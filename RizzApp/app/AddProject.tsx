import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { createProject, getProjectById, Project, updateProject } from "../api/projectsApi";

export default function AddProject() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [status, setStatus] = useState("active");
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      if (id) {
        setLoading(true);
        try {
          const project = await getProjectById(id.toString());
          if (project) {
            setName(project.name);
            setDescription(project.description || "");
            setStartDate(project.start_date ? new Date(project.start_date) : new Date());
            setEndDate(project.end_date ? new Date(project.end_date) : null);
            setStatus(project.status || "active");
          } else {
            Alert.alert("Error", "Project not found");
            router.back();
          }
        } catch (error) {
          Alert.alert("Error", "Failed to load project");
          router.back();
        } finally {
          setLoading(false);
        }
      }
    };
    loadProject();
  }, [id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!name?.trim()) {
        throw new Error("Please enter a project name");
      }
      const projectData: Omit<Project, "id" | "user_id" | "created_at" | "updated_at"> = {
        name: name.trim(),
        description: description.trim() || undefined,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate ? endDate.toISOString().split("T")[0] : undefined,
        status: status
      };
      if (id) {
        await updateProject(id.toString(), projectData);
      } else {
        await createProject(projectData as Project);
      }
      Alert.alert("Success", `Project ${id ? "updated" : "created"} successfully!`, [{ text: "OK", onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{id ? "Edit Project" : "New Project"}</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Name *</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="folder-outline" size={20} color="#667eea" style={styles.inputIcon} />
              <TextInput placeholder="Enter project name" value={name} onChangeText={setName} style={styles.input} editable={!loading} placeholderTextColor="#999" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <MaterialCommunityIcons name="text" size={20} color="#667eea" style={[styles.inputIcon, styles.textAreaIcon]} />
              <TextInput placeholder="Enter project description" value={description} onChangeText={setDescription} style={[styles.input, styles.textArea]} editable={!loading} placeholderTextColor="#999" multiline numberOfLines={4} textAlignVertical="top" />
            </View>
          </View>
          <TouchableOpacity style={[styles.saveButton, loading && styles.saveButtonDisabled]} onPress={handleSave} disabled={loading}>
            <LinearGradient colors={loading ? ["#999", "#666"] : ["#667eea", "#764ba2"]} style={styles.saveButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? <ActivityIndicator color="#fff" /> : <><MaterialCommunityIcons name="check" size={20} color="#fff" /><Text style={styles.saveButtonText}>{id ? "Update Project" : "Create Project"}</Text></>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  scrollView: { flex: 1 },
  form: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  textAreaContainer: { alignItems: "flex-start" },
  inputIcon: { marginRight: 10 },
  textAreaIcon: { marginTop: 2 },
  input: { flex: 1, fontSize: 16, color: "#333" },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  saveButton: { marginTop: 20, marginBottom: 40, borderRadius: 12, overflow: "hidden", shadowColor: "#667eea", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" }
});
