import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createProject, getProjectById, Project, ScopeOfWork, updateProject } from "../api/projectsApi";

interface ScopeOption {
  value: ScopeOfWork;
  icon: string;
  color: string;
}

const SCOPE_OPTIONS: ScopeOption[] = [
  { value: 'Carpentry Work', icon: 'hammer-screwdriver', color: '#8B4513' },
  { value: 'Painting Work', icon: 'format-paint', color: '#FF6B6B' },
  { value: 'Aluminium Work', icon: 'window-closed-variant', color: '#95A5A6' },
  { value: 'Electrical Work', icon: 'flash', color: '#F39C12' },
  { value: 'Plumbing Work', icon: 'pipe', color: '#3498DB' },
  { value: 'Flooring Work', icon: 'floor-plan', color: '#D4A574' },
  { value: 'False Ceiling Work', icon: 'ceiling-light', color: '#ECF0F1' },
  { value: 'Masonry Work', icon: 'wall', color: '#7F8C8D' },
  { value: 'Tiling Work', icon: 'grid', color: '#16A085' },
  { value: 'Glazing Work', icon: 'window-open-variant', color: '#5DADE2' },
  { value: 'Door & Window Work', icon: 'door', color: '#8E44AD' },
  { value: 'Kitchen & Modular Work', icon: 'countertop', color: '#E74C3C' },
  { value: 'Interior Decoration', icon: 'sofa', color: '#E91E63' },
  { value: 'Exterior Decoration', icon: 'home-city', color: '#9C27B0' },
  { value: 'Landscaping Work', icon: 'tree', color: '#27AE60' },
  { value: 'HVAC Work', icon: 'air-conditioner', color: '#00BCD4' },
  { value: 'Waterproofing Work', icon: 'water-off', color: '#2980B9' },
  { value: 'Structural Work', icon: 'home-variant', color: '#34495E' },
  { value: 'Civil Work', icon: 'hard-hat', color: '#F39C12' },
  { value: 'Plastering Work', icon: 'texture', color: '#BDC3C7' },
  { value: 'Wallpaper Work', icon: 'wallpaper', color: '#FF69B4' },
  { value: 'Furniture Work', icon: 'table-furniture', color: '#795548' },
  { value: 'Lighting Work', icon: 'lightbulb-on', color: '#FFC107' },
  { value: 'Partition Work', icon: 'view-split-vertical', color: '#607D8B' },
  { value: 'Plaster of Paris Work', icon: 'spray', color: '#E0E0E0' },
  { value: 'Wood Flooring', icon: 'pine-tree', color: '#8D6E63' },
  { value: 'Marble & Granite Work', icon: 'square', color: '#424242' },
  { value: 'Steel Fabrication', icon: 'wrench', color: '#546E7A' },
  { value: 'Railing Work', icon: 'fence', color: '#455A64' },
  { value: 'Staircase Work', icon: 'stairs', color: '#5D4037' },
  { value: 'Bathroom Fitting', icon: 'shower', color: '#26C6DA' },
  { value: 'Wardrobe Work', icon: 'wardrobe', color: '#6D4C41' },
  { value: 'Curtain & Blinds', icon: 'blinds', color: '#AB47BC' },
  { value: 'Wall Cladding', icon: 'wall-sconce-flat', color: '#78909C' },
  { value: 'Roofing Work', icon: 'home-roof', color: '#D32F2F' },
  { value: 'Insulation Work', icon: 'thermometer', color: '#0288D1' },
  { value: 'Demolition Work', icon: 'hammer-wrench', color: '#C62828' },
  { value: 'Site Preparation', icon: 'excavator', color: '#F57C00' },
  { value: 'Traveling Expenses', icon: 'car-multiple', color: '#FF5722' },
  { value: 'Complete Interior Fit-out', icon: 'home-modern', color: '#667eea' },
  { value: 'Complete Renovation', icon: 'home-edit', color: '#764ba2' },
  { value: 'Turnkey Project', icon: 'key-variant', color: '#4CAF50' },
];

