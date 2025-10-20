import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getProjects, Project } from '../../api/projectsApi';

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('Fetching projects...');
      
      const loadedProjects = await getProjects();
      console.log(`Found ${loadedProjects.length} projects`);
      setProjects(loadedProjects);
    } catch (error) {
      console.error('Error in fetchProjects:', error);
      Alert.alert(
        'Error',
        'Failed to load projects. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProjects();
    }, [])
  );

  const getProgressColor = (status?: string): [string, string] => {
    if (status === 'completed') return ['#6BCF7F', '#34C759'];
    if (status === 'cancelled') return ['#FF6B6B', '#FF3B30'];
    if (status === 'on-hold') return ['#FFD93D', '#FFA500'];
    return ['#667eea', '#764ba2'];  // active
  };

  const getStatusIcon = (status?: string) => {
    if (status === 'completed') return 'check-decagram';
    if (status === 'cancelled') return 'close-circle-outline';
    if (status === 'on-hold') return 'pause-circle-outline';
    return 'progress-clock';  // active
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerGreeting}>Projects</Text>
            <Text style={styles.headerSubtitle}>{projects.length} total projects</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/AddProject")}
          >
            <MaterialCommunityIcons name="plus" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="briefcase-clock" size={24} color="#FFD93D" />
            <Text style={styles.statNumber}>{activeProjects}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#6BCF7F" />
            <Text style={styles.statNumber}>{completedProjects}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="chart-line" size={24} color="#FF6B6B" />
            <Text style={styles.statNumber}>{activeProjects + completedProjects}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="folder-open-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No projects yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to create your first project</Text>
          </View>
        ) : (
          <View style={styles.projectsGrid}>
            {projects.map((project, index) => {
              const [gradientStart, gradientEnd] = getProgressColor(project.status);
              const statusIcon = getStatusIcon(project.status);
              
              return (
                <TouchableOpacity
                  key={project.id}
                  style={[styles.projectCard, { marginTop: index === 0 ? 0 : 16 }]}
                  onPress={() => router.push({
                    pathname: "/ProjectDetails",
                    params: { id: project.id }
                  })}
                  activeOpacity={0.7}
                >
                  {/* Card Header with Gradient */}
                  <LinearGradient
                    colors={[gradientStart, gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardHeader}
                  >
                    <View style={styles.cardHeaderContent}>
                      <View style={styles.projectIcon}>
                        <MaterialCommunityIcons name="briefcase" size={24} color="#fff" />
                      </View>
                      <View style={styles.cardHeaderRight}>
                        <MaterialCommunityIcons name={statusIcon} size={20} color="#fff" />
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
                    {project.description && (
                      <View style={styles.clientRow}>
                        <MaterialCommunityIcons name="text" size={16} color="#666" />
                        <Text style={styles.clientName} numberOfLines={2}>{project.description}</Text>
                      </View>
                    )}
                    <View style={styles.dateRow}>
                      <MaterialCommunityIcons name="calendar-start" size={16} color="#666" />
                      <Text style={styles.dateText}>
                        {new Date(project.start_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </Text>
                      {project.end_date && (
                        <>
                          <MaterialCommunityIcons name="arrow-right" size={14} color="#999" style={{ marginLeft: 8 }} />
                          <Text style={styles.dateText}>
                            {new Date(project.end_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </Text>
                        </>
                      )}
                    </View>

                    {/* Status Badge */}
                    <View style={styles.statusBadgeContainer}>
                      <View style={[styles.statusBadge, { backgroundColor: gradientStart }]}>
                        <Text style={styles.statusBadgeText}>
                          {project.status?.charAt(0).toUpperCase() + (project.status?.slice(1) || '')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerGreeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '40%',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  projectsGrid: {
    paddingBottom: 20,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  cardHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBody: {
    padding: 20,
    paddingTop: 16,
  },
  projectName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 15,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusBadgeContainer: {
    marginTop: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  }
});