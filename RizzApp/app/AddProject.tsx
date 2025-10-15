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
    // Reset loading state
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

      console.log('Starting project save...');
      
      // Initialize database
      console.log('Ensuring database is initialized...');
      await ensureDBInitialized();

      const db = getDatabase();
      if (!db) {
        throw new Error('Could not connect to database');
      }

      // Generate new ID for new projects
      const projectId = id || uuid.v4().toString();
      const today = new Date().toISOString().split('T')[0];
      
      // Create the project object
      const project = {
        id: projectId,
        name: name.trim(),
        client: client.trim(),
        budget: parsedBudget,
        date: today,
        progress: 0
      };
      
      console.log('Saving project:', project);

      try {
        // First verify the table exists
        const tableCheck = await db.execAsync(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='projects';"
        );
        
        if (!tableCheck?.[0]?.length) {
          throw new Error('Projects table does not exist');
        }

        // Simple insert or update query
        const query = id 
          ? `UPDATE projects 
             SET name = '${project.name.replace(/'/g, "''")}',
                 client = '${project.client.replace(/'/g, "''")}',
                 budget = ${project.budget},
                 date = '${project.date}'
             WHERE id = '${project.id}';`
          : `INSERT INTO projects (id, name, client, budget, progress, date)
             VALUES (
               '${project.id}',
               '${project.name.replace(/'/g, "''")}',
               '${project.client.replace(/'/g, "''")}',
               ${project.budget},
               ${project.progress},
               '${project.date}'
             );`;

        // Execute the save query
        console.log('Executing query:', query);
        await db.execAsync(query);

        // Verify the save by selecting the project
        const verifyResult = await db.execAsync(
          `SELECT * FROM projects WHERE id = '${project.id}';`
        );
        
        console.log('Verify result:', JSON.stringify(verifyResult, null, 2));

        if (!verifyResult?.[0]?.[0]) {
          throw new Error('Failed to verify saved project');
        }

        console.log('Project saved successfully:', verifyResult[0][0]);
        
        // Show success message and navigate back
        Alert.alert(
          "Success", 
          "Project saved successfully!",
          [{ 
            text: "OK",
            onPress: () => router.back()
          }]
        );
      } catch (dbError: any) {
        console.error('Database operation failed:', dbError);
        throw new Error(
          dbError?.message || 'Failed to save project to database'
        );
      }
    } catch (error: any) {
      console.error('Error in saveProject:', error);
      Alert.alert(
        "Error",
        error?.message || "An unexpected error occurred"
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
