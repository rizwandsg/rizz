import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/** A failed request must never look like an empty account or a zero balance. */
export function LoadFailure({ message, retry }: { message: string; retry: () => void }) {
  return <View style={styles.container} testID="load-failure">
    <Text accessibilityRole="alert" style={styles.message}>{message}</Text>
    <TouchableOpacity accessibilityRole="button" onPress={retry} style={styles.button}>
      <Text style={styles.label}>Retry</Text>
    </TouchableOpacity>
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f5f5f5' },
  message: { color: '#333', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  button: { backgroundColor: '#667eea', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  label: { color: '#fff', fontWeight: '600' },
});
