import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { ensureDBInitialized, getDatabase } from "../../database/db";
import { Project, SQLResult } from "../../database/types";

const screenWidth = Dimensions.get("window").width;

export default function Analytics() {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await ensureDBInitialized();
        const db = getDatabase();
        const result = await db.execAsync("SELECT * FROM projects;") as SQLResult;
        
        if (result && result.length > 0) {
          const projects = result[0] as Project[];
          const data = projects.map(p => ({
            name: p.name,
            population: p.budget,
            color: "#" + Math.floor(Math.random()*16777215).toString(16),
            legendFontColor: "#333",
            legendFontSize: 14
          }));
          setChartData(data);
        }
      } catch (error) {
        console.error("Error loading projects:", error);
      }
    };
    
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Analytics</Text>
      {chartData.length > 0 ? (
        <PieChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="16"
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
        />
      ) : (
        <Text>No project data yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
});
