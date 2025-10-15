import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import uuid from "react-native-uuid";
import { ensureDBInitialized, getDatabase } from "../database/db";

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
          await ensureDBInitialized();
          const db = getDatabase();
          const escapedId = id.toString().replace(/'/g, "''");
          const query = `SELECT * FROM projects WHERE id='${escapedId}';`;
          console.log('Loading project with query:', query);
          const result = await db.execAsync(query);
          
          if (result?.length > 0 && Array.isArray(result[0])) {
            const rows = result[0];
            if (rows.length > 0) {
              const p = rows[0];
              console.log('Loaded project:', p);
              setName(p.name || '');
              setClient(p.client || '');
              setBudget(p.budget?.toString() || '');
              setDate(p.date || new Date().toISOString().split('T')[0]);
            } else {
              console.log('No project found with id:', id);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error loading project:', errorMessage);
          Alert.alert('Error', 'Failed to load project: ' + errorMessage);
        }
      }
    };
    loadProject();
  }, [id]);

  const saveProject = async () => {
    // Validate input fields
    if (!name?.trim()) {
      Alert.alert("Error", "Please enter a project name");
      return;
    }
    if (!client?.trim()) {
      Alert.alert("Error", "Please enter a client name");
      return;
    }
    if (!budget) {
      Alert.alert("Error", "Please enter a budget");
      return;
    }

    // Show loading state
    setLoading(true);
    
    try {
      console.log('Starting project save...');
      
      // Initialize database
      console.log('Ensuring database is initialized...');
      await ensureDBInitialized();

      const db = getDatabase();
      console.log('Database connection obtained');

      // Validate budget
      const parsedBudget = parseFloat(budget);
      if (isNaN(parsedBudget) || parsedBudget < 0) {
        Alert.alert("Error", "Please enter a valid budget amount");
        setLoading(false);
        return;
      }

      // Generate new ID for new projects
      const projectId = id || uuid.v4().toString();
      const projectDate = date || new Date().toISOString().split('T')[0];
      
      console.log('Saving project:', {
        id: projectId,
        name: name.trim(),
        client: client.trim(),
        budget: parsedBudget,
        date: projectDate
      });

      try {
        // Save the project
        const cleanName = name.trim().replace(/'/g, "''");
        const cleanClient = client.trim().replace(/'/g, "''");
        
        let query: string;
        if (id) {
          query = "UPDATE projects SET " +
                  "name = '" + cleanName + "', " +
                  "client = '" + cleanClient + "', " +
                  "budget = " + parsedBudget + ", " +
                  "date = '" + projectDate + "' " +
                  "WHERE id = '" + projectId + "'";
        } else {
          query = "INSERT INTO projects (id, name, client, budget, progress, date) " +
                  "VALUES ('" + projectId + "', '" + 
                  cleanName + "', '" + 
                  cleanClient + "', " + 
                  parsedBudget + ", 0, '" + 
                  projectDate + "')";
        }

        console.log('Executing query:', query);
        await db.execAsync(query);

        // Verify the save
        const verifyQuery = "SELECT * FROM projects WHERE id = '" + projectId + "'";
        const verifyResult = await db.execAsync(verifyQuery);
        
        if (!verifyResult?.[0]?.[0]) {
          throw new Error('Project was not saved properly');
        }

        console.log('Project saved successfully:', verifyResult[0][0]);
        Alert.alert(
          "Success", 
          "Project saved successfully!",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } catch (dbError: any) {
        console.error('Database error:', dbError);
        throw new Error(dbError?.message || 'Failed to save to database');
      }
    } catch (error: any) {
      console.error('Error in saveProject:', error);
      Alert.alert(
        "Error",
        "Failed to save project: " + (error?.message || 'Unknown error')
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
        onPress={saveProject}
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
