import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    createCustomerPayment,
    CustomerPayment,
    getCustomerPaymentById,
    PAYMENT_METHODS,
    PaymentMethod,
    updateCustomerPayment,
} from "../api/customerPaymentsApi";
import { getProjectById, Project } from "../api/projectsApi";

export default function AddCustomerPayment() {
  const params = useLocalSearchParams();
  const paymentId = params.id as string | undefined;
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadProject();
      if (paymentId) {
        await loadPayment();
      }
    };
    init();
  }, [projectId, paymentId]);

  const loadProject = async () => {
    try {
      const projectData = await getProjectById(projectId);
      setProject(projectData);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const loadPayment = async () => {
    if (!paymentId) return;
    try {
      const payment = await getCustomerPaymentById(paymentId);
      if (payment) {
        setAmount(payment.amount.toString());
        setPaymentDate(new Date(payment.payment_date));
        setPaymentMethod(payment.payment_method);
        setReferenceNumber(payment.reference_number || "");
        setNotes(payment.notes || "");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!amount?.trim()) throw new Error("Please enter payment amount");
      if (!projectId) throw new Error("Project is required");

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const paymentData: Partial<CustomerPayment> = {
        project_id: projectId,
        amount: amountValue,
        payment_date: paymentDate.toISOString().split("T")[0],
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (paymentId) {
        await updateCustomerPayment(paymentId, paymentData);
        Alert.alert("Success", "Payment updated successfully");
      } else {
        await createCustomerPayment(paymentData as CustomerPayment);
        Alert.alert("Success", "Payment recorded successfully");
      }

      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setPaymentDate(selectedDate);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {paymentId ? "Edit Payment" : "Record Payment"}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content}>
          {/* Project Info */}
          {project && (
            <View style={styles.projectInfo}>
              <MaterialCommunityIcons
                name="briefcase"
                size={20}
                color="#667eea"
              />
              <View style={styles.projectDetails}>
                <Text style={styles.projectName}>{project.name}</Text>
                {project.client_name && (
                  <Text style={styles.clientName}>
                    Client: {project.client_name}
                  </Text>
                )}
                {project.total_project_cost && (
                  <Text style={styles.totalCost}>
                    Total Cost: ₹{project.total_project_cost.toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Payment Amount <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Payment Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialCommunityIcons
                name="calendar"
                size={20}
                color="#667eea"
              />
              <Text style={styles.dateText}>
                {paymentDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={paymentDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Payment Method */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowMethodDropdown(!showMethodDropdown)}
            >
              <MaterialCommunityIcons
                name={
                  (PAYMENT_METHODS.find((m) => m.value === paymentMethod)
                    ?.icon as any) || "cash"
                }
                size={20}
                color="#667eea"
              />
              <Text style={styles.dropdownText}>{paymentMethod}</Text>
              <MaterialCommunityIcons
                name={showMethodDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>

            {showMethodDropdown && (
              <View style={styles.dropdownList}>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setPaymentMethod(method.value);
                      setShowMethodDropdown(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={method.icon as any}
                      size={20}
                      color="#667eea"
                    />
                    <Text style={styles.dropdownItemText}>{method.label}</Text>
                    {paymentMethod === method.value && (
                      <MaterialCommunityIcons
                        name="check"
                        size={20}
                        color="#667eea"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Reference Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Reference Number (Check #, Transaction ID, etc.)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter reference number"
              value={referenceNumber}
              onChangeText={setReferenceNumber}
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any notes about this payment"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>
                {loading
                  ? "Saving..."
                  : paymentId
                  ? "Update Payment"
                  : "Record Payment"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  projectInfo: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectDetails: {
    marginLeft: 10,
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  clientName: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  totalCost: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  required: {
    color: "#e74c3c",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingLeft: 15,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#667eea",
    marginRight: 5,
  },
  amountInput: {
    flex: 1,
    padding: 15,
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dropdownText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    minHeight: 100,
  },
  saveButton: {
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 10,
    overflow: "hidden",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    padding: 15,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
