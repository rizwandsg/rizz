import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BarChart, LineChart, ProgressChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Expense, getExpensesByProject } from '../api/expensesApi';
import { getPaymentsByProject, getPaymentSummary, PaymentSummary } from '../api/paymentsApi';
import { getProjectById, Project } from '../api/projectsApi';

const { width } = Dimensions.get('window');

const chartConfig = {
  backgroundColor: '#fff',
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#667eea',
  },
};

export default function IndividualProjectAnalytics() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('IndividualProjectAnalytics loaded with ID:', id);
    if (id) {
      loadProjectAnalytics();
    } else {
      setError('No project ID provided');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProjectAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading analytics for project:', id);
      
      // First, load project and expenses
      const [projectData, expensesData] = await Promise.all([
        getProjectById(id as string),
        getExpensesByProject(id as string),
      ]);

      console.log('Project data loaded:', projectData);
      console.log('Project scope_of_work:', projectData?.scope_of_work);
      console.log('Loaded expenses:', expensesData);
      
      // Calculate total expenses
      const totalExpenses = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
      console.log('Total expenses calculated:', totalExpenses);
      
      // Now get payment summary with correct values
      const paymentData = await getPaymentSummary(
        id as string,
        projectData?.total_project_cost || 0,
        totalExpenses
      );
      
      console.log('Loaded payments:', await getPaymentsByProject(id as string));
      console.log('Payment summary:', paymentData);
      
      setProject(projectData);
      setExpenses(expensesData);
      setPaymentSummary(paymentData);
    } catch (error) {
      console.error('Error loading project analytics:', error);
      setError('Failed to load project analytics');
    } finally {
      setLoading(false);
    }
  };

  // Prepare expense data by category
  const getExpensesByCategory = () => {
    const categoryMap = new Map<string, number>();
    expenses.forEach((expense) => {
      const category = expense.category || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + expense.amount);
    });
    const allCategories = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Return all categories (no limit)
    return allCategories;
  };

  // Prepare monthly expense trend
  const getMonthlyExpenses = () => {
    const monthMap = new Map<string, number>();
    expenses.forEach((expense) => {
      const date = new Date(expense.expense_date);
      const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + expense.amount);
    });
    
    const sorted = Array.from(monthMap.entries()).sort((a, b) => {
      const [aMonth, aYear] = a[0].split('/').map(Number);
      const [bMonth, bYear] = b[0].split('/').map(Number);
      return aYear - bYear || aMonth - bMonth;
    });

    return sorted.slice(-6); // Last 6 months
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Project Analytics</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Project Analytics</Text>
        </View>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>{error || 'Project not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProjectAnalytics}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!project || !paymentSummary) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Project Analytics</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Project not found</Text>
        </View>
      </View>
    );
  }

  const expensesByCategory = getExpensesByCategory();
  const monthlyExpenses = getMonthlyExpenses();

  // Progress data
  const progressData = {
    labels: ['Received', 'Spent', 'Profit'],
    data: [
      paymentSummary.project_cost > 0 ? paymentSummary.total_received / paymentSummary.project_cost : 0,
      paymentSummary.project_cost > 0 ? paymentSummary.total_expenses / paymentSummary.project_cost : 0,
      paymentSummary.project_cost > 0 ? Math.max(0, paymentSummary.profit_loss) / paymentSummary.project_cost : 0,
    ],
    colors: ['#4CAF50', '#F44336', '#667eea'], // Green, Red, Purple
  };

  // Bar chart data for expense categories
  const categoryBarData = {
    labels: expensesByCategory.map(c => {
      // Shorten labels to prevent overlap
      if (c.name.length > 6) {
        return c.name.substring(0, 5) + '..';
      }
      return c.name;
    }),
    datasets: [{
      data: expensesByCategory.map(c => c.value),
    }],
  };

  // Line chart data for monthly expenses
  const monthlyLineData = monthlyExpenses.length > 0 ? {
    labels: monthlyExpenses.map(([month]) => month),
    datasets: [{
      data: monthlyExpenses.map(([, value]) => value),
      color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
      strokeWidth: 3,
    }],
  } : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Analytics</Text>
        <TouchableOpacity onPress={loadProjectAnalytics} style={styles.refreshButton}>
          <MaterialCommunityIcons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Project Info */}
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.projectClient}>{project.client_name}</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#667eea' }]}>
            <MaterialCommunityIcons name="currency-inr" size={28} color="#fff" />
            <Text style={styles.summaryLabel}>Budget</Text>
            <Text style={styles.summaryValue}>
              ₹{paymentSummary.project_cost.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#4CAF50' }]}>
            <MaterialCommunityIcons name="cash-check" size={28} color="#fff" />
            <Text style={styles.summaryLabel}>Received</Text>
            <Text style={styles.summaryValue}>
              ₹{paymentSummary.total_received.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F44336' }]}>
            <MaterialCommunityIcons name="cash-minus" size={28} color="#fff" />
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={styles.summaryValue}>
              ₹{paymentSummary.total_expenses.toLocaleString('en-IN')}
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor:
                  paymentSummary.profit_loss >= 0 ? '#4CAF50' : '#F44336',
              },
            ]}
          >
            <MaterialCommunityIcons
              name={paymentSummary.profit_loss >= 0 ? 'trending-up' : 'trending-down'}
              size={28}
              color="#fff"
            />
            <Text style={styles.summaryLabel}>Profit/Loss</Text>
            <Text style={styles.summaryValue}>
              ₹{paymentSummary.profit_loss.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Progress Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Project Progress</Text>
          <View style={styles.progressChartWrapper}>
            <ProgressChart
              data={progressData}
              width={width - 80}
              height={220}
              strokeWidth={16}
              radius={32}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1, index) => {
                  const colors = ['rgba(76, 175, 80, ', 'rgba(244, 67, 54, ', 'rgba(102, 126, 234, '];
                  return colors[index || 0] + opacity + ')';
                },
              }}
              hideLegend={true}
              style={styles.chart}
            />
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Received</Text>
              <Text style={styles.legendValue}>{(progressData.data[0] * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
              <Text style={styles.legendText}>Spent</Text>
              <Text style={styles.legendValue}>{(progressData.data[1] * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#667eea' }]} />
              <Text style={styles.legendText}>Profit</Text>
              <Text style={styles.legendValue}>{(progressData.data[2] * 100).toFixed(0)}%</Text>
            </View>
          </View>
        </View>

        {/* Expense by Category Bar Chart */}
        {expensesByCategory.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Expense Categories ({expensesByCategory.length})</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              style={styles.chartScrollView}
            >
              <BarChart
                data={categoryBarData}
                width={Math.max(width - 48, expensesByCategory.length * 60)}
                height={240}
                yAxisLabel="₹"
                yAxisSuffix=""
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  propsForLabels: {
                    fontSize: 9,
                  },
                  barPercentage: 0.6,
                }}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
                verticalLabelRotation={45}
              />
            </ScrollView>
          </View>
        )}

        {/* Monthly Expense Trend */}
        {monthlyLineData && monthlyLineData.labels.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Monthly Expense Trend</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              style={styles.chartScrollView}
            >
              <LineChart
                data={monthlyLineData}
                width={Math.max(width - 48, monthlyLineData.labels.length * 80)}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
                  propsForLabels: {
                    fontSize: 10,
                  },
                }}
                bezier
                style={styles.chart}
                yAxisLabel="₹"
                yAxisSuffix=""
                fromZero
              />
            </ScrollView>
          </View>
        )}

        {/* Expense Details List */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Expense Breakdown</Text>
          {expensesByCategory.map((category, index) => {
            const percentage = paymentSummary.total_expenses > 0 
              ? (category.value / paymentSummary.total_expenses) * 100 
              : 0;
            return (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryAmount}>
                    ₹{category.value.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(percentage, 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.categoryPercentage}>{percentage.toFixed(1)}% of expenses</Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  projectInfo: {
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  projectName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  projectClient: {
    fontSize: 15,
    color: '#666',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    width: (width - 44) / 2,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  chartSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  chartScrollView: {
    marginVertical: 8,
  },
  legendContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  legendValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '700',
  },
  categoryItem: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#667eea',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