export default function AddProject() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [status, setStatus] = useState("active");
  const [totalProjectCost, setTotalProjectCost] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState<ScopeOfWork[]>([]); // Changed to array
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
            setClientName(project.client_name || "");
            setDescription(project.description || "");
            setStartDate(project.start_date ? new Date(project.start_date) : new Date());
            setEndDate(project.end_date ? new Date(project.end_date) : null);
            setStatus(project.status || "active");
            setTotalProjectCost(project.total_project_cost?.toString() || "");
            setScopeOfWork(project.scope_of_work || []); // Handle undefined
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
      
      const costValue = totalProjectCost.trim() ? parseFloat(totalProjectCost) : undefined;
      if (totalProjectCost.trim() && (isNaN(costValue!) || costValue! < 0)) {
        throw new Error("Please enter a valid project cost");
      }
      
      const projectData: Omit<Project, "id" | "user_id" | "created_at" | "updated_at"> = {
        name: name.trim(),
        client_name: clientName.trim() || undefined,
        description: description.trim() || undefined,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate ? endDate.toISOString().split("T")[0] : undefined,
        status: status,
        total_project_cost: costValue,
        scope_of_work: scopeOfWork.length > 0 ? scopeOfWork : undefined // Only send if selections exist
      };
      
      console.log('Saving project with data:', projectData);
      console.log('Scope of work being saved:', projectData.scope_of_work);
      
      if (id) {
        await updateProject(id.toString(), projectData);
      } else {
        await createProject(projectData as Project);
      }
      Alert.alert("Success", `Project ${id ? "updated" : "created"} successfully!`, [{ text: "OK", onPress: () => router.back() }]);
    } catch (error) {
      console.error('Error saving project:', error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Gradient Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContentCentered}>
          <Text style={styles.headerTitle}>{id ? "Edit Project" : "New Project"}</Text>
          <Text style={styles.headerSubtitle}>Manage your project details</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

        {/* Client Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Client Name</Text>
          <View style={styles.inputContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="account-tie" size={20} color="#667eea" />
            </View>
            <TextInput 
              placeholder="Enter client name" 
              value={clientName} 
              onChangeText={setClientName} 
              style={styles.input} 
              editable={!loading} 
              placeholderTextColor="#999" 
            />
          </View>
        </View>

        {/* Total Project Cost */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Project Cost</Text>
          <View style={styles.inputContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="currency-usd" size={20} color="#667eea" />
            </View>
            <TextInput 
              placeholder="Enter total cost" 
              value={totalProjectCost} 
              onChangeText={setTotalProjectCost} 
              style={styles.input} 
              editable={!loading} 
              placeholderTextColor="#999" 
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Scope of Work */}
        <View style={styles.inputGroup}>
          <View style={styles.scopeHeader}>
            <Text style={styles.label}>Scope of Work</Text>
            {scopeOfWork.length > 0 && (
              <TouchableOpacity 
                onPress={() => setScopeOfWork([])}
                style={styles.clearAllButton}
              >
                <Text style={styles.clearAllText}>Clear All ({scopeOfWork.length})</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.helperText}>Select one or more work types for this project</Text>
          <View style={styles.scopeCardsGrid}>
            {SCOPE_OPTIONS.map((option) => {
              const isSelected = scopeOfWork.includes(option.value);
              
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.scopeCard,
                    isSelected && styles.scopeCardSelected
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      // Remove from selection
                      setScopeOfWork(scopeOfWork.filter(s => s !== option.value));
                    } else {
                      // Add to selection
                      setScopeOfWork([...scopeOfWork, option.value]);
                    }
                  }}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <View style={[styles.scopeIconContainer, { backgroundColor: option.color + '15' }]}>
                    <MaterialCommunityIcons 
                      name={option.icon as any} 
                      size={24} 
                      color={isSelected ? option.color : option.color + 'AA'} 
                    />
                  </View>
                  <Text 
                    style={[
                      styles.scopeCardText,
                      isSelected && styles.scopeCardTextSelected
                    ]}
                    numberOfLines={2}
                  >
                    {option.value}
                  </Text>
                  {isSelected && (
                    <View style={[styles.scopeCheckmark, { backgroundColor: option.color }]}>
                      <MaterialCommunityIcons name="check" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View style={[styles.inputGroup, { marginTop: 32 }]}>
          <Text style={styles.label}>Description</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <View style={[styles.iconCircle, styles.textAreaIcon]}>
              <MaterialCommunityIcons name="text" size={20} color="#667eea" />
            </View>
            <TextInput 
              placeholder="Enter project description (optional)" 
              value={description} 
              onChangeText={setDescription} 
              style={[styles.input, styles.textArea]} 
              editable={!loading} 
              placeholderTextColor="#aaa" 
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
          <View style={styles.inputContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="progress-clock" size={20} color="#667eea" />
            </View>
            <TextInput 
              placeholder="Enter project status" 
              value={status} 
              onChangeText={setStatus} 
              style={styles.input} 
              editable={!loading} 
              placeholderTextColor="#999" 
            />
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
    </KeyboardAvoidingView>
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
    fontSize: 12, 
    fontWeight: "700", 
    color: "#1a1a1a", 
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
    paddingVertical: 4,
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
    marginTop: 8,
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: "#333",
    fontWeight: '500',
  },
  textArea: { 
    minHeight: 100, 
    textAlignVertical: "top",
    paddingTop: 8,
    lineHeight: 22,
    fontSize: 15,
    fontWeight: '400',
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
  },
  helperText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    marginTop: -4,
  },
  scopeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
  },
  clearAllText: {
    fontSize: 12,
    color: '#E74C3C',
    fontWeight: '600',
  },
  scopeCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  scopeCard: {
    width: '31%',
    aspectRatio: 1,
    margin: '1%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  scopeCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#F5F7FF',
    shadowColor: '#667eea',
    shadowOpacity: 0.15,
    elevation: 4,
  },
  scopeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  scopeCardText: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },
  scopeCardTextSelected: {
    color: '#667eea',
    fontWeight: '700',
  },
  scopeCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownButton: {
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
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 0,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  }
});
