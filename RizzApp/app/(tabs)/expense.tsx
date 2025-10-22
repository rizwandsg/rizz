import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Expense, getExpenses } from "../../api/expensesApi";
import { getProjects } from "../../api/projectsApi";

interface ProjectExpenseSummary {
  projectId: string;
  projectName: string;
  totalAmount: number;
  expenseCount: number;
  expenses: Expense[];
  lastExpenseDate: string;
}

export default function ExpenseScreen() {
  const insets = useSafeAreaInsets();
  const [projectSummaries, setProjectSummaries] = useState<ProjectExpenseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  console.log('💰 Expense screen rendering with purple gradient theme');

  const loadData = async () => {
    try {
      // Load projects and expenses
      const projectsList = await getProjects();
      const expensesList = await getExpenses();

      // Group expenses by project
      const projectMap = new Map<string, ProjectExpenseSummary>();

      // Initialize all projects with zero expenses
      projectsList.forEach(project => {
        if (project.id) {
          projectMap.set(project.id, {
            projectId: project.id,
            projectName: project.name,
            totalAmount: 0,
            expenseCount: 0,
            expenses: [],
            lastExpenseDate: new Date().toISOString(),
          });
        }
      });

      // Add expenses to their respective projects
      expensesList.forEach(expense => {
        if (expense.project_id && projectMap.has(expense.project_id)) {
          const summary = projectMap.get(expense.project_id)!;
          summary.totalAmount += expense.amount || 0;
          summary.expenseCount += 1;
          summary.expenses.push(expense);
          
          // Update last expense date
          if (expense.expense_date && 
              new Date(expense.expense_date) > new Date(summary.lastExpenseDate)) {
            summary.lastExpenseDate = expense.expense_date;
          }
        }
      });

      // Convert to array and sort by total amount (highest first)
      const summaries = Array.from(projectMap.values())
        .filter(s => s.expenseCount > 0) // Only show projects with expenses
        .sort((a, b) => b.totalAmount - a.totalAmount);

      setProjectSummaries(summaries);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  const totalExpenses = projectSummaries.reduce((sum, project) => sum + project.totalAmount, 0);
  const totalTransactions = projectSummaries.reduce((sum, project) => sum + project.expenseCount, 0);
  const avgExpensePerProject = projectSummaries.length > 0 ? totalExpenses / projectSummaries.length : 0;
  const highestProjectExpense = projectSummaries.length > 0 ? Math.max(...projectSummaries.map(p => p.totalAmount)) : 0;

  return (
    <View style={styles.container}>
      {/* Purple Gradient Header - Updated Theme */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.headerGradient, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerGreeting}>Project Expenses</Text>
            <Text style={styles.headerSubtitle}>{projectSummaries.length} projects • {totalTransactions} transactions</Text>
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
            <Text style={styles.statNumber}>₹{(avgExpensePerProject / 1000).toFixed(1)}K</Text>
            <Text style={styles.statLabel}>Avg/Project</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="trending-up" size={22} color="#FF6B6B" />
            <Text style={styles.statNumber}>₹{(highestProjectExpense / 1000).toFixed(1)}K</Text>
            <Text style={styles.statLabel}>Highest</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={projectSummaries}
        keyExtractor={item => item.projectId}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        renderItem={({ item, index }) => {
          // Use gradient colors based on total amount
          const gradientColors: [string, string] = item.totalAmount > 50000 
            ? ['#FF6B6B', '#FF3B30']
            : item.totalAmount > 20000
            ? ['#FFD93D', '#FFA500']
            : ['#667eea', '#764ba2'];
          
          return (
            <TouchableOpacity 
              style={[styles.card, { marginTop: index === 0 ? 20 : 0 }]}
              onPress={() => router.push(`/ProjectDetails?id=${item.projectId}`)}
              activeOpacity={0.7}
            >
              {/* Colored Left Border */}
              <LinearGradient
                colors={gradientColors}
                style={styles.cardLeftBorder}
              />
              
              <View style={styles.cardContent}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.projectTagContainer}>
                    <LinearGradient
                      colors={gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.projectTag}
                    >
                      <MaterialCommunityIcons name="briefcase" size={14} color="#fff" />
                      <Text style={styles.projectName}>{item.projectName}</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.dateContainer}>
                    <MaterialCommunityIcons name="calendar" size={14} color="#999" />
                    <Text style={styles.date}>{formatDate(item.lastExpenseDate)}</Text>
                  </View>
                </View>

                {/* Description - Show expense count */}
                <Text style={styles.description} numberOfLines={2}>
                  {item.expenseCount} {item.expenseCount === 1 ? 'expense' : 'expenses'} recorded
                </Text>

                {/* Footer Row */}
                <View style={styles.cardFooter}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={gradientColors}
                      style={styles.iconGradient}
                    >
                      <MaterialCommunityIcons name="chart-bar" size={20} color="#fff" />
                    </LinearGradient>
                  </View>
                  <View style={styles.costContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <Text style={styles.cost}>{item.totalAmount.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
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
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerGreeting: {
    fontSize: 28,
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
