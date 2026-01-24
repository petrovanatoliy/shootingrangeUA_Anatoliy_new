import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function QRCodeScreen() {
  const router = useRouter();
  const [expoUrl, setExpoUrl] = useState<string>('');
  const [tunnelUrl, setTunnelUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTunnelUrl();
  }, []);

  const fetchTunnelUrl = async () => {
    try {
      // Try to get the tunnel URL from the Expo preview URL
      const previewUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://shooting-range-ua.preview.emergentagent.com';
      
      // Extract the subdomain to create the tunnel URL
      const subdomain = previewUrl.match(/https:\/\/([^.]+)/)?.[1] || 'shooting-range-ua';
      const tunnel = `${subdomain}.tunnel.emergentagent.com`;
      
      const url = `exp://${tunnel}`;
      setExpoUrl(url);
      setTunnelUrl(tunnel);
    } catch (error) {
      console.error('Error getting tunnel URL:', error);
      // Fallback to a basic URL
      const hostname = Constants.expoConfig?.hostUri || 'localhost:3000';
      setExpoUrl(`exp://${hostname}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
        <Text style={styles.backText}>Назад</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>📱 QR Код для Expo Go</Text>
        <Text style={styles.subtitle}>Скануйте цей QR код в додатку Expo Go</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0a7ea4" style={styles.loader} />
        ) : (
          <View style={styles.qrContainer}>
            {expoUrl ? (
              <>
                <QRCode
                  value={expoUrl}
                  size={300}
                  backgroundColor="white"
                  color="black"
                />
                <Text style={styles.urlText}>{expoUrl}</Text>
                {tunnelUrl && (
                  <View style={styles.tunnelInfo}>
                    <Text style={styles.tunnelLabel}>Tunnel Host:</Text>
                    <Text style={styles.tunnelValue}>{tunnelUrl}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.errorText}>Не вдалося отримати URL</Text>
            )}
          </View>
        )}

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Як використовувати:</Text>
          <Text style={styles.instructionText}>1. Встановіть додаток Expo Go на свій смартфон</Text>
          <Text style={styles.instructionText}>2. Відкрийте Expo Go</Text>
          <Text style={styles.instructionText}>3. Скануйте QR код вище</Text>
          <Text style={styles.instructionText}>4. Додаток завантажиться на вашому пристрої</Text>
        </View>

        <View style={styles.linkSection}>
          <Text style={styles.linkTitle}>Посилання для встановлення Expo Go:</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://apps.apple.com/app/expo-go/id982107779')}>
            <Text style={styles.link}>📱 iOS: App Store</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=host.exp.exponent')}>
            <Text style={styles.link}>🤖 Android: Google Play</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1a1a2e',
    paddingVertical: 40,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 40,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 50,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  urlText: {
    marginTop: 20,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    padding: 20,
  },
  instructions: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 15,
  },
  instructionText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    paddingLeft: 10,
  },
  linkSection: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 15,
    width: '100%',
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 10,
  },
  link: {
    fontSize: 12,
    color: '#4ea8de',
    marginBottom: 5,
  },
});
