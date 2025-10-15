import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import uuid from "react-native-uuid";
import { ensureDBInitialized, getDatabase } from "../database/db";
import { SQLResult } from "../database/types";

interface Project {
  id: string;
  name: string;
  client: string;
}

export default function AddExpenseScreen() {
  const router = useRouter();
  const { projectId: initialProjectId } = useLocalSearchParams();
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId as string || null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        await ensureDBInitialized();
        const db = getDatabase();
        const result = await db.execAsync('SELECT id, name, client FROM projects ORDER BY name;') as SQLResult;
        if (result && result.length > 0) {
          setProjects(result[0] as Project[]);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        Alert.alert('Error', 'Failed to load projects');
      }
    };
    loadProjects();
  }, []);

  const saveExpense = async () => {
    if (!description || !cost || !selectedProjectId) {
      Alert.alert("Error", "Please fill all fields and select a project");
      return;
    }

    try {
      await ensureDBInitialized();
      const db = getDatabase();
      const expenseId = uuid.v4().toString();

      const insertQuery = `INSERT INTO expenses (id, projectId, description, cost, date) 
        VALUES ('${expenseId}', '${selectedProjectId}', '${description}', ${parseFloat(cost)}, '${date}');`;
      
      await db.execAsync(insertQuery);
      Alert.alert("Success", "Expense saved successfully!");
      router.back();
    } catch (error) {
      console.error("Error saving expense:", error);
      Alert.alert("Error", "Failed to save expense");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Expense</Text>
      
      <Text style={styles.label}>Select Project</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectList}>
        {projects.map(project => (
          <TouchableOpacity
            key={project.id}
            style={[
              styles.projectCard,
              selectedProjectId === project.id && styles.selectedProject
            ]}
            onPress={() => setSelectedProjectId(project.id)}
          >
            <MaterialCommunityIcons 
              name={selectedProjectId === project.id ? "check-circle" : "circle-outline"} 
              size={24} 
              color={selectedProjectId === project.id ? "#007AFF" : "#666"}
            />
            <Text style={styles.projectName}>{project.name}</Text>
            <Text style={styles.clientName}>{project.client}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
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
      <TouchableOpacity 
        style={[styles.btn, (!description || !cost || !selectedProjectId) && styles.btnDisabled]} 
        onPress={saveExpense}
        disabled={!description || !cost || !selectedProjectId}
      >
        <Text style={styles.btnText}>Save Expense</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1c1c1e'
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1c1c1e'
  },
  projectList: {
    marginBottom: 20,
    flexGrow: 0
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'column',
    alignItems: 'center'
  },
  selectedProject: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
    borderWidth: 2
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
    color: '#1c1c1e'
  },
  clientName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  btn: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },
  btnDisabled: {
    backgroundColor: '#ccc'
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});