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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useCartStore } from '../../../store/cartStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const COLORS = {
  primary: '#202447',
  secondary: '#193B89',
  accent: '#6379C2',
  light: '#CAD2F6',
  white: '#FFFFFF',
  success: '#4ECDC4',
};

interface Service {
  id: string;
  name: string;
  description: string;
  price_uah: number;
  has_time_selection: boolean;
  has_duration_selection: boolean;
  has_master_selection: boolean;
  price_depends_on_duration: boolean;
}

interface Master {
  id: string;
  full_name: string;
  position: string;
}

const DURATIONS = [
  { value: 30, label: '30 хв' },
  { value: 60, label: '1 год' },
  { value: 90, label: '1.5 год' },
  { value: 120, label: '2 год' },
];

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [serviceRes, mastersRes] = await Promise.all([
        axios.get(`${API_URL}/api/services/${id}`),
        axios.get(`${API_URL}/api/services/${id}/masters`),
      ]);
      setService(serviceRes.data);
      setMasters(mastersRes.data);
      if (mastersRes.data.length > 0) {
        setSelectedMaster(mastersRes.data[0]);
      }
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося завантажити послугу');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!service) return 0;
    if (service.price_depends_on_duration) {
      return service.price_uah * (selectedDuration / 60);
    }
    return service.price_uah;
  };

  const handleAddToCart = () => {
    if (!service) return;

    if (service.has_master_selection && !selectedMaster) {
      Alert.alert('Помилка', 'Оберіть майстра');
      return;
    }

    addItem({
      id: `service-${service.id}-${Date.now()}`,
      type: 'service',
      name: service.name,
      price: calculatePrice(),
      discountPercent: 0,
      quantity: 1,
      duration: service.has_duration_selection ? selectedDuration : undefined,
      masterName: selectedMaster?.full_name,
    });

    Alert.alert(
      'Додано до кошика',
      service.name,
      [
        { text: 'Продовжити', style: 'cancel' },
        { text: 'До кошика', onPress: () => router.push('/user/cart') },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!service) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Послуга</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <Ionicons name="briefcase" size={64} color={COLORS.accent} />
        </View>

        <View style={styles.content}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceDescription}>{service.description}</Text>

          {/* Duration Selection */}
          {service.has_duration_selection && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Тривалість</Text>
              <View style={styles.optionsRow}>
                {DURATIONS.map((d) => (
                  <TouchableOpacity
                    key={d.value}
                    style={[
                      styles.optionButton,
                      selectedDuration === d.value && styles.optionButtonActive,
                    ]}
                    onPress={() => setSelectedDuration(d.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedDuration === d.value && styles.optionTextActive,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Master Selection */}
          {service.has_master_selection && masters.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Майстер</Text>
              <View style={styles.mastersContainer}>
                {masters.map((master) => (
                  <TouchableOpacity
                    key={master.id}
                    style={[
                      styles.masterCard,
                      selectedMaster?.id === master.id && styles.masterCardActive,
                    ]}
                    onPress={() => setSelectedMaster(master)}
                  >
                    <View style={styles.masterAvatar}>
                      <Ionicons name="person" size={24} color={COLORS.white} />
                    </View>
                    <View>
                      <Text style={styles.masterName}>{master.full_name}</Text>
                      <Text style={styles.masterPosition}>{master.position}</Text>
                    </View>
                    {selectedMaster?.id === master.id && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.success} style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Price Info */}
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Вартість:</Text>
            <Text style={styles.priceValue}>{calculatePrice().toFixed(0)} грн</Text>
            {service.price_depends_on_duration && (
              <Text style={styles.priceHint}>({service.price_uah} грн/год)</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Ionicons name="cart" size={20} color={COLORS.white} />
          <Text style={styles.addToCartText}>Додати до кошика</Text>
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
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(99,121,194,0.15)',
  },
  content: {
    padding: 20,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 12,
  },
  serviceDescription: {
    color: COLORS.light,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  optionButtonActive: {
    backgroundColor: COLORS.secondary,
  },
  optionText: {
    color: COLORS.light,
    fontSize: 14,
  },
  optionTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  mastersContainer: {
    gap: 8,
  },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  masterCardActive: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(78,205,196,0.1)',
  },
  masterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  masterName: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
  masterPosition: {
    color: COLORS.light,
    fontSize: 13,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 100,
  },
  priceLabel: {
    color: COLORS.light,
    fontSize: 16,
  },
  priceValue: {
    color: COLORS.success,
    fontSize: 28,
    fontWeight: 'bold',
  },
  priceHint: {
    color: COLORS.light,
    fontSize: 13,
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
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addToCartText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
