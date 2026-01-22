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
  Switch,
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
  warm: '#5A3E40',
  white: '#FFFFFF',
  success: '#4ECDC4',
  danger: '#FF6B6B',
};

interface Catalog {
  id: string;
  name: string;
}

export default function ServiceEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [catalogId, setCatalogId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceUah, setPriceUah] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [hasTimeSelection, setHasTimeSelection] = useState(false);
  const [hasDurationSelection, setHasDurationSelection] = useState(false);
  const [hasMasterSelection, setHasMasterSelection] = useState(false);
  const [priceDependsOnDuration, setPriceDependsOnDuration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);

  useEffect(() => {
    loadCatalogs();
    if (!isNew && id) {
      loadService();
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

  const loadService = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/services/${id}`);
      const service = response.data;
      setCatalogId(service.catalog_id);
      setName(service.name);
      setDescription(service.description);
      setPriceUah(service.price_uah.toString());
      setIsVisible(service.is_visible);
      setHasTimeSelection(service.has_time_selection);
      setHasDurationSelection(service.has_duration_selection);
      setHasMasterSelection(service.has_master_selection);
      setPriceDependsOnDuration(service.price_depends_on_duration);
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося завантажити послугу');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Помилка', 'Введіть назву послуги');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Помилка', 'Введіть опис послуги');
      return;
    }
    if (!priceUah || parseFloat(priceUah) <= 0) {
      Alert.alert('Помилка', 'Введіть коректну ціну');
      return;
    }

    setSaving(true);
    try {
      const data = {
        catalog_id: catalogId,
        name: name.trim(),
        description: description.trim(),
        price_uah: parseFloat(priceUah),
        is_visible: isVisible,
        has_time_selection: hasTimeSelection,
        has_duration_selection: hasDurationSelection,
        has_master_selection: hasMasterSelection,
        price_depends_on_duration: priceDependsOnDuration,
      };

      if (isNew) {
        await axios.post(`${API_URL}/api/services`, data);
      } else {
        await axios.put(`${API_URL}/api/services/${id}`, data);
      }

      Alert.alert('Успіх', isNew ? 'Послугу створено' : 'Послугу оновлено');
      router.back();
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося зберегти послугу');
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
            {isNew ? 'Нова послуга' : 'Редагування'}
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

          <View style={styles.inputGroup}>
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

          <Text style={styles.sectionTitle}>Налаштування послуги</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="time-outline" size={20} color={COLORS.accent} />
              <Text style={styles.toggleLabel}>Вибір дати/часу</Text>
            </View>
            <Switch
              value={hasTimeSelection}
              onValueChange={setHasTimeSelection}
              trackColor={{ false: COLORS.warm, true: COLORS.success }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="hourglass-outline" size={20} color={COLORS.accent} />
              <Text style={styles.toggleLabel}>Вибір тривалості</Text>
            </View>
            <Switch
              value={hasDurationSelection}
              onValueChange={setHasDurationSelection}
              trackColor={{ false: COLORS.warm, true: COLORS.success }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="person-outline" size={20} color={COLORS.accent} />
              <Text style={styles.toggleLabel}>Вибір майстра</Text>
            </View>
            <Switch
              value={hasMasterSelection}
              onValueChange={setHasMasterSelection}
              trackColor={{ false: COLORS.warm, true: COLORS.success }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="cash-outline" size={20} color={COLORS.accent} />
              <Text style={styles.toggleLabel}>Ціна залежить від тривалості</Text>
            </View>
            <Switch
              value={priceDependsOnDuration}
              onValueChange={setPriceDependsOnDuration}
              trackColor={{ false: COLORS.warm, true: COLORS.success }}
              thumbColor={COLORS.white}
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
                {isVisible ? 'Видима' : 'Прихована'}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 8,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    color: COLORS.white,
    fontSize: 14,
  },
  visibilityToggle: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
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
