import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
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

interface Service {
  id: string;
  catalog_id: string;
  name: string;
  description: string;
  price_uah: number;
  is_visible: boolean;
  has_time_selection: boolean;
  has_duration_selection: boolean;
  has_master_selection: boolean;
}

export default function ServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Failed to load services:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити послуги');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  const toggleVisibility = async (service: Service) => {
    try {
      await axios.put(`${API_URL}/api/services/${service.id}`, {
        is_visible: !service.is_visible,
      });
      setServices((prev) =>
        prev.map((s) =>
          s.id === service.id ? { ...s, is_visible: !s.is_visible } : s
        )
      );
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося змінити видимість');
    }
  };

  const deleteService = (service: Service) => {
    Alert.alert(
      'Видалення',
      `Видалити послугу "${service.name}"?`,
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/services/${service.id}`);
              setServices((prev) => prev.filter((s) => s.id !== service.id));
            } catch (error) {
              Alert.alert('Помилка', 'Не вдалося видалити послугу');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Service }) => (
    <View style={styles.serviceCard}>
      <TouchableOpacity
        style={styles.serviceContent}
        onPress={() => router.push(`/admin/services/${item.id}`)}
      >
        <View style={styles.serviceIcon}>
          <Ionicons name="briefcase" size={28} color={COLORS.accent} />
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.servicePrice}>{item.price_uah} грн</Text>
          <View style={styles.badges}>
            {item.has_time_selection && (
              <View style={styles.badge}>
                <Ionicons name="time-outline" size={12} color={COLORS.light} />
              </View>
            )}
            {item.has_duration_selection && (
              <View style={styles.badge}>
                <Ionicons name="hourglass-outline" size={12} color={COLORS.light} />
              </View>
            )}
            {item.has_master_selection && (
              <View style={styles.badge}>
                <Ionicons name="person-outline" size={12} color={COLORS.light} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.serviceActions}>
        <Switch
          value={item.is_visible}
          onValueChange={() => toggleVisibility(item)}
          trackColor={{ false: COLORS.warm, true: COLORS.success }}
          thumbColor={COLORS.white}
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteService(item)}
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
        <Text style={styles.headerTitle}>Послуги</Text>
        <TouchableOpacity
          onPress={() => router.push('/admin/services/new')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={64} color={COLORS.accent} />
              <Text style={styles.emptyText}>Немає послуг</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/admin/services/new')}
              >
                <Text style={styles.emptyButtonText}>Додати послугу</Text>
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
  serviceCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  serviceContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(99,121,194,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serviceActions: {
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
