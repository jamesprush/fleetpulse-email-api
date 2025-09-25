import React from 'react';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#00C851',
        backgroundColor: 'rgba(20, 20, 20, 0.95)',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 16,
        minHeight: 50,
        backdropFilter: 'blur(10px)',
      }}
      contentContainerStyle={{
        paddingHorizontal: 0,
      }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.3,
      }}
      text2Style={{
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        letterSpacing: 0.2,
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#FF4444',
        backgroundColor: 'rgba(20, 20, 20, 0.95)',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 16,
        minHeight: 50,
        backdropFilter: 'blur(10px)',
      }}
      contentContainerStyle={{
        paddingHorizontal: 0,
      }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.3,
      }}
      text2Style={{
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        letterSpacing: 0.2,
      }}
    />
  ),
};

export default function ToastMessage() {
  return <Toast config={toastConfig} />;
}

export const showToast = (text: string, type: 'success' | 'error' = 'success') => {
  Toast.show({
    type: type,
    text1: text,
    position: 'top',
    visibilityTime: 2500,
    topOffset: 60,
  });
};
