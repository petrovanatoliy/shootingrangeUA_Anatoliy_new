import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
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
  warm: '#5A3E40',
  white: '#FFFFFF',
  success: '#4ECDC4',
};

export default function UserLoginScreen() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('+38');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setPhone(cleaned.slice(0, 10));
  };

  const handleCountryCodeChange = (text: string) => {
    // Allow + and numbers
    const cleaned = text.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      setCountryCode(cleaned);
    } else if (cleaned) {
      setCountryCode('+' + cleaned);
    } else {
      setCountryCode('+');
    }
  };

  const checkPhone = async () => {
    if (phone.length < 10) {
      Alert.alert('Помилка', 'Введіть коректний номер телефону');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phone}`;
      
      // Check if this is an admin phone
      const adminCheckResponse = await axios.post(`${API_URL}/api/users/check-admin`, null, {
        params: { phone: fullPhone }
      });
      
      if (adminCheckResponse.data.is_admin) {
        // This is an admin phone, redirect to admin dashboard
        await AsyncStorage.setItem('admin_mode', 'true');
        router.replace('/admin/dashboard');
        return;
      }

      // Check if user exists
      const response = await axios.get(`${API_URL}/api/users/phone/${fullPhone}`);
      // User exists, log them in
      await AsyncStorage.setItem('user_id', response.data.id);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data));
      router.replace('/user/home');
    } catch (error: any) {
      if (error.response?.status === 404) {
        // New user, show name field
        setIsNewUser(true);
      } else {
        Alert.alert('Помилка', 'Не вдалося перевірити номер');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert('Помилка', "Введіть ваше ім'я");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phone}`;
      const response = await axios.post(`${API_URL}/api/users/login`, {
        phone: fullPhone,
        full_name: fullName.trim(),
      });

      await AsyncStorage.setItem('user_id', response.data.id);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data));
      
      Alert.alert(
        'Вітаємо!',
        'Вашу дисконтну картку створено. Ви отримуєте бонуси за кожне замовлення!',
        [{ text: 'Чудово', onPress: () => router.replace('/user/home') }]
      );
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося зареєструватися');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-circle" size={80} color={COLORS.accent} />
            </View>

            <Text style={styles.title}>
              {isNewUser ? 'Реєстрація' : 'Вхід'}
            </Text>
            <Text style={styles.subtitle}>
              {isNewUser
                ? 'Заповніть дані для створення акаунту'
                : 'Введіть номер телефону для входу'}
            </Text>

            <View style={styles.phoneInputContainer}>
              <TextInput
                style={styles.countryCodeInput}
                value={countryCode}
                onChangeText={handleCountryCodeChange}
                keyboardType="phone-pad"
                maxLength={5}
                editable={!isNewUser}
              />
              <TextInput
                style={styles.phoneInput}
                value={formatPhone(phone)}
                onChangeText={handlePhoneChange}
                placeholder="XXX XXX XX XX"
                placeholderTextColor={COLORS.accent}
                keyboardType="phone-pad"
                maxLength={13}
                editable={!isNewUser}
              />
            </View>

            {isNewUser && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ваше ім'я</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Введіть ім'я та прізвище"
                  placeholderTextColor={COLORS.accent}
                  autoCapitalize="words"
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={isNewUser ? handleRegister : checkPhone}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    {isNewUser ? 'Зареєструватися' : 'Продовжити'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>

            {isNewUser && (
              <TouchableOpacity
                style={styles.backToPhoneButton}
                onPress={() => {
                  setIsNewUser(false);
                  setFullName('');
                }}
              >
                <Text style={styles.backToPhoneText}>Змінити номер</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    padding: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.light,
    textAlign: 'center',
    marginBottom: 32,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  countryCodeInput: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
    width: 70,
    textAlign: 'center',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: COLORS.white,
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: COLORS.light,
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.white,
  },
  submitButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backToPhoneButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backToPhoneText: {
    color: COLORS.accent,
    fontSize: 14,
  },
});
