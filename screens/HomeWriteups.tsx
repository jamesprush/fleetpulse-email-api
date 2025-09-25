import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Keyboard,
  Animated,
  SafeAreaView,
  Dimensions,
  Pressable,
  Alert,
  Modal,
  Linking,
  Platform,
  Vibration,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '../context/NotesContext';

const { width: screenWidth } = Dimensions.get('window');

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const;

const WRITEUP_TYPES = [
  { id: 'ncns', label: 'NCNS', icon: 'close-circle', color: '#FF4444', description: 'No Call No Show' },
  { id: 'late', label: 'Late', icon: 'time', color: '#FF9500', description: 'Late Arrival' },
  { id: 'callout', label: 'Call Out', icon: 'warning', color: '#FF6B6B', description: 'Call Out' },
  { id: 'accident', label: 'Accident', icon: 'car', color: '#FF3333', description: 'Vehicle Accident' },
  { id: 'other', label: 'Other', icon: 'document-text', color: '#666666', description: 'Other Issue' },
];

export default function HomeWriteups() {
  const { colors } = useTheme();
  const { writeups, addWriteup, toggleWriteup, removeWriteup, weeklyLog } = useNotes();
  const [draft, setDraft] = useState<Record<string, { driver: string; reason: string; type: string }>>({});
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [currentWriteupKey, setCurrentWriteupKey] = useState<string>('');
  const [typeModalVisible, setTypeModalVisible] = useState<boolean>(false);
  const [cognitoVisible, setCognitoVisible] = useState<boolean>(false);
  const [cognitoUrl, setCognitoUrl] = useState<string>('');
  const [submittedDrivers, setSubmittedDrivers] = useState<Set<string>>(new Set());
  const [currentDriverForHR, setCurrentDriverForHR] = useState<{driver: string, division: 'dmv' | 'nyc'} | null>(null);
  
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Initialize draft state for all days and divisions
  useEffect(() => {
    const initialDraft: Record<string, { driver: string; reason: string; type: string }> = {};
    DAYS.forEach((day) => {
      ['dmv', 'nyc'].forEach((division) => {
        const key = `${day}-${division}`;
        if (!draft[key]) {
          initialDraft[key] = { driver: '', reason: '', type: 'other' };
        }
      });
    });
    if (Object.keys(initialDraft).length > 0) {
      setDraft((prev) => ({ ...prev, ...initialDraft }));
    }
  }, []);

  // Calculate statistics
  const getStatistics = () => {
    let totalItems = 0;
    let completedItems = 0;
    let callOuts = 0;
    
    DAYS.forEach(day => {
      ['dmv', 'nyc'].forEach(division => {
        const items = writeups[day]?.[division] ?? [];
        totalItems += items.length;
        completedItems += items.filter(item => item.done).length;
        
        // Count call-outs
        items.forEach(item => {
          if (item.text.toLowerCase().includes('call out') || item.text.toLowerCase().includes('callout')) {
            callOuts++;
          }
        });
      });
    });
    
    return { 
      totalItems, 
      completedItems, 
      callOuts,
      completionRate: totalItems > 0 ? (completedItems / totalItems) * 100 : 0 
    };
  };

  const stats = getStatistics();

  // Haptic feedback helper (using built-in React Native)
  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    // Use React Native's built-in vibration for all platforms
    switch (type) {
      case 'light': Vibration.vibrate(30); break;
      case 'medium': Vibration.vibrate(50); break;
      case 'heavy': Vibration.vibrate(100); break;
    }
  };

  // Get all writeups for a specific driver in a division
  const getDriverWriteups = (driverName: string, division: 'dmv' | 'nyc') => {
    let allWriteups = [];
    DAYS.forEach((day) => {
      const dayWriteups = writeups[day]?.[division] || [];
      dayWriteups.forEach((writeup) => {
        const parts = writeup.text.split(' - ');
        const driver = parts[0]?.trim();
        if (driver && driver.toLowerCase() === driverName.toLowerCase()) {
          allWriteups.push({
            day,
            text: writeup.text,
            type: writeup.text.includes('NCNS') ? 'NCNS' : 
                  writeup.text.includes('Late') ? 'Late' :
                  writeup.text.includes('Call Out') ? 'Call Out' :
                  writeup.text.includes('Accident') ? 'Accident' : 'Other'
          });
        }
      });
    });
    return allWriteups;
  };

  // Handle driver submission to HR (all their writeups in one form)
  const handleSubmitDriverToHR = (driverName: string, division: 'dmv' | 'nyc') => {
    hapticFeedback('medium');
    setCurrentDriverForHR({ driver: driverName, division });
    
    // Get all writeups for this driver
    const driverWriteups = getDriverWriteups(driverName, division);
    
    // Format all writeups for the form
    let formattedWriteups = '';
    driverWriteups.forEach((writeup) => {
      formattedWriteups += `${writeup.day}: ${writeup.text}\n`;
    });
    
    // Pre-fill Cognito form with all driver's writeup data
    const driverData = {
      'Employee Name': driverName,
      'Date': new Date().toLocaleDateString(),
      'Week': require('../utils/dateUtils').getCurrentWeek().weekString,
      'Incident Details': formattedWriteups || 'No writeups found',
      'Division': division.toUpperCase(),
      'Total Incidents': driverWriteups.length.toString(),
    };
    
    const baseUrl = 'https://www.cognitoforms.com/WheelzUpLLC/APDEmployeeWriteUpForm';
    const prefilledUrl = `${baseUrl}?${new URLSearchParams(driverData).toString()}`;
    setCognitoUrl(prefilledUrl);
    setCognitoVisible(true);
  };

  // Mark driver as submitted to HR
  const markDriverAsSubmittedToHR = () => {
    if (currentDriverForHR) {
      const { driver, division } = currentDriverForHR;
      const driverId = `${driver.toLowerCase()}-${division}`;
      setSubmittedDrivers(prev => new Set([...prev, driverId]));
      setCurrentDriverForHR(null);
    }
  };

  // Generate prefill data for Cognito form
  const generateCognitoPrefillData = () => {
    const { weekString } = require('../utils/dateUtils').getCurrentWeek();
    let allWriteups = '';
    
    DAYS.forEach((day) => {
      const dmv = writeups[day]?.dmv ?? [];
      const nyc = writeups[day]?.nyc ?? [];
      if (dmv.length || nyc.length) {
        allWriteups += `${day}:\n`;
        if (dmv.length) {
          allWriteups += 'DMV: ';
          allWriteups += dmv.map(w => w.text).join(', ') + '\n';
        }
        if (nyc.length) {
          allWriteups += 'NYC: ';
          allWriteups += nyc.map(w => w.text).join(', ') + '\n';
        }
        allWriteups += '\n';
      }
    });

    return {
      'Employee Name': 'FleetPulse System',
      'Date': new Date().toLocaleDateString(),
      'Week': weekString,
      'Incident Details': allWriteups || 'No writeups this week',
      'Total Items': stats.totalItems.toString(),
      'Call Outs': stats.callOuts.toString(),
    };
  };

  // Build weekly email content
  const formatWeeklyEmail = (): string => {
    let content = 'FleetPulse Weekly Writeups\n\n';
    DAYS.forEach((day) => {
      const dmv = writeups[day]?.dmv ?? [];
      const nyc = writeups[day]?.nyc ?? [];
      if (dmv.length || nyc.length) {
        content += `${day}\n`;
        if (dmv.length) {
          content += 'DMV:\n';
          dmv.forEach((w) => (content += `• ${w.done ? '✅' : '◯'} ${w.text}\n`));
        }
        if (nyc.length) {
          content += 'NYC:\n';
          nyc.forEach((w) => (content += `• ${w.done ? '✅' : '◯'} ${w.text}\n`));
        }
        content += '\n';
      }
    });
    return content;
  };

  // Utility functions
  const toggleDayCollapse = (day: string) => {
    setCollapsedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  const handleAdd = (day: string, division: 'dmv' | 'nyc') => {
    const key = `${day}-${division}`;
    const entry = draft[key];
    if (!entry || !entry.driver.trim() || !entry.reason.trim()) {
      hapticFeedback('heavy');
      Alert.alert('⚠️ Missing Info', 'Please fill in both Driver Name and Details before adding.');
      return;
    }

    hapticFeedback('medium');
    const typeInfo = WRITEUP_TYPES.find(t => t.id === entry.type) || WRITEUP_TYPES[4];
    const formattedText = `${entry.driver} - ${typeInfo.label}: ${entry.reason}`;

    addWriteup(day, division, formattedText);
    setDraft((prev) => ({ ...prev, [key]: { driver: '', reason: '', type: 'other' } }));
    Keyboard.dismiss();
  };

  // Email functionality
  const EMAIL_API_BASE =
    (process as any)?.env?.EXPO_PUBLIC_EMAIL_API_URL || (process as any)?.env?.EMAIL_API_URL || '';

  const sendWeeklyReport = async () => {
    hapticFeedback('medium');
    const content = formatWeeklyEmail();
    if (!EMAIL_API_BASE) {
      Alert.alert(
        'Email not configured',
        'Set EXPO_PUBLIC_EMAIL_API_URL to your deployed domain (e.g., https://your-app.vercel.app) so the app can call /api/send-email.'
      );
      return;
    }
    try {
      const res = await fetch(`${EMAIL_API_BASE.replace(/\/$/, '')}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: 'prush@mail.com',
          subject: 'FleetPulse Weekly Writeups',
          content,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      hapticFeedback('heavy');
      Alert.alert('✅ Report Sent!', 'Weekly report successfully emailed to prush@mail.com');
    } catch (e) {
      hapticFeedback('heavy');
      Alert.alert(
        '❌ Send Failed',
        'Could not send via API. We can wire an alternative (MailComposer) if you prefer.'
      );
    }
  };

  const renderWriteupTypeSelector = (day: string, division: 'dmv' | 'nyc') => {
    const key = `${day}-${division}`;
    const currentType = draft[key]?.type || 'other';

    return (
      <View style={styles.typeSelector}>
        <Text style={[styles.selectorLabel, { color: colors.text + '70' }]}>Issue Type</Text>
        <Pressable
          style={[styles.typePicker, { borderColor: colors.border, backgroundColor: colors.background }]}
          onPress={() => {
            setCurrentWriteupKey(key);
            setTypeModalVisible(true);
          }}
        >
          <Text style={[styles.typePickerText, { color: colors.text }]}>
            {WRITEUP_TYPES.find((t) => t.id === currentType)?.label || 'Other'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.text + '70'} />
        </Pressable>

        <Modal transparent visible={typeModalVisible} animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setTypeModalVisible(false)}>
            <View style={[styles.sheet, { backgroundColor: colors.card }]}> 
              {WRITEUP_TYPES.map((type) => (
                <Pressable
                  key={type.id}
                  style={styles.sheetRow}
                  onPress={() => {
                    hapticFeedback('medium');
                    const next = type.id;
                    setDraft((prev) => ({
                      ...prev,
                      [currentWriteupKey]: { ...prev[currentWriteupKey], type: next, driver: prev[currentWriteupKey]?.driver || '', reason: prev[currentWriteupKey]?.reason || '' },
                    }));
                    setTypeModalVisible(false);
                  }}
                >
                  <View style={[styles.sheetIcon, { backgroundColor: type.color + '22' }]}>
                    <Ionicons name={type.icon as any} size={16} color={type.color} />
                  </View>
                  <View style={styles.sheetTextCol}>
                    <Text style={[styles.sheetTitle, { color: colors.text }]}>{type.label}</Text>
                    <Text style={[styles.sheetSubtitle, { color: colors.text + '70' }]}>{type.description}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  };

  const renderDivision = (day: string, division: 'dmv' | 'nyc', label: string) => {
    const items = writeups[day]?.[division] ?? [];
    const completedCount = items.filter(item => item.done).length;
    const totalCount = items.length;
    const divisionColor = division === 'dmv' ? '#FF6B6B' : '#4ECDC4';
    const hasCallOuts = items.some(item => 
      item.text.toLowerCase().includes('call out') || 
      item.text.toLowerCase().includes('callout')
    );

    return (
      <Animated.View 
        style={[
          styles.divisionCard,
          { backgroundColor: colors.card, borderColor: divisionColor + '20' },
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={[styles.divisionHeader, { borderLeftColor: divisionColor }]}>
          <View style={styles.divisionTitleRow}>
            <View style={[styles.divisionIcon, { backgroundColor: divisionColor }]}>
              <Ionicons name={division === 'dmv' ? 'car-sport' : 'business'} size={18} color="#fff" />
            </View>
            <Text style={[styles.divisionTitle, { color: colors.text }]}>{label}</Text>
            {hasCallOuts && (
              <View style={[styles.callOutBadge, { backgroundColor: '#FF4444' }]}>
                <Ionicons name="warning" size={12} color="#fff" />
                <Text style={styles.callOutText}>C.O</Text>
              </View>
            )}
            {totalCount > 0 && (
              <View style={[styles.progressBadge, { backgroundColor: divisionColor + '20' }]}>
                <Text style={[styles.progressText, { color: divisionColor }]}>
                  {completedCount}/{totalCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={24} color={colors.text + '30'} />
            <Text style={[styles.empty, { color: colors.text + '50' }]}>No items yet</Text>
          </View>
        ) : (
          <View style={styles.itemsContainer}>
            {items.map((item, idx) => {
              const isCallOut = item.text.toLowerCase().includes('call out') || item.text.toLowerCase().includes('callout');
              const isAccident = item.text.toLowerCase().includes('accident');
              const isLate = item.text.toLowerCase().includes('late');
              const isNCNS = item.text.toLowerCase().includes('ncns');
              
              let itemType = 'other';
              let itemColor = '#666666';
              let itemIcon = 'document-text';
              
              if (isCallOut) { itemType = 'callout'; itemColor = '#FF6B6B'; itemIcon = 'warning'; }
              else if (isAccident) { itemType = 'accident'; itemColor = '#FF3333'; itemIcon = 'car'; }
              else if (isLate) { itemType = 'late'; itemColor = '#FF9500'; itemIcon = 'time'; }
              else if (isNCNS) { itemType = 'ncns'; itemColor = '#FF4444'; itemIcon = 'close-circle'; }

              // Extract driver name from writeup text
              const parts = item.text.split(' - ');
              const driverName = parts[0]?.trim() || 'Unknown Driver';
              const driverId = `${driverName.toLowerCase()}-${division}`;
              const isDriverSubmittedToHR = submittedDrivers.has(driverId);

              return (
                <Pressable 
                  key={idx} 
                style={[
                    styles.itemCard,
                    { backgroundColor: isCallOut ? '#FF4444' + '08' : 'rgba(0,0,0,0.02)' }
                  ]}
                  onPress={() => toggleWriteup(day, division, idx)}
                >
                  <View style={[styles.itemTypeIndicator, { backgroundColor: itemColor }]}>
                    <Ionicons name={itemIcon as any} size={14} color="#fff" />
                  </View>
                  
                  <View style={styles.itemContent}>
                    <Text style={[
                  styles.itemText,
                  {
                    color: colors.text,
                    textDecorationLine: item.done ? 'line-through' : 'none',
                    opacity: item.done ? 0.6 : 1,
                  },
                    ]}>
                {item.text}
              </Text>
                  </View>
                  
                  {/* Submit Driver to HR Button */}
                  {!isDriverSubmittedToHR && (
                    <Pressable
                      style={[styles.hrSubmitBtn, { backgroundColor: '#007AFF' }]}
                      onPress={() => handleSubmitDriverToHR(driverName, division)}
                    >
                      <Ionicons name="open" size={12} color="#fff" />
                    </Pressable>
                  )}
                  
                  {/* Driver HR Submitted Indicator */}
                  {isDriverSubmittedToHR && (
                    <View style={[styles.hrSubmittedIndicator, { backgroundColor: '#4CAF50' }]}>
                      <Ionicons name="checkmark-circle" size={14} color="#fff" />
                    </View>
                  )}
                  
                  <View style={[styles.statusIndicator, { backgroundColor: item.done ? '#00FF88' : colors.border }]}>
                    {item.done && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  
                  <Pressable 
                    style={[styles.removeBtn, { backgroundColor: '#ff5c5c' + '20' }]}
                    onPress={() => removeWriteup(day, division, idx)}
                  >
                    <Ionicons name="close" size={14} color="#ff5c5c" />
                  </Pressable>
                </Pressable>
              );
            })}
            </View>
        )}

        {/* Enhanced Input Section */}
        <View style={styles.inputSection}>
          {renderWriteupTypeSelector(day, division)}
          
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text + '70' }]}>Driver Name</Text>
          <TextInput
            value={draft[`${day}-${division}`]?.driver || ''}
            onChangeText={(t) =>
              setDraft((prev) => ({
                ...prev,
                [`${day}-${division}`]: {
                  ...prev[`${day}-${division}`],
                  driver: t,
                  reason: prev[`${day}-${division}`]?.reason || '',
                      type: prev[`${day}-${division}`]?.type || 'other'
                },
              }))
            }
                placeholder="Enter driver name"
                placeholderTextColor={colors.text + '50'}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              />
            </View>
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text + '70' }]}>Details</Text>
          <TextInput
            value={draft[`${day}-${division}`]?.reason || ''}
            onChangeText={(t) =>
              setDraft((prev) => ({
                ...prev,
                [`${day}-${division}`]: {
                  ...prev[`${day}-${division}`],
                  reason: t,
                  driver: prev[`${day}-${division}`]?.driver || '',
                      type: prev[`${day}-${division}`]?.type || 'other'
                },
              }))
            }
                placeholder="Enter details about the issue..."
                placeholderTextColor={colors.text + '50'}
                style={[styles.inputLarge, { color: colors.text, borderColor: colors.border }]}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
          
          <Pressable
            style={[styles.addBtn, { backgroundColor: divisionColor }]}
            onPress={() => handleAdd(day, division)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add Writeup</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Clean Header */}
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>Writeups</Text>
            <View style={styles.statsRow}>
              <Text style={[styles.statText, { color: colors.text + '70' }]}>{stats.totalItems} items</Text>
              <Text style={[styles.statText, { color: '#00FF88' }]}>•</Text>
              <Text style={[styles.statText, { color: '#00FF88' }]}>{stats.completedItems} done</Text>
              <Text style={[styles.statText, { color: colors.text + '70' }]}>•</Text>
              <Text style={[styles.statText, { color: '#FF4444' }]}>{stats.callOuts} call-outs</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: stats.completionRate === 100 ? '#00FF88' : '#FF9500' }]}>
            <Text style={styles.statusText}>
              {stats.completionRate === 100 ? 'COMPLETE' : 'IN PROGRESS'}
            </Text>
          </View>
        </View>
        
        {/* Simple Action Bar */}
        <View style={styles.actionBar}>
          <Pressable 
            style={[styles.actionBtn, { backgroundColor: '#FF9500' }]}
            onPress={sendWeeklyReport}
          >
            <Ionicons name="mail" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Send Report</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Cognito in-app form (WebView if available, else open browser) */}
      <Modal visible={cognitoVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Form</Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                hapticFeedback('light');
                setCognitoVisible(false);
              }}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>
          
          {/* Form Action Buttons */}
          <View style={styles.formActionButtons}>
            <Pressable
              style={[styles.formActionBtn, styles.submitBtn]}
              onPress={() => {
                hapticFeedback('heavy');
                markDriverAsSubmittedToHR();
                
                // Also mark all writeups for this driver as completed
                if (currentDriverForHR) {
                  const { driver, division } = currentDriverForHR;
                  DAYS.forEach((day) => {
                    const dayWriteups = writeups[day]?.[division] || [];
                    dayWriteups.forEach((writeup, index) => {
                      const parts = writeup.text.split(' - ');
                      const writeupDriver = parts[0]?.trim();
                      if (writeupDriver && writeupDriver.toLowerCase() === driver.toLowerCase() && !writeup.done) {
                        toggleWriteup(day, division, index);
                      }
                    });
                  });
                }
                
                setCognitoVisible(false);
                Alert.alert('✅ Success!', 'Writeup submitted!', [
                  { text: 'OK' }
                ]);
              }}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Writeup Submitted?</Text>
            </Pressable>
            
            <Pressable
              style={[styles.formActionBtn, styles.disregardBtn]}
              onPress={() => {
                hapticFeedback('light');
                setCognitoVisible(false);
              }}
            >
              <Ionicons name="close-circle" size={18} color="#fff" />
              <Text style={styles.disregardBtnText}>Disregard</Text>
            </Pressable>
          </View>
          {cognitoVisible && (
            (() => {
              try {
                const { WebView } = require('react-native-webview');
                return (
                  <WebView
                    source={{ uri: cognitoUrl }}
                    startInLoadingState
                    style={{ flex: 1 }}
                  />
                );
              } catch (e) {
                Linking.openURL('https://www.cognitoforms.com/WheelzUpLLC/APDEmployeeWriteUpForm');
                return <View style={{ flex: 1 }} />;
              }
            })()
          )}
        </SafeAreaView>
      </Modal>

      {/* Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {DAYS.map((day, index) => {
          const isCollapsed = collapsedDays.has(day);
          const dayStats = {
            dmv: writeups[day]?.dmv ?? [],
            nyc: writeups[day]?.nyc ?? []
          };
          const totalDayItems = dayStats.dmv.length + dayStats.nyc.length;
          const completedDayItems = dayStats.dmv.filter(item => item.done).length + dayStats.nyc.filter(item => item.done).length;
          const dayCompletionRate = totalDayItems > 0 ? (completedDayItems / totalDayItems) * 100 : 0;
          
          return (
            <Animated.View
              key={day}
              style={[
                styles.dayCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Pressable 
                style={styles.dayHeader}
                onPress={() => toggleDayCollapse(day)}
              >
                <View style={styles.dayHeaderLeft}>
                  <View style={[styles.dayIcon, { backgroundColor: dayCompletionRate === 100 ? '#00FF88' : '#FF9500' }]}>
                    <Ionicons name="calendar" size={20} color="#fff" />
                  </View>
                  <View style={styles.dayHeaderText}>
                    <Text style={[styles.dayTitle, { color: colors.text }]}>{day}</Text>
                    <Text style={[styles.daySubtitle, { color: colors.text + '70' }]}>
                      {completedDayItems}/{totalDayItems} items completed
                    </Text>
                  </View>
                </View>
                
                <View style={styles.dayHeaderRight}>
                  <View style={[styles.dayProgressBadge, { backgroundColor: dayCompletionRate === 100 ? '#00FF88' + '20' : '#FF9500' + '20' }]}>
                    <Text style={[styles.dayProgressText, { color: dayCompletionRate === 100 ? '#00FF88' : '#FF9500' }]}>
                      {Math.round(dayCompletionRate)}%
                    </Text>
                  </View>
                  <Ionicons 
                    name={isCollapsed ? "chevron-down" : "chevron-up"} 
                    size={20} 
                    color={colors.text + '70'} 
                  />
                </View>
              </Pressable>
              
              {!isCollapsed && (
                <View style={styles.dayContent}>
                  {renderDivision(day, 'dmv', 'DMV Division')}
                  {renderDivision(day, 'nyc', 'NYC Division')}
                </View>
              )}
            </Animated.View>
          );
        })}
    </ScrollView>
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
    paddingBottom: 100,
  },

  // Header Styles
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
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
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Action Bar
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dayHeaderText: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  daySubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayProgressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayProgressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Division Styles
  divisionCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  divisionHeader: {
    padding: 16,
    borderLeftWidth: 4,
  },
  divisionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  divisionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divisionTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  callOutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  callOutText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  progressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Items Container
  itemsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  itemTypeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  statusIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hrSubmitBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  hrSubmittedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  empty: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },

  // Type Selector
  typeSelector: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  typePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  typePickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  typeScroll: {
    marginHorizontal: -16,
  },
  typeButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Input Section
  inputSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  inputRow: {
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputLarge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.02)',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area for home indicator
    maxHeight: '80%',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  sheetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sheetTextCol: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cognitoModalContent: {
    flex: 1,
  },
  cognitoLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  cognitoFallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    gap: 8,
  },
  cognitoFallbackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Form Action Buttons
  formActionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  formActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitBtn: {
    backgroundColor: '#4CAF50',
  },
  disregardBtn: {
    backgroundColor: '#FF4444',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disregardBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});