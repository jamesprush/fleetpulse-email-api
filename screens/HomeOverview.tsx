import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Animated,
  SafeAreaView,
  Dimensions,
  Pressable
} from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '../context/NotesContext';
import { useHeaderHeight } from '@react-navigation/elements';
import { getCurrentWeek } from '../utils/dateUtils';

const { width: screenWidth } = Dimensions.get('window');

const getDayDate = (dayName: string) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
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

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Calculate comprehensive statistics
  const getDashboardStats = () => {
    let totalNotes = 0;
    let totalWriteups = 0;
    let totalTraining = 0;
    let completedWriteups = 0;
    let completedTraining = 0;
    
    DAYS.forEach(day => {
      // Count notes
      const dmvNotes = weeklyLog[day]?.dmv?.trim() ? 1 : 0;
      const nycNotes = weeklyLog[day]?.nyc?.trim() ? 1 : 0;
      totalNotes += dmvNotes + nycNotes;
      
      // Count writeups
      const dmvWriteups = writeups[day]?.dmv ?? [];
      const nycWriteups = writeups[day]?.nyc ?? [];
      totalWriteups += dmvWriteups.length + nycWriteups.length;
      completedWriteups += dmvWriteups.filter(item => item.done).length + nycWriteups.filter(item => item.done).length;
      
      // Count training
      const allTraining = training[day] ?? [];
      totalTraining += allTraining.length;
      completedTraining += allTraining.filter(item => item.done).length;
    });
    
    return {
      totalNotes,
      totalWriteups,
      totalTraining,
      completedWriteups,
      completedTraining,
      writeupProgress: totalWriteups > 0 ? (completedWriteups / totalWriteups) * 100 : 0,
      trainingProgress: totalTraining > 0 ? (completedTraining / totalTraining) * 100 : 0,
      overallProgress: (totalWriteups + totalTraining) > 0 ? 
        ((completedWriteups + completedTraining) / (totalWriteups + totalTraining)) * 100 : 0
    };
  };

  const stats = getDashboardStats();

  const formatNotesForEmail = () => {
    let emailContent = `FleetPulse Weekly Notes - ${weekString}\n\n`;
    
    // Add summary statistics
    emailContent += `WEEKLY SUMMARY:\n`;
    emailContent += `Total Notes: ${stats.totalNotes}\n`;
    emailContent += `Write-ups: ${stats.completedWriteups}/${stats.totalWriteups} (${Math.round(stats.writeupProgress)}% complete)\n`;
    emailContent += `Training: ${stats.completedTraining}/${stats.totalTraining} (${Math.round(stats.trainingProgress)}% complete)\n`;
    emailContent += `Overall Progress: ${Math.round(stats.overallProgress)}%\n\n`;
    emailContent += '='.repeat(50) + '\n\n';
    
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
          
          if (weeklyLog[day]?.dmv?.trim()) {
            emailContent += 'Notes:\n';
            emailContent += weeklyLog[day].dmv + '\n\n';
          }
          
          if (dmvWriteups.length > 0) {
            emailContent += 'Write-ups:\n';
            dmvWriteups.forEach(w => {
              emailContent += `• ${w.done ? '✅' : '◯'} ${w.text}\n`;
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
          
          if (weeklyLog[day]?.nyc?.trim()) {
            emailContent += 'Notes:\n';
            emailContent += weeklyLog[day].nyc + '\n\n';
          }
          
          if (nycWriteups.length > 0) {
            emailContent += 'Write-ups:\n';
            nycWriteups.forEach(w => {
              emailContent += `• ${w.done ? '✅' : '◯'} ${w.text}\n`;
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

  const sendWeeklyReport = () => {
    const emailContent = formatNotesForEmail();
    
    Alert.alert(
      'Send Weekly Report',
      'This will send the complete weekly report to prush@mail.com',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Report', 
          onPress: () => {
            // In a real app, you'd use a service like EmailJS or a backend API
            Alert.alert('Report Sent!', 'Weekly report has been sent to prush@mail.com');
          }
        }
      ]
    );
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

  const renderStatCard = (title: string, value: string, subtitle: string, color: string, icon: string, progress?: number) => (
    <Animated.View
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.statCardHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <Text style={[styles.statTitle, { color: colors.text + '70' }]}>{title}</Text>
      </View>
      
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statSubtitle, { color: colors.text + '50' }]}>{subtitle}</Text>
      
      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: color,
                  width: `${progress}%`
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: color }]}>{Math.round(progress)}%</Text>
        </View>
      )}
    </Animated.View>
  );

  const renderDivision = (label: string, notes: string, writeupItems: any[], trainingItems: any[]) => {
    const hasNotes = notes?.trim();
    const hasWriteups = writeupItems.length > 0;
    const hasTraining = trainingItems.length > 0;
    
    if (!hasNotes && !hasWriteups && !hasTraining) {
      return null;
    }

    const divisionColor = label === 'DMV' ? '#FF6B6B' : '#4ECDC4';

    return (
      <View style={[styles.divisionBlock, { borderLeftColor: divisionColor, backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.divisionHeader}>
          <View style={[styles.divisionIcon, { backgroundColor: divisionColor }]}>
            <Ionicons name={label === 'DMV' ? 'car-sport' : 'business'} size={16} color="#fff" />
          </View>
          <Text style={[styles.divisionTitle, { color: colors.text }]}>{label}</Text>
        </View>
        
        {hasNotes && (
          <View style={styles.notesSection}>
            <Text style={[styles.sectionLabel, { color: divisionColor }]}>📝 Notes</Text>
            {notes.split('\n').map((line, i) => {
              if (line.trim() === '') {
                return <View key={i} style={styles.emptyLine} />;
              }
              return (
                <View key={i} style={styles.noteRow}>
                  <View style={[styles.noteIndicator, { backgroundColor: divisionColor }]} />
                  <Text style={[styles.noteText, { color: colors.text }]}>{line}</Text>
                </View>
              );
            })}
          </View>
        )}
        
        {hasWriteups && (
          <View style={styles.writeupsSection}>
            <Text style={[styles.sectionLabel, { color: divisionColor }]}>📋 Write-ups ({writeupItems.length})</Text>
            {writeupItems.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Ionicons 
                  name={item.done ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={item.done ? '#00FF88' : colors.text + '50'} 
                />
                <Text style={[
                  styles.itemText, 
                  { 
                    color: colors.text,
                    textDecorationLine: item.done ? 'line-through' : 'none',
                    opacity: item.done ? 0.6 : 1
                  }
                ]}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {hasTraining && (
          <View style={styles.trainingSection}>
            <Text style={[styles.sectionLabel, { color: divisionColor }]}>🎓 Training ({trainingItems.length})</Text>
            {trainingItems.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Ionicons 
                  name={item.done ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={item.done ? '#00FF88' : colors.text + '50'} 
                />
                <Text style={[
                  styles.itemText, 
                  { 
                    color: colors.text,
                    textDecorationLine: item.done ? 'line-through' : 'none',
                    opacity: item.done ? 0.6 : 1
                  }
                ]}>
                  {item.driver} ({item.location.toUpperCase()}) {item.trainer} {item.van}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Header */}
      <Animated.View 
        style={[
          styles.header,
          { backgroundColor: colors.card },
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Overview</Text>
            <Text style={[styles.headerSubtitle, { color: colors.text + '70' }]}>{weekString}</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable 
              style={[styles.emailBtn, { backgroundColor: '#FF9500' }]}
              onPress={sendWeeklyReport}
            >
              <Ionicons name="mail" size={16} color="#fff" />
            </Pressable>
            <View style={[styles.statusBadge, { backgroundColor: stats.overallProgress === 100 ? '#00FF88' : '#FF9500' }]}>
              <Text style={styles.statusText}>
                {stats.overallProgress === 100 ? 'COMPLETE' : 'IN PROGRESS'}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* Daily Breakdown */}
        <View style={styles.dailySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Breakdown</Text>
          
          {DAYS.map((day, index) => {
            const dmvWriteups = writeups[day]?.dmv ?? [];
            const nycWriteups = writeups[day]?.nyc ?? [];
            const allTraining = training[day] ?? [];
            const dmvTraining = allTraining.filter(t => t.division === 'dmv');
            const nycTraining = allTraining.filter(t => t.division === 'nyc');
            
            const dayStats = {
              dmv: dmvWriteups.length + dmvTraining.length,
              nyc: nycWriteups.length + nycTraining.length,
              total: dmvWriteups.length + nycWriteups.length + allTraining.length,
              completed: dmvWriteups.filter(item => item.done).length + 
                        nycWriteups.filter(item => item.done).length + 
                        allTraining.filter(item => item.done).length
            };
            
            const dayCompletionRate = dayStats.total > 0 ? (dayStats.completed / dayStats.total) * 100 : 0;
            
            return (
              <Animated.View
                key={day}
                style={[
                  styles.dayCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  {
                    opacity: fadeAnim,
                    transform: [{ 
                      translateY: slideAnim
                    }]
                  }
                ]}
              >
                <Pressable style={styles.dayHeader}>
                  <View style={styles.dayHeaderLeft}>
                    <View style={[styles.dayIcon, { backgroundColor: dayCompletionRate === 100 ? '#00FF88' : '#FF9500' }]}>
                      <Ionicons name="calendar" size={18} color="#fff" />
                    </View>
                    <View style={styles.dayHeaderText}>
                      <Text style={[styles.dayTitle, { color: colors.text }]}>{day}</Text>
                      <Text style={[styles.dayDate, { color: colors.text + '70' }]}>{getDayDate(day)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.dayHeaderRight}>
                    <View style={[styles.dayProgressBadge, { backgroundColor: dayCompletionRate === 100 ? '#00FF88' + '20' : '#FF9500' + '20' }]}>
                      <Text style={[styles.dayProgressText, { color: dayCompletionRate === 100 ? '#00FF88' : '#FF9500' }]}>
                        {Math.round(dayCompletionRate)}%
                      </Text>
                    </View>
                    <Text style={[styles.dayStats, { color: colors.text + '70' }]}>
                      {dayStats.completed}/{dayStats.total}
                    </Text>
                  </View>
                </Pressable>
                
                <View style={styles.dayContent}>
                  {renderDivision('DMV', weeklyLog[day]?.dmv ?? '', dmvWriteups, dmvTraining)}
                  {renderDivision('NYC', weeklyLog[day]?.nyc ?? '', nycWriteups, nycTraining)}
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <Pressable 
          style={[styles.fab, { backgroundColor: '#FF9500' }]}
          onPress={() => navigation.navigate('WeeklyLog')}
        >
          <Ionicons name="create" size={24} color="#fff" />
        </Pressable>
        
        <Pressable 
          style={[styles.fab, styles.fabSecondary, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleWeekReset}
        >
          <Ionicons name="refresh" size={20} color="#FF6B6B" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scroll: { 
    padding: 20,
    paddingBottom: 120,
  },

  // Header Styles
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emailBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Dashboard Section
  dashboardSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    width: (screenWidth - 56) / 2,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 32,
  },

  // Daily Section
  dailySection: {
    marginBottom: 20,
  },

  // Day Card Styles
  dayCard: {
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dayHeaderText: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  dayDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayProgressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dayProgressText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dayStats: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Division Styles
  divisionBlock: {
    marginBottom: 16,
    borderLeftWidth: 4,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  divisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  divisionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divisionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },
  notesSection: {
    marginBottom: 16,
  },
  writeupsSection: {
    marginBottom: 16,
  },
  trainingSection: {
    marginBottom: 0,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  noteIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
    marginTop: 6,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    fontWeight: '500',
  },
  emptyLine: {
    height: 8,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  itemText: {
    fontSize: 14,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },

  // Floating Action Buttons
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  fabSecondary: {
    borderWidth: 1,
  },
});