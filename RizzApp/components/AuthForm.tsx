import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AuthForm({ title, subtitle, error, children }: React.PropsWithChildren<{ title: string; subtitle: string; error?: string | null }>) {
  return <SafeAreaView style={styles.page}>
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
            <Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text>
          </LinearGradient>
          <View style={styles.content}>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {children}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function AuthInput({ label, secureTextEntry, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  const [visible, setVisible] = useState(false);
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>
    <View style={styles.inputRow}>
      <TextInput {...props} accessibilityLabel={label} style={styles.input} secureTextEntry={secureTextEntry && !visible} />
      {secureTextEntry ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible(value => !value)} style={styles.toggle}><Text>{visible ? 'Hide' : 'Show'}</Text></TouchableOpacity> : null}
    </View>
  </View>;
}
export function AuthButton({ title, onPress, disabled, loading, secondary, testID }: { title: string; onPress: () => void; disabled?: boolean; loading?: boolean; secondary?: boolean; testID?: string }) {
  return <TouchableOpacity accessibilityRole="button" testID={testID} onPress={onPress} disabled={disabled || loading} style={[styles.button, secondary && styles.secondary, (disabled || loading) && styles.disabled]}>
    {loading ? <ActivityIndicator color={secondary ? '#667eea' : '#fff'} /> : null}
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>
  </TouchableOpacity>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8f9fa' }, scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  header: { padding: 28 }, title: { color: '#fff', fontWeight: '700', fontSize: 27 }, subtitle: { color: '#fff', marginTop: 10, lineHeight: 22 },
  content: { padding: 24, gap: 16 }, error: { color: '#a02020', lineHeight: 22 }, field: { gap: 8 }, label: { color: '#333', fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderColor: '#ccc', borderWidth: 1, borderRadius: 10 },
  input: { minWidth: 0, flex: 1, padding: 14, color: '#222', fontSize: 16 }, toggle: { padding: 14 },
  button: { minHeight: 48, backgroundColor: '#667eea', borderRadius: 10, padding: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  buttonText: { color: '#fff', fontWeight: '600' }, secondary: { backgroundColor: '#f0f2ff' }, secondaryText: { color: '#4658ab' }, disabled: { opacity: 0.6 },
});
