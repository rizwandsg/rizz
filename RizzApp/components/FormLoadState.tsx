import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export function FormLoadState({ error, onRetry, onBack }: { error: string | null; onRetry: () => void; onBack: () => void }) {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 }}>
    {error ? <>
      <Text accessibilityRole="alert">{error}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={onRetry}><Text>Retry</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={onBack}><Text>Go back</Text></TouchableOpacity>
    </> : <><ActivityIndicator /><Text>Loading form...</Text></>}
  </View>;
}
