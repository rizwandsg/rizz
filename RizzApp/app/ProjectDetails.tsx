import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Expense, getExpensesByProject } from "../api/expensesApi";
import {
  getPaymentsByProject,
  getPaymentSummary,
  Payment,
  PAYMENT_TYPES,
  PaymentSummary,
} from "../api/paymentsApi";
import {
  deleteProject,
  getProjectById,
  Project,
  updateProject,
} from "../api/projectsApi";

export default function ProjectDetails() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [customStatus, setCustomStatus] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const PROJECT_STATUSES = [
    { value: 'site visitted', label: 'Site Visited', icon: 'map-marker-check', color: '#2196F3' },
    { value: 'design work processing', label: 'Design Work Processing', icon: 'palette', color: '#9C27B0' },
    { value: 'quotation sent', label: 'Quotation Sent', icon: 'file-document-edit', color: '#00BCD4' },
    { value: 'work started', label: 'Work Started', icon: 'hammer-wrench', color: '#FF9800' },
    { value: 'work finished', label: 'Work Finished', icon: 'check-circle', color: '#4CAF50' },
    { value: 'on hold', label: 'On Hold', icon: 'pause-circle', color: '#607D8B' },
    { value: 'cancelled', label: 'Cancelled', icon: 'close-circle', color: '#F44336' },
  ];

  const loadProjectData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [projectData, expensesData, paymentsData] = await Promise.all([
        getProjectById(id.toString()),
        getExpensesByProject(id.toString()),
        getPaymentsByProject(id.toString()),
      ]);
      console.log('Loaded project data:', projectData);
      console.log('Project scope_of_work:', projectData?.scope_of_work);
      console.log('Loaded expenses:', expensesData);
      console.log('Loaded payments:', paymentsData);
      setProject(projectData);
      setExpenses(expensesData || []);
      setPayments(paymentsData || []);
      
      // Calculate payment summary
      const totalExpenses = (expensesData || []).reduce((sum, exp) => sum + exp.amount, 0);
      const summary = await getPaymentSummary(
        id.toString(),
        projectData?.total_project_cost || 0,
        totalExpenses
      );
      setPaymentSummary(summary);
    } catch (error) {
      console.error('Error loading project details:', error);
      Alert.alert("Error", "Failed to load project details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProjectData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
  );

  const handleEdit = useCallback(() => {
    router.push({ pathname: "/AddProject", params: { id: id } });
  }, [router, id]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Project",
      "Are you sure you want to delete this project?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteProject(id.toString());
              Alert.alert("Success", "Project deleted", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch {
              Alert.alert("Error", "Failed to delete project");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [id, router]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!project) return;
    try {
      setUpdatingStatus(true);
      await updateProject(project.id!, { status: newStatus });
      setProject({ ...project, status: newStatus });
      setStatusModalVisible(false);
      setShowCustomInput(false);
      setCustomStatus('');
      Alert.alert("Success", "Project status updated");
    } catch {
      Alert.alert("Error", "Failed to update project status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCustomStatusSubmit = () => {
    if (customStatus.trim()) {
      handleStatusUpdate(customStatus.trim());
    } else {
      Alert.alert("Error", "Please enter a status");
    }
  };

  const handleAddExpense = () => {
    router.push({ pathname: "/AddExpense", params: { projectId: id } });
  };

  // Set header buttons
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 8 }}>
          <TouchableOpacity onPress={handleEdit} style={{ padding: 8, marginRight: 8 }}>
            <MaterialCommunityIcons name="pencil" size={22} color="#667eea" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} disabled={deleting} style={{ padding: 8 }}>
            {deleting ? (
              <ActivityIndicator size="small" color="#667eea" />
            ) : (
              <MaterialCommunityIcons name="delete" size={22} color="#FF3B30" />
            )}
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, deleting, handleEdit, handleDelete]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "site visitted":
        return "#2196F3";
      case "design work processing":
        return "#9C27B0";
      case "quotation sent":
        return "#00BCD4";
      case "work started":
        return "#FF9800";
      case "work finished":
        return "#4CAF50";
      case "on hold":
      case "on-hold":
        return "#607D8B";
      case "cancelled":
        return "#F44336";
      default:
        return "#667eea";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "site visitted":
        return "map-marker-check";
      case "design work processing":
        return "palette";
      case "quotation sent":
        return "file-document-edit";
      case "work started":
        return "hammer-wrench";
      case "work finished":
        return "check-circle";
      case "on hold":
      case "on-hold":
        return "pause-circle";
      case "cancelled":
        return "close-circle";
      default:
        return "briefcase";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons
          name="folder-open-outline"
          size={80}
          color="#ccc"
        />
        <Text style={styles.emptyText}>Project not found</Text>
      </View>
    );
  }

  const statusColor = getStatusColor(project.status);
  const statusIcon = getStatusIcon(project.status);

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Project Info Card */}
      <LinearGradient
        colors={[statusColor, statusColor + "DD"]}
        style={styles.headerCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.projectIcon}>
          <MaterialCommunityIcons name="briefcase" size={32} color="#fff" />
        </View>
        <Text style={styles.projectName}>{project.name}</Text>
        {project.description && (
          <Text style={styles.projectDescription}>{project.description}</Text>
        )}
        <View style={styles.statusBadgeContainer}>
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons
              name={statusIcon as any}
              size={16}
              color="#fff"
            />
            <Text style={styles.statusText}>
              {project.status?.charAt(0).toUpperCase() +
                (project.status?.slice(1) || "")}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.editStatusButton}
            onPress={() => setStatusModalVisible(true)}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Project Information</Text>
          
          {/* Client Name */}
          {project.client_name && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="account-tie"
                size={20}
                color="#667eea"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Client Name</Text>
                <Text style={styles.infoValue}>{project.client_name}</Text>
              </View>
            </View>
          )}
          
          {/* Total Project Cost */}
          {project.total_project_cost !== undefined && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="currency-usd"
                size={20}
                color="#667eea"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Total Project Cost</Text>
                <Text style={styles.infoValue}>
                  {formatCurrency(project.total_project_cost)}
                </Text>
              </View>
            </View>
          )}
          
          {/* Scope of Work */}
          {project.scope_of_work && project.scope_of_work.length > 0 && (
            <View style={styles.infoRowColumn}>
              <View style={styles.infoRowHeader}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={20}
                  color="#667eea"
                />
                <Text style={styles.infoLabel}>Scope of Work ({project.scope_of_work.length})</Text>
              </View>
              <View style={styles.scopeBadgesContainer}>
                {project.scope_of_work.map((scope, index) => (
                  <View key={index} style={styles.scopeBadge}>
                    <Text style={styles.scopeBadgeText}>{scope}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar-start"
              size={20}
              color="#667eea"
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Start Date</Text>
              <Text style={styles.infoValue}>
                {new Date(project.start_date).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
          {project.end_date && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="calendar-end"
                size={20}
                color="#667eea"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>End Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(project.end_date).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={20}
              color="#667eea"
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>
                {new Date(project.created_at || "").toLocaleDateString(
                  "en-US",
                  { day: "numeric", month: "short", year: "numeric" }
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Summary Section */}
        {paymentSummary && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons
                name="cash-check"
                size={20}
                color="#4CAF50"
              />
              <Text style={styles.cardTitle}>Payment Summary</Text>
            </View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryItemHeader}>
                  <MaterialCommunityIcons
                    name="currency-inr"
                    size={16}
                    color="#667eea"
                  />
                  <Text style={styles.summaryLabel}>Project Cost</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {formatCurrency(paymentSummary.project_cost)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <View style={styles.summaryItemHeader}>
                  <MaterialCommunityIcons
                    name="cash-check"
                    size={16}
                    color="#4CAF50"
                  />
                  <Text style={styles.summaryLabel}>Received</Text>
                </View>
                <Text style={[styles.summaryValue, styles.receivedValue]}>
                  {formatCurrency(paymentSummary.total_received)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <View style={styles.summaryItemHeader}>
                  <MaterialCommunityIcons
                    name="clock-alert-outline"
                    size={16}
                    color="#FF9800"
                  />
                  <Text style={styles.summaryLabel}>Remaining</Text>
                </View>
                <Text style={[styles.summaryValue, styles.remainingValue]}>
                  {formatCurrency(paymentSummary.remaining_amount)}
                </Text>
              </View>
              <View style={[styles.summaryItem, styles.expensesCard]}>
                <View style={styles.summaryItemHeader}>
                  <MaterialCommunityIcons
                    name="cart-outline"
                    size={18}
                    color="#F44336"
                  />
                  <Text style={styles.summaryLabel}>Total Expenses</Text>
                </View>
                <Text style={[styles.summaryValue, styles.expensesValue]}>
                  {formatCurrency(paymentSummary.total_expenses)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <View style={styles.summaryItemHeader}>
                  <MaterialCommunityIcons
                    name={paymentSummary.profit_loss >= 0 ? "trending-up" : "trending-down"}
                    size={16}
                    color={paymentSummary.profit_loss >= 0 ? "#4CAF50" : "#F44336"}
                  />
                  <Text style={styles.summaryLabel}>Profit/Loss</Text>
                </View>
                <Text
                  style={[
                    styles.summaryValue,
                    paymentSummary.profit_loss >= 0
                      ? styles.profitValue
                      : styles.lossValue,
                  ]}
                >
                  {paymentSummary.profit_loss >= 0 ? "+" : ""}
                  {formatCurrency(Math.abs(paymentSummary.profit_loss))}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <View style={styles.summaryItemHeader}>
                  <MaterialCommunityIcons
                    name="counter"
                    size={16}
                    color="#2196F3"
                  />
                  <Text style={styles.summaryLabel}>Payments</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {paymentSummary.payment_count}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Payments Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons
              name="cash-plus"
              size={24}
              color="#4CAF50"
            />
            <Text style={styles.sectionTitle}>Payments</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/AddPayment", params: { projectId: id } })}
            style={[styles.addExpenseButton, styles.recordPaymentButton]}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            <Text style={styles.addExpenseText}>Record</Text>
          </TouchableOpacity>
        </View>
        
        {payments.length === 0 ? (
          <View style={styles.emptyPayments}>
            <MaterialCommunityIcons
              name="cash-remove"
              size={60}
              color="#ccc"
            />
            <Text style={styles.emptyExpensesText}>No payments recorded</Text>
            <Text style={styles.emptyExpensesSubtext}>
              Record client payments to track project revenue
            </Text>
          </View>
        ) : (
          <View style={styles.paymentsList}>
            {payments.map((payment) => {
              const paymentType = PAYMENT_TYPES.find((t) => t.value === payment.payment_type);
              return (
                <TouchableOpacity
                  key={payment.id}
                  style={styles.paymentCard}
                  onPress={() =>
                    router.push({
                      pathname: "/AddPayment",
                      params: { id: payment.id, projectId: id },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.paymentHeader}>
                    <MaterialCommunityIcons
                      name={(paymentType?.icon || "cash") as any}
                      size={24}
                      color={paymentType?.color || "#4CAF50"}
                    />
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentAmount}>
                        {formatCurrency(payment.amount)}
                      </Text>
                      <Text style={styles.paymentDate}>
                        {new Date(payment.payment_date).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                    <View style={styles.paymentBadge}>
                      <Text
                        style={[
                          styles.paymentBadgeText,
                          { color: paymentType?.color || "#4CAF50" },
                        ]}
                      >
                        {payment.payment_type}
                      </Text>
                    </View>
                  </View>
                  {payment.received_from && (
                    <Text style={styles.paymentFrom}>From: {payment.received_from}</Text>
                  )}
                  {payment.payment_mode && (
                    <Text style={styles.paymentMode}>
                      via {payment.payment_mode}
                      {payment.reference_number && ` • ${payment.reference_number}`}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons
              name="cash-multiple"
              size={24}
              color="#333"
            />
            <Text style={styles.sectionTitle}>Expenses</Text>
          </View>
          <TouchableOpacity
            onPress={handleAddExpense}
            style={styles.addExpenseButton}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            <Text style={styles.addExpenseText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Expenses</Text>
            <Text style={styles.statValue}>{formatCurrency(totalExpenses)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Count</Text>
            <Text style={styles.statValue}>{expenses.length}</Text>
          </View>
        </View>
        {expenses.length === 0 ? (
          <View style={styles.emptyExpenses}>
            <MaterialCommunityIcons
              name="receipt-text-outline"
              size={60}
              color="#ccc"
            />
            <Text style={styles.emptyExpensesText}>No expenses yet</Text>
            <Text style={styles.emptyExpensesSubtext}>
              Tap the + Add button to create one
            </Text>
          </View>
        ) : (
          <View style={styles.expenseList}>
            {/* Group expenses by scope */}
            {(() => {
              const expensesByScope: Record<string, Expense[]> = {};
              expenses.forEach((exp) => {
                const scope = exp.scope_of_work || 'Uncategorized';
                if (!expensesByScope[scope]) {
                  expensesByScope[scope] = [];
                }
                expensesByScope[scope].push(exp);
              });

              return Object.entries(expensesByScope).map(([scope, scopeExpenses]) => (
                <View key={scope} style={styles.scopeGroup}>
                  <View style={styles.scopeGroupHeader}>
                    <MaterialCommunityIcons name="hammer-wrench" size={18} color="#667eea" />
                    <Text style={styles.scopeGroupTitle}>{scope}</Text>
                    <View style={styles.scopeGroupBadge}>
                      <Text style={styles.scopeGroupCount}>{scopeExpenses.length}</Text>
                    </View>
                    <Text style={styles.scopeGroupTotal}>
                      {formatCurrency(scopeExpenses.reduce((sum, e) => sum + e.amount, 0))}
                    </Text>
                  </View>
                  
                  {scopeExpenses.map((expense) => (
                    <View key={expense.id} style={styles.expenseCard}>
                      <TouchableOpacity
                        style={styles.expenseMainArea}
                        onPress={() => router.push({ pathname: "/ExpenseDetails", params: { id: expense.id } })}
                        activeOpacity={0.7}
                      >
                        <View style={styles.expenseHeader}>
                          <View style={styles.expenseIcon}>
                            <MaterialCommunityIcons
                              name={
                                expense.category === "materials"
                                  ? "package-variant"
                                  : expense.category === "labor"
                                  ? "account-hard-hat"
                                  : expense.category === "equipment"
                                  ? "tools"
                                  : "receipt"
                              }
                              size={20}
                              color="#667eea"
                            />
                          </View>
                          <View style={styles.expenseInfo}>
                            <Text style={styles.expenseDescription}>
                              {expense.description}
                            </Text>
                            <Text style={styles.expenseDate}>
                              {new Date(expense.expense_date).toLocaleDateString(
                                "en-US",
                                { day: "numeric", month: "short", year: "numeric" }
                              )}
                            </Text>
                          </View>
                          <View style={styles.expenseRight}>
                            <Text style={styles.expenseAmount}>
                              {formatCurrency(expense.amount)}
                            </Text>
                            {expense.category && (
                              <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>
                                  {expense.category}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.editExpenseButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push({ pathname: "/AddExpense", params: { id: expense.id, projectId: id } });
                        }}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="pencil" size={18} color="#f093fb" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ));
            })()}
          </View>
        )}
      </ScrollView>

      {/* Status Update Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Project Status</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.statusOptions}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {PROJECT_STATUSES.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusOption,
                    project?.status === status.value && styles.statusOptionSelected
                  ]}
                  onPress={() => handleStatusUpdate(status.value)}
                  disabled={updatingStatus}
                >
                  <MaterialCommunityIcons 
                    name={status.icon as any} 
                    size={24} 
                    color={project?.status === status.value ? "#fff" : status.color}
                  />
                  <Text style={[
                    styles.statusOptionText,
                    project?.status === status.value && styles.statusOptionTextSelected
                  ]}>
                    {status.label}
                  </Text>
                  {project?.status === status.value && (
                    <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}

              {/* Custom Status Option */}
              <TouchableOpacity
                style={[styles.statusOption, styles.customStatusOption]}
                onPress={() => setShowCustomInput(!showCustomInput)}
                disabled={updatingStatus}
              >
                <MaterialCommunityIcons 
                  name="pencil-box-outline" 
                  size={24} 
                  color="#667eea"
                />
                <Text style={styles.statusOptionText}>
                  Custom Status
                </Text>
                <MaterialCommunityIcons 
                  name={showCustomInput ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#667eea"
                />
              </TouchableOpacity>

              {/* Custom Input Field */}
              {showCustomInput && (
                <View style={styles.customInputContainer}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Enter custom status..."
                    value={customStatus}
                    onChangeText={setCustomStatus}
                    autoFocus
                    maxLength={50}
                  />
                  <TouchableOpacity
                    style={styles.customSubmitButton}
                    onPress={handleCustomStatusSubmit}
                    disabled={updatingStatus || !customStatus.trim()}
                  >
                    <Text style={styles.customSubmitText}>Set Status</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
            
            {updatingStatus && (
              <ActivityIndicator size="large" color="#667eea" style={styles.modalLoader} />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Analytics FAB */}
      <TouchableOpacity
        style={styles.analyticsFAB}
        onPress={() => router.push(`/ProjectAnalytics?id=${project.id}`)}
      >
        <MaterialCommunityIcons name="chart-box" size={28} color="#fff" />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    color: "#999",
    fontWeight: "600",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  projectIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  projectName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 24,
    lineHeight: 20,
    fontStyle: "italic",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  editStatusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  addExpenseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#667eea",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addExpenseText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  emptyExpenses: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyExpensesText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    fontWeight: "600",
  },
  emptyExpensesSubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 4,
  },
  expenseList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  expenseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  expenseMainArea: {
    flex: 1,
  },
  editExpenseButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  expenseHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
    lineHeight: 20,
  },
  expenseDate: {
    fontSize: 13,
    color: "#999",
  },
  expenseRight: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    color: "#667eea",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  infoRowColumn: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  scopeBadgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginLeft: 28,
  },
  scopeBadge: {
    backgroundColor: "#F5F7FF",
    borderWidth: 1,
    borderColor: "#667eea",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scopeBadgeText: {
    fontSize: 12,
    color: "#667eea",
    fontWeight: "600",
  },
  scopeGroup: {
    marginBottom: 20,
  },
  scopeGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  scopeGroupTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
  },
  scopeGroupBadge: {
    backgroundColor: "#667eea",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  scopeGroupCount: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  scopeGroupTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#667eea",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#e8f5e9",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  summaryItem: {
    width: "47%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  expensesCard: {
    backgroundColor: "#fff5f5",
    borderColor: "#ffcdd2",
    borderWidth: 2,
    borderLeftWidth: 5,
    borderLeftColor: "#F44336",
  },
  summaryItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  expensesValue: {
    color: "#F44336",
    fontSize: 20,
  },
  receivedValue: {
    color: "#4CAF50",
    fontSize: 20,
  },
  remainingValue: {
    color: "#FF9800",
    fontSize: 20,
  },
  profitValue: {
    color: "#4CAF50",
    fontSize: 20,
  },
  lossValue: {
    color: "#F44336",
    fontSize: 20,
  },
  recordPaymentButton: {
    backgroundColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyPayments: {
    alignItems: "center",
    paddingVertical: 50,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  paymentsList: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  paymentCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: "#4CAF50",
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  paymentAmount: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  paymentBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4CAF50",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paymentFrom: {
    fontSize: 14,
    color: "#555",
    marginLeft: 46,
    marginBottom: 6,
    fontWeight: "500",
  },
  paymentMode: {
    fontSize: 13,
    color: "#888",
    marginLeft: 46,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: "100%",
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  statusOptions: {
    flexGrow: 0,
    paddingBottom: 20,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    gap: 12,
    borderWidth: 2,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  statusOptionSelected: {
    backgroundColor: "#667eea",
    borderColor: "#667eea",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  statusOptionTextSelected: {
    color: "#fff",
  },
  customStatusOption: {
    backgroundColor: "#ffffff",
    borderColor: "#667eea",
    borderWidth: 2,
  },
  customInputContainer: {
    marginTop: 12,
    gap: 12,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  customInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    color: "#333",
    fontWeight: "500",
  },
  customSubmitButton: {
    backgroundColor: "#667eea",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  customSubmitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  modalLoader: {
    marginTop: 20,
  },
  analyticsFAB: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
