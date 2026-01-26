import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useCartStore } from '../../store/cartStore';

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

interface User {
  id: string;
  full_name: string;
  phone: string;
  discount_percent: number;
  bonus_points: number;
}

export default function OrderFormScreen() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        router.replace('/user/login');
        return;
      }

      const response = await axios.get(`${API_URL}/api/users/${userId}`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити дані користувача');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!user || items.length === 0) return;

    setSubmitting(true);
    try {
      const orderData = {
        user_id: user.id,
        items: items.map((item) => {
          const itemPrice = item.price - (item.price * item.discount_percent) / 100;
          return {
            type: item.type,
            item_id: item.item_id,
            name: item.name,
            base_price: item.price,
            item_discount_percent: item.discount_percent,
            quantity: item.quantity,
            duration: item.duration,
            master_name: item.master_name,
            date_time: item.date_time,
            total_amount: itemPrice * item.quantity,
          };
        }),
        total_amount: getTotal(),
        discount_percent: user.discount_percent,
      };

      const response = await axios.post(`${API_URL}/api/orders`, orderData);

      // Очистити кошик
      clearCart();

      // Оновити дані користувача (бонуси)
      const updatedUser = await axios.get(`${API_URL}/api/users/${user.id}`);
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser.data));

      Alert.alert(
        'Успіх! 🎉',
        `Замовлення #${response.data.id.slice(0, 8)} створено!\n\nВаші бонуси оновлено.`,
        [
          {
            text: 'Переглянути замовлення',
            onPress: () => router.replace('/user/checkout'),
          },
          {
            text: 'На головну',
            onPress: () => router.replace('/user/home'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to create order:', error);
      Alert.alert(
        'Помилка',
        error.response?.data?.detail || 'Не вдалося створити замовлення'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user || items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Оформлення замовлення</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={COLORS.accent} />
          <Text style={styles.emptyText}>Кошик порожній</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/user/catalogs')}
          >
            <Text style={styles.shopButtonText}>До каталогу</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const subtotal = getTotal();
  const discount = (subtotal * user.discount_percent) / 100;
  const total = subtotal - discount;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Оформлення замовлення</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={24} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>Інформація про клієнта</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Ім'я:</Text>
            <Text style={styles.infoValue}>{user.full_name}</Text>
            <Text style={styles.infoLabel}>Телефон:</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
            <Text style={styles.infoLabel}>Бонусні бали:</Text>
            <Text style={styles.infoValue}>{user.bonus_points} балів</Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={24} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>Товари ({items.length})</Text>
          </View>
          {items.map((item, index) => {
            const itemTotal =
              (item.price - (item.price * item.discount_percent) / 100) * item.quantity;
            return (
              <View key={index} style={styles.orderItem}>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemName}>{item.name}</Text>
                  <Text style={styles.orderItemDetails}>
                    {item.price} ₴ x {item.quantity}
                    {item.discount_percent > 0 && ` (-${item.discount_percent}%)`}
                  </Text>
                </View>
                <Text style={styles.orderItemPrice}>{itemTotal.toFixed(2)} ₴</Text>
              </View>
            );
          })}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calculator" size={24} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>Підсумок</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Сума товарів:</Text>
              <Text style={styles.summaryValue}>{subtotal.toFixed(2)} ₴</Text>
            </View>
            {user.discount_percent > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Знижка ({user.discount_percent}%):
                </Text>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                  -{discount.toFixed(2)} ₴
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>До сплати:</Text>
              <Text style={styles.totalValue}>{total.toFixed(2)} ₴</Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.accent} />
          <Text style={styles.infoBoxText}>
            Після оформлення замовлення ви отримаєте бонусні бали.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmitOrder}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.submitButtonText}>
                Підтвердити замовлення ({total.toFixed(2)} ₴)
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  infoCard: {
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.light,
    marginTop: 8,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '500',
    marginBottom: 4,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: 4,
  },
  orderItemDetails: {
    fontSize: 12,
    color: COLORS.light,
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  summaryCard: {
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.light,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 121, 194, 0.15)',
    padding: 12,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.light,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  submitButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 20,
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  shopButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
