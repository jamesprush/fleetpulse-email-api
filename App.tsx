// App.tsx
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Image, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '@react-navigation/native';

import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import HomeOverview from './screens/HomeOverview';
import HomeWriteups from './screens/HomeWriteups';
import WeeklyLogScreen from './screens/WeeklyLogScreen';
import DetailsScreen from './screens/DetailsScreen';
import TrainingScreen from './screens/TrainingScreen';
import HubScreen from './screens/HubScreen';
import TruckDashboard from './screens/TruckDashboard';

import { RootStackParamList } from './types';
import * as CustomTheme from './theme';
import ToastMessage from './components/ToastMessage';
import { NotesProvider } from './context/NotesContext';
import { AuthProvider } from './context/AuthContext';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const NotesStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createMaterialTopTabNavigator();

/* ---------------- Notes Tabs ---------------- */
function NotesTabs() {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const tabs = ['Overview', 'Writeups', 'Training'] as const;

  const renderTab = (name: typeof tabs[number], index: number) => {
    const isActive = activeIndex === index;
    return (
      <TouchableOpacity 
        key={name} 
        onPress={() => setActiveIndex(index)} 
        style={{ 
          flex: 1, 
          paddingVertical: 16, 
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ 
          color: isActive ? colors.primary : colors.text, 
          fontSize: 16, 
          fontWeight: isActive ? '700' : '500',
          textAlign: 'center',
        }}>
          {name === 'Writeups' ? 'Write-ups' : name}
        </Text>
        {isActive && (
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: colors.primary,
            borderRadius: 1.5,
          }} />
        )}
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    switch (activeIndex) {
      case 0:
        return <HomeOverview />;
      case 1:
        return <HomeWriteups />;
      case 2:
        return <TrainingScreen />;
      default:
        return <HomeOverview />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        }}
      >
        {tabs.map((name, index) => renderTab(name, index))}
      </View>

      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
    </View>
  );
}




/* ---------------- Notes Stack ---------------- */
/* ---------------- Notes Stack ---------------- */
function NotesStackNavigator({
  toggleTheme,
  dark,
}: {
  toggleTheme: () => void;
  dark: boolean;
}) {
  return (
    <NotesStack.Navigator
      initialRouteName="Home"
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: dark ? '#000' : '#fff',
        },
        headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
        headerBackTitleVisible: false,
        headerBackVisible: false,
        headerTitleAlign: 'center',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Hub')}
            style={{ paddingHorizontal: 12 }}
          >
            <Ionicons name="home-outline" size={22} color={dark ? '#fff' : '#000'} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={toggleTheme} style={{ paddingHorizontal: 12 }}>
            <Ionicons
              name={dark ? 'sunny-outline' : 'moon-outline'}
              size={22}
              color={dark ? '#FFD60A' : '#000'} // 🌞 yellow button in dark mode
            />
          </TouchableOpacity>
        ),
      })}
    >
      <NotesStack.Screen
        name="Home"
        component={NotesTabs}
        options={{ title: 'Notes', headerShown: true }}
      />
      <NotesStack.Screen
        name="WeeklyLog"
        component={WeeklyLogScreen}
        options={{ title: 'Edit Notes' }}
      />
      <NotesStack.Screen name="Details" component={DetailsScreen} />
    </NotesStack.Navigator>
  );
}


/* ---------------- Root App ---------------- */
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [dark, setDark] = useState(true);
  const toggleTheme = () => setDark((d) => !d);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <NotesProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <NavigationContainer theme={dark ? CustomTheme.DarkTheme : CustomTheme.LightTheme}>
          <RootStack.Navigator initialRouteName="Hub">
            <RootStack.Screen
              name="Hub"
              component={HubScreen}
              options={{
                headerTitle: () => (
                  <Image
                    source={
                      dark
                        ? require('./assets/logo/fleetpulse-dark.png')
                        : require('./assets/logo/fleetpulse-light.png')
                    }
    style={{ width: 220, height: 150, resizeMode: 'contain' }} // bigger logo
                  />
                ),
                headerTitleAlign: 'center',
                headerRight: () => (
  <TouchableOpacity onPress={toggleTheme} style={{ paddingHorizontal: 12 }}>
    <Ionicons
      name={dark ? 'sunny-outline' : 'moon-outline'}
      size={24}
      color={dark ? '#FFD60A' : '#000'} // 🔥 yellow in dark mode
    />
  </TouchableOpacity>
                ),
              }}
            />
            <RootStack.Screen name="NotesStack" options={{ headerShown: false }}>
              {() => <NotesStackNavigator toggleTheme={toggleTheme} dark={dark} />}
            </RootStack.Screen>
            <RootStack.Screen 
              name="TruckDashboard" 
              component={TruckDashboard}
              options={{ 
                title: 'Truck Dashboard',
                headerShown: true,
                headerStyle: {
                  backgroundColor: dark ? '#1a1a1a' : '#f5f5f5',
                },
                headerTintColor: dark ? '#fff' : '#000',
              }}
            />
          </RootStack.Navigator>
        </NavigationContainer>
        <ToastMessage />
      </NotesProvider>
    </AuthProvider>
  );
}
