import { useCreateId } from '../hooks/useCreateId';
import { useRef } from 'react';
import { parseMoney, localDate } from '../services/validation';
import { formError, parseCalendarDate } from '../services/formValues';
import { FormLoadState } from '../components/FormLoadState';
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

  const [loadedVersion, setLoadedVersion] = useState<string | undefined>(undefined);
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
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [showPaymentTypeDropdown, setShowPaymentTypeDropdown] = useState(false);
  const [showPaymentModeDropdown, setShowPaymentModeDropdown] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingPayment(true);
      setLoadError(null);
      try {
        const payment = id ? await getPaymentById(id.toString()) : null;
        if (id && !payment) throw new Error('Payment not found or access denied');
        if (payment && projectId && payment.project_id !== projectId.toString()) throw new Error('Payment does not belong to this project');
        const targetId = payment?.project_id || projectId?.toString();
        if (!targetId) throw new Error('Project is required');
        const projectData = await getProjectById(targetId);
        if (cancelled) return;
        if (!projectData) throw new Error('Project not found or access denied');
        if (payment && !payment.updated_at) throw new Error('Payment version is missing. Reload before editing.');
        setProject(projectData);
        if (payment) {
          setLoadedVersion(payment.updated_at);
          setAmount(payment.amount.toString());
          setPaymentDate(parseCalendarDate(payment.payment_date));
          setPaymentType(payment.payment_type);
          setPaymentMode(payment.payment_mode);
          setReferenceNumber(payment.reference_number || "");
          setNotes(payment.notes || "");
          setReceivedFrom(payment.received_from || "");
        } else {
          setReceivedFrom(projectData.client_name || '');
        }
      } catch (error) {
        if (!cancelled) setLoadError(formError(error, 'Failed to load payment form'));
      } finally {
        if (!cancelled) setLoadingPayment(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [id, projectId, loadAttempt]);

  const requestId = useCreateId();
  const savingRef = useRef(false);
  const handleSave = async () => {
    if (savingRef.current || loadingPayment || loadError) return;
    savingRef.current = true;
    setLoading(true);
    try {
      if (!amount) throw new Error("Please enter an amount");
      if (!project?.id) throw new Error("Project is required");

      const amountValue = parseMoney(amount);
      if (isNaN(amountValue) || amountValue <= 0)
        throw new Error("Please enter a valid amount");

      const paymentData: Partial<Payment> = {
        updated_at: loadedVersion,
        project_id: project.id,
        amount: amountValue,
        payment_date: localDate(paymentDate),
        payment_type: paymentType,
        payment_mode: paymentMode,
        reference_number: referenceNumber.trim(),
        notes: notes.trim(),
        received_from: receivedFrom.trim(),
      };

      if (id) {
        await updatePayment(id.toString(), paymentData);
        Alert.alert("Success", "Payment updated successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await createPayment({ ...paymentData, id: requestId } as Payment);
        Alert.alert("Success", "Payment recorded successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      savingRef.current = false;
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save payment"
      );
      setLoading(false);
    }
  };

  if (loadingPayment || loadError) return <FormLoadState error={loadError} onRetry={() => setLoadAttempt(attempt => attempt + 1)} onBack={() => router.back()} />;

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
                testID="payment-amount"
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
                testID="payment-received-from"
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
            testID="payment-save"
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


