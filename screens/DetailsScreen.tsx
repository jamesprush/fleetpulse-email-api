import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp, useTheme } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type DetailsRouteProp = RouteProp<RootStackParamList, 'Details'>;

type Props = {
  route: DetailsRouteProp;
};

export default function DetailsScreen({ route }: Props) {
  const { noteId } = route.params;
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Note Details</Text>
      <Text style={{ color: colors.text }}>ID: {noteId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
});
