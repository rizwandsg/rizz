import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getProjectById, saveProject } from "../database/projectService";

export default function AddProject() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [budget, setBudget] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      if (id) {
        try {
          const project = await getProjectById(id.toString());
          if (project) {
            console.log('Loaded project:', project);
            setName(project.name);
            setClient(project.client);
            setBudget(project.budget.toString());
            setDate(project.date);
          } else {
            console.log('No project found with id:', id);
            Alert.alert('Error', 'Project not found');
          }
        } catch (error) {
          console.error('Error loading project:', error);
          Alert.alert(
            'Error',
            'Failed to load project: ' + (error instanceof Error ? error.message : String(error))
          );
        }
      }
    };
    loadProject();
  }, [id]);

  const handleSave = async () => {
    setLoading(true);

    try {
      // Validate input fields
      if (!name?.trim()) {
        throw new Error("Please enter a project name");
      }
      if (!client?.trim()) {
        throw new Error("Please enter a client name");
      }
      if (!budget) {
        throw new Error("Please enter a budget");
      }

      // Validate budget
      const parsedBudget = parseFloat(budget);
      if (isNaN(parsedBudget) || parsedBudget < 0) {
        throw new Error("Please enter a valid budget amount");
      }

      // Create the project object
      const projectData = {
        id: id?.toString(),
        name: name.trim(),
        client: client.trim(),
        budget: parsedBudget,
        date: date,
        progress: 0
      };
      
      console.log('Saving project:', projectData);
      
      const savedProject = await saveProject(projectData);
      console.log('Project saved successfully:', savedProject);

      Alert.alert(
        "Success", 
        "Project saved successfully!",
        [{ 
          text: "OK",
          onPress: () => router.back()
        }]
      );
    } catch (error) {
      console.error('Error saving project:', error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save project"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id ? "Edit Project" : "Add Project"}</Text>
      <TextInput 
        placeholder="Project Name" 
        value={name} 
        onChangeText={setName} 
        style={styles.input}
        editable={!loading} 
      />
      <TextInput 
        placeholder="Client Name" 
        value={client} 
        onChangeText={setClient} 
        style={styles.input}
        editable={!loading} 
      />
      <TextInput 
        placeholder="Budget" 
        value={budget} 
        onChangeText={setBudget} 
        keyboardType="numeric" 
        style={styles.input}
        editable={!loading} 
      />
      <TextInput 
        placeholder="Date" 
        value={date} 
        onChangeText={setDate}
        style={styles.input}
        editable={!loading} 
      />
      <TouchableOpacity 
        style={[styles.btn, loading && styles.btnDisabled]} 
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12
  },
  btn: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  btnDisabled: {
    backgroundColor: '#999',
    opacity: 0.7
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
