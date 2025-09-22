import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useNotes } from '../context/NotesContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useNavigation } from '@react-navigation/native';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const;

export default function HomeOverview() {
  const { colors } = useTheme();
  const { weeklyLog } = useNotes();
  const navigation = useNavigation<NavProp>();

  const renderSection = (label: string, text?: string) => {
    if (!text?.trim()) return null;
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>{label}</Text>
        {text.split('\n').map((line, i) => (
          <Text key={i} style={[styles.line, { color: colors.text }]}>
            • {line}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {DAYS.map((day) => (
          <View key={day} style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.dayHeader, { color: colors.text }]}>{day}</Text>
            {renderSection('DMV', weeklyLog[day].dmv)}
            {renderSection('NYC', weeklyLog[day].nyc)}
            {renderSection('Academy Training', weeklyLog[day].academy)}
            {!weeklyLog[day].dmv && !weeklyLog[day].nyc && !weeklyLog[day].academy ? (
              <Text style={[styles.empty, { color: '#888' }]}>No notes yet.</Text>
            ) : null}
          </View>
        ))}
        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('WeeklyLog')}
        >
          <Text style={styles.editText}>✏️ Edit Notes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  card: { borderRadius: 14, padding: 16, marginBottom: 14, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  dayHeader: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  section: { marginBottom: 8 },
  sectionHeader: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  line: { fontSize: 15, lineHeight: 20 },
  empty: { fontSize: 14, fontStyle: 'italic' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: '#111' },
  editButton: { backgroundColor: '#34C759', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  editText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
