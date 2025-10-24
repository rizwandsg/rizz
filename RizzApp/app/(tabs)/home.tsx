import { useAuth, useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentUser, getSupabaseUserFromClerk, syncClerkUserToSupabase } from '../../api/authApi';
import { deleteProject, getProjects, Project } from '../../api/projectsApi';
import { useTheme } from '../../context/ThemeContext';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { isSignedIn, userId } = useAuth(); // Get both isSignedIn and userId from Clerk
  const { user: clerkUser } = useUser(); // Get Clerk user object for email
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isSyncingRef = useRef(false); // Use ref to persist across renders and prevent race conditions
  const hasLoadedRef = useRef(false); // Track if we've loaded data to prevent multiple initial calls

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('Fetching projects...');
      
      // Check if user is authenticated (either Clerk or regular)
      let regularUser = await getCurrentUser();
      
      // If user is signed in with Clerk but not in AsyncStorage, sync them
      // Use ref to prevent multiple simultaneous sync attempts
      if (!regularUser && isSignedIn && userId && !isSyncingRef.current) {
        isSyncingRef.current = true; // Set flag immediately
        console.log('🔄 Clerk user signed in but not in AsyncStorage, syncing...');
        try {
          // Try to get user from Supabase
          let supabaseUser = await getSupabaseUserFromClerk(userId);
          
          // If user doesn't exist in Supabase, create them
          if (!supabaseUser) {
            console.log('📝 Creating Clerk user in Supabase...');
            // Get email from Clerk user object
            const email = clerkUser?.primaryEmailAddress?.emailAddress || `user_${userId}@clerk.temp`;
            const fullName = clerkUser?.fullName || clerkUser?.firstName || 'Clerk User';
            supabaseUser = await syncClerkUserToSupabase(userId, email, fullName);
            console.log('✅ Created Supabase user:', { email, fullName });
          }
          
          // Store in AsyncStorage
          await AsyncStorage.setItem('@rizzapp_user', JSON.stringify(supabaseUser));
          await AsyncStorage.setItem('@rizzapp_token', supabaseUser.id);
          console.log('✅ Clerk user synced to AsyncStorage');
          
          // Update regularUser variable so we don't redirect
          regularUser = supabaseUser;
        } catch (syncError) {
          console.error('❌ Failed to sync Clerk user:', syncError);
          isSyncingRef.current = false; // Reset on error
          // If sync fails, sign out and redirect to login
          Alert.alert(
            'Sync Error',
            'Failed to sync your account. Please sign in again.',
            [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
          );
          return;
        }
        // Don't reset isSyncingRef here - keep it true so we never sync again for this session
      }
      
      const isAuthenticated = regularUser !== null || isSignedIn;
      
      if (!isAuthenticated) {
        console.log('⚠️ User not authenticated, redirecting to login...');
        router.replace('/(auth)/login');
        return;
      }
      
      console.log(`✅ User authenticated - Regular: ${!!regularUser}, Clerk: ${isSignedIn}`);
      
      const loadedProjects = await getProjects();
      console.log(`Found ${loadedProjects.length} projects`);
      setProjects(loadedProjects);
    } catch (error) {
      console.error('Error in fetchProjects:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('not authenticated')) {
        console.log('⚠️ Authentication error, redirecting to login...');
        router.replace('/(auth)/login');
      } else {
        Alert.alert(
          'Error',
          'Failed to load projects. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      // Only fetch if we haven't loaded yet, or if this is a subsequent focus (refresh)
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        fetchProjects();
      } else {
        // On subsequent focus events, only fetch if user is already in AsyncStorage
        // This prevents re-syncing on every tab switch
        getCurrentUser().then(user => {
          if (user) {
            fetchProjects();
          }
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const getProgressColor = (status?: string): [string, string] => {
    if (status === 'completed') return ['#6BCF7F', '#34C759'];
    if (status === 'cancelled') return ['#FF6B6B', '#FF3B30'];
    if (status === 'on-hold') return ['#FFD93D', '#FFA500'];
    return [theme.primaryColor, theme.secondaryColor];  // active - uses theme
  };

  const getStatusIcon = (status?: string) => {
    if (status === 'completed') return 'check-decagram';
    if (status === 'cancelled') return 'close-circle-outline';
    if (status === 'on-hold') return 'pause-circle-outline';
    return 'progress-clock';  // active
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProject(projectId);
              Alert.alert('Success', 'Project deleted successfully');
              fetchProjects(); // Refresh the list
            } catch {
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const handleEditProject = (projectId: string) => {
    router.push({ pathname: '/AddProject', params: { id: projectId } });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  const activeProjects = projects.filter(p => 
    p.status === 'active' || 
    p.status === 'work started' || 
    p.status === 'on-hold'
  ).length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={theme.colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 8 }]}
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

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primaryColor]}
            tintColor={theme.primaryColor}
          />
        }
      >
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
                <View
                  key={project.id}
                  style={[styles.projectCard, { marginTop: index === 0 ? 0 : 16 }]}
                >
                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: "/ProjectDetails",
                      params: { id: project.id }
                    })}
                    activeOpacity={0.7}
                    style={{ flex: 1 }}
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
                        <View style={styles.headerStatusBadge}>
                          <MaterialCommunityIcons name={statusIcon} size={16} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={styles.headerStatusText}>
                            {project.status?.charAt(0).toUpperCase() + (project.status?.slice(1) || '')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
                    
                    {/* Client Name */}
                    {project.client_name && (
                      <View style={styles.clientRow}>
                        <MaterialCommunityIcons name="account-tie" size={16} color="#666" />
                        <Text style={styles.clientName} numberOfLines={1}>{project.client_name}</Text>
                      </View>
                    )}
                    
                    {/* Total Project Cost */}
                    {project.total_project_cost !== undefined && (
                      <View style={styles.clientRow}>
                        <MaterialCommunityIcons name="currency-usd" size={16} color="#4CAF50" />
                        <Text style={[styles.clientName, { color: '#4CAF50', fontWeight: '600' }]}>
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(project.total_project_cost)}
                        </Text>
                      </View>
                    )}
                    
                    {/* Scope of Work */}
                    {project.scope_of_work && project.scope_of_work.length > 0 && (
                      <View style={styles.scopeSection}>
                        <View style={styles.scopeHeader}>
                          <MaterialCommunityIcons name="file-document-outline" size={14} color="#667eea" />
                          <Text style={styles.scopeLabel}>Scope ({project.scope_of_work.length})</Text>
                        </View>
                        <View style={styles.scopeTags}>
                          {project.scope_of_work.slice(0, 3).map((scope, idx) => (
                            <View key={idx} style={styles.scopeTag}>
                              <Text style={styles.scopeTagText} numberOfLines={1}>{scope}</Text>
                            </View>
                          ))}
                          {project.scope_of_work.length > 3 && (
                            <View style={[styles.scopeTag, styles.scopeTagMore]}>
                              <Text style={[styles.scopeTagText, { color: '#fff' }]}>+{project.scope_of_work.length - 3}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                    
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
                  </View>
                  </TouchableOpacity>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => project.id && router.push(`/IndividualProjectAnalytics?id=${project.id}`)}
                    >
                      <MaterialCommunityIcons name="chart-line" size={18} color="#4CAF50" />
                      <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>Analytics</Text>
                    </TouchableOpacity>
                    <View style={styles.actionDivider} />
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => project.id && handleEditProject(project.id)}
                    >
                      <MaterialCommunityIcons name="pencil" size={18} color="#667eea" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <View style={styles.actionDivider} />
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => project.id && handleDeleteProject(project.id, project.name)}
                    >
                      <MaterialCommunityIcons name="delete" size={18} color="#FF3B30" />
                      <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    marginBottom: 16,
  },
  headerGreeting: {
    fontSize: 28,
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
  headerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
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
  },
  scopeSection: {
    marginBottom: 12,
  },
  scopeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  scopeLabel: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  scopeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scopeTag: {
    backgroundColor: '#F5F7FF',
    borderWidth: 1,
    borderColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '48%',
  },
  scopeTagMore: {
    backgroundColor: '#667eea',
  },
  scopeTagText: {
    fontSize: 10,
    color: '#667eea',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  actionDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
});