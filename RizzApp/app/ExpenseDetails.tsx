import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { deleteExpense, Expense, getExpenseById } from "../api/expensesApi";
import { getProjectById, Project } from "../api/projectsApi";

export default function ExpenseDetails() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push(`/AddExpense?id=${id}&projectId=${expense?.project_id}`)}
          >
            <MaterialCommunityIcons name="pencil" size={22} color="#f093fb" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <MaterialCommunityIcons name="delete" size={22} color="#F44336" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, id, expense]);

  useEffect(() => {
    loadExpense();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadExpense = async () => {
    try {
      setLoading(true);
      if (id) {
        const expenseData = await getExpenseById(id.toString());
        if (expenseData) {
          setExpense(expenseData);
          // Load project details
          if (expenseData.project_id) {
            const projectData = await getProjectById(expenseData.project_id);
            setProject(projectData);
          }
        } else {
          Alert.alert("Error", "Expense not found");
          router.back();
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load expense");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Expense", "Are you sure you want to delete this expense? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (id) {
              await deleteExpense(id.toString());
              Alert.alert("Success", "Expense deleted successfully!", [
                { text: "OK", onPress: () => router.back() },
              ]);
            }
          } catch (error) {
            Alert.alert("Error", "Failed to delete expense");
          }
        },
      },
    ]);
  };

  const getCategoryInfo = (category?: string) => {
    const categories: Record<string, { icon: string; color: string; label: string }> = {
      materials: { icon: "package-variant", color: "#FF6B6B", label: "Materials" },
      labor: { icon: "account-hard-hat", color: "#4ECDC4", label: "Labor" },
      equipment: { icon: "tools", color: "#FFD93D", label: "Equipment" },
      transport: { icon: "truck", color: "#95E1D3", label: "Transport" },
      general: { icon: "receipt", color: "#667eea", label: "General" },
      other: { icon: "dots-horizontal", color: "#999", label: "Other" },
    };
    return categories[category || "general"] || categories.general;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f093fb" />
        <Text style={styles.loadingText}>Loading expense...</Text>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={80} color="#ccc" />
        <Text style={styles.emptyText}>Expense not found</Text>
      </View>
    );
  }

  const categoryInfo = getCategoryInfo(expense.category);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Amount Card */}
      <LinearGradient colors={["#f093fb", "#f5576c"]} style={styles.amountCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.categoryBadge}>
          <MaterialCommunityIcons name={categoryInfo.icon as any} size={16} color="#fff" />
          <Text style={styles.categoryBadgeText}>{categoryInfo.label}</Text>
        </View>
        <Text style={styles.amountLabel}>Total Amount</Text>
        <Text style={styles.amountValue}>₹{expense.amount.toLocaleString()}</Text>
        <Text style={styles.expenseDate}>
          {new Date(expense.expense_date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </LinearGradient>

      {/* Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>

        {/* Description */}
        <View style={styles.infoCard}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="text" size={20} color="#f093fb" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>{expense.description}</Text>
          </View>
        </View>

        {/* Project */}
        {project && (
          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => router.push(`/ProjectDetails?id=${expense.project_id}`)}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="briefcase" size={20} color="#667eea" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Project</Text>
              <Text style={styles.infoValue}>{project.name}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        )}

        {/* Category */}
        <View style={styles.infoCard}>
          <View style={[styles.iconCircle, { backgroundColor: categoryInfo.color + "20" }]}>
            <MaterialCommunityIcons name={categoryInfo.icon as any} size={20} color={categoryInfo.color} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{categoryInfo.label}</Text>
          </View>
        </View>

        {/* Created Date */}
        {expense.created_at && (
          <View style={styles.infoCard}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#999" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>
                {new Date(expense.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Updated Date */}
        {expense.updated_at && expense.updated_at !== expense.created_at && (
          <View style={styles.infoCard}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="update" size={20} color="#999" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>
                {new Date(expense.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
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
  headerButtons: {
    flexDirection: "row",
    gap: 12,
    marginRight: 8,
  },
  headerButton: {
    padding: 8,
  },
  amountCard: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: "#f093fb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 16,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  amountLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  expenseDate: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    letterSpacing: 0.3,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF0F5",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
