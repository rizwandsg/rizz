import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getDatabase, ensureDBInitialized } from "../../database/db";
import { Expense, SQLResult } from "../../database/types";

export default function ExpenseScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        await ensureDBInitialized();
        const db = getDatabase();
        const result = await db.execAsync("SELECT * FROM expenses;") as SQLResult;
        
        if (result && result.length > 0) {
          setExpenses(result[0] as Expense[]);
        }
      } catch (error) {
        console.error("Error loading expenses:", error);
      }
    };
    
    loadExpenses();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💰 Expenses</Text>
      <FlatList
        data={expenses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>Description: {item.description}</Text>
            <Text>Cost: ₹{item.cost}</Text>
            <Text>Date: {item.date}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No expenses yet.</Text>}
      />
      <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/AddExpense")}>
        <Text style={styles.addBtnText}>＋ Add Expense</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  card: { backgroundColor: "#f0f0f0", padding: 12, borderRadius: 8, marginBottom: 8 },
  addBtn: { backgroundColor: "#007AFF", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 12 },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
