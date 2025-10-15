import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { ensureDBInitialized, getDatabase } from "../../database/db";
import { Expense, Project, SQLResult } from "../../database/types";

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

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        await ensureDBInitialized();
        const db = getDatabase();
        
        // Fetch projects
        const projectResult = await db.execAsync("SELECT * FROM projects;") as SQLResult;
        if (projectResult && projectResult.length > 0) {
          const projects = projectResult[0] as Project[];
          const total = projects.reduce((sum, p) => sum + p.budget, 0);
          setTotalBudget(total);
          
          setProjectData(projects.map(p => ({
            name: p.name,
            population: p.budget,
            color: '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0'),
            legendFontColor: "#333",
            legendFontSize: 14
          })));
        }

        // Fetch expenses
        const expenseResult = await db.execAsync("SELECT * FROM expenses ORDER BY date DESC;") as SQLResult;
        if (expenseResult && expenseResult.length > 0) {
          const expenses = expenseResult[0] as Expense[];
          const total = expenses.reduce((sum, e) => sum + e.cost, 0);
          setTotalExpenses(total);
          
          setExpenseData(expenses);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError(error instanceof Error ? error.message : "Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const [error, setError] = useState<string | null>(null);

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
  const expensesByMonth = expenseData.reduce((acc: { [key: string]: number }, expense) => {
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Financial Overview</Text>
      
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
