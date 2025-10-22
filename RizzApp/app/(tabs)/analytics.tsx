import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Expense, getExpenses } from "../../api/expensesApi";
import { getProjects, Project } from "../../api/projectsApi";
import { useTheme } from '../../context/ThemeContext';

interface ChartDataPoint {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface ExpenseData {
  id: string;
  projectId: string;
  description: string;
  cost: number;
  date: string;
}

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundColor: "#fff",
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  decimalPlaces: 0
};

// Helper function to get consistent colors for projects
const getProjectColor = (index: number): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DFE6E9', '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E'
  ];
  return colors[index % colors.length];
};

function AnalyticsRoute() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectData, setProjectData] = useState<ChartDataPoint[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [error, setError] = useState<string | null>(null);

  console.log('📊 Analytics rendering with theme:', theme.name);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load projects
        const projects = await getProjects();
        
        // Calculate total budget from project costs
        const calculatedBudget = projects.reduce((sum, p) => sum + (p.total_project_cost || 0), 0);
        setTotalBudget(calculatedBudget || projects.length * 100000);
          
        const projectChartData = projects.map((p: Project, index: number) => {
          const projectBudget = p.total_project_cost || 100000;
          // Truncate name to fit better
          let displayName = p.name;
          if (displayName.length > 12) {
            displayName = displayName.substring(0, 12) + '...';
          }
          
          return {
            name: displayName,
            population: projectBudget,
            color: getProjectColor(index),
            legendFontColor: "#333",
            legendFontSize: 10
          };
        });
        
        setProjectData(projectChartData);

        // Load expenses
        const expenses = await getExpenses();
        const expenseTotal = expenses.reduce((sum: number, e: Expense) => sum + (e.amount ?? 0), 0);
        setTotalExpenses(expenseTotal);
        
        // Convert Expense to ExpenseData format
        const expenseDataList: ExpenseData[] = expenses.map(e => ({
          id: e.id || '',
          projectId: e.project_id || '',
          description: e.description,
          cost: e.amount || 0,
          date: e.expense_date
        }));
        setExpenseData(expenseDataList);
        
        if (projects.length === 0 && expenses.length === 0) {
          setError('No data available yet. Add some projects and expenses to see analytics.');
        } else {
          setError(null);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        alert(error instanceof Error ? error.message : "Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const projects = await getProjects();
      const expenses = await getExpenses();

      const calculatedBudget = projects.reduce((sum, p) => sum + (p.total_project_cost || 0), 0);
      setTotalBudget(calculatedBudget || projects.length * 100000);

      const projectChartData = projects.map((p: Project, index: number) => {
        const projectBudget = p.total_project_cost || 100000;
        const displayName = p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name;
        
        return {
          name: displayName,
          population: projectBudget,
          color: getProjectColor(index),
          legendFontColor: "#7F7F7F",
          legendFontSize: 12
        };
      });

      setProjectData(projectChartData);

      const calculatedTotalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      setTotalExpenses(calculatedTotalExpenses);

      const expenseDataList: ExpenseData[] = expenses.map(expense => ({
        id: expense.id || '',
        projectId: expense.project_id || '',
        description: expense.description || '',
        cost: expense.amount,
        date: expense.expense_date
      }));
      
      setExpenseData(expenseDataList);
      
      if (projects.length === 0 && expenses.length === 0) {
        setError('No data available yet. Add some projects and expenses to see analytics.');
      } else {
        setError(null);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Prepare expense data for line chart
  const expensesByMonth = expenseData.reduce<{ [key: string]: number }>((acc, expense) => {
    const date = new Date(expense.date);
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
    acc[monthYear] = (acc[monthYear] || 0) + expense.cost;
    return acc;
  }, {});

  const expenseChartData = {
    labels: Object.keys(expensesByMonth).slice(-6), // Last 6 months
    datasets: [{
      data: Object.values(expensesByMonth).slice(-6),
      color: (opacity = 1) => `rgba(52, 199, 89, ${opacity})`,
      strokeWidth: 2
    }]
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      {/* Dynamic Gradient Header - Uses Theme */}
      <LinearGradient
        colors={theme.colors as any}
        style={[styles.headerGradient, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Analytics</Text>
            <Text style={styles.headerSubtitle}>Financial Overview</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="currency-inr" size={24} color="#FFD93D" />
            <Text style={styles.statNumber}>₹{(totalBudget / 1000).toFixed(0)}K</Text>
            <Text style={styles.statLabel}>Budget</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#6BCF7F" />
            <Text style={styles.statNumber}>₹{(totalExpenses / 1000).toFixed(0)}K</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primaryColor]}
            tintColor={theme.primaryColor}
          />
        }
      >
      
      {/* Removed old summary cards as they're now in header */}
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Budget Distribution</Text>
        {projectData.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartScrollContent}
          >
            <PieChart
              data={projectData}
              width={screenWidth}
              height={projectData.length > 4 ? 280 : 240}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              chartConfig={chartConfig}
              absolute={false}
              hasLegend={true}
            />
          </ScrollView>
        ) : (
          <View style={styles.emptyChart}>
            <MaterialCommunityIcons name="chart-pie" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No project data available</Text>
          </View>
        )}
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Monthly Expenses</Text>
        {expenseData.length > 0 ? (
          <View style={styles.chartWrapper}>
            <LineChart
              data={expenseChartData}
              width={screenWidth - 72}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <MaterialCommunityIcons name="chart-line" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No expense data available</Text>
          </View>
        )}
      </View>
      
      {/* Add bottom padding for last element */}
      <View style={{ height: 24 }} />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
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
    paddingBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  chartScrollContent: {
    paddingHorizontal: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyChart: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  }
});

export default AnalyticsRoute;