import { useRequestGuard } from '../hooks/useRequestGuard';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { budgetDistribution } from '../services/budgetDistribution';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { downloadProjectCostData, ProjectCostSummary, generateAndSavePDF, generateAndSharePDF } from '../services/exportService';

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
  const { start: startRequest, cancel: cancelRequest } = useRequestGuard();
  
  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);

  useFocusEffect(useCallback(() => {
    void loadAnalytics();
    return cancelRequest;
  }, [id, cancelRequest]));

  const loadAnalytics = async () => {
    const isCurrent = startRequest();
    try {
      setLoading(true);
      setError(null);
      if (typeof id !== 'string' || !id) throw new Error('No valid project ID provided');
      const [projectData, expensesData, paymentData] = await Promise.all([
        getProjectById(id as string),
        getExpensesByProject(id as string),
        getPaymentSummary(id as string),
      ]);

      if (!isCurrent()) return;
      setProject(projectData);
      setExpenses(expensesData);
      setPaymentSummary(paymentData);

      // Calculate budget distribution by category
      calculateBudgetDistribution(expensesData, paymentData);
    } catch (error) {
      if (!isCurrent()) return;
      console.error('Error loading analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load analytics');
    } finally {
      if (isCurrent()) setLoading(false);
    }
  };

  const calculateBudgetDistribution = (
    expensesData: Expense[],
    paymentData: PaymentSummary | null
  ) => {
    const categories = budgetDistribution(expensesData, paymentData?.project_cost || 0).map(row => ({ ...row, color: getCategoryColor(row.name), icon: getCategoryIcon(row.name) }));
    setBudgetCategories(categories);
  };

  const handleDownloadProjectCost = async () => {
    if (!project || !paymentSummary) return;

    // Show options for PDF export
    Alert.alert(
      'Export PDF',
      'Choose how to export the project cost summary:',
      [
        {
          text: 'Share',
          onPress: async () => {
            setIsDownloading(true);
            try {
              const expensesByCategory = budgetDistribution(expenses, 0)
                .map(cat => ({
                  category: cat.name,
                  amount: cat.amount,
                  percentage: cat.percentage
                }));

              const costSummary: ProjectCostSummary = {
                projectName: project.name,
                clientName: project.client_name || '',
                totalBudget: paymentSummary.project_cost,
                totalExpenses: paymentSummary.total_expenses,
                totalReceived: paymentSummary.total_received,
                remainingAmount: paymentSummary.remaining_amount,
                profitLoss: paymentSummary.profit_loss,
                expensesByCategory
              };

              // React Native equivalent of Flutter's onPressed handler
              await generateAndSharePDF(costSummary);
              Alert.alert('Success', 'PDF shared successfully');
            } catch (err) {
              console.error('Share error:', err);
              Alert.alert('Error', 'Failed to share PDF');
            } finally {
              setIsDownloading(false);
            }
          },
        },
        {
          text: 'Save to Device',
          onPress: async () => {
            setIsDownloading(true);
            try {
              const expensesByCategory = budgetDistribution(expenses, 0)
                .map(cat => ({
                  category: cat.name,
                  amount: cat.amount,
                  percentage: cat.percentage
                }));

              const costSummary: ProjectCostSummary = {
                projectName: project.name,
                clientName: project.client_name || '',
                totalBudget: paymentSummary.project_cost,
                totalExpenses: paymentSummary.total_expenses,
                totalReceived: paymentSummary.total_received,
                remainingAmount: paymentSummary.remaining_amount,
                profitLoss: paymentSummary.profit_loss,
                expensesByCategory
              };

              const filepath = await generateAndSavePDF(costSummary);
              Alert.alert('Success', `PDF saved to device:\n${filepath}`);
            } catch (err) {
              console.error('Save error:', err);
              Alert.alert('Error', `Failed to save PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
              setIsDownloading(false);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
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
    if (!budgetCategories.length) return <Text>No budget or expenses recorded.</Text>;
    return <PieChart
      data={budgetCategories.map(category => ({ name: category.name, amount: category.amount, color: category.color, legendFontColor: '#333', legendFontSize: 11 }))}
      width={width - 48} height={220} accessor="amount" backgroundColor="transparent" paddingLeft="12" hasLegend={false}
      chartConfig={{ color: () => '#333' }}
    />;
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

  if (error || !project || !paymentSummary) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Project Analytics</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error || 'Project not found'}</Text>
          <TouchableOpacity onPress={loadAnalytics}><Text>Retry</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Project Analytics</Text>
          <TouchableOpacity onPress={loadAnalytics} style={styles.refreshButton}>
            <MaterialCommunityIcons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Distribution</Text>
            <TouchableOpacity
              style={[styles.downloadPdfBtn, isDownloading && styles.downloadPdfBtnActive]}
              onPress={handleDownloadProjectCost}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={styles.pdfButtonContent}>
                  <MaterialCommunityIcons name="file-pdf-box" size={20} color="#fff" />
                  <Text style={styles.pdfButtonText}>PDF</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
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
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 6,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
    letterSpacing: 0.3,
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
  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  downloadButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  downloadPdfBtn: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    opacity: 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadPdfBtnActive: {
    opacity: 1,
  },
  pdfButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pdfButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
