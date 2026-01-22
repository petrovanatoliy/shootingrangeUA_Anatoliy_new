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

interface Catalog {
  id: string;
  name: string;
}

export default function ProductEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [catalogId, setCatalogId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceUah, setPriceUah] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [quantity, setQuantity] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);

  useEffect(() => {
    loadCatalogs();
    if (!isNew && id) {
      loadProduct();
    }
  }, [id]);

  const loadCatalogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/catalogs`);
      setCatalogs(response.data);
      if (response.data.length > 0 && isNew) {
        setCatalogId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load catalogs:', error);
    }
  };

  const loadProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/products/${id}`);
      const product = response.data;
      setCatalogId(product.catalog_id);
      setName(product.name);
      setDescription(product.description);
      setPriceUah(product.price_uah.toString());
      setDiscountPercent(product.discount_percent.toString());
      setQuantity(product.quantity.toString());
      setWeight(product.weight || '');
      setColor(product.color || '');
      setMainImage(product.main_image);
      setIsVisible(product.is_visible);
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося завантажити товар');
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
      setMainImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Помилка', 'Введіть назву товару');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Помилка', 'Введіть опис товару');
      return;
    }
    if (!priceUah || parseFloat(priceUah) <= 0) {
      Alert.alert('Помилка', 'Введіть коректну ціну');
      return;
    }
    if (!quantity || parseInt(quantity) < 0) {
      Alert.alert('Помилка', 'Введіть кількість');
      return;
    }
    if (!mainImage) {
      Alert.alert('Помилка', 'Додайте зображення товару');
      return;
    }

    setSaving(true);
    try {
      const data = {
        catalog_id: catalogId,
        name: name.trim(),
        description: description.trim(),
        price_uah: parseFloat(priceUah),
        discount_percent: parseFloat(discountPercent) || 0,
        quantity: parseInt(quantity),
        weight: weight.trim() || null,
        color: color.trim() || null,
        main_image: mainImage,
        is_visible: isVisible,
      };

      if (isNew) {
        await axios.post(`${API_URL}/api/products`, data);
      } else {
        await axios.put(`${API_URL}/api/products/${id}`, data);
      }

      Alert.alert('Успіх', isNew ? 'Товар створено' : 'Товар оновлено');
      router.back();
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося зберегти товар');
    } finally {
      setSaving(false);
    }
  };

  const selectedCatalog = catalogs.find((c) => c.id === catalogId);

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
            {isNew ? 'Новий товар' : 'Редагування'}
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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            {mainImage ? (
              <Image source={{ uri: mainImage }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={48} color={COLORS.accent} />
                <Text style={styles.imagePlaceholderText}>Додати зображення *</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Каталог *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCatalogPicker(!showCatalogPicker)}
            >
              <Text style={styles.pickerText}>
                {selectedCatalog?.name || 'Оберіть каталог'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.light} />
            </TouchableOpacity>
            {showCatalogPicker && (
              <View style={styles.pickerDropdown}>
                {catalogs.map((catalog) => (
                  <TouchableOpacity
                    key={catalog.id}
                    style={[
                      styles.pickerOption,
                      catalog.id === catalogId && styles.pickerOptionSelected,
                    ]}
                    onPress={() => {
                      setCatalogId(catalog.id);
                      setShowCatalogPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{catalog.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Назва *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Введіть назву"
              placeholderTextColor={COLORS.accent}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Опис *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Введіть опис"
              placeholderTextColor={COLORS.accent}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Ціна (грн) *</Text>
              <TextInput
                style={styles.input}
                value={priceUah}
                onChangeText={setPriceUah}
                placeholder="0"
                placeholderTextColor={COLORS.accent}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Скидка (%)</Text>
              <TextInput
                style={styles.input}
                value={discountPercent}
                onChangeText={setDiscountPercent}
                placeholder="0"
                placeholderTextColor={COLORS.accent}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Кількість *</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                placeholderTextColor={COLORS.accent}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Вага</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="напр. 500г"
                placeholderTextColor={COLORS.accent}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Колір</Text>
            <TextInput
              style={styles.input}
              value={color}
              onChangeText={setColor}
              placeholder="напр. Чорний"
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
              <Text style={styles.visibilityTitle}>
                {isVisible ? 'Видимий' : 'Прихований'}
              </Text>
            </View>
            <View
              style={[
                styles.visibilityIndicator,
                isVisible ? styles.visibilityOn : styles.visibilityOff,
              ]}
            />
          </TouchableOpacity>

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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  pickerButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.white,
  },
  pickerDropdown: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerOptionSelected: {
    backgroundColor: COLORS.accent,
  },
  pickerOptionText: {
    color: COLORS.white,
    fontSize: 16,
  },
  visibilityToggle: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  visibilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visibilityTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
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
  bottomPadding: {
    height: 40,
  },
});
