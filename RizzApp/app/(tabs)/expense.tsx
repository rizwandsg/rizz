import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Project } from "../../database/projectService";
import Storage from "../../services/projectStorage";

interface Expense {
  id: string;
  projectId: string;
  description: string;
  cost: number;
  date: string;
}

export default function ExpenseScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<{[key: string]: string}>({});
  const router = useRouter();

  const loadData = async () => {
    try {
      // Load projects for mapping
      const projects = await Storage.loadProjects();
      const projectMap = projects.reduce<{[key: string]: string}>((acc, project: Project) => {
        if (project.id) { // Check if id exists
          acc[project.id] = project.name;
        }
        return acc;
      }, {});
      setProjects(projectMap);

      // Load expenses
      const expenses = await Storage.loadExpenses();
      setExpenses(expenses.sort((a: Expense, b: Expense) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💰 Expenses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/AddExpense")}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.projectTag}>
                <MaterialCommunityIcons name="folder-outline" size={16} color="#007AFF" />
                <Text style={styles.projectName}>{projects[item.projectId] || 'No Project'}</Text>
              </View>
              <Text style={styles.date}>{formatDate(item.date)}</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <View style={styles.costContainer}>
              <MaterialCommunityIcons name="currency-inr" size={18} color="#34C759" />
              <Text style={styles.cost}>{item.cost.toLocaleString()}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cash-remove" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No expenses recorded yet</Text>
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
    backgroundColor: "#f8f9fa"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    marginTop: 10,
    color: "#666"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold"
  },
  addButton: {
    backgroundColor: "#007AFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  listContent: {
    padding: 16
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  projectTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  projectName: {
    color: "#007AFF",
    marginLeft: 4,
    fontSize: 12
  },
  date: {
    color: "#666",
    fontSize: 12
  },
  description: {
    fontSize: 16,
    marginBottom: 8
  },
  costContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  cost: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#34C759",
    marginLeft: 4
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: "50%"
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8
  }
});
