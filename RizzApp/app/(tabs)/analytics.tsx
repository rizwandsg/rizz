import { Dimensions, StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-chart-kit";


const screenWidth = Dimensions.get("window").width;

const data = [
  { name: "Project A", population: 50000, color: "#007AFF", legendFontColor: "#333", legendFontSize: 14 },
  { name: "Project B", population: 32000, color: "#34C759", legendFontColor: "#333", legendFontSize: 14 },
];

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      <PieChart
        data={data}
        width={screenWidth - 32}
        height={220}
        accessor={"population"}
        backgroundColor={"transparent"}
        paddingLeft={"16"}
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
});
