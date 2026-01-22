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

export default function CheckoutScreen() {
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
    } finally {
      setLoading(false);
    }
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => {
      const discountedPrice = item.price - (item.price * item.discountPercent) / 100;
      return total + discountedPrice * item.quantity;
    }, 0);
  };

  const getUserDiscount = () => {
    if (!user || user.discount_percent === 0) return 0;
    return getSubtotal() * (user.discount_percent / 100);
  };

  const getFinalTotal = () => {
    return getSubtotal() - getUserDiscount();
  };

  const handleSubmitOrder = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      const orderItems = items.map((item) => ({
        type: item.type,
        item_id: item.id,
        name: item.name,
        base_price: item.price,
        item_discount_percent: item.discountPercent,
        quantity: item.quantity,
        duration: item.duration || null,
        master_name: item.masterName || null,
        date_time: item.dateTime || null,
        total_amount: (item.price - (item.price * item.discountPercent) / 100) * item.quantity,
      }));

      const orderData = {
        user_id: user.id,
        items: orderItems,
        total_amount: getFinalTotal(),
        discount_percent: user.discount_percent,
        bonus_points_earned: 0,
      };

      await axios.post(`${API_URL}/api/orders`, orderData);

      clearCart();

      Alert.alert(
        '🎉 Дякуємо за замовлення!',
        'Ваше замовлення прийнято. Ми зв\'яжемося з вами найближчим часом.',
        [
          {
            text: 'На головну',
            onPress: () => router.replace('/user/home'),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit order:', error);
      Alert.alert('Помилка', 'Не вдалося оформити замовлення. Спробуйте ще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Оформлення</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Контактні дані</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <Ionicons name="person" size={20} color={COLORS.accent} />
              <Text style={styles.contactText}>{user?.full_name}</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call" size={20} color={COLORS.accent} />
              <Text style={styles.contactText}>{user?.phone}</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ваше замовлення</Text>
          {items.map((item) => {
            const discountedPrice = item.price - (item.price * item.discountPercent) / 100;
            return (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.orderItemInfo}>
                  <Ionicons
                    name={item.type === 'product' ? 'cube' : 'briefcase'}
                    size={18}
                    color={COLORS.accent}
                  />
                  <View style={styles.orderItemDetails}>
                    <Text style={styles.orderItemName}>{item.name}</Text>
                    {item.masterName && (
                      <Text style={styles.orderItemMeta}>Майстер: {item.masterName}</Text>
                    )}
                    {item.duration && (
                      <Text style={styles.orderItemMeta}>Тривалість: {item.duration} хв</Text>
                    )}
                  </View>
                </View>
                <View style={styles.orderItemRight}>
                  <Text style={styles.orderItemQty}>x{item.quantity}</Text>
                  <Text style={styles.orderItemPrice}>
                    {(discountedPrice * item.quantity).toFixed(0)} грн
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Підсумок</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Сума товарів/послуг:</Text>
              <Text style={styles.summaryValue}>{getSubtotal().toFixed(0)} грн</Text>
            </View>
            {user && user.discount_percent > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Ваша знижка ({user.discount_percent}%):
                </Text>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                  -{getUserDiscount().toFixed(0)} грн
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>До сплати:</Text>
              <Text style={styles.totalValue}>{getFinalTotal().toFixed(0)} грн</Text>
            </View>
          </View>
        </View>

        {/* Bonus Info */}
        {user && user.bonus_points > 0 && (
          <View style={styles.bonusCard}>
            <Ionicons name="gift" size={24} color={COLORS.success} />
            <Text style={styles.bonusText}>
              У вас є {user.bonus_points} бонусів. Ви отримаєте ще більше за це замовлення!
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmitOrder}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.submitButtonText}>
                Підтвердити замовлення
              </Text>
              <Text style={styles.submitButtonPrice}>
                {getFinalTotal().toFixed(0)} грн
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
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 12,
  },
  contactCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    color: COLORS.white,
    fontSize: 15,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  orderItemInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
  },
  orderItemDetails: {
    flex: 1,
  },
  orderItemName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  orderItemMeta: {
    color: COLORS.light,
    fontSize: 12,
    marginTop: 2,
  },
  orderItemRight: {
    alignItems: 'flex-end',
  },
  orderItemQty: {
    color: COLORS.light,
    fontSize: 12,
  },
  orderItemPrice: {
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    color: COLORS.light,
    fontSize: 14,
  },
  summaryValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 12,
  },
  totalLabel: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: COLORS.success,
    fontSize: 22,
    fontWeight: 'bold',
  },
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: 'rgba(78,205,196,0.15)',
    borderRadius: 16,
    gap: 12,
  },
  bonusText: {
    flex: 1,
    color: COLORS.light,
    fontSize: 13,
  },
  bottomPadding: {
    height: 120,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.secondary,
    padding: 16,
    paddingBottom: 32,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.success,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButtonPrice: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
});
