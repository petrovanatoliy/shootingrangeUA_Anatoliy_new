import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { apiConfig } from '../config/apiConfig';

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://shooting-range-ua.preview.emergentagent.com';

const COLORS = {
  primary: '#202447',
  secondary: '#193B89',
  accent: '#6379C2',
  light: '#CAD2F6',
  warm: '#5A3E40',
  white: '#FFFFFF',
};

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const [showAdminButton, setShowAdminButton] = useState(false);

  useEffect(() => {
    if (!checked) {
      setChecked(true);
      initializeApp();
    }
  }, [checked]);

  const initializeApp = async () => {
    // Ініціалізувати API конфігурацію
    await apiConfig.initialize();
    
    // Потім виконати checkAuth та checkAdminPhones
    checkAuth();
    checkAdminPhones();
  };

  const checkAuth = async () => {
    try {
      const adminMode = await AsyncStorage.getItem('admin_mode');
      const userId = await AsyncStorage.getItem('user_id');
      
      if (adminMode === 'true') {
        router.replace('/admin/dashboard');
        return;
      } else if (userId) {
        router.replace('/user/home');
        return;
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminPhones = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/settings/has-admin-phones`);
      // Показувати кнопку тільки якщо немає налаштованих admin phones
      setShowAdminButton(!response.data.has_admin_phones);
    } catch (error) {
      console.error('Error checking admin phones:', error);
      // За замовчуванням показуємо кнопку
      setShowAdminButton(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="locate" size={100} color={COLORS.accent} />
          <Text style={styles.title}>Shooting Range</Text>
          <Text style={styles.subtitle}>Тир та стрілецькі послуги</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.userButton}
            onPress={() => router.push('/user/login')}
          >
            <Ionicons name="call" size={24} color={COLORS.white} />
            <Text style={styles.buttonText}>За номером телефону</Text>
          </TouchableOpacity>

          {showAdminButton && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push('/admin/login')}
            >
              <Ionicons name="shield-checkmark" size={20} color={COLORS.light} />
              <Text style={styles.adminButtonText}>Адміністратор</Text>
            </TouchableOpacity>
          )}
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.light,
    marginTop: 8,
  },
  buttonsContainer: {
    gap: 12,
  },
  userButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  adminButtonText: {
    color: COLORS.light,
    fontSize: 14,
  },
});
