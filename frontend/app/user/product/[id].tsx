import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useCartStore } from '../../../store/cartStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const COLORS = {
  primary: '#202447',
  secondary: '#193B89',
  accent: '#6379C2',
  light: '#CAD2F6',
  white: '#FFFFFF',
  success: '#4ECDC4',
  danger: '#FF6B6B',
};

interface Product {
  id: string;
  name: string;
  description: string;
  price_uah: number;
  discount_percent: number;
  quantity: number;
  weight: string | null;
  color: string | null;
  main_image: string;
  additional_images: string[];
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося завантажити товар');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getDiscountedPrice = (price: number, discount: number) => {
    return price - (price * discount) / 100;
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addItem({
      id: `product-${product.id}-${Date.now()}`,
      type: 'product',
      name: product.name,
      price: product.price_uah,
      discountPercent: product.discount_percent,
      quantity: quantity,
      image: product.main_image,
    });

    Alert.alert(
      'Додано до кошика',
      `${product.name} x${quantity}`,
      [
        { text: 'Продовжити покупки', style: 'cancel' },
        { text: 'До кошика', onPress: () => router.push('/user/cart') },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!product) return null;

  const discountedPrice = getDiscountedPrice(product.price_uah, product.discount_percent);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/user/cart')} style={styles.cartButton}>
          <Ionicons name="cart" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image */}
        {product.main_image ? (
          <Image source={{ uri: product.main_image }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="cube" size={64} color={COLORS.accent} />
          </View>
        )}

        {/* Discount Badge */}
        {product.discount_percent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{product.discount_percent}%</Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.productName}>{product.name}</Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>{discountedPrice.toFixed(0)} грн</Text>
            {product.discount_percent > 0 && (
              <Text style={styles.oldPrice}>{product.price_uah} грн</Text>
            )}
          </View>

          {/* Availability */}
          <View style={styles.availabilityRow}>
            <Ionicons
              name={product.quantity > 0 ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={product.quantity > 0 ? COLORS.success : COLORS.danger}
            />
            <Text style={[styles.availabilityText, { color: product.quantity > 0 ? COLORS.success : COLORS.danger }]}>
              {product.quantity > 0 ? `У наявності: ${product.quantity} шт` : 'Немає в наявності'}
            </Text>
          </View>

          {/* Specs */}
          {(product.weight || product.color) && (
            <View style={styles.specsContainer}>
              {product.weight && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Вага</Text>
                  <Text style={styles.specValue}>{product.weight}</Text>
                </View>
              )}
              {product.color && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Колір</Text>
                  <Text style={styles.specValue}>{product.color}</Text>
                </View>
              )}
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Опис</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      {product.quantity > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.min(product.quantity, quantity + 1))}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
            <Ionicons name="cart" size={20} color={COLORS.white} />
            <Text style={styles.addToCartText}>
              {(discountedPrice * quantity).toFixed(0)} грн
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 120,
    right: 16,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  oldPrice: {
    fontSize: 18,
    color: COLORS.light,
    textDecorationLine: 'line-through',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  availabilityText: {
    fontSize: 14,
  },
  specsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  specItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  specLabel: {
    color: COLORS.light,
    fontSize: 12,
    marginBottom: 4,
  },
  specValue: {
    color: COLORS.white,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 100,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  descriptionText: {
    color: COLORS.light,
    fontSize: 14,
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addToCartText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
