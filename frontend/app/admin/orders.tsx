import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
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
  warning: '#FFE66D',
};

interface OrderItem {
  type: string;
  name: string;
  quantity: number;
  total_amount: number;
}

interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  discount_percent: number;
  bonus_points_earned: number;
  status: string;
  created_at: string;
}

interface User {
  id: string;
  phone: string;
  full_name: string;
}

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/orders`),
        axios.get(`${API_URL}/api/users`),
      ]);

      setOrders(ordersRes.data);

      const usersMap: Record<string, User> = {};
      usersRes.data.forEach((user: User) => {
        usersMap[user.id] = user;
      });
      setUsers(usersMap);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'cancelled':
        return COLORS.danger;
      case 'processing':
        return COLORS.warning;
      default:
        return COLORS.accent;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Виконано';
      case 'cancelled':
        return 'Скасовано';
      case 'processing':
        return 'В обробці';
      default:
        return 'Очікує';
    }
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

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await axios.put(`${API_URL}/api/orders/${orderId}/status?status=${newStatus}`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const renderItem = ({ item }: { item: Order }) => {
    const user = users[item.user_id];
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '30' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={COLORS.light} />
            <Text style={styles.infoText}>{user?.full_name || 'Невідомий'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={COLORS.light} />
            <Text style={styles.infoText}>{user?.phone || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={COLORS.light} />
            <Text style={styles.infoText}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        <View style={styles.itemsList}>
          {item.items.map((orderItem, index) => (
            <View key={index} style={styles.orderItem}>
              <Ionicons
                name={orderItem.type === 'product' ? 'cube-outline' : 'briefcase-outline'}
                size={14}
                color={COLORS.accent}
              />
              <Text style={styles.itemName} numberOfLines={1}>
                {orderItem.name} x{orderItem.quantity}
              </Text>
              <Text style={styles.itemPrice}>{orderItem.total_amount} грн</Text>
            </View>
          ))}
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Загалом:</Text>
            <Text style={styles.totalAmount}>{item.total_amount} грн</Text>
          </View>
          {item.bonus_points_earned > 0 && (
            <View style={styles.bonusContainer}>
              <Ionicons name="gift" size={14} color={COLORS.success} />
              <Text style={styles.bonusText}>+{item.bonus_points_earned} бонусів</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          {item.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.processButton]}
                onPress={() => updateStatus(item.id, 'processing')}
              >
                <Text style={styles.actionButtonText}>В обробку</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => updateStatus(item.id, 'completed')}
              >
                <Text style={styles.actionButtonText}>Виконано</Text>
              </TouchableOpacity>
            </>
          )}
          {item.status === 'processing' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => updateStatus(item.id, 'completed')}
            >
              <Text style={styles.actionButtonText}>Виконано</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Замовлення</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={64} color={COLORS.accent} />
              <Text style={styles.emptyText}>Немає замовлень</Text>
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
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    gap: 6,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: COLORS.light,
    fontSize: 14,
  },
  itemsList: {
    gap: 8,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
  },
  itemPrice: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    color: COLORS.light,
    fontSize: 14,
  },
  totalAmount: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  bonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bonusText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  processButton: {
    backgroundColor: COLORS.warning,
  },
  completeButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
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
});
