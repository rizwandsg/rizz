import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createExpense, Expense, getExpenseById, updateExpense } from "../api/expensesApi";
import { getProjects, Project } from "../api/projectsApi";

export default function AddExpense() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, projectId: initialProjectId } = useLocalSearchParams();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("general");
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId as string || null);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");

  useEffect(() => {
    loadProjects();
    if (id) {
      loadExpense();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadExpense = async () => {
    try {
      setLoadingExpense(true);
      if (id) {
        const expense = await getExpenseById(id.toString());
        if (expense) {
          setDescription(expense.description);
          setAmount(expense.amount.toString());
          setCategory(expense.category || "general");
          setExpenseDate(new Date(expense.expense_date));
          setSelectedProjectId(expense.project_id);
        } else {
          Alert.alert("Error", "Expense not found");
          router.back();
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load expense");
      router.back();
    } finally {
      setLoadingExpense(false);
    }
  };

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const projectsList = await getProjects();
      setProjects(projectsList);
      if (!selectedProjectId && projectsList.length > 0 && projectsList[0].id) {
        setSelectedProjectId(projectsList[0].id);
      }
    } catch {
      Alert.alert("Error", "Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!description?.trim()) throw new Error("Please enter a description");
      if (!amount) throw new Error("Please enter an amount");
      if (!selectedProjectId) throw new Error("Please select a project");
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) throw new Error("Please enter a valid amount");
      
      const expenseData: Partial<Expense> = {
        project_id: selectedProjectId,
        description: description.trim(),
        amount: amountValue,
        category: category,
        expense_date: expenseDate.toISOString().split("T")[0]
      };

      if (id) {
        await updateExpense(id.toString(), expenseData);
        Alert.alert("Success", "Expense updated successfully!", [{ text: "OK", onPress: () => router.back() }]);
      } else {
        await createExpense(expenseData as Expense);
        Alert.alert("Success", "Expense created successfully!", [{ text: "OK", onPress: () => router.back() }]);
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "materials", label: "Materials", icon: "package-variant", color: "#FF6B6B" },
    { value: "labor", label: "Labor", icon: "account-hard-hat", color: "#4ECDC4" },
    { value: "equipment", label: "Equipment", icon: "tools", color: "#FFD93D" },
    { value: "transport", label: "Transport", icon: "truck", color: "#95E1D3" },
    { value: "general", label: "General", icon: "receipt", color: "#667eea" },
    { value: "other", label: "Other", icon: "dots-horizontal", color: "#999" }
  ];

  if (loadingProjects || (id && loadingExpense)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f093fb" />
        <Text style={styles.loadingText}>{id ? "Loading expense..." : "Loading projects..."}</Text>
      </View>
    );
  }

  if (projects.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="folder-open-outline" size={80} color="#ccc" />
        <Text style={styles.emptyText}>No projects found</Text>
        <Text style={styles.emptySubtext}>Create a project first to add expenses</Text>
        <TouchableOpacity style={styles.createProjectButton} onPress={() => router.push("/AddProject")}>
          <Text style={styles.createProjectText}>Create Project</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#f093fb', '#f5576c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContentCentered}>
          <Text style={styles.headerTitle}>{id ? "Edit Expense" : "Add Expense"}</Text>
          <Text style={styles.headerSubtitle}>Track your project costs</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        {/* Project Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Project *</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowProjectDropdown(!showProjectDropdown)}
            disabled={loading}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="briefcase" size={20} color="#667eea" />
            </View>
            <Text style={[styles.dropdownText, !selectedProjectId && styles.dropdownPlaceholder]}>
              {selectedProjectId 
                ? projects.find(p => p.id === selectedProjectId)?.name 
                : "Select a project"}
            </Text>
            <MaterialCommunityIcons 
              name={showProjectDropdown ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#999" 
            />
          </TouchableOpacity>

          {/* Dropdown List */}
          {showProjectDropdown && (
            <View style={styles.dropdownList}>
              {/* Search Input */}
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20} color="#999" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search projects..."
                  value={projectSearchQuery}
                  onChangeText={setProjectSearchQuery}
                  placeholderTextColor="#999"
                />
                {projectSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setProjectSearchQuery("")}>
                    <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Project List */}
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {projects
                  .filter(project => 
                    project.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
                  )
                  .map((project) => (
                    <TouchableOpacity
                      key={project.id}
                      style={[
                        styles.dropdownItem,
                        selectedProjectId === project.id && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        if (project.id) {
                          setSelectedProjectId(project.id);
                          setShowProjectDropdown(false);
                          setProjectSearchQuery("");
                        }
                      }}
                    >
                      <MaterialCommunityIcons 
                        name={selectedProjectId === project.id ? "check-circle" : "circle-outline"} 
                        size={20} 
                        color={selectedProjectId === project.id ? "#667eea" : "#ccc"} 
                      />
                      <Text style={[
                        styles.dropdownItemText,
                        selectedProjectId === project.id && styles.dropdownItemTextSelected
                      ]}>
                        {project.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <View style={styles.inputContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="text" size={20} color="#f093fb" />
            </View>
            <TextInput 
              placeholder="Enter expense description" 
              value={description} 
              onChangeText={setDescription} 
              style={styles.input} 
              editable={!loading} 
              placeholderTextColor="#999" 
            />
          </View>
        </View>

        {/* Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount *</Text>
          <View style={styles.inputContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="currency-inr" size={20} color="#f093fb" />
            </View>
            <TextInput 
              placeholder="0.00" 
              value={amount} 
              onChangeText={setAmount} 
              keyboardType="decimal-pad" 
              style={styles.input} 
              editable={!loading} 
              placeholderTextColor="#999" 
            />
          </View>
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowDatePicker(true)} 
            disabled={loading}
          >
            <MaterialCommunityIcons name="calendar" size={20} color="#f093fb" />
            <Text style={styles.dateText}>
              {expenseDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
        </View>
          {showDatePicker && <DateTimePicker value={expenseDate} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={(event, selectedDate) => { setShowDatePicker(Platform.OS === "ios"); if (selectedDate) setExpenseDate(selectedDate); }} maximumDate={new Date()} />}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.value} style={[styles.categoryCard, category === cat.value && { backgroundColor: cat.color, borderColor: cat.color }]} onPress={() => setCategory(cat.value)} disabled={loading}>
                  <MaterialCommunityIcons name={cat.icon as any} size={24} color={category === cat.value ? "#fff" : cat.color} />
                  <Text style={[styles.categoryLabel, category === cat.value && { color: "#fff" }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={[styles.saveButton, loading && styles.saveButtonDisabled]} onPress={handleSave} disabled={loading}>
            <LinearGradient colors={loading ? ["#999", "#666"] : ["#f093fb", "#f5576c"]} style={styles.saveButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? <ActivityIndicator color="#fff" /> : <><MaterialCommunityIcons name="check" size={20} color="#fff" /><Text style={styles.saveButtonText}>{id ? "Update Expense" : "Save Expense"}</Text></>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f5f5" 
  },
  headerGradient: {
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContentCentered: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#f5f5f5", 
    padding: 20 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 16, 
    color: "#666" 
  },
  emptyText: { 
    marginTop: 12, 
    fontSize: 18, 
    color: "#999", 
    fontWeight: "600" 
  },
  emptySubtext: { 
    marginTop: 8, 
    fontSize: 14, 
    color: "#ccc", 
    textAlign: "center" 
  },
  createProjectButton: { 
    marginTop: 20, 
    backgroundColor: "#667eea", 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 20 
  },
  createProjectText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "600" 
  },
  form: { 
    padding: 20 
  },
  inputGroup: { 
    marginBottom: 24 
  },
  label: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#333", 
    marginBottom: 10,
    letterSpacing: 0.3
  },
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#fff", 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderWidth: 1, 
    borderColor: "#e8e8e8", 
    shadowColor: "#f093fb", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 3,
    gap: 12
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: "#333",
    letterSpacing: 0.3
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  dateText: { 
    flex: 1, 
    fontSize: 16, 
    color: "#333",
    letterSpacing: 0.3
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    letterSpacing: 0.3,
    fontWeight: '600',
  },
  dropdownPlaceholder: {
    color: '#999',
    fontWeight: '400',
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  dropdownItemSelected: {
    backgroundColor: '#F5F5FF',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    letterSpacing: 0.3,
  },
  dropdownItemTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  categoryGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 12 
  },
  categoryCard: { 
    width: "30%", 
    aspectRatio: 1, 
    backgroundColor: "#fff", 
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: "#e8e8e8", 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 12, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 6, 
    elevation: 2 
  },
  categoryLabel: { 
    fontSize: 11, 
    fontWeight: "600", 
    color: "#666", 
    marginTop: 8, 
    textAlign: "center",
    letterSpacing: 0.3
  },
  saveButton: { 
    marginTop: 20, 
    marginBottom: 40, 
    borderRadius: 16, 
    overflow: "hidden", 
    shadowColor: "#f093fb", 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.35, 
    shadowRadius: 12, 
    elevation: 6 
  },
  saveButtonDisabled: { 
    opacity: 0.6 
  },
  saveButtonGradient: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: 16, 
    gap: 10 
  },
  saveButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold",
    letterSpacing: 0.5
  }
});
