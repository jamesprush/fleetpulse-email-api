// WeeklyLogScreen.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotes } from '../context/NotesContext';
import { showToast } from '../components/ToastMessage';
import { getCurrentWeek } from '../utils/dateUtils';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const;

export default function WeeklyLogScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { weeklyLog, setWeeklyLog } = useNotes();
  const { weekString } = getCurrentWeek();

  const initial = useMemo(() => ({ ...weeklyLog }), [weeklyLog]);
  const [localLog, setLocalLog] = useState(initial);
  const [toast, setToast] = useState<string | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const setVal = (day: string, field: 'dmv' | 'nyc', val: string) =>
    setLocalLog(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof prev], [field]: val } }));

  const handleSave = () => {
    setIsSaving(true);
    setWeeklyLog(localLog);
    showToast('✅ Notes saved');
    Keyboard.dismiss();
    setTimeout(() => {
      navigation.navigate('Home', { screen: 'Overview' }); // jump back to preview
    }, 1000);
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.header, { color: colors.text }]}>
          Edit Fleet Notes — {weekString}
        </Text>

        {DAYS.map(day => (
          <View
            key={day}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.dayHeader, { color: colors.text }]}>{day}</Text>

            <Text style={[styles.label, { color: colors.text }]}>DMV:</Text>
            <TextInput
              multiline
              placeholder="Add DMV notes..."
              placeholderTextColor="#888"
              value={localLog[day]?.dmv || ''}
              onChangeText={(t) => setVal(day, 'dmv', t)}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />

            <Text style={[styles.label, { color: colors.text }]}>NYC:</Text>
            <TextInput
              multiline
              placeholder="Add NYC notes..."
              placeholderTextColor="#888"
              value={localLog[day]?.nyc || ''}
              onChangeText={(t) => setVal(day, 'nyc', t)}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
          </View>
        ))}
      </ScrollView>

      {!isKeyboardVisible && (
        <TouchableOpacity 
          style={[styles.saveBtn, isSaving && styles.savingBtn]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveText}>
            {isSaving ? '⏳ Saving...' : '💾 Save Notes'}
          </Text>
        </TouchableOpacity>
      )}

      {isKeyboardVisible && (
        <View style={styles.keyboardSaveContainer}>
          <TouchableOpacity 
            style={[
              styles.keyboardSaveBtn, 
              { backgroundColor: colors.primary },
              isSaving && styles.savingBtn
            ]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.keyboardSaveText}>
              {isSaving ? '⏳ Saving...' : '💾 Save Notes'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 120 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  dayHeader: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '800', marginTop: 6, marginBottom: 6 },
  input: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
  },
  saveBtn: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    backgroundColor: '#FF9500',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#FF9500',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  keyboardSaveContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  keyboardSaveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  keyboardSaveText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  savingBtn: {
    opacity: 0.7,
  },
});
