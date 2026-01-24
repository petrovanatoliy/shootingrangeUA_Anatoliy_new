import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const COLORS = {
  primary: '#202447',
  secondary: '#193B89',
  accent: '#6379C2',
  light: '#CAD2F6',
  white: '#FFFFFF',
  success: '#4ECDC4',
  warning: '#FFA500',
  danger: '#FF6B6B',
};

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  items: any[];
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Очікує', color: COLORS.warning, icon: 'time' },
  confirmed: { label: 'Підтверджено', color: COLORS.success, icon: 'checkmark-circle' },
  completed: { label: 'Виконано', color: COLORS.accent, icon: 'checkmark-done' },
  cancelled: { label: 'Скасовано', color: COLORS.danger, icon: 'close-circle' },
};

export default function MyOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        router.replace('/user/login');
        return;
      }

      const response = await axios.get(`${API_URL}/api/orders?user_id=${userId}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Мої замовлення</Text>
        <Text style={styles.headerSubtitle}>
          Всього замовлень: {orders.length}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color={COLORS.accent} />
            <Text style={styles.emptyText}>Ще немає замовлень</Text>
            <Text style={styles.emptySubtext}>
              Оформіть своє перше замовлення в каталозі
            </Text>
            <TouchableOpacity
              style={styles.catalogButton}
              onPress={() => router.push('/user/catalogs')}
            >
              <Ionicons name="grid" size={20} color={COLORS.white} />
              <Text style={styles.catalogButtonText}>Перейти до каталогу</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.orderNumber}>
                        Замовлення #{order.id.slice(0, 8)}
                      </Text>
                      <Text style={styles.orderDate}>
                        {formatDate(order.created_at)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusConfig.color + '20' },
                      ]}
                    >
                      <Ionicons
                        name={statusConfig.icon as any}
                        size={16}
                        color={statusConfig.color}
                      />
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderItems}>
                    <Text style={styles.itemsTitle}>Товари:</Text>
                    {order.items.slice(0, 3).map((item, index) => (
                      <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                      </View>
                    ))}
                    {order.items.length > 3 && (
                      <Text style={styles.moreItems}>
                        +{order.items.length - 3} ще...
                      </Text>
                    )}
                  </View>

                  <View style={styles.orderFooter}>
                    <Text style={styles.totalLabel}>Сума:</Text>
                    <Text style={styles.totalAmount}>{order.total_amount} ₴</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.light,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.light,
    textAlign: 'center',
    marginBottom: 24,
  },
  catalogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  catalogButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  ordersContainer: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.light,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.light,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
    color: COLORS.white,
    flex: 1,
    marginRight: 8,
  },
  itemQuantity: {
    fontSize: 14,
    color: COLORS.light,
    fontWeight: '500',
  },
  moreItems: {
    fontSize: 12,
    color: COLORS.accent,
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.light,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.success,
  },
});
