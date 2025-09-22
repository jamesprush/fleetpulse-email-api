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
    visibilityTime: 1500,
    topOffset: 60,
    text1Style: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    style: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginHorizontal: 20,
    },
  });
};
