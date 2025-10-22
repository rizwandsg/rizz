import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    createPayment,
    getPaymentById,
    Payment,
    PAYMENT_MODES,
    PAYMENT_TYPES,
    PaymentMode,
    PaymentType,
    updatePayment,
} from "../api/paymentsApi";
import { getProjectById, Project } from "../api/projectsApi";

export default function AddPayment() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, projectId } = useLocalSearchParams();

  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>("Advance");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [receivedFrom, setReceivedFrom] = useState("");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [showPaymentTypeDropdown, setShowPaymentTypeDropdown] = useState(false);
  const [showPaymentModeDropdown, setShowPaymentModeDropdown] = useState(false);

  useEffect(() => {
    loadProject();
    if (id) {
      loadPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, projectId]);

  const loadProject = async () => {
    try {
      if (projectId) {
        const projectData = await getProjectById(projectId.toString());
        setProject(projectData);
        if (projectData?.client_name) {
          setReceivedFrom(projectData.client_name);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load project");
    }
  };

  const loadPayment = async () => {
    try {
      setLoadingPayment(true);
      if (id) {
        const payment = await getPaymentById(id.toString());
        if (payment) {
          setAmount(payment.amount.toString());
          setPaymentDate(new Date(payment.payment_date));
          setPaymentType(payment.payment_type);
          setPaymentMode(payment.payment_mode);
          setReferenceNumber(payment.reference_number || "");
          setNotes(payment.notes || "");
          setReceivedFrom(payment.received_from || "");
        } else {
          Alert.alert("Error", "Payment not found");
          router.back();
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load payment");
      router.back();
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!amount) throw new Error("Please enter an amount");
      if (!projectId) throw new Error("Project ID is required");

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0)
        throw new Error("Please enter a valid amount");

      const paymentData: Partial<Payment> = {
        project_id: projectId.toString(),
        amount: amountValue,
        payment_date: paymentDate.toISOString().split("T")[0],
        payment_type: paymentType,
        payment_mode: paymentMode,
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        received_from: receivedFrom.trim() || undefined,
      };

      if (id) {
        await updatePayment(id.toString(), paymentData);
        Alert.alert("Success", "Payment updated successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await createPayment(paymentData as Payment);
        Alert.alert("Success", "Payment recorded successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save payment"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingPayment) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading payment...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.headerTitle}>
              {id ? "Edit Payment" : "Record Payment"}
            </Text>
            {project && (
              <Text style={styles.headerSubtitle}>
                Project: {project.name}
              </Text>
            )}
          </LinearGradient>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount Received *</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="currency-inr"
                size={20}
                color="#667eea"
              />
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Payment Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Date *</Text>
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
                {paymentDate.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={paymentDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setPaymentDate(selectedDate);
                }}
              />
            )}
          </View>

          {/* Received From */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Received From</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="account"
                size={20}
                color="#667eea"
              />
              <TextInput
                style={styles.input}
                placeholder="Client name"
                value={receivedFrom}
                onChangeText={setReceivedFrom}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Payment Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Type *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowPaymentTypeDropdown(!showPaymentTypeDropdown)}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name={
                  (PAYMENT_TYPES.find((t) => t.value === paymentType)?.icon ||
                    "cash") as any
                }
                size={20}
                color={
                  PAYMENT_TYPES.find((t) => t.value === paymentType)?.color ||
                  "#667eea"
                }
              />
              <Text style={styles.dropdownText}>
                {PAYMENT_TYPES.find((t) => t.value === paymentType)?.label ||
                  paymentType}
              </Text>
              <MaterialCommunityIcons
                name={showPaymentTypeDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>

            {showPaymentTypeDropdown && (
              <View style={styles.dropdownList}>
                {PAYMENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.dropdownItem,
                      paymentType === type.value && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setPaymentType(type.value);
                      setShowPaymentTypeDropdown(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={type.icon as any}
                      size={20}
                      color={type.color}
                    />
                    <Text
                      style={[
                        styles.dropdownItemText,
                        paymentType === type.value &&
                          styles.dropdownItemTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                    {paymentType === type.value && (
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

          {/* Payment Mode */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Mode *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowPaymentModeDropdown(!showPaymentModeDropdown)}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name={
                  (PAYMENT_MODES.find((m) => m.value === paymentMode)?.icon ||
                    "cash") as any
                }
                size={20}
                color={
                  PAYMENT_MODES.find((m) => m.value === paymentMode)?.color ||
                  "#667eea"
                }
              />
              <Text style={styles.dropdownText}>
                {PAYMENT_MODES.find((m) => m.value === paymentMode)?.label ||
                  paymentMode}
              </Text>
              <MaterialCommunityIcons
                name={showPaymentModeDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>

            {showPaymentModeDropdown && (
              <View style={styles.dropdownList}>
                {PAYMENT_MODES.map((mode) => (
                  <TouchableOpacity
                    key={mode.value}
                    style={[
                      styles.dropdownItem,
                      paymentMode === mode.value && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setPaymentMode(mode.value);
                      setShowPaymentModeDropdown(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={mode.icon as any}
                      size={20}
                      color={mode.color}
                    />
                    <Text
                      style={[
                        styles.dropdownItemText,
                        paymentMode === mode.value &&
                          styles.dropdownItemTextSelected,
                      ]}
                    >
                      {mode.label}
                    </Text>
                    {paymentMode === mode.value && (
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
              Reference Number {paymentMode !== "Cash" && "(Optional)"}
            </Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="barcode"
                size={20}
                color="#667eea"
              />
              <TextInput
                style={styles.input}
                placeholder="Transaction ID, Check number, etc."
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Additional details about this payment..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>
          </View>

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
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>
                    {id ? "Update Payment" : "Record Payment"}
                  </Text>
                </>
              )}
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
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  inputGroup: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#333",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#333",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dropdownText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#333",
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemSelected: {
    backgroundColor: "#f5f5f5",
  },
  dropdownItemText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#333",
  },
  dropdownItemTextSelected: {
    fontWeight: "600",
    color: "#667eea",
  },
  textAreaContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  textArea: {
    fontSize: 15,
    color: "#333",
    minHeight: 100,
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});


