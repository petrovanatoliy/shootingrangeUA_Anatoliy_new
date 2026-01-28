import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
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

interface Settings {
  telegram_bot_token: string;
  telegram_chat_id: string;
  default_language: string;
  admin_phone1: string;
  admin_phone2: string;
  admin_phone3: string;
  server_address: string;
  access_code: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    telegram_bot_token: '',
    telegram_chat_id: '',
    default_language: 'uk',
    admin_phone1: '',
    admin_phone2: '',
    admin_phone3: '',
    server_address: '',
    access_code: '',
  });
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/settings`, settings);
      Alert.alert('Успіх', 'Налаштування збережено');
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося зберегти налаштування');
    } finally {
      setSaving(false);
    }
  };

  const testTelegram = async () => {
    if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
      Alert.alert('Помилка', 'Введіть токен бота та Chat ID');
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage`;
      const message = '🎯 Тестове повідомлення від Shooting Range Admin';
      
      await axios.post(url, {
        chat_id: settings.telegram_chat_id,
        text: message,
      });
      
      Alert.alert('Успіх', 'Тестове повідомлення відправлено!');
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося відправити повідомлення. Перевірте токен та Chat ID.');
    }
  };

  const testConnection = async () => {
    if (!settings.server_address) {
      Alert.alert('Помилка', 'Введіть адресу сервера');
      return;
    }

    setTesting(true);
    try {
      const response = await axios.post(`${API_URL}/api/settings/test-connection`, null, {
        params: {
          server_address: settings.server_address,
          access_code: settings.access_code,
        },
      });

      if (response.data.success) {
        Alert.alert('Успіх! ✅', response.data.message);
      } else {
        Alert.alert('Помилка', response.data.message);
      }
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося підключитися до сервера');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Налаштування</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="checkmark" size={24} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="paper-plane" size={24} color="#0088CC" />
              <Text style={styles.sectionTitle}>Telegram інтеграція</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Замовлення будуть автоматично надсилатися у вказаний Telegram чат.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bot Token</Text>
              <View style={styles.tokenInputContainer}>
                <TextInput
                  style={[styles.input, styles.tokenInput]}
                  value={settings.telegram_bot_token}
                  onChangeText={(text) =>
                    setSettings({ ...settings, telegram_bot_token: text })
                  }
                  placeholder="Введіть токен бота"
                  placeholderTextColor={COLORS.accent}
                  secureTextEntry={!showToken}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowToken(!showToken)}
                >
                  <Ionicons
                    name={showToken ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.light}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>
                Отримайте у @BotFather в Telegram
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Chat ID</Text>
              <TextInput
                style={styles.input}
                value={settings.telegram_chat_id}
                onChangeText={(text) =>
                  setSettings({ ...settings, telegram_chat_id: text })
                }
                placeholder="Введіть Chat ID"
                placeholderTextColor={COLORS.accent}
                keyboardType="numeric"
              />
              <Text style={styles.hint}>
                ID чату або групи для отримання замовлень
              </Text>
            </View>

            <TouchableOpacity style={styles.testButton} onPress={testTelegram}>
              <Ionicons name="send" size={18} color={COLORS.white} />
              <Text style={styles.testButtonText}>Надіслати тестове повідомлення</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.accent} />
              <Text style={styles.sectionTitle}>Телефони адміністраторів</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Користувачі з цими номерами матимуть доступ до адмін-панелі.
                Якщо заповнено хоча б один номер, кнопка "Адміністратор" буде прихована на головній сторінці.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Телефон адміністратора 1</Text>
              <TextInput
                style={styles.input}
                value={settings.admin_phone1}
                onChangeText={(text) =>
                  setSettings({ ...settings, admin_phone1: text })
                }
                placeholder="+380661234567"
                placeholderTextColor={COLORS.accent}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Телефон адміністратора 2</Text>
              <TextInput
                style={styles.input}
                value={settings.admin_phone2}
                onChangeText={(text) =>
                  setSettings({ ...settings, admin_phone2: text })
                }
                placeholder="+380661234567"
                placeholderTextColor={COLORS.accent}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Телефон адміністратора 3</Text>
              <TextInput
                style={styles.input}
                value={settings.admin_phone3}
                onChangeText={(text) =>
                  setSettings({ ...settings, admin_phone3: text })
                }
                placeholder="+380661234567"
                placeholderTextColor={COLORS.accent}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="server" size={24} color={COLORS.accent} />
              <Text style={styles.sectionTitle}>Підключення до сервера</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Налаштуйте підключення до зовнішнього backend сервера.
                Перевірте зв'язок перед збереженням налаштувань.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Адреса сервера</Text>
              <TextInput
                style={styles.input}
                value={settings.server_address}
                onChangeText={(text) =>
                  setSettings({ ...settings, server_address: text })
                }
                placeholder="https://api.example.com"
                placeholderTextColor={COLORS.accent}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Код доступу користувача</Text>
              <TextInput
                style={styles.input}
                value={settings.access_code}
                onChangeText={(text) =>
                  setSettings({ ...settings, access_code: text })
                }
                placeholder="Введіть код доступу"
                placeholderTextColor={COLORS.accent}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={[styles.testButton, testing && styles.testButtonDisabled]} 
              onPress={testConnection}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="wifi" size={18} color={COLORS.white} />
                  <Text style={styles.testButtonText}>Перевірити зв'язок</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="language" size={24} color={COLORS.accent} />
              <Text style={styles.sectionTitle}>Мова</Text>
            </View>

            <View style={styles.languageOptions}>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  settings.default_language === 'uk' && styles.languageOptionActive,
                ]}
                onPress={() => setSettings({ ...settings, default_language: 'uk' })}
              >
                <Text style={styles.languageEmoji}>🇺🇦</Text>
                <Text style={styles.languageText}>Українська</Text>
                {settings.default_language === 'uk' && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  settings.default_language === 'en' && styles.languageOptionActive,
                ]}
                onPress={() => setSettings({ ...settings, default_language: 'en' })}
              >
                <Text style={styles.languageEmoji}>🇬🇧</Text>
                <Text style={styles.languageText}>English</Text>
                {settings.default_language === 'en' && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* App Info */}
          <View style={styles.appInfoSection}>
            <View style={styles.appInfoDivider} />
            
            <View style={styles.appInfoContent}>
              <Text style={styles.versionText}>Версія мобільного додатку: 1.0.0</Text>
              
              <Text style={styles.developmentText}>Development by HVOYA integra 2026</Text>
              
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.websiteText}>hvoya.com.ua</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomPadding} />
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
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
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
  saveButton: {
    padding: 8,
    backgroundColor: COLORS.success,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  infoCard: {
    backgroundColor: 'rgba(0,136,204,0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    color: COLORS.light,
    fontSize: 13,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
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
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.white,
  },
  tokenInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  eyeButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  hint: {
    color: COLORS.accent,
    fontSize: 12,
    marginTop: 6,
  },
  testButton: {
    backgroundColor: '#0088CC',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  languageOptions: {
    gap: 8,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  languageOptionActive: {
    backgroundColor: 'rgba(78,205,196,0.2)',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  languageEmoji: {
    fontSize: 24,
  },
  languageText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
  },
  appInfoSection: {
    marginTop: 40,
    marginBottom: 20,
  },
  appInfoDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  appInfoContent: {
    alignItems: 'center',
    gap: 8,
  },
  versionText: {
    color: COLORS.light,
    fontSize: 14,
    marginBottom: 12,
  },
  developmentText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '500',
  },
  websiteText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  bottomPadding: {
    height: 40,
  },
});
