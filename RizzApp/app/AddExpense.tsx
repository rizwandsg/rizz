import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExpenseCategory, getCategoriesForScope } from "../api/expenseCategoriesApi";
import { createExpense, Expense, getExpenseById, getUniqueVendors, PAYMENT_METHODS, PAYMENT_STATUS_OPTIONS, PaymentMethod, PaymentStatus, updateExpense, VendorInfo } from "../api/expensesApi";
import { getProjects, Project, ScopeOfWork } from "../api/projectsApi";

export default function AddExpense() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, projectId: initialProjectId } = useLocalSearchParams();
  
  // Feature flag - set to true after running database migration
  const VENDOR_PAYMENT_ENABLED = true; // Vendor and payment tracking enabled
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("general");
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId as string || null);
  const [selectedScope, setSelectedScope] = useState<ScopeOfWork | 'Other' | null>(null);
  const [availableScopes, setAvailableScopes] = useState<ScopeOfWork[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  
  // Vendor and payment fields
  const [vendorName, setVendorName] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Unpaid");
  const [vendors, setVendors] = useState<VendorInfo[]>([]);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [showPaymentMethodDropdown, setShowPaymentMethodDropdown] = useState(false);
  const [showPaymentStatusDropdown, setShowPaymentStatusDropdown] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");

  useEffect(() => {
    loadProjects();
    loadVendors();
    if (id) {
      loadExpense();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadVendors = async () => {
    try {
      const vendorsList = await getUniqueVendors();
      setVendors(vendorsList);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  };

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
          if (expense.scope_of_work) {
            setSelectedScope(expense.scope_of_work);
          }
          // Load vendor and payment info
          if (expense.vendor_name) {
            setVendorName(expense.vendor_name);
          }
          if (expense.vendor_contact) {
            setVendorContact(expense.vendor_contact);
          }
          if (expense.payment_method) {
            setPaymentMethod(expense.payment_method);
          }
          if (expense.payment_status) {
            setPaymentStatus(expense.payment_status);
          }
        } else {
          Alert.alert("Error", "Expense not found");
          router.back();
        }
      }
    } catch {
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

  // Load scopes when project changes
  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project?.scope_of_work && project.scope_of_work.length > 0) {
        setAvailableScopes(project.scope_of_work);
        // Auto-select first scope if not already selected
        if (!selectedScope && project.scope_of_work.length === 1) {
          setSelectedScope(project.scope_of_work[0]);
        }
      } else {
        setAvailableScopes([]);
        setSelectedScope(null);
      }
    }
  }, [selectedProjectId, projects, selectedScope]);

  // Load categories when scope changes
  useEffect(() => {
    if (selectedScope) {
      const categories = getCategoriesForScope(selectedScope);
      setExpenseCategories(categories);
      // Reset category to first available category or empty
      if (categories.length > 0) {
        setCategory(categories[0].name);
      } else {
        setCategory('');
      }
    } else {
      setExpenseCategories([]);
      setCategory('general'); // Reset to general when no scope
    }
  }, [selectedScope]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!description?.trim()) throw new Error("Please enter a description");
      if (!amount) throw new Error("Please enter an amount");
      if (!selectedProjectId) throw new Error("Please select a project");
      if (!selectedScope) throw new Error("Please select a scope of work");
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) throw new Error("Please enter a valid amount");
      
      // Build expense data - only include vendor/payment fields if they have values
      const expenseData: Partial<Expense> = {
        project_id: selectedProjectId,
        description: description.trim(),
        amount: amountValue,
        category: category,
        expense_date: expenseDate.toISOString().split("T")[0],
        scope_of_work: selectedScope,
      };

      // Only add vendor/payment fields if database has been migrated
      // This prevents errors if migration hasn't been run yet
      if (vendorName.trim()) {
        expenseData.vendor_name = vendorName.trim();
      }
      if (vendorContact.trim()) {
        expenseData.vendor_contact = vendorContact.trim();
      }
      // Add payment fields (database migration completed)
      expenseData.payment_method = paymentMethod;
      expenseData.payment_status = paymentStatus;

      // Set loading to false BEFORE showing alert
      setLoading(false);
      
      if (id) {
        await updateExpense(id.toString(), expenseData);
        console.log('✅ Expense updated successfully');
        // Show alert with tiny delay to ensure it renders
        setTimeout(() => {
          Alert.alert(
            "Success", 
            "Expense updated successfully!", 
            [{ 
              text: "OK", 
              onPress: () => {
                console.log('Alert OK pressed, navigating back...');
                router.back();
              }
            }]
          );
        }, 100);
      } else {
        await createExpense(expenseData as Expense);
        console.log('✅ Expense created successfully');
        // Show alert with tiny delay to ensure it renders
        setTimeout(() => {
          Alert.alert(
            "Success", 
            "Expense created successfully!", 
            [{ 
              text: "OK", 
              onPress: () => {
                console.log('Alert OK pressed, navigating back...');
                router.back();
              }
            }]
          );
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error saving expense:', error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save expense");
      setLoading(false);
    }
  };

  // Helper function to get icon for scope
  const getScopeIcon = (scope: ScopeOfWork | 'Other'): string => {
    const scopeIconMap: Record<string, string> = {
      'Carpentry Work': 'hammer-screwdriver',
      'Painting Work': 'format-paint',
      'Aluminium Work': 'window-closed-variant',
      'Electrical Work': 'flash',
      'Plumbing Work': 'pipe',
      'Flooring Work': 'floor-plan',
      'False Ceiling Work': 'ceiling-light',
      'Masonry Work': 'wall',
      'Tiling Work': 'grid',
      'Glazing Work': 'window-open-variant',
      'Door & Window Work': 'door',
      'Kitchen & Modular Work': 'countertop',
      'Interior Decoration': 'sofa',
      'Exterior Decoration': 'home-city',
      'Landscaping Work': 'tree',
      'HVAC Work': 'air-conditioner',
      'Waterproofing Work': 'water-off',
      'Structural Work': 'home-variant',
      'Civil Work': 'hard-hat',
      'Plastering Work': 'texture',
      'Wallpaper Work': 'wallpaper',
      'Furniture Work': 'table-furniture',
      'Lighting Work': 'lightbulb-on',
      'Partition Work': 'view-split-vertical',
      'Plaster of Paris Work': 'spray',
      'Wood Flooring': 'pine-tree',
      'Marble & Granite Work': 'square',
      'Steel Fabrication': 'wrench',
      'Railing Work': 'fence',
      'Staircase Work': 'stairs',
      'Bathroom Fitting': 'shower',
      'Wardrobe Work': 'wardrobe',
      'Curtain & Blinds': 'blinds',
      'Wall Cladding': 'wall-sconce-flat',
      'Roofing Work': 'home-roof',
      'Insulation Work': 'thermometer',
      'Demolition Work': 'hammer-wrench',
      'Site Preparation': 'excavator',
      'Traveling Expenses': 'car-multiple',
      'Complete Interior Fit-out': 'home-modern',
      'Complete Renovation': 'home-edit',
      'Turnkey Project': 'key-variant',
    };
    return scopeIconMap[scope] || 'hammer-wrench';
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
        <ActivityIndicator size="large" color="#667eea" />
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Gradient Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.headerGradient, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContentCentered}>
          <Text style={styles.headerTitle}>{id ? "Edit Expense" : "Add Expense"}</Text>
          <Text style={styles.headerSubtitle}>Track your project costs</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
              <MaterialCommunityIcons name="text" size={20} color="#667eea" />
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
              <MaterialCommunityIcons name="currency-inr" size={20} color="#667eea" />
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
            <MaterialCommunityIcons name="calendar" size={20} color="#667eea" />
            <Text style={styles.dateText}>
              {expenseDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
        </View>
          {showDatePicker && <DateTimePicker value={expenseDate} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={(event, selectedDate) => { setShowDatePicker(Platform.OS === "ios"); if (selectedDate) setExpenseDate(selectedDate); }} maximumDate={new Date()} />}
          
          {/* Scope of Work */}
          {availableScopes.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Scope of Work *</Text>
              <TouchableOpacity 
                style={styles.dropdownButton} 
                onPress={() => setShowScopeDropdown(!showScopeDropdown)}
                disabled={loading}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons 
                    name={selectedScope ? getScopeIcon(selectedScope) as any : "hammer-wrench"} 
                    size={20} 
                    color="#667eea" 
                  />
                </View>
                <Text style={[styles.dropdownText, !selectedScope && { color: '#999' }]}>
                  {selectedScope || 'Select scope of work'}
                </Text>
                <MaterialCommunityIcons name={showScopeDropdown ? "chevron-up" : "chevron-down"} size={20} color="#999" />
              </TouchableOpacity>
              
              {showScopeDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView 
                    style={styles.dropdownScroll}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={true}
                  >
                    {availableScopes.map((scope) => (
                      <TouchableOpacity
                        key={scope}
                        style={[
                          styles.dropdownItem,
                          selectedScope === scope && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          setSelectedScope(scope);
                          setShowScopeDropdown(false);
                        }}
                      >
                        <View style={styles.scopeItemContainer}>
                          <View style={styles.scopeIconCircle}>
                            <MaterialCommunityIcons 
                              name={getScopeIcon(scope) as any} 
                              size={20} 
                              color={selectedScope === scope ? "#667eea" : "#667eea"} 
                            />
                          </View>
                          <Text style={[
                            styles.dropdownItemText,
                            selectedScope === scope && styles.dropdownItemTextSelected
                          ]}>
                            {scope}
                          </Text>
                        </View>
                        {selectedScope === scope && (
                          <MaterialCommunityIcons name="check" size={20} color="#667eea" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Vendor/Supplier Selection - Only show if feature enabled */}
          {VENDOR_PAYMENT_ENABLED && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vendor/Supplier (Optional)</Text>
              <TouchableOpacity 
                style={styles.dropdownButton} 
                onPress={() => setShowVendorDropdown(!showVendorDropdown)}
                disabled={loading}
              >
                <MaterialCommunityIcons name="store" size={20} color="#667eea" />
                <Text style={[styles.dropdownText, !vendorName && { color: '#999' }]}>
                  {vendorName || 'Select or enter vendor'}
              </Text>
              <MaterialCommunityIcons name={showVendorDropdown ? "chevron-up" : "chevron-down"} size={20} color="#999" />
            </TouchableOpacity>
            
            {showVendorDropdown && (
              <View style={styles.dropdownList}>
                {/* Manual entry option */}
                <View style={styles.manualEntryContainer}>
                  <TextInput
                    style={styles.manualEntryInput}
                    placeholder="Enter new vendor name"
                    value={vendorName}
                    onChangeText={setVendorName}
                    placeholderTextColor="#999"
                  />
                </View>
                
                {/* Recent vendors */}
                {vendors.length > 0 && (
                  <>
                    <View style={styles.dropdownDivider} />
                    <Text style={styles.dropdownSectionTitle}>Recent Vendors</Text>
                    {vendors.map((vendor) => (
                      <TouchableOpacity
                        key={vendor.vendor_name}
                        style={[
                          styles.dropdownItem,
                          vendorName === vendor.vendor_name && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          setVendorName(vendor.vendor_name);
                          setVendorContact(vendor.vendor_contact || '');
                          setShowVendorDropdown(false);
                        }}
                      >
                        <View style={styles.vendorItemContent}>
                          <View style={styles.vendorInfo}>
                            <Text style={[
                              styles.dropdownItemText,
                              vendorName === vendor.vendor_name && styles.dropdownItemTextSelected
                            ]}>
                              {vendor.vendor_name}
                            </Text>
                            {vendor.vendor_contact && (
                              <Text style={styles.vendorContact}>
                                {vendor.vendor_contact}
                              </Text>
                            )}
                          </View>
                          <View style={styles.vendorStats}>
                            <Text style={styles.vendorStatsText}>
                              {vendor.total_expenses} expense{vendor.total_expenses !== 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>
                        {vendorName === vendor.vendor_name && (
                          <MaterialCommunityIcons name="check" size={20} color="#667eea" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>
            )}
            </View>
          )}

          {/* Vendor Contact */}
          {VENDOR_PAYMENT_ENABLED && vendorName.trim() && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vendor Contact (Optional)</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="phone" size={20} color="#667eea" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Phone or email"
                  value={vendorContact}
                  onChangeText={setVendorContact}
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          )}

          {/* Payment Method */}
          {VENDOR_PAYMENT_ENABLED && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Method</Text>
              <TouchableOpacity 
                style={styles.dropdownButton} 
                onPress={() => setShowPaymentMethodDropdown(!showPaymentMethodDropdown)}
                disabled={loading}
              >
                <MaterialCommunityIcons 
                  name={(PAYMENT_METHODS.find(m => m.value === paymentMethod)?.icon || 'cash') as any}
                  size={20} 
                  color={PAYMENT_METHODS.find(m => m.value === paymentMethod)?.color || '#667eea'} 
                />
                <Text style={styles.dropdownText}>{paymentMethod}</Text>
                <MaterialCommunityIcons name={showPaymentMethodDropdown ? "chevron-up" : "chevron-down"} size={20} color="#999" />
              </TouchableOpacity>
              
              {showPaymentMethodDropdown && (
                <View style={styles.dropdownList}>
                  {PAYMENT_METHODS.map((method) => (
                    <TouchableOpacity
                      key={method.value}
                      style={[
                        styles.dropdownItem,
                        paymentMethod === method.value && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        setPaymentMethod(method.value);
                        setShowPaymentMethodDropdown(false);
                      }}
                    >
                      <MaterialCommunityIcons 
                        name={method.icon as any}
                        size={20} 
                        color={method.color} 
                      />
                      <Text style={[
                        styles.dropdownItemText,
                        paymentMethod === method.value && styles.dropdownItemTextSelected
                      ]}>
                        {method.label}
                      </Text>
                      {paymentMethod === method.value && (
                        <MaterialCommunityIcons name="check" size={20} color="#667eea" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Payment Status */}
          {VENDOR_PAYMENT_ENABLED && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Status</Text>
              <TouchableOpacity 
                style={styles.dropdownButton} 
                onPress={() => setShowPaymentStatusDropdown(!showPaymentStatusDropdown)}
                disabled={loading}
              >
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: PAYMENT_STATUS_OPTIONS.find(s => s.value === paymentStatus)?.color || '#999' }
                ]} />
                <Text style={styles.dropdownText}>{paymentStatus}</Text>
                <MaterialCommunityIcons name={showPaymentStatusDropdown ? "chevron-up" : "chevron-down"} size={20} color="#999" />
              </TouchableOpacity>
              
              {showPaymentStatusDropdown && (
                <View style={styles.dropdownList}>
                  {PAYMENT_STATUS_OPTIONS.map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      style={[
                        styles.dropdownItem,
                        paymentStatus === status.value && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        setPaymentStatus(status.value);
                        setShowPaymentStatusDropdown(false);
                      }}
                    >
                      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                      <Text style={[
                        styles.dropdownItemText,
                        paymentStatus === status.value && styles.dropdownItemTextSelected
                      ]}>
                        {status.label}
                      </Text>
                      {paymentStatus === status.value && (
                        <MaterialCommunityIcons name="check" size={20} color="#667eea" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {(expenseCategories.length > 0 ? expenseCategories : categories).map((cat) => {
                const catName = 'name' in cat ? cat.name : cat.value;
                const catLabel = 'name' in cat ? cat.name : cat.label;
                return (
                  <TouchableOpacity 
                    key={catName} 
                    style={[
                      styles.categoryCard, 
                      category === catName && { backgroundColor: cat.color, borderColor: cat.color }
                    ]} 
                    onPress={() => setCategory(catName)} 
                    disabled={loading}
                  >
                    <MaterialCommunityIcons 
                      name={cat.icon as any} 
                      size={24} 
                      color={category === catName ? "#fff" : cat.color} 
                    />
                    <Text style={[
                      styles.categoryLabel, 
                      category === catName && { color: "#fff" }
                    ]}>
                      {catLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <TouchableOpacity style={[styles.saveButton, loading && styles.saveButtonDisabled]} onPress={handleSave} disabled={loading}>
            <LinearGradient colors={loading ? ["#999", "#666"] : ["#667eea", "#764ba2"]} style={styles.saveButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? <ActivityIndicator color="#fff" /> : <><MaterialCommunityIcons name="check" size={20} color="#fff" /><Text style={styles.saveButtonText}>{id ? "Update Expense" : "Save Expense"}</Text></>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    shadowColor: "#667eea", 
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
    shadowColor: '#667eea',
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
    shadowColor: '#667eea',
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
    shadowColor: "#667eea", 
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
  },
  manualEntryContainer: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  manualEntryInput: {
    fontSize: 15,
    color: '#333',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  dropdownSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
  },
  vendorItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorContact: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  vendorStats: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vendorStatsText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
    marginLeft: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  scopeItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  scopeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});


