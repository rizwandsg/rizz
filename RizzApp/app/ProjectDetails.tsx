import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  deleteProject,
  getProjectById,
  Project,
} from "../api/projectsApi";
import { getExpensesByProject, Expense } from "../api/expensesApi";

export default function ProjectDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadProjectData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [projectData, expensesData] = await Promise.all([
        getProjectById(id.toString()),
        getExpensesByProject(id.toString()),
      ]);
      setProject(projectData);
      setExpenses(expensesData || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load project details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProjectData();
    }, [id])
  );

  const handleEdit = () => {
    router.push({ pathname: "/AddProject", params: { id: id } });
  };

  const handleDelete = () => {
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
            } catch (error) {
              Alert.alert("Error", "Failed to delete project");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleAddExpense = () => {
    router.push({ pathname: "/AddExpense", params: { projectId: id } });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#F44336";
      case "on-hold":
        return "#FF9800";
      default:
        return "#667eea";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return "check-decagram";
      case "cancelled":
        return "close-circle-outline";
      case "on-hold":
        return "pause-circle-outline";
      default:
        return "progress-clock";
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
    <View style={styles.container}>
      <LinearGradient
        colors={[statusColor, statusColor + "DD"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleEdit} style={styles.iconButton}>
              <MaterialCommunityIcons name="pencil" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.iconButton}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="delete" size={22} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerContent}>
          <View style={styles.projectIcon}>
            <MaterialCommunityIcons name="briefcase" size={32} color="#fff" />
          </View>
          <Text style={styles.projectName}>{project.name}</Text>
          {project.description && (
            <Text style={styles.projectDescription}>{project.description}</Text>
          )}
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
        </View>
      </LinearGradient>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Project Information</Text>
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
            {expenses.map((expense) => (
              <View key={expense.id} style={styles.expenseCard}>
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
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
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
    color: "#333",
    marginBottom: 4,
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
});
