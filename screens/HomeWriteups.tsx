import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useNotes } from '../context/NotesContext';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const;

export default function HomeWriteups() {
  const { colors } = useTheme();
  const { writeups, addWriteup, toggleWriteup, removeWriteup } = useNotes();
  const [draft, setDraft] = useState<Record<string, { driver: string; reason: string }>>({});

  const handleAdd = (day: string, division: 'dmv' | 'nyc') => {
    const key = `${day}-${division}`;
    const entry = draft[key];
    if (!entry || !entry.driver.trim() || !entry.reason.trim()) return;

    addWriteup(day, division, `${entry.driver} — ${entry.reason}`);
    setDraft((prev) => ({ ...prev, [key]: { driver: '', reason: '' } }));
    Keyboard.dismiss(); // ✅ single tap adds + closes keyboard
  };

  const renderDivision = (day: string, division: 'dmv' | 'nyc', label: string) => {
    const items = writeups[day]?.[division] ?? [];

    return (
      <View style={styles.division}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>{label}</Text>
        {items.length === 0 ? (
          <Text style={[styles.empty, { color: '#888' }]}>No items yet.</Text>
        ) : (
          items.map((item, idx) => (
            <View key={idx} style={styles.row}>
              <TouchableOpacity onPress={() => toggleWriteup(day, division, idx)}>
                <Text style={[styles.bubble, { color: item.done ? '#0A84FF' : colors.border }]}>
                  {item.done ? '✅' : '◯'}
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.itemText,
                  {
                    color: colors.text,
                    textDecorationLine: item.done ? 'line-through' : 'none',
                    opacity: item.done ? 0.6 : 1,
                  },
                ]}
              >
                {item.text}
              </Text>
              <TouchableOpacity onPress={() => removeWriteup(day, division, idx)}>
                <Text style={[styles.remove, { color: '#ff5c5c' }]}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Input row */}
        <View style={styles.addRow}>
          <TextInput
            value={draft[`${day}-${division}`]?.driver || ''}
            onChangeText={(t) =>
              setDraft((prev) => ({
                ...prev,
                [`${day}-${division}`]: {
                  ...prev[`${day}-${division}`],
                  driver: t,
                  reason: prev[`${day}-${division}`]?.reason || '',
                },
              }))
            }
            placeholder="Driver"
            placeholderTextColor="#888"
            style={[styles.inputHalf, { borderColor: colors.border, color: colors.text }]}
          />
          <TextInput
            value={draft[`${day}-${division}`]?.reason || ''}
            onChangeText={(t) =>
              setDraft((prev) => ({
                ...prev,
                [`${day}-${division}`]: {
                  ...prev[`${day}-${division}`],
                  reason: t,
                  driver: prev[`${day}-${division}`]?.driver || '',
                },
              }))
            }
            placeholder="Reason"
            placeholderTextColor="#888"
            style={[styles.inputHalf, { borderColor: colors.border, color: colors.text }]}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: '#0A84FF' }]}
            onPress={() => handleAdd(day, division)}
          >
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {DAYS.map((day) => (
        <View
          key={day}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.dayHeader, { color: colors.text }]}>{day}</Text>
          {renderDivision(day, 'dmv', 'DMV')}
          {renderDivision(day, 'nyc', 'NYC')}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  card: { borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1 },
  dayHeader: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  division: { marginBottom: 10 },
  sectionHeader: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  bubble: { fontSize: 18, width: 24, textAlign: 'center', marginRight: 8 },
  itemText: { fontSize: 15, flex: 1 },
  remove: { marginLeft: 8, fontSize: 16 },
  addRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  inputHalf: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, marginRight: 6, height: 40 },
  addBtn: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  empty: { fontSize: 14, fontStyle: 'italic' },
});
