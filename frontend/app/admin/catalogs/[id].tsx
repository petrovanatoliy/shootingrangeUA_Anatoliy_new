import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
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

export default function CatalogEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      loadCatalog();
    }
  }, [id]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/catalogs/${id}`);
      const catalog = response.data;
      setName(catalog.name);
      setImage(catalog.image);
      setIsVisible(catalog.is_visible);
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося завантажити каталог');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Помилка', 'Потрібен доступ до галереї');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Помилка', 'Введіть назву каталогу');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        image,
        is_visible: isVisible,
      };

      if (isNew) {
        await axios.post(`${API_URL}/api/catalogs`, data);
      } else {
        await axios.put(`${API_URL}/api/catalogs/${id}`, data);
      }

      Alert.alert('Успіх', isNew ? 'Каталог створено' : 'Каталог оновлено');
      router.back();
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося зберегти каталог');
    } finally {
      setSaving(false);
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
          <Text style={styles.headerTitle}>
            {isNew ? 'Новий каталог' : 'Редагування'}
          </Text>
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

        <ScrollView style={styles.content}>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={48} color={COLORS.accent} />
                <Text style={styles.imagePlaceholderText}>Додати зображення</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Назва каталогу</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Введіть назву"
              placeholderTextColor={COLORS.accent}
            />
          </View>

          <TouchableOpacity
            style={styles.visibilityToggle}
            onPress={() => setIsVisible(!isVisible)}
          >
            <View style={styles.visibilityInfo}>
              <Ionicons
                name={isVisible ? 'eye' : 'eye-off'}
                size={24}
                color={isVisible ? COLORS.success : COLORS.warm}
              />
              <View style={styles.visibilityText}>
                <Text style={styles.visibilityTitle}>
                  {isVisible ? 'Видимий' : 'Прихований'}
                </Text>
                <Text style={styles.visibilitySubtitle}>
                  {isVisible
                    ? 'Каталог відображається у користувачів'
                    : 'Каталог прихований від користувачів'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.visibilityIndicator,
                isVisible ? styles.visibilityOn : styles.visibilityOff,
              ]}
            />
          </TouchableOpacity>
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
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: COLORS.accent,
    marginTop: 12,
    fontSize: 16,
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
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.white,
  },
  visibilityToggle: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visibilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visibilityText: {
    gap: 4,
  },
  visibilityTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  visibilitySubtitle: {
    color: COLORS.light,
    fontSize: 12,
  },
  visibilityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  visibilityOn: {
    backgroundColor: COLORS.success,
  },
  visibilityOff: {
    backgroundColor: COLORS.warm,
  },
});
