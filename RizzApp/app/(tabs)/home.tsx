import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ensureDBInitialized, getDatabase } from '../../database/db';
import { SQLResult } from '../../database/types';

interface Project {
  id: string;
  name: string;
  client: string;
  budget: number;
  progress: number;
  date: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      await ensureDBInitialized();
      const db = getDatabase();
      console.log('Fetching projects...');
      const result = await db.execAsync('SELECT * FROM projects ORDER BY name;') as SQLResult;
      console.log('Database query result:', JSON.stringify(result, null, 2));
      if (result && result.length > 0) {
        console.log('Projects found:', result[0]);
        setProjects(result[0] as Project[]);
      } else {
        console.log('No projects found in database');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProjects();
    }, [])
  );

  const getProgressColor = (progress: number) => {
    if (progress < 30) return '#FF3B30';
    if (progress < 70) return '#FFCC00';
    return '#34C759';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏗️ Projects Overview</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/AddProject")}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="folder-open-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No projects yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add your first project</Text>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Project Name</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Client Name</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
            </View>

            {/* Table Rows */}
            {projects.map(project => (
              <TouchableOpacity
                key={project.id}
                style={styles.tableRow}
                onPress={() => router.push({
                  pathname: "/ProjectDetails",
                  params: { id: project.id }
                })}
              >
                <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{project.name}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{project.client}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>
                  {new Date(project.date).toLocaleDateString()}
                </Text>
                <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
                  <View style={[styles.statusBadge, { backgroundColor: getProgressColor(project.progress) }]}>
                    <Text style={styles.statusText}>{project.progress}%</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '50%',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  tableCell: {
    fontSize: 15,
    color: '#1c1c1e',
    paddingRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  }
});