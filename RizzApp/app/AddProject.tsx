import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import uuid from "react-native-uuid";
import { getDatabase, ensureDBInitialized } from "../database/db";

export default function AddProject() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    const loadProject = async () => {
      if (id) {
        await ensureDBInitialized();
        const db = getDatabase();
        const query = `SELECT * FROM projects WHERE id='${id}';`;
        const result = await db.execAsync(query);
        if (result?.length > 0 && Array.isArray(result[0])) {
          const rows = result[0];
          if (rows.length > 0) {
            const p = rows[0];
            setName(p.name);
            setClient(p.client);
            setBudget(p.budget.toString());
          }
        }
      }
    };
    loadProject();
  }, [id]);

  const saveProject = async () => {
    if (!name || !client || !budget) {
      Alert.alert("Fill all fields");
      return;
    }
    
    try {
      await ensureDBInitialized();
      const db = getDatabase();
      const projectId = id || uuid.v4().toString();
      
      if (id) {
        const updateQuery = `UPDATE projects SET name='${name}', client='${client}', budget=${parseFloat(budget)} WHERE id='${projectId}';`;
        await db.execAsync(updateQuery);
      } else {
        const insertQuery = `INSERT INTO projects (id,name,client,budget,progress) VALUES ('${projectId}','${name}','${client}',${parseFloat(budget)},0);`;
        await db.execAsync(insertQuery);
      }
      
      Alert.alert("Project saved!");
      router.back();
    } catch (error) {
      console.error("Error saving project:", error);
      Alert.alert("Error", "Failed to save project");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id ? "Edit Project" : "Add Project"}</Text>
      <TextInput placeholder="Project Name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Client Name" value={client} onChangeText={setClient} style={styles.input} />
      <TextInput placeholder="Budget" value={budget} onChangeText={setBudget} keyboardType="numeric" style={styles.input} />
      <TouchableOpacity style={styles.btn} onPress={saveProject}>
        <Text style={styles.btnText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,padding:16,backgroundColor:'#fff'},
  title:{fontSize:22,fontWeight:'bold',marginBottom:12},
  input:{borderWidth:1,borderColor:'#ccc',borderRadius:8,padding:10,marginBottom:12},
  btn:{backgroundColor:'#007AFF',padding:14,borderRadius:10,alignItems:'center'},
  btnText:{color:'#fff',fontWeight:'bold'}
});
