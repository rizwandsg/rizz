import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import uuid from "react-native-uuid";

export default function AddProject() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [budget, setBudget] = useState("");

  const saveProject = async () => {
    if (!name || !client || !budget) {
      Alert.alert("Please fill all fields");
      return;
    }

    const newProject = {
      id: uuid.v4().toString(),
      name,
      client,
      budget: parseFloat(budget),
      progress: 0,
    };

    const data = await AsyncStorage.getItem("projects");
    const projects = data ? JSON.parse(data) : [];
    projects.push(newProject);
    await AsyncStorage.setItem("projects", JSON.stringify(projects));

    Alert.alert("✅ Project added successfully!");
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Project</Text>

      <TextInput placeholder="Project Name" style={styles.input} value={name} onChangeText={setName} />
      <TextInput placeholder="Client Name" style={styles.input} value={client} onChangeText={setClient} />
      <TextInput
        placeholder="Budget (₹)"
        keyboardType="numeric"
        style={styles.input}
        value={budget}
        onChangeText={setBudget}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={saveProject}>
        <Text style={styles.saveText}>Save Project</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  saveBtn: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
