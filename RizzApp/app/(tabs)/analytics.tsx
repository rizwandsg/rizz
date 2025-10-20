import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Expense, getExpenses } from "../../api/expensesApi";
import { getProjects, Project } from "../../api/projectsApi";

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

function AnalyticsRoute() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<ChartDataPoint[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load projects
        const projects = await getProjects();
        // Since API projects don't have budget, we'll calculate from expenses per project
        setTotalBudget(projects.length * 100000); // Mock budget for now
          
        setProjectData(projects.map((p: Project) => ({
          name: p.name,
          population: 100000, // Mock budget per project
          color: '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0'),
          legendFontColor: "#333",
          legendFontSize: 14
        })));

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
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Financial Overview</Text>
      </View>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="currency-inr" size={24} color="#007AFF" />
          <Text style={styles.summaryLabel}>Total Budget</Text>
          <Text style={styles.summaryValue}>₹{totalBudget.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="cash-multiple" size={24} color="#34C759" />
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={styles.summaryValue}>₹{totalExpenses.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Budget Distribution</Text>
        {projectData.length > 0 ? (
          <PieChart
            data={projectData}
            width={screenWidth - 32}
            height={220}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="16"
            center={[10, 0]}
            chartConfig={chartConfig}
            absolute
          />
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
          <LineChart
            data={expenseChartData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        ) : (
          <View style={styles.emptyChart}>
            <MaterialCommunityIcons name="chart-line" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No expense data available</Text>
          </View>
        )}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
  },
  header: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
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