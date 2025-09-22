import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Note } from "../types/Note";

const sampleNotes: Note[] = [
  {
    id: "1",
    date: "2025-09-20",
    division: "DMV",
    driver: "Ty Robinson",
    status: "c/o (MERCOM)",
    vehicle: "z203",
    createdBy: "System",
    createdAt: Date.now(),
  },
  {
    id: "2",
    date: "2025-09-20",
    division: "NYC",
    driver: "Christian J.",
    status: "(Fleet)",
    vehicle: "z420",
    createdBy: "System",
    createdAt: Date.now(),
  },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fleet Ops Log</Text>
      <FlatList
        data={sampleNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.division}>{item.division}</Text>
            <Text>{item.driver} – {item.status}</Text>
            {item.vehicle ? <Text>Vehicle: {item.vehicle}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111", padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 12 },
  card: { backgroundColor: "#222", padding: 12, marginBottom: 8, borderRadius: 8 },
  division: { fontSize: 16, fontWeight: "600", color: "#4da6ff" },
});
