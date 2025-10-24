import { SignedIn, SignedOut } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SignOutButton } from '../components/SignOutButton';

/**
 * Example component showing how to use Clerk's conditional rendering
 * 
 * <SignedIn> - Only visible when user is logged in
 * <SignedOut> - Only visible when user is logged out
 */
export default function ClerkConditionalExample() {
  return (
    <View style={styles.container}>
      
      {/* Content for SIGNED IN users only */}
      <SignedIn>
        <View style={styles.section}>
          <Text style={styles.title}>✅ You are signed in!</Text>
          <Text style={styles.subtitle}>This content is only visible to authenticated users.</Text>
          
          <View style={styles.content}>
            <Text style={styles.text}>Welcome! You have access to:</Text>
            <Text style={styles.listItem}>• Protected routes</Text>
            <Text style={styles.listItem}>• User dashboard</Text>
            <Text style={styles.listItem}>• All app features</Text>
          </View>

          <SignOutButton />
        </View>
      </SignedIn>

      {/* Content for SIGNED OUT users only */}
      <SignedOut>
        <View style={styles.section}>
          <Text style={styles.title}>🔒 You are signed out</Text>
          <Text style={styles.subtitle}>This content is only visible to guests.</Text>
          
          <View style={styles.content}>
            <Text style={styles.text}>Please sign in to access:</Text>
            <Text style={styles.listItem}>• Your projects</Text>
            <Text style={styles.listItem}>• Expense tracking</Text>
            <Text style={styles.listItem}>• Analytics</Text>
          </View>

          <Link href="/(auth)/clerk-signin" style={styles.link}>
            <Text style={styles.linkText}>Go to Sign In →</Text>
          </Link>
        </View>
      </SignedOut>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  content: {
    marginBottom: 24,
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    fontWeight: '600',
  },
  listItem: {
    fontSize: 15,
    color: '#666',
    marginBottom: 6,
    paddingLeft: 8,
  },
  link: {
    backgroundColor: '#667eea',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
