import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import uuid from "react-native-uuid";
import { ensureDBInitialized, getDatabase } from "../database/db";

export default function AddExpenseScreen() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams();
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const saveExpense = async () => {
    if (!description || !cost) {
      Alert.alert("Fill all fields");
      return;
    }

    try {
      await ensureDBInitialized();
      const db = getDatabase();
      const expenseId = uuid.v4().toString();

      const insertQuery = `INSERT INTO expenses (id, projectId, description, cost, date) 
        VALUES ('${expenseId}', '${projectId || ''}', '${description}', ${parseFloat(cost)}, '${date}');`;
      
      await db.execAsync(insertQuery);
      Alert.alert("Expense saved!");
      router.back();
    } catch (error) {
      console.error("Error saving expense:", error);
      Alert.alert("Error", "Failed to save expense");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Expense</Text>
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />
      <TextInput
        placeholder="Cost"
        value={cost}
        onChangeText={setCost}
        keyboardType="numeric"
        style={styles.input}
      />
      <TouchableOpacity style={styles.btn} onPress={saveExpense}>
        <Text style={styles.btnText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
  btn: { backgroundColor: '#007AFF', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});