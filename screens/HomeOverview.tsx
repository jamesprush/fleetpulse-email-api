import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import { useNotes } from '../context/NotesContext';
import { useHeaderHeight } from '@react-navigation/elements';
import { getCurrentWeek } from '../utils/dateUtils';

const getDayDate = (dayName: string) => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday);
  
  const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(dayName);
  const targetDate = new Date(monday);
  targetDate.setDate(monday.getDate() + dayIndex);
  
  return `${targetDate.getMonth() + 1}/${targetDate.getDate()}`;
};

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const;

export default function HomeOverview() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { weeklyLog, writeups, training, setWeeklyLog, setWriteups, setTraining } = useNotes();
  const headerHeight = useHeaderHeight();
  const { weekString } = getCurrentWeek();

  const formatNotesForEmail = () => {
    let emailContent = `FleetPulse Weekly Notes - ${weekString}\n\n`;
    
    DAYS.forEach(day => {
      const dmvWriteups = writeups[day]?.dmv ?? [];
      const nycWriteups = writeups[day]?.nyc ?? [];
      const allTraining = training[day] ?? [];
      const dmvTraining = allTraining.filter(t => t.division === 'dmv');
      const nycTraining = allTraining.filter(t => t.division === 'nyc');
      
      const hasContent = weeklyLog[day]?.dmv?.trim() || weeklyLog[day]?.nyc?.trim() || 
                        dmvWriteups.length > 0 || nycWriteups.length > 0 || 
                        dmvTraining.length > 0 || nycTraining.length > 0;
      
      if (hasContent) {
        emailContent += `${day} - ${getDayDate(day)}\n`;
        emailContent += '='.repeat(30) + '\n\n';
        
        // DMV Section
        if (weeklyLog[day]?.dmv?.trim() || dmvWriteups.length > 0 || dmvTraining.length > 0) {
          emailContent += 'DMV:\n';
          emailContent += '-'.repeat(10) + '\n';
          
          if (weeklyLog[day]?.dmv?.trim()) {
            emailContent += 'Notes:\n';
            weeklyLog[day].dmv.split('\n').forEach(line => {
              if (line.trim()) emailContent += `• ${line.trim()}\n`;
            });
            emailContent += '\n';
          }
          
          if (dmvWriteups.length > 0) {
            emailContent += 'Write-ups:\n';
            dmvWriteups.forEach(item => {
              emailContent += `• ${item.done ? '✅' : '◯'} ${item.text}\n`;
            });
            emailContent += '\n';
          }
          
          if (dmvTraining.length > 0) {
            emailContent += 'Training:\n';
            dmvTraining.forEach(t => {
              emailContent += `• ${t.done ? '✅' : '◯'} ${t.driver} (${t.location.toUpperCase()}) ${t.trainer} ${t.van}\n`;
            });
            emailContent += '\n';
          }
        }
        
        // NYC Section
        if (weeklyLog[day]?.nyc?.trim() || nycWriteups.length > 0 || nycTraining.length > 0) {
          emailContent += 'NYC:\n';
          emailContent += '-'.repeat(10) + '\n';
          
          if (weeklyLog[day]?.nyc?.trim()) {
            emailContent += 'Notes:\n';
            weeklyLog[day].nyc.split('\n').forEach(line => {
              if (line.trim()) emailContent += `• ${line.trim()}\n`;
            });
            emailContent += '\n';
          }
          
          if (nycWriteups.length > 0) {
            emailContent += 'Write-ups:\n';
            nycWriteups.forEach(item => {
              emailContent += `• ${item.done ? '✅' : '◯'} ${item.text}\n`;
            });
            emailContent += '\n';
          }
          
          if (nycTraining.length > 0) {
            emailContent += 'Training:\n';
            nycTraining.forEach(t => {
              emailContent += `• ${t.done ? '✅' : '◯'} ${t.driver} (${t.location.toUpperCase()}) ${t.trainer} ${t.van}\n`;
            });
            emailContent += '\n';
          }
        }
        
        emailContent += '\n';
      }
    });
    
    return emailContent;
  };

  const handleWeekReset = () => {
    Alert.alert(
      'Reset Week',
      'This will clear all notes, write-ups, and training data for a fresh start. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Week', 
          style: 'destructive',
          onPress: () => {
            // Reset all data
            setWeeklyLog({
              Monday: { dmv: '', nyc: '', academy: '' },
              Tuesday: { dmv: '', nyc: '', academy: '' },
              Wednesday: { dmv: '', nyc: '', academy: '' },
              Thursday: { dmv: '', nyc: '', academy: '' },
              Friday: { dmv: '', nyc: '', academy: '' },
              Saturday: { dmv: '', nyc: '', academy: '' },
              Sunday: { dmv: '', nyc: '', academy: '' },
            });
            
            setWriteups({
              Monday: { dmv: [], nyc: [] },
              Tuesday: { dmv: [], nyc: [] },
              Wednesday: { dmv: [], nyc: [] },
              Thursday: { dmv: [], nyc: [] },
              Friday: { dmv: [], nyc: [] },
              Saturday: { dmv: [], nyc: [] },
              Sunday: { dmv: [], nyc: [] },
            });
            
            setTraining({
              Monday: [],
              Tuesday: [],
              Wednesday: [],
              Thursday: [],
              Friday: [],
              Saturday: [],
              Sunday: [],
            });
            
            Alert.alert('Success', 'Week reset! All data cleared.');
          }
        }
      ]
    );
  };

  const renderDivision = (label: string, notes: string, writeupItems: any[], trainingItems: any[]) => {
    const hasNotes = notes?.trim();
    const hasWriteups = writeupItems.length > 0;
    const hasTraining = trainingItems.length > 0;
    
    // Only render if there's actual content
    if (!hasNotes && !hasWriteups && !hasTraining) {
      return null;
    }

    return (
      <View style={[styles.divisionBlock, { borderColor: colors.border }]}>
        <Text style={[styles.divisionHeader, { color: colors.text }]}>{label}</Text>
        
        {hasNotes && (
          <View style={styles.notesSection}>
            {notes.split('\n').map((line, i) => {
              // Handle empty lines for spacing
              if (line.trim() === '') {
                return <View key={i} style={styles.emptyLine} />;
              }
              return (
                <View key={i} style={styles.noteRow}>
                  <View style={[styles.noteIndicator, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.noteText, { color: colors.text }]}>{line}</Text>
                </View>
              );
            })}
          </View>
        )}
        
        {hasWriteups && (
          <View style={styles.writeupsSection}>
            <Text style={[styles.subHeader, { color: colors.primary }]}>📝 Write-ups</Text>
            {writeupItems.map((item, i) => (
              <Text key={i} style={[styles.itemText, { color: colors.text }]}>
                {item.done ? '✅' : '◯'} {item.text}
              </Text>
            ))}
          </View>
        )}
        
        {hasTraining && (
          <View style={styles.trainingSection}>
            <Text style={[styles.subHeader, { color: colors.primary }]}>🚛 Training</Text>
            {trainingItems.map((t, i) => (
              <Text key={i} style={[styles.itemText, { color: colors.text }]}>
                {t.done ? '✅' : '◯'} {t.driver} ({t.location.toUpperCase()}) {t.trainer} {t.van}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.headerBanner, { backgroundColor: colors.background }]}>
          <View style={[styles.headerContent, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerText, { color: colors.text }]}>Fleet Notes</Text>
              <Text style={[styles.separator, { color: colors.primary }]}>—</Text>
              <Text style={[styles.subheaderText, { color: colors.primary }]}>{weekString}</Text>
            </View>
          </View>
        </View>
        {DAYS.map(day => {
          const dmvWriteups = writeups[day]?.dmv ?? [];
          const nycWriteups = writeups[day]?.nyc ?? [];
          const allTraining = training[day] ?? [];
          const dmvTraining = allTraining.filter(t => t.division === 'dmv');
          const nycTraining = allTraining.filter(t => t.division === 'nyc');
          return (
            <View key={day} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.dayHeaderContainer, { borderBottomColor: colors.primary }]}>
                <Text style={[styles.dayHeader, { color: colors.text }]}>{day} - {getDayDate(day)}</Text>
              </View>
              {renderDivision('DMV', weeklyLog[day]?.dmv ?? '', dmvWriteups, dmvTraining)}
              {renderDivision('NYC', weeklyLog[day]?.nyc ?? '', nycWriteups, nycTraining)}
            </View>
          );
        })}
      </ScrollView>
      <TouchableOpacity style={[styles.floatingEditBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('WeeklyLog')}>
        <Text style={styles.floatingEditIcon}>✏️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, paddingHorizontal: 16, paddingTop: 16 },
  headerBanner: { 
    marginBottom: 16,
    marginTop: 8,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: 12,
  },
  resetIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  resetBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
      headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255, 149, 0, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 149, 0, 0.3)',
        minHeight: 36,
      },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#FF9500',
    fontFamily: 'Inter_700Bold',
  },
  separator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
    marginHorizontal: 8,
    opacity: 0.7,
    fontFamily: 'Inter_600SemiBold',
  },
  subheaderText: { 
    fontSize: 13, 
    fontWeight: '600',
    color: '#FF9500',
    opacity: 0.8,
    fontFamily: 'Inter_600SemiBold',
  },
  card: { borderRadius: 16, padding: 0, marginBottom: 16, borderWidth: 1, overflow: 'hidden' },
  dayHeaderContainer: { padding: 16, borderBottomWidth: 2, backgroundColor: 'rgba(255, 149, 0, 0.1)' },
  dayHeader: { fontSize: 18, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  divisionBlock: { marginBottom: 8, padding: 16, borderRadius: 12, borderWidth: 1, margin: 16 },
  divisionHeader: { fontSize: 15, fontWeight: '800', marginBottom: 10, fontFamily: 'Inter_700Bold' },
  notesSection: { marginBottom: 16 },
  writeupsSection: { marginBottom: 16 },
  trainingSection: { marginBottom: 0 },
  subHeader: { fontSize: 13, fontWeight: '800', marginBottom: 8, marginTop: 4, fontFamily: 'Inter_700Bold' },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  noteIndicator: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    marginRight: 10, 
    marginTop: 6,
    opacity: 0.8
  },
  noteText: { fontSize: 13, lineHeight: 18, flex: 1, fontFamily: 'Inter_500Medium' },
  emptyLine: { height: 8, marginBottom: 4 },
  itemText: { fontSize: 13, marginBottom: 6, lineHeight: 18, fontFamily: 'Inter_500Medium' },
  floatingEditBtn: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingEditIcon: {
    fontSize: 24,
    color: '#fff',
  },
});
