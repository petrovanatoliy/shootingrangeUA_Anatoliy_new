from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import base64
import hashlib
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Shooting Range API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

# Catalog Models
class CatalogBase(BaseModel):
    name: str
    image: Optional[str] = None
    is_visible: bool = True

class CatalogCreate(CatalogBase):
    pass

class CatalogUpdate(BaseModel):
    name: Optional[str] = None
    image: Optional[str] = None
    is_visible: Optional[bool] = None

class Catalog(CatalogBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Product Models
class ProductBase(BaseModel):
    catalog_id: str
    name: str
    description: str
    price_uah: float
    discount_percent: float = 0
    quantity: int
    weight: Optional[str] = None
    color: Optional[str] = None
    is_visible: bool = True
    main_image: str
    additional_images: List[str] = []

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    catalog_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price_uah: Optional[float] = None
    discount_percent: Optional[float] = None
    quantity: Optional[int] = None
    weight: Optional[str] = None
    color: Optional[str] = None
    is_visible: Optional[bool] = None
    main_image: Optional[str] = None
    additional_images: Optional[List[str]] = None

class Product(ProductBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Service Models
class ServiceBase(BaseModel):
    catalog_id: str
    name: str
    description: str
    price_uah: float
    is_visible: bool = True
    has_time_selection: bool = False
    has_duration_selection: bool = False
    has_master_selection: bool = False
    price_depends_on_duration: bool = False

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    catalog_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price_uah: Optional[float] = None
    is_visible: Optional[bool] = None
    has_time_selection: Optional[bool] = None
    has_duration_selection: Optional[bool] = None
    has_master_selection: Optional[bool] = None
    price_depends_on_duration: Optional[bool] = None

class Service(ServiceBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Master Models
class MasterBase(BaseModel):
    full_name: str
    position: str  # specialist / master / instructor / guru
    description: Optional[str] = None
    is_active: bool = True

class MasterCreate(MasterBase):
    pass

class MasterUpdate(BaseModel):
    full_name: Optional[str] = None
    position: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class Master(MasterBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_ids: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Service-Master Link
class ServiceMasterLink(BaseModel):
    service_id: str
    master_id: str

# User Models
class UserBase(BaseModel):
    phone: str
    full_name: str

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    full_name: Optional[str] = None

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    registration_date: datetime = Field(default_factory=datetime.utcnow)
    total_orders_count: int = 0
    total_orders_amount: float = 0
    bonus_points: int = 0
    discount_percent: float = 0
    qr_md5: str = ""

# Cart Models
class CartItemBase(BaseModel):
    type: str  # product or service
    item_id: str
    name: str
    price: float
    discount_percent: float = 0
    quantity: int = 1
    image: Optional[str] = None
    # Service specific
    duration: Optional[int] = None
    master_name: Optional[str] = None
    date_time: Optional[str] = None

class CartItemCreate(CartItemBase):
    pass

class CartItem(CartItemBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class Cart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Order Models
class OrderItemBase(BaseModel):
    type: str  # product or service
    item_id: str
    name: str
    base_price: float
    item_discount_percent: float = 0
    quantity: int = 1
    duration: Optional[int] = None
    master_name: Optional[str] = None
    date_time: Optional[str] = None
    total_amount: float

class OrderCreate(BaseModel):
    user_id: str
    items: List[OrderItemBase]
    total_amount: float
    discount_percent: float = 0
    bonus_points_earned: int = 0

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[OrderItemBase]
    total_amount: float
    discount_percent: float = 0
    bonus_points_earned: int = 0
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Loyalty Rules
class LoyaltyRule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    min_total_amount: float
    bonus_points: int = 0
    discount_percent: float = 0

class LoyaltyRuleCreate(BaseModel):
    min_total_amount: float
    bonus_points: int = 0
    discount_percent: float = 0

# Settings
class Settings(BaseModel):
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""
    default_language: str = "uk"
    admin_phone1: str = ""
    admin_phone2: str = ""
    admin_phone3: str = ""

class SettingsUpdate(BaseModel):
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    default_language: Optional[str] = None
    admin_phone1: Optional[str] = None
    admin_phone2: Optional[str] = None
    admin_phone3: Optional[str] = None

# ===================== CATALOG ENDPOINTS =====================

@api_router.get("/")
async def root():
    return {"message": "Shooting Range API", "version": "1.0"}

@api_router.post("/catalogs", response_model=Catalog)
async def create_catalog(catalog: CatalogCreate):
    catalog_obj = Catalog(**catalog.dict())
    await db.catalogs.insert_one(catalog_obj.dict())
    return catalog_obj

@api_router.get("/catalogs", response_model=List[Catalog])
async def get_catalogs(visible_only: bool = False):
    query = {"is_visible": True} if visible_only else {}
    catalogs = await db.catalogs.find(query).to_list(1000)
    return [Catalog(**c) for c in catalogs]

@api_router.get("/catalogs/{catalog_id}", response_model=Catalog)
async def get_catalog(catalog_id: str):
    catalog = await db.catalogs.find_one({"id": catalog_id})
    if not catalog:
        raise HTTPException(status_code=404, detail="Catalog not found")
    return Catalog(**catalog)

@api_router.put("/catalogs/{catalog_id}", response_model=Catalog)
async def update_catalog(catalog_id: str, catalog_update: CatalogUpdate):
    update_data = {k: v for k, v in catalog_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    result = await db.catalogs.update_one({"id": catalog_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Catalog not found")
    catalog = await db.catalogs.find_one({"id": catalog_id})
    return Catalog(**catalog)

@api_router.delete("/catalogs/{catalog_id}")
async def delete_catalog(catalog_id: str):
    result = await db.catalogs.delete_one({"id": catalog_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Catalog not found")
    return {"message": "Catalog deleted"}

# ===================== PRODUCT ENDPOINTS =====================

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    # Verify catalog exists
    catalog = await db.catalogs.find_one({"id": product.catalog_id})
    if not catalog:
        raise HTTPException(status_code=404, detail="Catalog not found")
    product_obj = Product(**product.dict())
    await db.products.insert_one(product_obj.dict())
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(catalog_id: Optional[str] = None, visible_only: bool = False):
    query = {}
    if catalog_id:
        query["catalog_id"] = catalog_id
    if visible_only:
        query["is_visible"] = True
    products = await db.products.find(query).to_list(1000)
    return [Product(**p) for p in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_update: ProductUpdate):
    update_data = {k: v for k, v in product_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    product = await db.products.find_one({"id": product_id})
    return Product(**product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ===================== SERVICE ENDPOINTS =====================

@api_router.post("/services", response_model=Service)
async def create_service(service: ServiceCreate):
    catalog = await db.catalogs.find_one({"id": service.catalog_id})
    if not catalog:
        raise HTTPException(status_code=404, detail="Catalog not found")
    service_obj = Service(**service.dict())
    await db.services.insert_one(service_obj.dict())
    return service_obj

@api_router.get("/services", response_model=List[Service])
async def get_services(catalog_id: Optional[str] = None, visible_only: bool = False):
    query = {}
    if catalog_id:
        query["catalog_id"] = catalog_id
    if visible_only:
        query["is_visible"] = True
    services = await db.services.find(query).to_list(1000)
    return [Service(**s) for s in services]

@api_router.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str):
    service = await db.services.find_one({"id": service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return Service(**service)

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, service_update: ServiceUpdate):
    update_data = {k: v for k, v in service_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    result = await db.services.update_one({"id": service_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    service = await db.services.find_one({"id": service_id})
    return Service(**service)

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str):
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted"}

# ===================== MASTER ENDPOINTS =====================

@api_router.post("/masters", response_model=Master)
async def create_master(master: MasterCreate):
    master_obj = Master(**master.dict())
    await db.masters.insert_one(master_obj.dict())
    return master_obj

@api_router.get("/masters", response_model=List[Master])
async def get_masters(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    masters = await db.masters.find(query).to_list(1000)
    return [Master(**m) for m in masters]

@api_router.get("/masters/{master_id}", response_model=Master)
async def get_master(master_id: str):
    master = await db.masters.find_one({"id": master_id})
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    return Master(**master)

@api_router.put("/masters/{master_id}", response_model=Master)
async def update_master(master_id: str, master_update: MasterUpdate):
    update_data = {k: v for k, v in master_update.dict().items() if v is not None}
    result = await db.masters.update_one({"id": master_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Master not found")
    master = await db.masters.find_one({"id": master_id})
    return Master(**master)

@api_router.delete("/masters/{master_id}")
async def delete_master(master_id: str):
    result = await db.masters.delete_one({"id": master_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Master not found")
    return {"message": "Master deleted"}

# Link/Unlink service to master
@api_router.post("/masters/{master_id}/services/{service_id}")
async def link_service_to_master(master_id: str, service_id: str):
    master = await db.masters.find_one({"id": master_id})
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    service = await db.services.find_one({"id": service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service_ids = master.get("service_ids", [])
    if service_id not in service_ids:
        service_ids.append(service_id)
        await db.masters.update_one({"id": master_id}, {"$set": {"service_ids": service_ids}})
    return {"message": "Service linked to master"}

@api_router.delete("/masters/{master_id}/services/{service_id}")
async def unlink_service_from_master(master_id: str, service_id: str):
    master = await db.masters.find_one({"id": master_id})
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    
    service_ids = master.get("service_ids", [])
    if service_id in service_ids:
        service_ids.remove(service_id)
        await db.masters.update_one({"id": master_id}, {"$set": {"service_ids": service_ids}})
    return {"message": "Service unlinked from master"}

@api_router.get("/services/{service_id}/masters", response_model=List[Master])
async def get_masters_for_service(service_id: str):
    masters = await db.masters.find({"service_ids": service_id, "is_active": True}).to_list(1000)
    return [Master(**m) for m in masters]

# ===================== USER ENDPOINTS =====================

@api_router.post("/users/login", response_model=User)
async def login_or_register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"phone": user_data.phone})
    if existing_user:
        return User(**existing_user)
    
    # Create new user with discount card
    user_obj = User(**user_data.dict())
    qr_string = f"{user_obj.phone};{user_obj.full_name};{user_obj.registration_date.isoformat()}"
    user_obj.qr_md5 = hashlib.md5(qr_string.encode()).hexdigest()
    await db.users.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/users", response_model=List[User])
async def get_users():
    users = await db.users.find().to_list(1000)
    return [User(**u) for u in users]

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.get("/users/phone/{phone}", response_model=User)
async def get_user_by_phone(phone: str):
    user = await db.users.find_one({"phone": phone})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

# ===================== CART ENDPOINTS =====================

@api_router.get("/cart/{user_id}", response_model=Cart)
async def get_user_cart(user_id: str):
    """Get user's cart"""
    cart = await db.carts.find_one({"user_id": user_id})
    if not cart:
        # Create empty cart
        new_cart = Cart(user_id=user_id, items=[])
        await db.carts.insert_one(new_cart.dict())
        return new_cart
    return Cart(**cart)

@api_router.post("/cart/{user_id}/items")
async def add_item_to_cart(user_id: str, item: CartItemCreate):
    """Add item to cart or update quantity if exists"""
    cart = await db.carts.find_one({"user_id": user_id})
    
    if not cart:
        # Create new cart with item
        cart_item = CartItem(**item.dict())
        new_cart = Cart(user_id=user_id, items=[cart_item])
        await db.carts.insert_one(new_cart.dict())
        return {"success": True, "message": "Item added to cart"}
    
    # Check if item already exists
    items = [CartItem(**i) for i in cart.get("items", [])]
    existing_item = None
    existing_index = -1
    
    for idx, cart_item in enumerate(items):
        if cart_item.item_id == item.item_id and cart_item.type == item.type:
            existing_item = cart_item
            existing_index = idx
            break
    
    if existing_item:
        # Update quantity
        items[existing_index].quantity += item.quantity
    else:
        # Add new item
        new_item = CartItem(**item.dict())
        items.append(new_item)
    
    # Update cart
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": [i.dict() for i in items], "updated_at": datetime.utcnow()}}
    )
    
    return {"success": True, "message": "Item added to cart"}

@api_router.put("/cart/{user_id}/items/{item_id}")
async def update_cart_item(user_id: str, item_id: str, quantity: int):
    """Update item quantity in cart"""
    cart = await db.carts.find_one({"user_id": user_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = [CartItem(**i) for i in cart.get("items", [])]
    
    if quantity <= 0:
        # Remove item
        items = [i for i in items if i.id != item_id]
    else:
        # Update quantity
        for item in items:
            if item.id == item_id:
                item.quantity = quantity
                break
    
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": [i.dict() for i in items], "updated_at": datetime.utcnow()}}
    )
    
    return {"success": True, "message": "Cart updated"}

@api_router.delete("/cart/{user_id}/items/{item_id}")
async def remove_cart_item(user_id: str, item_id: str):
    """Remove item from cart"""
    cart = await db.carts.find_one({"user_id": user_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = [CartItem(**i) for i in cart.get("items", []) if i["id"] != item_id]
    
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": items, "updated_at": datetime.utcnow()}}
    )
    
    return {"success": True, "message": "Item removed from cart"}

@api_router.delete("/cart/{user_id}")
async def clear_cart(user_id: str):
    """Clear user's cart"""
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": [], "updated_at": datetime.utcnow()}}
    )
    return {"success": True, "message": "Cart cleared"}

# ===================== ORDER ENDPOINTS =====================

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    # Get user
    user = await db.users.find_one({"id": order_data.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate loyalty
    loyalty_rules = await db.loyalty_rules.find().sort("min_total_amount", -1).to_list(100)
    new_total = user.get("total_orders_amount", 0) + order_data.total_amount
    
    bonus_points = 0
    user_discount = user.get("discount_percent", 0)
    
    for rule in loyalty_rules:
        if new_total >= rule.get("min_total_amount", 0):
            bonus_points = rule.get("bonus_points", 0)
            user_discount = rule.get("discount_percent", 0)
            break
    
    # Create order
    order_obj = Order(
        user_id=order_data.user_id,
        items=order_data.items,
        total_amount=order_data.total_amount,
        discount_percent=order_data.discount_percent,
        bonus_points_earned=bonus_points
    )
    await db.orders.insert_one(order_obj.dict())
    
    # Update user stats
    await db.users.update_one(
        {"id": order_data.user_id},
        {
            "$inc": {
                "total_orders_count": 1,
                "total_orders_amount": order_data.total_amount,
                "bonus_points": bonus_points
            },
            "$set": {"discount_percent": user_discount}
        }
    )
    
    # Send to Telegram
    await send_telegram_notification(order_obj, User(**user))
    
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders(user_id: str):
    """Get orders for a specific user - user_id is required"""
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    orders = await db.orders.find({"user_id": user_id}).sort("created_at", -1).to_list(1000)
    return [Order(**o) for o in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**order)

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated"}

# ===================== LOYALTY RULES =====================

@api_router.post("/loyalty-rules", response_model=LoyaltyRule)
async def create_loyalty_rule(rule: LoyaltyRuleCreate):
    rule_obj = LoyaltyRule(**rule.dict())
    await db.loyalty_rules.insert_one(rule_obj.dict())
    return rule_obj

@api_router.get("/loyalty-rules", response_model=List[LoyaltyRule])
async def get_loyalty_rules():
    rules = await db.loyalty_rules.find().sort("min_total_amount", 1).to_list(100)
    return [LoyaltyRule(**r) for r in rules]

@api_router.put("/loyalty-rules/{rule_id}", response_model=LoyaltyRule)
async def update_loyalty_rule(rule_id: str, rule: LoyaltyRuleCreate):
    update_data = rule.dict()
    result = await db.loyalty_rules.update_one({"id": rule_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Rule not found")
    updated = await db.loyalty_rules.find_one({"id": rule_id})
    return LoyaltyRule(**updated)

@api_router.delete("/loyalty-rules/{rule_id}")
async def delete_loyalty_rule(rule_id: str):
    result = await db.loyalty_rules.delete_one({"id": rule_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"message": "Rule deleted"}

# ===================== SETTINGS =====================

@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({})
    if not settings:
        # Create default settings
        default = Settings()
        await db.settings.insert_one(default.dict())
        return default
    return Settings(**settings)

@api_router.put("/settings", response_model=Settings)
async def update_settings(settings_update: SettingsUpdate):
    update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
    existing = await db.settings.find_one({})
    if existing:
        await db.settings.update_one({}, {"$set": update_data})
    else:
        settings = Settings(**update_data)
        await db.settings.insert_one(settings.dict())
    settings = await db.settings.find_one({})
    return Settings(**settings)

@api_router.get("/settings/has-admin-phones")
async def check_admin_phones():
    """Check if any admin phone numbers are configured"""
    settings = await db.settings.find_one({})
    if not settings:
        return {"has_admin_phones": False}
    
    has_phones = bool(
        settings.get("admin_phone1") or 
        settings.get("admin_phone2") or 
        settings.get("admin_phone3")
    )
    return {"has_admin_phones": has_phones}

@api_router.post("/users/check-admin")
async def check_if_admin(phone: str):
    """Check if phone number belongs to an admin"""
    settings = await db.settings.find_one({})
    if not settings:
        return {"is_admin": False}
    
    admin_phones = [
        settings.get("admin_phone1", ""),
        settings.get("admin_phone2", ""),
        settings.get("admin_phone3", "")
    ]
    
    # Remove empty strings and check if phone matches
    admin_phones = [p for p in admin_phones if p]
    is_admin = phone in admin_phones
    
    return {"is_admin": is_admin}

# ===================== TELEGRAM NOTIFICATION =====================

async def send_telegram_notification(order: Order, user: User):
    settings = await db.settings.find_one({})
    if not settings or not settings.get("telegram_bot_token") or not settings.get("telegram_chat_id"):
        logger.warning("Telegram settings not configured")
        return
    
    bot_token = settings["telegram_bot_token"]
    chat_id = settings["telegram_chat_id"]
    
    # Format message
    items_text = "\n".join([
        f"  - {item.name}: {item.quantity} x {item.base_price} грн = {item.total_amount} грн"
        for item in order.items
    ])
    
    message = f"""
🎯 НОВЕ ЗАМОВЛЕННЯ #{order.id[:8]}

👤 Клієнт: {user.full_name}
📱 Телефон: {user.phone}

📦 Товари/Послуги:
{items_text}

💰 Загальна сума: {order.total_amount} грн
🎁 Бонуси нараховано: {order.bonus_points_earned}
📅 Дата: {order.created_at.strftime('%d.%m.%Y %H:%M')}
"""
    
    try:
        async with httpx.AsyncClient() as client:
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            await client.post(url, json={"chat_id": chat_id, "text": message, "parse_mode": "HTML"})
            logger.info(f"Telegram notification sent for order {order.id}")
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {e}")

# ===================== SEED DATA =====================

@api_router.post("/seed")
async def seed_demo_data():
    """Seed demo data for testing"""
    # Check if data already exists
    existing = await db.catalogs.count_documents({})
    if existing > 0:
        return {"message": "Demo data already exists"}
    
    # Demo images (using placeholder URLs that will be converted to base64)
    demo_images = {
        "catalog1": "https://images.unsplash.com/photo-1617619667494-6b3f51ce58a7?w=400",
        "catalog2": "https://images.pexels.com/photos/6092074/pexels-photo-6092074.jpeg?w=400",
        "catalog3": "https://images.unsplash.com/photo-1619760563678-02e23d15f69f?w=400",
        "catalog4": "https://images.pexels.com/photos/5202416/pexels-photo-5202416.jpeg?w=400",
        "product1": "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=400",
        "product2": "https://images.unsplash.com/photo-1610165540008-bf28446d5cb8?w=400",
        "product3": "https://images.pexels.com/photos/9170201/pexels-photo-9170201.jpeg?w=400",
    }
    
    # Create catalogs
    catalogs = [
        Catalog(name="Зброя", image=demo_images["catalog1"], is_visible=True),
        Catalog(name="Амуніція", image=demo_images["catalog2"], is_visible=True),
        Catalog(name="Тренування", image=demo_images["catalog3"], is_visible=True),
        Catalog(name="Аксесуари", image=demo_images["catalog4"], is_visible=True),
    ]
    for c in catalogs:
        await db.catalogs.insert_one(c.dict())
    
    # Create products
    products = [
        Product(
            catalog_id=catalogs[0].id,
            name="Пістолет Glock 17",
            description="Напівавтоматичний пістолет калібру 9мм. Ідеальний для тренувань та спортивної стрільби.",
            price_uah=25000,
            discount_percent=10,
            quantity=5,
            weight="625г",
            color="Чорний",
            main_image=demo_images["product1"],
            is_visible=True
        ),
        Product(
            catalog_id=catalogs[1].id,
            name="Набір патронів 9мм (50 шт)",
            description="Високоякісні патрони калібру 9x19мм для тренувальної стрільби.",
            price_uah=800,
            discount_percent=0,
            quantity=100,
            main_image=demo_images["product2"],
            is_visible=True
        ),
        Product(
            catalog_id=catalogs[3].id,
            name="Захисні навушники",
            description="Професійні захисні навушники для стрільби з активним шумоподавленням.",
            price_uah=1500,
            discount_percent=15,
            quantity=20,
            color="Зелений",
            main_image=demo_images["product3"],
            is_visible=True
        ),
    ]
    for p in products:
        await db.products.insert_one(p.dict())
    
    # Create services
    services = [
        Service(
            catalog_id=catalogs[2].id,
            name="Індивідуальне тренування",
            description="Персональне тренування з професійним інструктором. Включає інструктаж з безпеки та техніки стрільби.",
            price_uah=500,
            is_visible=True,
            has_time_selection=True,
            has_duration_selection=True,
            has_master_selection=True,
            price_depends_on_duration=True
        ),
        Service(
            catalog_id=catalogs[2].id,
            name="Групове заняття",
            description="Групове заняття для 3-5 осіб з інструктором. Базовий курс стрільби.",
            price_uah=300,
            is_visible=True,
            has_time_selection=True,
            has_duration_selection=False,
            has_master_selection=True,
            price_depends_on_duration=False
        ),
        Service(
            catalog_id=catalogs[2].id,
            name="Оренда доріжки",
            description="Оренда стрілецької доріжки на годину. Включає базове обладнання безпеки.",
            price_uah=200,
            is_visible=True,
            has_time_selection=True,
            has_duration_selection=True,
            has_master_selection=False,
            price_depends_on_duration=True
        ),
    ]
    for s in services:
        await db.services.insert_one(s.dict())
    
    # Create masters
    masters = [
        Master(
            full_name="Олександр Петренко",
            position="Головний інструктор",
            description="15 років досвіду. Чемпіон України з практичної стрільби.",
            is_active=True,
            service_ids=[services[0].id, services[1].id]
        ),
        Master(
            full_name="Марія Коваленко",
            position="Інструктор",
            description="Спеціалізація на навчанні початківців. 7 років досвіду.",
            is_active=True,
            service_ids=[services[0].id, services[1].id]
        ),
    ]
    for m in masters:
        await db.masters.insert_one(m.dict())
    
    # Create loyalty rules
    loyalty_rules = [
        LoyaltyRule(min_total_amount=0, bonus_points=0, discount_percent=0),
        LoyaltyRule(min_total_amount=5000, bonus_points=50, discount_percent=3),
        LoyaltyRule(min_total_amount=15000, bonus_points=100, discount_percent=5),
        LoyaltyRule(min_total_amount=50000, bonus_points=200, discount_percent=10),
    ]
    for r in loyalty_rules:
        await db.loyalty_rules.insert_one(r.dict())
    
    return {"message": "Demo data created successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
