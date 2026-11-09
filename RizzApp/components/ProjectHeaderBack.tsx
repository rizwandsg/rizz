import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

export function ProjectHeaderBack() {
  const router = useRouter();
  return <Pressable accessibilityRole="button" accessibilityLabel="Back to projects" hitSlop={10}
    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} style={styles.back}>
    <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
  </Pressable>;
}
const styles = StyleSheet.create({ back: { width:44, height:44, alignItems:'center', justifyContent:'center' } });
