import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, Dimensions } from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { MODULES } from '../modules';

export default function HubScreen() {
  const { colors } = useTheme();
  const nav = useNavigation<any>();
  const { hasRole } = useAuth();
  const [viewMode, setViewMode] = useState<'compact' | 'vertical'>('compact');

  const visible = MODULES.filter(m => m.roles.length === 0 || hasRole(...m.roles));

  // Add placeholder modules for future expansion
  const allModules = [
    ...visible,
    {
      id: 'roster',
      title: 'FleetPulse Roster',
      subtitle: 'Trucks • Drivers • Locations',
      icon: { pack: 'Ionicons', name: 'people-outline' },
      route: 'RosterStack',
      roles: ['manager', 'admin'],
    },
    {
      id: 'connect',
      title: 'FleetPulse Connect',
      subtitle: 'Communication • Alerts',
      icon: { pack: 'Ionicons', name: 'chatbubbles-outline' },
      route: 'ConnectStack',
      roles: ['driver', 'manager', 'admin'],
    },
  ];

  const getModuleIcon = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      'document-text-outline': 'document-text-outline',
      'people-outline': 'people-outline',
      'chatbubbles-outline': 'chatbubbles-outline',
    };
    return iconMap[iconName] || 'folder-outline';
  };

  const renderCompactView = () => (
    <View style={styles.grid}>
      {allModules.map(mod => (
        <Pressable
          key={mod.id}
          style={({ pressed }) => [
            styles.compactCard,
            { 
              backgroundColor: pressed ? colors.primary : colors.card,
              borderColor: colors.border,
              shadowColor: colors.primary,
            },
          ]}
          onPress={() =>
            nav.navigate(mod.route === 'NotesStack' ? 'NotesStack' : (mod.route as never))
          }
        >
          <View style={[styles.compactIconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name={getModuleIcon(mod.icon.name) as any} size={24} color="#fff" />
          </View>
          <Text style={[styles.compactCardTitle, { color: colors.text }]}>{mod.title}</Text>
          {mod.subtitle ? <Text style={[styles.compactCardSub, { color: colors.primary }]}>{mod.subtitle}</Text> : null}
        </Pressable>
      ))}
    </View>
  );

  const renderVerticalView = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.verticalScrollContainer}
    >
      {allModules.map(mod => (
        <Pressable
          key={mod.id}
          style={({ pressed }) => [
            styles.verticalCard,
            { 
              backgroundColor: pressed ? colors.primary : colors.card,
              borderColor: colors.border,
              shadowColor: colors.primary,
            },
          ]}
          onPress={() =>
            nav.navigate(mod.route === 'NotesStack' ? 'NotesStack' : (mod.route as never))
          }
        >
          <View style={styles.verticalCardContent}>
            <View style={[styles.verticalIconCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name={getModuleIcon(mod.icon.name) as any} size={28} color="#fff" />
            </View>
            <View style={styles.verticalCardText}>
              <Text style={[styles.verticalCardTitle, { color: colors.text }]}>{mod.title}</Text>
              {mod.subtitle ? <Text style={[styles.verticalCardSub, { color: colors.primary }]}>{mod.subtitle}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerSection}>
        <Text style={[styles.welcome, { color: colors.text }]}>Welcome back, James</Text>
        <Text style={[styles.subtitle, { color: colors.primary }]}>Your fleet. One hub.</Text>
        <Pressable 
          style={[styles.viewToggle, { borderColor: colors.border }]}
          onPress={() => setViewMode(viewMode === 'compact' ? 'vertical' : 'compact')}
        >
          <Text style={[styles.viewToggleText, { color: colors.text }]}>
            {viewMode === 'compact' ? 'List View' : 'Grid View'}
          </Text>
          <Ionicons 
            name={viewMode === 'compact' ? 'list' : 'grid'} 
            size={20} 
            color={colors.primary} 
          />
        </Pressable>
      </View>
      
      {viewMode === 'compact' ? renderCompactView() : renderVerticalView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  headerSection: { marginBottom: 30, alignItems: 'center', paddingHorizontal: 20 },
  welcome: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  viewToggleText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  // Compact Grid View
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 16,
  },
  compactCard: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    minHeight: 140,
  },
  compactIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  compactCardTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  compactCardSub: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    lineHeight: 14,
  },
  // Vertical List View
  verticalScrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  verticalCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  verticalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  verticalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  verticalCardText: {
    flex: 1,
  },
  verticalCardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  verticalCardSub: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    lineHeight: 16,
  },
});
