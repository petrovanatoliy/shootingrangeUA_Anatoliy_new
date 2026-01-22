import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#202447',
  secondary: '#193B89',
  accent: '#6379C2',
  light: '#CAD2F6',
  white: '#FFFFFF',
  success: '#4ECDC4',
};

interface Product {
  id: string;
  name: string;
  price_uah: number;
  discount_percent: number;
  main_image: string;
}

interface Service {
  id: string;
  name: string;
  price_uah: number;
}

interface Catalog {
  id: string;
  name: string;
}

export default function CatalogDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [catalogRes, productsRes, servicesRes] = await Promise.all([
        axios.get(`${API_URL}/api/catalogs/${id}`),
        axios.get(`${API_URL}/api/products?catalog_id=${id}&visible_only=true`),
        axios.get(`${API_URL}/api/services?catalog_id=${id}&visible_only=true`),
      ]);
      setCatalog(catalogRes.data);
      setProducts(productsRes.data);
      setServices(servicesRes.data);
      
      // Auto-select tab based on content
      if (productsRes.data.length === 0 && servicesRes.data.length > 0) {
        setActiveTab('services');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getDiscountedPrice = (price: number, discount: number) => {
    return price - (price * discount) / 100;
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/user/product/${item.id}`)}
    >
      {item.main_image ? (
        <Image source={{ uri: item.main_image }} style={styles.productImage} />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="cube" size={32} color={COLORS.accent} />
        </View>
      )}
      {item.discount_percent > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{item.discount_percent}%</Text>
        </View>
      )}
      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.currentPrice}>
          {getDiscountedPrice(item.price_uah, item.discount_percent).toFixed(0)} грн
        </Text>
        {item.discount_percent > 0 && (
          <Text style={styles.oldPrice}>{item.price_uah} грн</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderService = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => router.push(`/user/service/${item.id}`)}
    >
      <View style={styles.serviceIcon}>
        <Ionicons name="briefcase" size={24} color={COLORS.accent} />
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.servicePrice}>від {item.price_uah} грн</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.light} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{catalog?.name || 'Каталог'}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      {products.length > 0 && services.length > 0 && (
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'products' && styles.activeTab]}
            onPress={() => setActiveTab('products')}
          >
            <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
              Товари ({products.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'services' && styles.activeTab]}
            onPress={() => setActiveTab('services')}
          >
            <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
              Послуги ({services.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'products' ? (
        <FlatList
          key="products-list"
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color={COLORS.accent} />
              <Text style={styles.emptyText}>Товари відсутні</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={renderService}
          contentContainerStyle={styles.servicesListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={64} color={COLORS.accent} />
              <Text style={styles.emptyText}>Послуги відсутні</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: COLORS.secondary,
  },
  tabText: {
    color: COLORS.light,
    fontSize: 14,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    gap: 12,
  },
  productCard: {
    width: (width - 44) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
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
  discountText: {
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
  servicesListContent: {
    padding: 16,
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99,121,194,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  servicePrice: {
    color: COLORS.success,
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: COLORS.light,
    fontSize: 16,
    marginTop: 16,
  },
});
