// theme.ts
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';

export const DarkTheme = {
  ...NavigationDarkTheme,
  dark: true,
  colors: {
    ...NavigationDarkTheme.colors,
    background: '#000000',
    card: '#111111',
    text: '#ffffff',
    border: '#222222',
    primary: '#FF9500',
    notification: '#ff453a',
  },
};

export const LightTheme = {
  ...NavigationDefaultTheme,
  dark: false,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: '#f9f9f9',
    card: '#ffffff',
    text: '#000000',
    border: '#dddddd',
    primary: '#FF9500',
    notification: '#ff3b30',
  },
};

// fonts kept separate
export const AppFonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
};
