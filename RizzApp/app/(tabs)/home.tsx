import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ensureDBInitialized, getDatabase } from '../../database/db';

interface Project {
  id: string;
  name: string;
  client: string;
  budget: number;
  progress: number;
}

export default function HomeScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      await ensureDBInitialized();
      const db = getDatabase();
      
      const allRows = await db.getAllAsync<Project>(
        'SELECT * FROM projects ORDER BY name;'
      );
      
      setProjects(allRows);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading projects...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Projects</Text>
      {projects.length === 0 ? (
        <Text>No projects found</Text>
      ) : (
        projects.map(project => (
          <View key={project.id} style={styles.projectCard}>
            <Text style={styles.projectName}>{project.name}</Text>
            <Text>Client: {project.client}</Text>
            <Text>Budget: ${project.budget}</Text>
            <Text>Progress: {project.progress}%</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  projectCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});