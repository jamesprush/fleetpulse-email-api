import React from 'react';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

export default function ToastMessage() {
  return <Toast />;
}

export const showToast = (text: string) => {
  Toast.show({
    type: 'success',
    text1: text,
    position: 'top',
    visibilityTime: 2000,
    topOffset: 80,
    text1Style: {
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
      fontFamily: 'Inter_600SemiBold',
    },
    style: {
      backgroundColor: 'rgba(255, 149, 0, 0.95)',
      borderRadius: 25,
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginHorizontal: 24,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      shadowColor: '#FF9500',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  });
};
