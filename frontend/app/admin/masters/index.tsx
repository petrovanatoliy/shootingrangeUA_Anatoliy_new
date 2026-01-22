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

interface Master {
  id: string;
  full_name: string;
  position: string;
  description: string | null;
  is_active: boolean;
  service_ids: string[];
}

export default function MastersScreen() {
  const router = useRouter();
  const [masters, setMasters] = useState<Master[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMasters();
  }, []);

  const loadMasters = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/masters`);
      setMasters(response.data);
    } catch (error) {
      console.error('Failed to load masters:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити майстрів');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMasters();
    setRefreshing(false);
  };

  const toggleActive = async (master: Master) => {
    try {
      await axios.put(`${API_URL}/api/masters/${master.id}`, {
        is_active: !master.is_active,
      });
      setMasters((prev) =>
        prev.map((m) =>
          m.id === master.id ? { ...m, is_active: !m.is_active } : m
        )
      );
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося змінити статус');
    }
  };

  const deleteMaster = (master: Master) => {
    Alert.alert(
      'Видалення',
      `Видалити майстра "${master.full_name}"?`,
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/masters/${master.id}`);
              setMasters((prev) => prev.filter((m) => m.id !== master.id));
            } catch (error) {
              Alert.alert('Помилка', 'Не вдалося видалити майстра');
            }
          },
        },
      ]
    );
  };

  const getPositionColor = (position: string) => {
    switch (position.toLowerCase()) {
      case 'гуру':
        return '#FFD700';
      case 'головний інструктор':
        return '#FF6B6B';
      case 'інструктор':
        return '#4ECDC4';
      default:
        return COLORS.accent;
    }
  };

  const renderItem = ({ item }: { item: Master }) => (
    <View style={styles.masterCard}>
      <TouchableOpacity
        style={styles.masterContent}
        onPress={() => router.push(`/admin/masters/${item.id}`)}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color={COLORS.white} />
        </View>
        <View style={styles.masterInfo}>
          <Text style={styles.masterName}>{item.full_name}</Text>
          <View style={[styles.positionBadge, { backgroundColor: getPositionColor(item.position) + '30' }]}>
            <Text style={[styles.positionText, { color: getPositionColor(item.position) }]}>
              {item.position}
            </Text>
          </View>
          {item.service_ids.length > 0 && (
            <Text style={styles.servicesCount}>
              Послуг: {item.service_ids.length}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.masterActions}>
        <Switch
          value={item.is_active}
          onValueChange={() => toggleActive(item)}
          trackColor={{ false: COLORS.warm, true: COLORS.success }}
          thumbColor={COLORS.white}
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteMaster(item)}
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
        <Text style={styles.headerTitle}>Майстри</Text>
        <TouchableOpacity
          onPress={() => router.push('/admin/masters/new')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={masters}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={COLORS.accent} />
              <Text style={styles.emptyText}>Немає майстрів</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/admin/masters/new')}
              >
                <Text style={styles.emptyButtonText}>Додати майстра</Text>
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
  masterCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  masterContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  masterInfo: {
    flex: 1,
    marginLeft: 12,
  },
  masterName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  positionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  positionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  servicesCount: {
    fontSize: 12,
    color: COLORS.light,
  },
  masterActions: {
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
