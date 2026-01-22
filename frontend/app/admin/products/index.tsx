import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Image,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const COLORS = {
  primary: '#202447',
  secondary: '#193B89',
  accent: '#6379C2',
  light: '#CAD2F6',
  warm: '#5A3E40',
  white: '#FFFFFF',
  success: '#4ECDC4',
  danger: '#FF6B6B',
};

interface Product {
  id: string;
  catalog_id: string;
  name: string;
  description: string;
  price_uah: number;
  discount_percent: number;
  quantity: number;
  main_image: string;
  is_visible: boolean;
}

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити товари');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const toggleVisibility = async (product: Product) => {
    try {
      await axios.put(`${API_URL}/api/products/${product.id}`, {
        is_visible: !product.is_visible,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_visible: !p.is_visible } : p
        )
      );
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося змінити видимість');
    }
  };

  const deleteProduct = (product: Product) => {
    Alert.alert(
      'Видалення',
      `Видалити товар "${product.name}"?`,
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/products/${product.id}`);
              setProducts((prev) => prev.filter((p) => p.id !== product.id));
            } catch (error) {
              Alert.alert('Помилка', 'Не вдалося видалити товар');
            }
          },
        },
      ]
    );
  };

  const getDiscountedPrice = (price: number, discount: number) => {
    return price - (price * discount) / 100;
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <TouchableOpacity
        style={styles.productContent}
        onPress={() => router.push(`/admin/products/${item.id}`)}
      >
        {item.main_image ? (
          <Image source={{ uri: item.main_image }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="cube-outline" size={32} color={COLORS.accent} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.priceRow}>
            {item.discount_percent > 0 ? (
              <>
                <Text style={styles.discountedPrice}>
                  {getDiscountedPrice(item.price_uah, item.discount_percent).toFixed(0)} грн
                </Text>
                <Text style={styles.originalPrice}>{item.price_uah} грн</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{item.discount_percent}%</Text>
                </View>
              </>
            ) : (
              <Text style={styles.price}>{item.price_uah} грн</Text>
            )}
          </View>
          <Text style={styles.quantity}>Кількість: {item.quantity}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.productActions}>
        <Switch
          value={item.is_visible}
          onValueChange={() => toggleVisibility(item)}
          trackColor={{ false: COLORS.warm, true: COLORS.success }}
          thumbColor={COLORS.white}
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteProduct(item)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Товари</Text>
        <TouchableOpacity
          onPress={() => router.push('/admin/products/new')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color={COLORS.accent} />
              <Text style={styles.emptyText}>Немає товарів</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/admin/products/new')}
              >
                <Text style={styles.emptyButtonText}>Додати товар</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  addButton: {
    padding: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  productCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  productContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  originalPrice: {
    fontSize: 12,
    color: COLORS.light,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 12,
    color: COLORS.light,
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.light,
    marginTop: 16,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});
