import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createProject, getProjectById, Project, updateProject } from "../api/projectsApi";

export default function AddProject() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [status, setStatus] = useState("active");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const statusOptions = [
    { value: "active", label: "Active", icon: "progress-clock", color: "#667eea" },
    { value: "completed", label: "Completed", icon: "check-circle", color: "#4CAF50" },
    { value: "on-hold", label: "On Hold", icon: "pause-circle", color: "#FF9800" },
    { value: "cancelled", label: "Cancelled", icon: "close-circle", color: "#F44336" }
  ];

  if (loading && id) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{id ? "Edit Project" : "New Project"}</Text>
            <Text style={styles.headerSubtitle}>Manage your project details</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        {/* Project Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Project Name *</Text>
          <View style={styles.inputContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="briefcase" size={20} color="#667eea" />
            </View>
            <TextInput 
              placeholder="Enter project name" 
              value={name} 
              onChangeText={setName} 
              style={styles.input} 
              editable={!loading} 
              placeholderTextColor="#999" 
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <View style={[styles.iconCircle, styles.textAreaIcon]}>
              <MaterialCommunityIcons name="text" size={20} color="#667eea" />
            </View>
            <TextInput 
              placeholder="Enter project description" 
              value={description} 
              onChangeText={setDescription} 
              style={[styles.input, styles.textArea]} 
              editable={!loading} 
              placeholderTextColor="#999" 
              multiline 
              numberOfLines={4} 
              textAlignVertical="top" 
            />
          </View>
        </View>

        {/* Date Inputs */}
        <View style={styles.dateRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Start Date *</Text>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowStartPicker(true)}
              disabled={loading}
            >
              <MaterialCommunityIcons name="calendar-start" size={20} color="#667eea" />
              <Text style={styles.dateText}>
                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowEndPicker(true)}
              disabled={loading}
            >
              <MaterialCommunityIcons name="calendar-end" size={20} color="#667eea" />
              <Text style={[styles.dateText, !endDate && { color: '#999' }]}>
                {endDate ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Optional'}
              </Text>
              {endDate && (
                <TouchableOpacity onPress={() => setEndDate(null)} style={styles.clearButton}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusGrid}>
            {statusOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.statusChip,
                  status === opt.value && { 
                    backgroundColor: opt.color,
                    borderColor: opt.color,
                  }
                ]}
                onPress={() => setStatus(opt.value)}
                disabled={loading}
              >
                <MaterialCommunityIcons 
                  name={opt.icon as any} 
                  size={20} 
                  color={status === opt.value ? '#fff' : opt.color} 
                />
                <Text style={[
                  styles.statusText,
                  status === opt.value && { color: '#fff', fontWeight: '600' }
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
          onPress={handleSave} 
          disabled={loading}
        >
          <LinearGradient 
            colors={loading ? ["#999", "#666"] : ["#667eea", "#764ba2"]} 
            style={styles.saveButtonGradient} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {id ? "Update Project" : "Create Project"}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (date) setStartDate(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowEndPicker(Platform.OS === 'ios');
            if (date) setEndDate(date);
          }}
        />
      )}
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
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
    letterSpacing: 0.3,
  },
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#fff", 
    borderRadius: 14, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderWidth: 1, 
    borderColor: "#e8e8e8", 
    shadowColor: "#667eea", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 3 
  },
  textAreaContainer: { 
    alignItems: "flex-start",
    minHeight: 120,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textAreaIcon: { 
    alignSelf: 'flex-start',
    marginTop: 0,
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: "#333",
    fontWeight: '500',
  },
  textArea: { 
    minHeight: 100, 
    textAlignVertical: "top" 
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  clearButton: {
    padding: 2,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusChip: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: { 
    marginTop: 12, 
    marginBottom: 40, 
    borderRadius: 14, 
    overflow: "hidden", 
    shadowColor: "#667eea", 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 12, 
    elevation: 8 
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
    fontSize: 17, 
    fontWeight: "700",
    letterSpacing: 0.5,
  }
});
