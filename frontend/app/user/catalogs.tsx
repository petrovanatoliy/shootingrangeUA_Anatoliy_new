import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
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
  white: '#FFFFFF',
};

interface Catalog {
  id: string;
  name: string;
  image: string;
}

export default function CatalogsScreen() {
  const router = useRouter();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/catalogs?visible_only=true`);
      setCatalogs(response.data);
    } catch (error) {
      console.error('Failed to load catalogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCatalogs();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Catalog }) => (
    <TouchableOpacity
      style={styles.catalogCard}
      onPress={() => router.push(`/user/catalog/${item.id}`)}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.catalogImage} />
      ) : (
        <View style={styles.catalogImagePlaceholder}>
          <Ionicons name="folder-open" size={48} color={COLORS.accent} />
        </View>
      )}
      <View style={styles.catalogOverlay}>
        <Text style={styles.catalogName}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Каталог</Text>
      </View>

      <FlatList
        key="catalogs-grid"
        data={catalogs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color={COLORS.accent} />
              <Text style={styles.emptyText}>Каталоги відсутні</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    gap: 12,
  },
  catalogCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  catalogImage: {
    width: '100%',
    height: '100%',
  },
  catalogImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catalogOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  catalogName: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: COLORS.light,
    fontSize: 16,
    marginTop: 16,
  },
});
