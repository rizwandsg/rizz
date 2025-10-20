import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
}

// Demo user for testing
const DEMO_USER: User = {
  id: 'demo-user-1',
  email: 'demo@example.com',
  name: 'Demo User'
};

// Demo credentials
const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'password123';

export const signIn = async (email: string, password: string): Promise<User> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    await AsyncStorage.setItem('user', JSON.stringify(DEMO_USER));
    return DEMO_USER;
  }
  
  throw new Error('Invalid email or password');
};

export const signOut = async (): Promise<void> => {
  await AsyncStorage.removeItem('user');
};

export const getCurrentUser = async (): Promise<User | null> => {
  const userStr = await AsyncStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
};