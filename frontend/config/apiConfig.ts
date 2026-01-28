import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL_KEY = 'api_server_url';
const DEFAULT_API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://shooting-range-ua.preview.emergentagent.com';

class ApiConfig {
  private currentUrl: string = DEFAULT_API_URL;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const savedUrl = await AsyncStorage.getItem(API_URL_KEY);
      if (savedUrl) {
        this.currentUrl = savedUrl;
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load API URL from storage:', error);
      this.currentUrl = DEFAULT_API_URL;
      this.initialized = true;
    }
  }

  async setApiUrl(url: string): Promise<void> {
    try {
      await AsyncStorage.setItem(API_URL_KEY, url);
      this.currentUrl = url;
      console.log('API URL updated to:', url);
    } catch (error) {
      console.error('Failed to save API URL:', error);
      throw error;
    }
  }

  getApiUrl(): string {
    return this.currentUrl;
  }

  getDefaultUrl(): string {
    return DEFAULT_API_URL;
  }
}

export const apiConfig = new ApiConfig();

// Helper function to get API URL (ensures initialization)
export const getApiUrl = async (): Promise<string> => {
  await apiConfig.initialize();
  return apiConfig.getApiUrl();
};

// Synchronous version (use only after initialization)
export const getApiUrlSync = (): string => {
  return apiConfig.getApiUrl();
};

// Update API URL
export const setApiUrl = async (url: string): Promise<void> => {
  await apiConfig.setApiUrl(url);
};
