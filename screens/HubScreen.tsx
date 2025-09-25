import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, Dimensions, Animated, SafeAreaView } from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { MODULES } from '../modules';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 768;

export default function HubScreen() {
  const { colors } = useTheme();
  const nav = useNavigation<any>();
  const { hasRole } = useAuth();
  const [viewMode, setViewMode] = useState<'compact' | 'vertical'>('compact');
  
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Check if we're in development mode
  const isDevelopmentMode = (process as any)?.env?.EXPO_PUBLIC_MODE === 'development' || __DEV__;

  const visible = MODULES.filter(m => m.roles.length === 0 || hasRole(...m.roles));

  // Premium modules for fleet management
  const allModules = [
    ...visible,
    {
      id: 'truck-dashboard',
      title: 'Fleet Dashboard',
      subtitle: 'Real-time fleet monitoring and status tracking',
      icon: { pack: 'Ionicons', name: 'car-sport-outline' },
      route: 'TruckDashboard',
      roles: ['manager', 'admin'],
      color: '#FF6B6B',
      gradient: ['#FF6B6B', '#FF8E8E'],
    },
    {
      id: 'roster',
      title: 'Fleet Roster',
      subtitle: 'Driver assignments and vehicle management',
      icon: { pack: 'Ionicons', name: 'people-outline' },
      route: 'RosterStack',
      roles: ['manager', 'admin'],
      color: '#4ECDC4',
      gradient: ['#4ECDC4', '#7EDDD6'],
    },
    {
      id: 'analytics',
      title: 'Analytics Hub',
      subtitle: 'Performance metrics and insights',
      icon: { pack: 'Ionicons', name: 'analytics-outline' },
      route: 'Analytics',
      roles: ['manager', 'admin'],
      color: '#45B7D1',
      gradient: ['#45B7D1', '#6BC5D8'],
    },
    {
      id: 'maintenance',
      title: 'Maintenance',
      subtitle: 'Vehicle service and repair tracking',
      icon: { pack: 'Ionicons', name: 'construct-outline' },
      route: 'Maintenance',
      roles: ['manager', 'admin'],
      color: '#96CEB4',
      gradient: ['#96CEB4', '#B8DCC6'],
    },
    {
      id: 'routes',
      title: 'Route Planning',
      subtitle: 'Optimized delivery and pickup routes',
      icon: { pack: 'Ionicons', name: 'map-outline' },
      route: 'Routes',
      roles: ['manager', 'admin'],
      color: '#FECA57',
      gradient: ['#FECA57', '#FED766'],
    },
    {
      id: 'reports',
      title: 'Reports',
      subtitle: 'Comprehensive fleet reports and documents',
      icon: { pack: 'Ionicons', name: 'document-text-outline' },
      route: 'Reports',
      roles: ['manager', 'admin'],
      color: '#FF9FF3',
      gradient: ['#FF9FF3', '#F368E0'],
    },
  ];

  // Add completed status to modules
  const modulesWithStatus = allModules.map(module => ({
    ...module,
    completed: module.id === 'notes' || module.id === 'overview' || module.id === 'writeups' || module.id === 'training' || module.id === 'weekly-log'
  }));

  // Filter modules based on development mode
  const visibleModules = isDevelopmentMode 
    ? modulesWithStatus 
    : modulesWithStatus.filter(module => module.completed);

  // Animation effect
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

  const getModuleIcon = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      'document-text-outline': 'document-text-outline',
      'people-outline': 'people-outline',
      'car-sport-outline': 'car-sport-outline',
      'analytics-outline': 'analytics-outline',
      'construct-outline': 'construct-outline',
      'map-outline': 'map-outline',
    };
    return iconMap[iconName] || 'folder-outline';
  };

  const renderCompactView = () => (
    <ScrollView 
      style={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.gridContainer}
    >
      <Animated.View 
        style={[
          styles.grid,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        {visibleModules.map((mod, index) => (
          <Animated.View
            key={mod.id}
            style={[
              styles.compactCardWrapper,
              {
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  })
                }]
              }
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.compactCard,
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                  shadowColor: mod.color || colors.primary,
                },
              ]}
              onPress={() =>
                nav.navigate(mod.route === 'NotesStack' ? 'NotesStack' : (mod.route as never))
              }
            >
              <View style={[styles.compactIconCircle, { backgroundColor: mod.color || colors.primary }]}>
                <Ionicons name={getModuleIcon(mod.icon.name) as any} size={28} color="#fff" />
              </View>
              <Text style={[styles.compactCardTitle, { color: colors.text }]}>{mod.title}</Text>
              {mod.subtitle ? <Text style={[styles.compactCardSub, { color: colors.text + '70' }]}>{mod.subtitle}</Text> : null}
              <View style={[styles.compactCardAccent, { backgroundColor: mod.color || colors.primary }]} />
            </Pressable>
          </Animated.View>
        ))}
      </Animated.View>
    </ScrollView>
  );

  const renderVerticalView = () => (
    <ScrollView 
      style={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.verticalScrollContainer}
    >
      <Animated.View 
        style={[
          styles.verticalContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        {visibleModules.map((mod, index) => (
          <Animated.View
            key={mod.id}
            style={[
              styles.verticalCardWrapper,
              {
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }]
              }
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.verticalCard,
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: mod.color || colors.primary,
                },
              ]}
              onPress={() =>
                nav.navigate(mod.route === 'NotesStack' ? 'NotesStack' : (mod.route as never))
              }
            >
              <View style={styles.verticalCardContent}>
                <View style={[styles.verticalIconCircle, { backgroundColor: mod.color || colors.primary }]}>
                  <Ionicons name={getModuleIcon(mod.icon.name) as any} size={32} color="#fff" />
                </View>
                <View style={styles.verticalCardText}>
                  <Text style={[styles.verticalCardTitle, { color: colors.text }]}>{mod.title}</Text>
                  {mod.subtitle ? <Text style={[styles.verticalCardSub, { color: colors.text + '70' }]}>{mod.subtitle}</Text> : null}
                </View>
                <View style={[styles.chevronContainer, { backgroundColor: mod.color + '20' }]}>
                  <Ionicons name="chevron-forward" size={20} color={mod.color || colors.primary} />
                </View>
              </View>
              <View style={[styles.verticalCardAccent, { backgroundColor: mod.color || colors.primary }]} />
            </Pressable>
          </Animated.View>
        ))}
      </Animated.View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View 
        style={[
          styles.headerSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={[styles.welcome, { color: colors.text }]}>Welcome back, James</Text>
            <Text style={[styles.subtitle, { color: colors.text + '70' }]}>Your fleet management hub</Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: '#00FF88' }]}>
            <Text style={styles.statusText}>Live</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <Pressable 
            style={[styles.viewToggle, { 
              backgroundColor: viewMode === 'compact' ? colors.primary : colors.card,
              borderColor: colors.border 
            }]}
            onPress={() => setViewMode(viewMode === 'compact' ? 'vertical' : 'compact')}
          >
            <Ionicons 
              name={viewMode === 'compact' ? 'grid' : 'list'} 
              size={18} 
              color={viewMode === 'compact' ? '#fff' : colors.primary} 
            />
            <Text style={[styles.viewToggleText, { 
              color: viewMode === 'compact' ? '#fff' : colors.text 
            }]}>
              {viewMode === 'compact' ? 'Grid' : 'List'}
            </Text>
          </Pressable>
          
          <Pressable style={[styles.searchButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.text} />
          </Pressable>
        </View>
      </Animated.View>
      
      {viewMode === 'compact' ? renderCompactView() : renderVerticalView()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  headerSection: { 
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#1e1e1e',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  welcome: {
    fontSize: 32,
    fontFamily: 'Inter_800ExtraBold',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewToggleText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  searchButton: {
    padding: 10,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // Scroll and Grid Containers
  scrollContainer: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  compactCardWrapper: {
    width: isTablet ? '31%' : '47%',
    marginBottom: 16,
    height: 180, // Fixed height to ensure all cards are the same size
  },
  compactCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
    height: '100%', // Use full height of wrapper
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  compactIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  compactCardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  compactCardSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
  },
  compactCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  // Vertical List View
  verticalScrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  verticalContainer: {
    gap: 16,
  },
  verticalCardWrapper: {
    marginBottom: 4,
  },
  verticalCard: {
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  verticalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  verticalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  verticalCardText: {
    flex: 1,
  },
  verticalCardTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  verticalCardSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    opacity: 0.8,
  },
  chevronContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  verticalCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});
