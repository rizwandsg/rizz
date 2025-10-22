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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Expense, getExpensesByProject } from '../api/expensesApi';
import { getPaymentSummary, PaymentSummary } from '../api/paymentsApi';
import { getProjectById, Project } from '../api/projectsApi';

const { width } = Dimensions.get('window');

interface BudgetCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

export default function ProjectAnalytics() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [id]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [projectData, expensesData, paymentData] = await Promise.all([
        getProjectById(id as string),
        getExpensesByProject(id as string),
        getPaymentSummary(id as string),
      ]);

      setProject(projectData);
      setExpenses(expensesData);
      setPaymentSummary(paymentData);

      // Calculate budget distribution by category
      calculateBudgetDistribution(expensesData, paymentData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBudgetDistribution = (
    expensesData: Expense[],
    paymentData: PaymentSummary | null
  ) => {
    // Group expenses by category
    const categoryMap = new Map<string, number>();
    
    expensesData.forEach((expense) => {
      const category = expense.category || 'Other';
      const current = categoryMap.get(category) || 0;
      categoryMap.set(category, current + expense.amount);
    });

    const totalExpenses = paymentData?.total_expenses || 0;
    const totalBudget = paymentData?.project_cost || 0;

    // Convert to array and calculate percentages
    const categories: BudgetCategory[] = Array.from(categoryMap.entries()).map(
      ([name, amount]) => ({
        name,
        amount,
        percentage: totalBudget > 0 ? (amount / totalBudget) * 100 : 0,
        color: getCategoryColor(name),
        icon: getCategoryIcon(name),
      })
    );

    // Sort by amount (highest first)
    categories.sort((a, b) => b.amount - a.amount);

    // Add payments received as a category
    if (paymentData && paymentData.total_received > 0) {
      categories.push({
        name: 'Payments Received',
        amount: paymentData.total_received,
        percentage: totalBudget > 0 ? (paymentData.total_received / totalBudget) * 100 : 0,
        color: '#4CAF50',
        icon: 'cash-check',
      });
    }

    // Add remaining budget
    if (paymentData && paymentData.remaining_amount > 0) {
      categories.push({
        name: 'Remaining Budget',
        amount: paymentData.remaining_amount,
        percentage: totalBudget > 0 ? (paymentData.remaining_amount / totalBudget) * 100 : 0,
        color: '#FF9800',
        icon: 'wallet',
      });
    }

    setBudgetCategories(categories);
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Wood Materials': '#8B4513',
      'Labor Cost': '#2196F3',
      'Hardware & Fittings': '#666',
      'Paint & Coating': '#FF6B6B',
      'Electrical Items': '#F39C12',
      'Plumbing Materials': '#3498DB',
      'Cement & Sand': '#7F8C8D',
      'Transportation': '#4CAF50',
      'Tiles & Flooring': '#16A085',
      'Tools & Equipment': '#FF9800',
      'Fuel & Petrol': '#FF5722',
      'Vehicle Rental': '#F57C00',
      'Other': '#999',
    };
    return colors[category] || '#667eea';
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'Wood Materials': 'pine-tree',
      'Labor Cost': 'account-hard-hat',
      'Hardware & Fittings': 'hammer',
      'Paint & Coating': 'format-paint',
      'Electrical Items': 'flash',
      'Plumbing Materials': 'pipe',
      'Cement & Sand': 'wall',
      'Transportation': 'truck',
      'Tiles & Flooring': 'grid',
      'Tools & Equipment': 'toolbox',
      'Fuel & Petrol': 'gas-station',
      'Vehicle Rental': 'car-estate',
      'Other': 'dots-horizontal',
    };
    return icons[category] || 'chart-box';
  };

  const renderProgressBar = (category: BudgetCategory) => {
    return (
      <View key={category.name} style={styles.progressBarContainer}>
        <View style={styles.progressBarHeader}>
          <View style={styles.categoryInfo}>
            <MaterialCommunityIcons
              name={category.icon as any}
              size={20}
              color={category.color}
            />
            <Text style={styles.categoryName} numberOfLines={2} ellipsizeMode="tail">
              {category.name}
            </Text>
          </View>
          <Text style={styles.categoryPercentage}>
            {category.percentage.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(category.percentage, 100)}%`,
                backgroundColor: category.color,
              },
            ]}
          />
        </View>
        <Text style={styles.categoryAmount}>
          ₹{category.amount.toLocaleString('en-IN')}
        </Text>
      </View>
    );
  };

  const renderPieChart = () => {
    const chartSize = width - 80;
    const radius = chartSize / 2;
    const centerX = radius;
    const centerY = radius;

    let currentAngle = -90; // Start from top

    return (
      <View style={styles.pieChartContainer}>
        <View style={[styles.pieChart, { width: chartSize, height: chartSize }]}>
          {budgetCategories.slice(0, 8).map((category, index) => {
            const sliceAngle = (category.percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            currentAngle = endAngle;

            return (
              <View
                key={category.name}
                style={[
                  styles.pieSlice,
                  {
                    width: chartSize,
                    height: chartSize,
                    borderRadius: radius,
                  },
                ]}
              >
                <View
                  style={{
                    position: 'absolute',
                    width: chartSize,
                    height: chartSize,
                    borderRadius: radius,
                    backgroundColor: category.color,
                    opacity: 0.8,
                  }}
                />
              </View>
            );
          })}
          <View style={styles.pieChartCenter}>
            <Text style={styles.pieChartCenterTitle}>Total Budget</Text>
            <Text style={styles.pieChartCenterValue}>
              ₹{paymentSummary?.project_cost.toLocaleString('en-IN') || '0'}
            </Text>
          </View>
        </View>
      </View>
    );
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Analytics</Text>
        <TouchableOpacity onPress={loadAnalytics} style={styles.refreshButton}>
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
          <View style={[styles.summaryCard, { backgroundColor: '#FF9800' }]}>
            <MaterialCommunityIcons name="wallet" size={28} color="#fff" />
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={styles.summaryValue}>
              ₹{paymentSummary.remaining_amount.toLocaleString('en-IN')}
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

        {/* Budget Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Distribution</Text>
          {budgetCategories.map((category) => renderProgressBar(category))}
        </View>

        {/* Expense Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Expense Categories</Text>
          {budgetCategories
            .filter((cat) => cat.name !== 'Payments Received' && cat.name !== 'Remaining Budget')
            .slice(0, 5)
            .map((category) => (
              <View key={category.name} style={styles.expenseCard}>
                <View
                  style={[styles.expenseIconCircle, { backgroundColor: category.color + '20' }]}
                >
                  <MaterialCommunityIcons
                    name={category.icon as any}
                    size={24}
                    color={category.color}
                  />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseName} numberOfLines={1} ellipsizeMode="tail">
                    {category.name}
                  </Text>
                  <Text style={styles.expensePercentage} numberOfLines={1}>
                    {category.percentage.toFixed(1)}% of budget
                  </Text>
                </View>
                <Text style={styles.expenseAmount} numberOfLines={1}>
                  ₹{category.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  projectClient: {
    fontSize: 14,
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
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
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
  section: {
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
    marginBottom: 20,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667eea',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  categoryAmount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  pieChartContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  pieChart: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieSlice: {
    position: 'absolute',
  },
  pieChartCenter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pieChartCenterTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  pieChartCenterValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12,
  },
  expenseIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  expenseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  expensePercentage: {
    fontSize: 12,
    color: '#666',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
    flexShrink: 0,
  },
});
