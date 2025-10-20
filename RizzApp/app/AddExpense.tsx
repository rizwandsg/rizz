import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { createExpense, Expense } from "../api/expensesApi";
import { getProjects, Project } from "../api/projectsApi";

export default function AddExpense() {
  const router = useRouter();
  const { projectId: initialProjectId } = useLocalSearchParams();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("general");
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId as string || null);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const projectsList = await getProjects();
      setProjects(projectsList);
      if (!selectedProjectId && projectsList.length > 0 && projectsList[0].id) {
        setSelectedProjectId(projectsList[0].id);
      }
    } catch (error) {
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
      const expenseData: Expense = {
        project_id: selectedProjectId,
        description: description.trim(),
        amount: amountValue,
        category: category,
        expense_date: expenseDate.toISOString().split("T")[0]
      };
      await createExpense(expenseData);
      Alert.alert("Success", "Expense created successfully!", [{ text: "OK", onPress: () => router.back() }]);
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

  if (loadingProjects) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f093fb" />
        <Text style={styles.loadingText}>Loading projects...</Text>
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
      <LinearGradient colors={["#f093fb", "#f5576c"]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Expense</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectScroll}>
              {projects.map((project) => (
                <TouchableOpacity key={project.id} style={[styles.projectChip, selectedProjectId === project.id && styles.projectChipSelected]} onPress={() => project.id && setSelectedProjectId(project.id)}>
                  <MaterialCommunityIcons name={selectedProjectId === project.id ? "check-circle" : "circle-outline"} size={18} color={selectedProjectId === project.id ? "#fff" : "#667eea"} />
                  <Text style={[styles.projectChipText, selectedProjectId === project.id && styles.projectChipTextSelected]}>{project.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="text" size={20} color="#f093fb" style={styles.inputIcon} />
              <TextInput placeholder="Enter expense description" value={description} onChangeText={setDescription} style={styles.input} editable={!loading} placeholderTextColor="#999" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount *</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="currency-inr" size={20} color="#f093fb" style={styles.inputIcon} />
              <TextInput placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.input} editable={!loading} placeholderTextColor="#999" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)} disabled={loading}>
              <MaterialCommunityIcons name="calendar" size={20} color="#f093fb" style={styles.inputIcon} />
              <Text style={styles.dateText}>{expenseDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</Text>
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
              {loading ? <ActivityIndicator color="#fff" /> : <><MaterialCommunityIcons name="check" size={20} color="#fff" /><Text style={styles.saveButtonText}>Save Expense</Text></>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5", padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
  emptyText: { marginTop: 12, fontSize: 18, color: "#999", fontWeight: "600" },
  emptySubtext: { marginTop: 8, fontSize: 14, color: "#ccc", textAlign: "center" },
  createProjectButton: { marginTop: 20, backgroundColor: "#667eea", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  createProjectText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  scrollView: { flex: 1 },
  form: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#333" },
  dateText: { flex: 1, fontSize: 16, color: "#333" },
  projectScroll: { marginTop: 8 },
  projectChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#667eea", marginRight: 10, gap: 6 },
  projectChipSelected: { backgroundColor: "#667eea", borderColor: "#667eea" },
  projectChipText: { fontSize: 14, fontWeight: "600", color: "#667eea" },
  projectChipTextSelected: { color: "#fff" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryCard: { width: "30%", aspectRatio: 1, backgroundColor: "#fff", borderRadius: 12, borderWidth: 2, borderColor: "#e0e0e0", justifyContent: "center", alignItems: "center", padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  categoryLabel: { fontSize: 12, fontWeight: "600", color: "#666", marginTop: 8, textAlign: "center" },
  saveButton: { marginTop: 20, marginBottom: 40, borderRadius: 12, overflow: "hidden", shadowColor: "#f093fb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" }
});
