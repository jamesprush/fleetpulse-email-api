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
import { useTheme, DefaultTheme, Theme } from '@react-navigation/native';
import { useNotes } from '../context/NotesContext';
import { showToast } from '../components/ToastMessage';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const;
const DIVISIONS: ('dmv' | 'nyc')[] = ['dmv', 'nyc'];

export default function TrainingScreen() {
  const theme: Theme = useTheme() ?? DefaultTheme;
  const { colors } = theme;
  const { training, addTraining, toggleTraining, removeTraining } = useNotes();

  const [draft, setDraft] = useState<
    Record<string, { driver: string; location: string; trainer: string; van: string }>
  >({});

  const handleAdd = (day: string, division: 'dmv' | 'nyc') => {
    const key = `${day}-${division}`;
    const entry = draft[key];
    
    console.log('Training add attempt:', { day, division, entry });
    
    // Only require driver, location, and trainer - van is optional
    if (!entry?.driver?.trim() || !entry?.location?.trim() || !entry?.trainer?.trim()) {
      console.log('Missing required fields - need driver, location, and trainer');
      showToast('❌ Please fill in Trainee, Location, and Trainer');
      return;
    }

    const trainingData = {
      driver: entry.driver.trim(),
      location: entry.location.trim(),
      trainer: entry.trainer.trim(),
      van: entry.van?.trim() || 'N/A', // Default to N/A if van is empty
      division: division,
    };
    
    console.log('Adding training data:', trainingData);
    
    addTraining(day, trainingData);
    setDraft((prev) => ({ ...prev, [key]: { driver: '', location: '', trainer: '', van: '' } }));
    showToast('✅ Training added');
    Keyboard.dismiss();
  };

  const renderDivision = (day: string, division: 'dmv' | 'nyc') => {
    const items = (training[day] || []).filter(t => t.division === division);
    return (
      <View style={{ marginBottom: 10 }}>
        <Text style={[styles.sectionHeader, { color: colors.primary }]}>{division.toUpperCase()}</Text>
        {items.length === 0 ? (
          <Text style={{ color: '#888', marginBottom: 8 }}>No trainees yet.</Text>
        ) : (
          items.map((t, idx) => (
            <View key={idx} style={styles.row}>
              <TouchableOpacity onPress={() => toggleTraining(day, idx)}>
                <Text style={[styles.bubble, { color: t.done ? colors.primary : colors.border }]}>
                  {t.done ? '✅' : '◯'}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.itemText, { color: colors.text, opacity: t.done ? 0.65 : 1 }]}>
                {t.driver} — {t.location.toUpperCase()} | Van {t.van} (Trainer: {t.trainer})
              </Text>
              <TouchableOpacity onPress={() => removeTraining(day, idx)}>
                <Text style={[styles.remove, { color: '#ff5c5c' }]}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Input Rows - mobile friendly box layout */}
        <View style={styles.inputGrid}>
          <View style={styles.leftColumn}>
            <TextInput
              value={draft[`${day}-${division}`]?.driver || ''}
              onChangeText={(t) =>
                setDraft(prev => ({
                  ...prev,
                  [`${day}-${division}`]: {
                    ...prev[`${day}-${division}`],
                    driver: t,
                    location: prev[`${day}-${division}`]?.location || '',
                    trainer: prev[`${day}-${division}`]?.trainer || '',
                    van: prev[`${day}-${division}`]?.van || '',
                  },
                }))
              }
              placeholder="Trainee"
              placeholderTextColor="#888"
              style={[styles.inputCompact, { borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              value={draft[`${day}-${division}`]?.trainer || ''}
              onChangeText={(t) =>
                setDraft(prev => ({
                  ...prev,
                  [`${day}-${division}`]: {
                    ...prev[`${day}-${division}`],
                    trainer: t,
                    location: prev[`${day}-${division}`]?.location || '',
                    driver: prev[`${day}-${division}`]?.driver || '',
                    van: prev[`${day}-${division}`]?.van || '',
                  },
                }))
              }
              placeholder="Trainer"
              placeholderTextColor="#888"
              style={[styles.inputCompact, { borderColor: colors.border, color: colors.text }]}
            />
          </View>
          <View style={styles.rightColumn}>
            <TextInput
              value={draft[`${day}-${division}`]?.location || ''}
              onChangeText={(t) =>
                setDraft(prev => ({
                  ...prev,
                  [`${day}-${division}`]: {
                    ...prev[`${day}-${division}`],
                    location: t,
                    driver: prev[`${day}-${division}`]?.driver || '',
                    trainer: prev[`${day}-${division}`]?.trainer || '',
                    van: prev[`${day}-${division}`]?.van || '',
                  },
                }))
              }
              placeholder="Location"
              autoCapitalize="none"
              placeholderTextColor="#888"
              style={[styles.inputCompact, { borderColor: colors.border, color: colors.text }]}
            />
            <View style={styles.vanRow}>
              <TextInput
                value={draft[`${day}-${division}`]?.van || ''}
                onChangeText={(t) =>
                  setDraft(prev => ({
                    ...prev,
                    [`${day}-${division}`]: {
                      ...prev[`${day}-${division}`],
                      van: t,
                      location: prev[`${day}-${division}`]?.location || '',
                      driver: prev[`${day}-${division}`]?.driver || '',
                      trainer: prev[`${day}-${division}`]?.trainer || '',
                    },
                  }))
                }
                placeholder="Van # (optional)"
                placeholderTextColor="#888"
                style={[styles.inputVan, { borderColor: colors.border, color: colors.text }]}
              />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => handleAdd(day, division)}>
                <Text style={styles.addBtnText}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {DAYS.map((day) => (
        <View key={day} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.dayHeader, { color: colors.text }]}>{day}</Text>
          {DIVISIONS.map((div) => (
            <React.Fragment key={`${day}-${div}`}>{renderDivision(day, div)}</React.Fragment>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 80 },
  card: { borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1 },
  dayHeader: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  sectionHeader: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  bubble: { fontSize: 18, width: 24, textAlign: 'center', marginRight: 8 },
  itemText: { fontSize: 15, flex: 1 },
  remove: { marginLeft: 8, fontSize: 16 },
  addRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  inputGrid: { flexDirection: 'row', marginTop: 6 },
  leftColumn: { flex: 1, marginRight: 6 },
  rightColumn: { flex: 1 },
  inputCompact: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, height: 36, marginBottom: 6 },
  inputVan: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, height: 36, flex: 1, marginRight: 6 },
  vanRow: { flexDirection: 'row', alignItems: 'center' },
  inputFull: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, marginRight: 6, height: 40 },
  addBtn: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 20, fontWeight: '800' },
});
