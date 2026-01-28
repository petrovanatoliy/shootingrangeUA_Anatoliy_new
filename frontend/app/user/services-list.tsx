import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const COLORS = {
  primary: '#202447',
  secondary: '#193B89',
  accent: '#6379C2',
  light: '#CAD2F6',
  white: '#FFFFFF',
};

interface Catalog {
  id: string;
  name: string;
  image?: string;
  is_visible: boolean;
  is_product: boolean;
}

export default function ServicesListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const type = params.type as string;

  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    try {
      // Завантажити тільки каталоги послуг (is_product=false)
      const response = await axios.get(`${API_URL}/api/catalogs`, {
        params: {
          visible_only: true,
          is_product: false,
        },
      });
      setCatalogs(response.data);
    } catch (error) {
      console.error('Failed to load catalogs:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCatalogs();
  };

  const getTitle = () => {
    if (type === 'rental') return 'Оренда';
    return 'Тренування';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
      >
        {catalogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={80} color={COLORS.accent} />
            <Text style={styles.emptyText}>Категорії послуг відсутні</Text>
          </View>
        ) : (
          <View style={styles.catalogsGrid}>
            {catalogs.map((catalog) => (
              <TouchableOpacity
                key={catalog.id}
                style={styles.catalogCard}
                onPress={() => router.push(`/user/services?catalog_id=${catalog.id}`)}
              >
                {catalog.image ? (
                  <Image source={{ uri: catalog.image }} style={styles.catalogImage} />
                ) : (
                  <View style={styles.catalogImagePlaceholder}>
                    <Ionicons name="albums" size={40} color={COLORS.accent} />
                  </View>
                )}
                <Text style={styles.catalogName}>{catalog.name}</Text>
              </TouchableOpacity>
            ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.light,
    marginTop: 20,
  },
  catalogsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  catalogCard: {
    width: '48%',
    margin: '1%',
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  catalogImage: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.accent + '20',
  },
  catalogImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catalogName: {
    padding: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
});
