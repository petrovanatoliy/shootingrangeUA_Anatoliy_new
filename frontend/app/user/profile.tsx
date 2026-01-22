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
import QRCode from 'react-native-qrcode-svg';

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
  phone: string;
  full_name: string;
  registration_date: string;
  total_orders_count: number;
  total_orders_amount: number;
  bonus_points: number;
  discount_percent: number;
  qr_md5: string;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        router.replace('/user/login');
        return;
      }

      const [userRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/api/users/${userId}`),
        axios.get(`${API_URL}/api/orders?user_id=${userId}`),
      ]);

      setUser(userRes.data);
      await AsyncStorage.setItem('user_data', JSON.stringify(userRes.data));
      setOrders(ordersRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Вихід',
      'Ви впевнені, що хочете вийти?',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Вийти',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('user_id');
            await AsyncStorage.removeItem('user_data');
            router.replace('/');
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Виконано';
      case 'processing': return 'В обробці';
      case 'cancelled': return 'Скасовано';
      default: return 'Очікує';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'cancelled': return COLORS.danger;
      default: return COLORS.accent;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Профіль</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.light} />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.white} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.full_name}</Text>
            <Text style={styles.userPhone}>{user.phone}</Text>
          </View>
        </View>

        {/* Discount Card */}
        <TouchableOpacity
          style={styles.discountCard}
          onPress={() => setShowQR(!showQR)}
        >
          <View style={styles.discountCardHeader}>
            <View>
              <Text style={styles.discountCardTitle}>Дисконтна картка</Text>
              <Text style={styles.discountCardSubtitle}>
                {showQR ? 'Натисніть, щоб сховати' : 'Натисніть, щоб показати QR'}
              </Text>
            </View>
            <Ionicons name="qr-code" size={28} color={COLORS.white} />
          </View>
          {showQR && (
            <View style={styles.qrContainer}>
              <QRCode
                value={user.qr_md5}
                size={180}
                backgroundColor="white"
                color={COLORS.primary}
              />
            </View>
          )}
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="gift" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>{user.bonus_points}</Text>
            <Text style={styles.statLabel}>Бонусів</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="pricetag" size={24} color={COLORS.accent} />
            <Text style={styles.statValue}>{user.discount_percent}%</Text>
            <Text style={styles.statLabel}>Знижка</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cart" size={24} color="#FFE66D" />
            <Text style={styles.statValue}>{user.total_orders_count}</Text>
            <Text style={styles.statLabel}>Замовлень</Text>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Останні замовлення</Text>
          {orders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.accent} />
              <Text style={styles.emptyOrdersText}>Замовлень поки немає</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>{order.total_amount} грн</Text>
                  <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Total Spent */}
        <View style={styles.totalSpentCard}>
          <Ionicons name="wallet" size={28} color={COLORS.success} />
          <View>
            <Text style={styles.totalSpentLabel}>Загальна сума замовлень</Text>
            <Text style={styles.totalSpentValue}>{user.total_orders_amount.toFixed(0)} грн</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 16,
  },
  userName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userPhone: {
    color: COLORS.light,
    fontSize: 14,
    marginTop: 4,
  },
  discountCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
  },
  discountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discountCardTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  discountCardSubtitle: {
    color: COLORS.light,
    fontSize: 12,
    marginTop: 4,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: COLORS.light,
    fontSize: 11,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyOrders: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
  },
  emptyOrdersText: {
    color: COLORS.light,
    marginTop: 12,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  orderInfo: {},
  orderId: {
    color: COLORS.white,
    fontWeight: '600',
  },
  orderDate: {
    color: COLORS.light,
    fontSize: 12,
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  orderStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  totalSpentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: 'rgba(78,205,196,0.15)',
    borderRadius: 16,
    gap: 12,
  },
  totalSpentLabel: {
    color: COLORS.light,
    fontSize: 13,
  },
  totalSpentValue: {
    color: COLORS.success,
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 100,
  },
});
