import { FlatList, StyleSheet, Text, View } from "react-native";

const projects = [
  { id: "1", name: "Project A", status: "Completed", budget: 50000 },
  { id: "2", name: "Project B", status: "Ongoing", budget: 32000 },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Project Reports</Text>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Budget: ₹{item.budget}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  card: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  name: { fontSize: 18, fontWeight: "600" },
});
