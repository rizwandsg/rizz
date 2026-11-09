import {useRequestGuard} from '../../hooks/useRequestGuard';
import { useFocusEffect } from 'expo-router';
import { LoadFailure } from '../../components/LoadFailure';
import { useIdentity } from '../../context/IdentityContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentUser, logout, User } from '../../api/authApi';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { signOut } = useIdentity();
  const [user, setUser] = useState<User | null>(null);
  const {start:startRequest,cancel:cancelRequest}=useRequestGuard();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const isCurrent=startRequest();
    try {
      setLoading(true);
      setError(null);
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error('Please sign in again');
      if(!isCurrent())return;
      setUser(currentUser);

    } catch (error) {
      if(isCurrent())setError('Failed to load profile. Please retry.');
    } finally {
      if(isCurrent())setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { void loadData(); return cancelRequest; }, [cancelRequest]));

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            await logout();
          } catch (err) {
            console.error('Logout error:', err);
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) return <LoadFailure message={error} retry={loadData} />;

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={theme.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop:16,paddingBottom: 20 }}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/EditProfile')}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="account-edit" size={22} color={theme.primaryColor} />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/ChangePassword')}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="lock" size={22} color={theme.primaryColor} />
            </View>
            <Text style={styles.menuText}>Change Password</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/Notifications')}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="bell" size={22} color={theme.primaryColor} />
            </View>
            <Text style={styles.menuText}>Notifications</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/Theme')}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="palette" size={22} color={theme.primaryColor} />
            </View>
            <Text style={styles.menuText}>Theme</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/HelpSupport')}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="help-circle" size={22} color={theme.primaryColor} />
            </View>
            <Text style={styles.menuText}>Help & Support</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/About')}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="information" size={22} color={theme.primaryColor} />
            </View>
            <Text style={styles.menuText}>About</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LinearGradient
            colors={['#FF6B6B', '#FF3B30']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoutGradient}
          >
            <MaterialCommunityIcons name="logout" size={22} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.version}>Version 1.0.0</Text>
        
        {/* Bottom Padding for Tab Bar */}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    marginLeft: 16,
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  version: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 32,
  },
});
