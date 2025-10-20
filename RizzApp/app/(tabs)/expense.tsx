import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Expense, getExpenses } from "../../api/expensesApi";
import { getProjects } from "../../api/projectsApi";

export default function ExpenseScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<{[key: string]: string}>({});
  const router = useRouter();

  const loadData = async () => {
    try {
      // Load projects for mapping
      const projectsList = await getProjects();
      const projectMap = projectsList.reduce<{[key: string]: string}>((acc, project) => {
        if (project.id) {
          acc[project.id] = project.name;
        }
        return acc;
      }, {});
      setProjects(projectMap);

      // Load expenses
      const expensesList = await getExpenses();
      setExpenses(expensesList.sort((a, b) => 
        new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      ));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category?: string): [string, string] => {
    // You can add category logic here if expenses have categories
    const colors: { [key: string]: [string, string] } = {
      'food': ['#FF6B6B', '#FF3B30'],
      'transport': ['#4ECDC4', '#00A896'],
      'utilities': ['#FFD93D', '#FFA500'],
      'materials': ['#6BCF7F', '#34C759'],
      'equipment': ['#A8E6CF', '#56C596'],
      'default': ['#667eea', '#764ba2'],
    };
    return colors[category?.toLowerCase() || 'default'] || colors['default'];
  };

  const getCategoryIcon = (amount: number) => {
    if (amount > 50000) return 'alert-circle';
    if (amount > 20000) return 'trending-up';
    return 'cash';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const avgExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
  const highestExpense = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount || 0)) : 0;

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#f093fb', '#f5576c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerGreeting}>Expenses</Text>
            <Text style={styles.headerSubtitle}>{expenses.length} transactions</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/AddExpense")}
          >
            <MaterialCommunityIcons name="plus" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="wallet" size={22} color="#FFD93D" />
            <Text style={styles.statNumber}>₹{(totalExpenses / 1000).toFixed(1)}K</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="chart-line" size={22} color="#6BCF7F" />
            <Text style={styles.statNumber}>₹{(avgExpense / 1000).toFixed(1)}K</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="trending-up" size={22} color="#FF6B6B" />
            <Text style={styles.statNumber}>₹{(highestExpense / 1000).toFixed(1)}K</Text>
            <Text style={styles.statLabel}>Highest</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={expenses}
        keyExtractor={item => item.id || ''}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const [gradientStart, gradientEnd] = getCategoryColor(item.category);
          const categoryIcon = getCategoryIcon(item.amount || 0);
          
          return (
            <View style={[styles.card, { marginTop: index === 0 ? 20 : 0 }]}>
              {/* Colored Left Border */}
              <LinearGradient
                colors={[gradientStart, gradientEnd]}
                style={styles.cardLeftBorder}
              />
              
              <View style={styles.cardContent}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.projectTagContainer}>
                    <LinearGradient
                      colors={[gradientStart, gradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.projectTag}
                    >
                      <MaterialCommunityIcons name="folder" size={14} color="#fff" />
                      <Text style={styles.projectName}>{projects[item.project_id || ''] || 'General'}</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.dateContainer}>
                    <MaterialCommunityIcons name="calendar" size={14} color="#999" />
                    <Text style={styles.date}>{formatDate(item.expense_date)}</Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

                {/* Footer Row */}
                <View style={styles.cardFooter}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={[gradientStart, gradientEnd]}
                      style={styles.iconGradient}
                    >
                      <MaterialCommunityIcons name={categoryIcon} size={20} color="#fff" />
                    </LinearGradient>
                  </View>
                  <View style={styles.costContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <Text style={styles.cost}>{(item.amount || 0).toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cash-remove" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add your first expense</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa"
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16
  },
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerGreeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  cardLeftBorder: {
    width: 6,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  projectTagContainer: {
    flex: 1,
  },
  projectTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  projectName: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600'
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    color: "#999",
    fontSize: 12,
    marginLeft: 4,
  },
  description: {
    fontSize: 16,
    color: '#1c1c1e',
    marginBottom: 16,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  iconContainer: {
    marginRight: 12,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  costContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    flex: 1,
    justifyContent: 'flex-end',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "700",
    color: "#34C759",
    marginRight: 4,
  },
  cost: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#34C759"
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: '40%'
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: "#666",
    marginTop: 20
  },
  emptySubtext: {
    fontSize: 15,
    color: "#999",
    marginTop: 8,
    textAlign: 'center',
  }
});
