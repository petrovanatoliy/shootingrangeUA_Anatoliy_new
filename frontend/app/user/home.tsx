import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useCartStore } from '../../store/cartStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#202447',
  secondary: '#193B89',
  accent: '#6379C2',
  light: '#CAD2F6',
  warm: '#5A3E40',
  white: '#FFFFFF',
  success: '#4ECDC4',
};

interface Catalog {
  id: string;
  name: string;
  image: string;
}

interface Product {
  id: string;
  name: string;
  price_uah: number;
  discount_percent: number;
  main_image: string;
}

interface User {
  full_name: string;
  bonus_points: number;
  discount_percent: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { setUserId } = useCartStore();
  const [user, setUser] = useState<User | null>(null);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeUser();
    loadData();
  }, []);

  const initializeUser = async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        setUserId(userId);
      }
    } catch (error) {
      console.error('Failed to initialize user:', error);
    }
  };

  const loadData = async () => {
    try {
      // Load user
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      // Load catalogs
      const catalogsRes = await axios.get(`${API_URL}/api/catalogs?visible_only=true`);
      setCatalogs(catalogsRes.data.slice(0, 4));

      // Load featured products (with discounts)
      const productsRes = await axios.get(`${API_URL}/api/products?visible_only=true`);
      const discounted = productsRes.data.filter((p: Product) => p.discount_percent > 0);
      setFeaturedProducts(discounted.slice(0, 4));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Reload user data from server
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        const userRes = await axios.get(`${API_URL}/api/users/${userId}`);
        await AsyncStorage.setItem('user_data', JSON.stringify(userRes.data));
        setUser(userRes.data);
      }
    } catch (e) {}
    await loadData();
    setRefreshing(false);
  };

  const getDiscountedPrice = (price: number, discount: number) => {
    return price - (price * discount) / 100;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Вітаємо!</Text>
            <Text style={styles.userName}>{user?.full_name || 'Гість'}</Text>
          </View>
          <TouchableOpacity
            style={styles.bonusCard}
            onPress={() => router.push('/user/profile')}
          >
            <Ionicons name="gift" size={18} color={COLORS.success} />
            <Text style={styles.bonusText}>{user?.bonus_points || 0} бонусів</Text>
          </TouchableOpacity>
        </View>

        {/* Discount Banner */}
        {user && user.discount_percent > 0 && (
          <View style={styles.discountBanner}>
            <Ionicons name="pricetag" size={24} color={COLORS.white} />
            <View>
              <Text style={styles.discountTitle}>Ваша знижка {user.discount_percent}%</Text>
              <Text style={styles.discountSubtitle}>Застосовується до всіх замовлень</Text>
            </View>
          </View>
        )}

        {/* Catalogs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Категорії</Text>
            <TouchableOpacity onPress={() => router.push('/user/catalogs')}>
              <Text style={styles.seeAllText}>Всі</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catalogsScroll}>
            {catalogs.map((catalog) => (
              <TouchableOpacity
                key={catalog.id}
                style={styles.catalogCard}
                onPress={() => router.push(`/user/catalog/${catalog.id}`)}
              >
                {catalog.image ? (
                  <Image source={{ uri: catalog.image }} style={styles.catalogImage} />
                ) : (
                  <View style={styles.catalogImagePlaceholder}>
                    <Ionicons name="folder" size={32} color={COLORS.accent} />
                  </View>
                )}
                <Text style={styles.catalogName}>{catalog.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Акційні товари</Text>
            </View>
            <View style={styles.productsGrid}>
              {featuredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => router.push(`/user/product/${product.id}`)}
                >
                  {product.main_image ? (
                    <Image source={{ uri: product.main_image }} style={styles.productImage} />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Ionicons name="cube" size={32} color={COLORS.accent} />
                    </View>
                  )}
                  {product.discount_percent > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>-{product.discount_percent}%</Text>
                    </View>
                  )}
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.currentPrice}>
                      {getDiscountedPrice(product.price_uah, product.discount_percent).toFixed(0)} грн
                    </Text>
                    {product.discount_percent > 0 && (
                      <Text style={styles.oldPrice}>{product.price_uah} грн</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Послуги</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/user/catalogs')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(78,205,196,0.2)' }]}>
                <Ionicons name="fitness" size={28} color={COLORS.success} />
              </View>
              <Text style={styles.actionTitle}>Тренування</Text>
              <Text style={styles.actionSubtitle}>Індивідуальні та групові</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/user/catalogs')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(99,121,194,0.2)' }]}>
                <Ionicons name="calendar" size={28} color={COLORS.accent} />
              </View>
              <Text style={styles.actionTitle}>Оренда</Text>
              <Text style={styles.actionSubtitle}>Доріжки та обладнання</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.light,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78,205,196,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  bonusText: {
    color: COLORS.success,
    fontWeight: '600',
    fontSize: 13,
  },
  discountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  discountTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  discountSubtitle: {
    color: COLORS.light,
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAllText: {
    color: COLORS.accent,
    fontSize: 14,
  },
  catalogsScroll: {
    paddingLeft: 20,
  },
  catalogCard: {
    width: 100,
    marginRight: 12,
    alignItems: 'center',
  },
  catalogImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  catalogImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  catalogName: {
    color: COLORS.white,
    fontSize: 12,
    textAlign: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  productCard: {
    width: (width - 44) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  productName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
    padding: 10,
    paddingBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 6,
  },
  currentPrice: {
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 14,
  },
  oldPrice: {
    color: COLORS.light,
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  actionSubtitle: {
    color: COLORS.light,
    fontSize: 11,
    marginTop: 2,
  },
  bottomPadding: {
    height: 48,
  },
});
