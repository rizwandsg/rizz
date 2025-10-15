import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import db from "../../database/db";

interface Project {
  id: string;
  name: string;
  client: string;
  budget: number;
  progress: number;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        "SELECT * FROM projects;",
        [],
        (_, result) => setProjects(result.rows._array),
        (_, error) => console.log(error)
      );
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏗️ Projects</Text>
      <FlatList
        data={projects}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: "/AddProject", params: { id: item.id } })}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>Client: {item.client}</Text>
            <Text>Budget: ₹{item.budget}</Text>
            <Text>Progress: {item.progress}%</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No projects added yet.</Text>}
      />
      <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/AddProject")}>
        <Text style={styles.addBtnText}>＋ Add Project</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  card: { backgroundColor: "#f0f0f0", padding: 12, borderRadius: 8, marginBottom: 8 },
  name: { fontSize: 18, fontWeight: "600" },
  addBtn: { backgroundColor: "#007AFF", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 12 },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
