import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = '@rizzapp_theme';

export type ThemeId = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'teal';

export interface Theme {
  id: ThemeId;
  name: string;
  colors: readonly [string, string];
  primaryColor: string;
  secondaryColor: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  purple: {
    id: 'purple',
    name: 'Purple Gradient',
    colors: ['#667eea', '#764ba2'],
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
  },
  blue: {
    id: 'blue',
    name: 'Blue Ocean',
    colors: ['#2196F3', '#1976D2'],
    primaryColor: '#2196F3',
    secondaryColor: '#1976D2',
  },
  green: {
    id: 'green',
    name: 'Fresh Green',
    colors: ['#4CAF50', '#388E3C'],
    primaryColor: '#4CAF50',
    secondaryColor: '#388E3C',
  },
  orange: {
    id: 'orange',
    name: 'Sunset Orange',
    colors: ['#FF9800', '#F57C00'],
    primaryColor: '#FF9800',
    secondaryColor: '#F57C00',
  },
  pink: {
    id: 'pink',
    name: 'Rose Pink',
    colors: ['#E91E63', '#C2185B'],
    primaryColor: '#E91E63',
    secondaryColor: '#C2185B',
  },
  teal: {
    id: 'teal',
    name: 'Ocean Teal',
    colors: ['#009688', '#00796B'],
    primaryColor: '#009688',
    secondaryColor: '#00796B',
  },
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeId: ThemeId) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(THEMES.purple);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedThemeId = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedThemeId && savedThemeId in THEMES) {
        setThemeState(THEMES[savedThemeId as ThemeId]);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setTheme = async (themeId: ThemeId) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
      setThemeState(THEMES[themeId]);
    } catch (error) {
      console.error('Failed to save theme:', error);
      throw error;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
