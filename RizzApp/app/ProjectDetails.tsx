import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Project {
  id: string;
  name: string;
  client: string;
  budget: number;
  progress: number;
}

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const router = useRouter();

  const loadProject = React.useCallback(async () => {
    const data = await AsyncStorage.getItem("projects");
    if (data) {
      const list = JSON.parse(data);
      const found = list.find((p: Project) => p.id === id);
      setProject(found);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const increaseProgress = async () => {
    if (!project) return;
    const newProgress = Math.min(project.progress + 10, 100);
    const data = await AsyncStorage.getItem("projects");
    const list = data ? JSON.parse(data) : [];
    const updated = list.map((p: Project) =>
      p.id === project.id ? { ...p, progress: newProgress } : p
    );
    await AsyncStorage.setItem("projects", JSON.stringify(updated));
    setProject({ ...project, progress: newProgress });
    Alert.alert("Progress Updated!");
  };

  if (!project) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{project.name}</Text>
      <Text>Client: {project.client}</Text>
      <Text>Budget: ₹{project.budget}</Text>
      <Text>Progress: {project.progress}%</Text>

      <TouchableOpacity style={styles.btn} onPress={increaseProgress}>
        <Text style={styles.btnText}>+10% Progress</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: "#888" }]}
        onPress={() => router.back()}
      >
        <Text style={styles.btnText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  btn: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
});
