import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getCurrentUser, logout, User } from '../api/authApi';
import { Expense, getExpenses } from '../api/expensesApi';
import { getProjects, Project } from '../api/projectsApi';

export default function Index() {
  const router = useRouter();
  const { signOut } = useAuth(); // Get Clerk signOut function
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const [userProjects, userExpenses] = await Promise.all([
          getProjects(),
          getExpenses(),
        ]);
        setProjects(userProjects);
        setExpenses(userExpenses);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // Logout from both regular auth and Clerk
            await logout(); // Clear AsyncStorage
            
            // Sign out from Clerk if user is signed in with Clerk
            try {
              await signOut();
              console.log('✅ Signed out from Clerk');
            } catch {
              console.log('⚠️ No Clerk session to sign out from');
            }
            
            // Navigate to login
            router.replace('/(auth)/login');
          } catch (err) {
            console.error('Logout error:', err);
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{projects.length}</Text>
          <Text style={styles.statLabel}>Projects</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{expenses.length}</Text>
          <Text style={styles.statLabel}>Expenses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${totalExpenses.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/AddProject')}
        >
          <Text style={styles.actionButtonText}>+ Add New Project</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => router.push('/AddExpense')}
        >
          <Text style={styles.actionButtonTextSecondary}>+ Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Projects */}
      {projects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Projects</Text>
          {projects.slice(0, 3).map((project) => (
            <View key={project.id} style={styles.projectCard}>
              <Text style={styles.projectName}>{project.name}</Text>
              <Text style={styles.projectDescription} numberOfLines={2}>
                {project.description}
              </Text>
              <View style={styles.projectFooter}>
                <Text style={styles.projectDate}>
                  {new Date(project.start_date).toLocaleDateString()}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    project.status === 'active' && styles.statusActive,
                  ]}
                >
                  <Text style={styles.statusText}>{project.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Expenses */}
      {expenses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {expenses.slice(0, 5).map((expense) => (
            <View key={expense.id} style={styles.expenseCard}>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseDescription}>{expense.description}</Text>
                <Text style={styles.expenseDate}>
                  {new Date(expense.expense_date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {projects.length === 0 && expenses.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No projects or expenses yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Get started by creating your first project!
          </Text>
        </View>
      )}
    </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  logoutText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  projectCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4CAF50',
    textTransform: 'capitalize',
  },
  expenseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
