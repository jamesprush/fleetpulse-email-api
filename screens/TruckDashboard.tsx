import React, { useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
  TextInput 
} from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Truck, TruckDashboardFilters } from '../types/truck';
import { nyTrucks } from '../data/nyTrucks';

export default function TruckDashboard() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [selectedDivision, setSelectedDivision] = useState<'NYC' | 'DMV'>('NYC');
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<TruckDashboardFilters>({
    division: 'NYC',
    status: 'ALL',
    search: '',
    sortBy: 'VEHICLE_NUMBER',
    sortOrder: 'ASC'
  });

  const allTrucks: Truck[] = useMemo(() => {
    // DMV could be added later; for now use NYC dataset
    return nyTrucks;
  }, []);

  const filteredTrucks = useMemo(() => {
    let trucks = allTrucks.filter(t => t.division === selectedDivision);

    if (filters.status !== 'ALL') {
      const map: any = {
        ACTIVE: 'Active',
        MAINTENANCE: 'Maintenance',
        OUT_OF_SERVICE: 'Out of Service',
      };
      trucks = trucks.filter(t => t.status.toLowerCase().includes((map[filters.status] || '').toLowerCase()));
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      trucks = trucks.filter(t =>
        t.vehicleNumber.toLowerCase().includes(q) ||
        t.driver.toLowerCase().includes(q) ||
        t.plate.toLowerCase().includes(q) ||
        (t.location || '').toLowerCase().includes(q)
      );
    }

    const sorters: Record<TruckDashboardFilters['sortBy'], (a: Truck, b: Truck) => number> = {
      VEHICLE_NUMBER: (a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber, undefined, { numeric: true }),
      MILEAGE: (a, b) => a.mileage - b.mileage,
      LAST_SERVICE: (a, b) => new Date(a.maintenance.lastService).getTime() - new Date(b.maintenance.lastService).getTime(),
      DRIVER: (a, b) => a.driver.localeCompare(b.driver),
    };

    const sorted = [...trucks].sort(sorters[filters.sortBy]);
    if (filters.sortOrder === 'DESC') sorted.reverse();
    return sorted;
  }, [allTrucks, filters, selectedDivision]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const Stats = () => {
    const total = filteredTrucks.length;
    const issues = filteredTrucks.filter(t => t.maintenance.issues.length > 0).length;
    const dueOil = filteredTrucks.filter(t => t.oilChange.nextDue).length; // placeholder
    return (
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{total}</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Trucks</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: issues ? '#ff6b6b' : colors.text }]}>{issues}</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Need Attention</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{dueOil}</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Oil Due</Text>
        </View>
      </View>
    );
  };

  const Toolbar = () => (
    <View style={styles.toolbar}>
      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.text} />
        <TextInput
          placeholder="Search vehicle, driver, plate"
          placeholderTextColor={colors.text + '80'}
          style={[styles.searchInput, { color: colors.text }]}
          value={filters.search}
          onChangeText={(v) => setFilters(prev => ({ ...prev, search: v }))}
        />
      </View>
      <View style={[styles.sortPills]}>
        <TouchableOpacity onPress={() => setFilters(p => ({ ...p, sortBy: 'VEHICLE_NUMBER' }))} style={[styles.pill, filters.sortBy === 'VEHICLE_NUMBER' && { backgroundColor: colors.primary }]}>
          <Text style={[styles.pillText, { color: filters.sortBy === 'VEHICLE_NUMBER' ? '#fff' : colors.text }]}>Vehicle</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilters(p => ({ ...p, sortBy: 'MILEAGE' }))} style={[styles.pill, filters.sortBy === 'MILEAGE' && { backgroundColor: colors.primary }]}>
          <Text style={[styles.pillText, { color: filters.sortBy === 'MILEAGE' ? '#fff' : colors.text }]}>Mileage</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilters(p => ({ ...p, sortBy: 'DRIVER' }))} style={[styles.pill, filters.sortBy === 'DRIVER' && { backgroundColor: colors.primary }]}>
          <Text style={[styles.pillText, { color: filters.sortBy === 'DRIVER' ? '#fff' : colors.text }]}>Driver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleTruckPress = (truck: Truck) => {
    Alert.alert(
      truck.vehicleNumber,
      `Driver: ${truck.driver}\nMileage: ${truck.mileage.toLocaleString()}\nPlate: ${truck.plate}\nLocation: ${truck.location || 'N/A'}`,
      [{ text: 'OK' }]
    );
  };

  const Badge = ({ label, color }: { label: string; color: string }) => (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );

  const renderTruckCard = ({ item }: { item: Truck }) => (
    <TouchableOpacity 
      style={[styles.truckCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleTruckPress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={[styles.vehicleNumber, { color: colors.primary }]}>{item.vehicleNumber}</Text>
          <Text style={[styles.driverName, { color: colors.text }]}>{item.driver}</Text>
        </View>
        <View style={styles.rightHeader}>
          {item.tags?.includes('spare') && <Badge label="SPARE" color="#6c757d" />}
          {item.maintenance.issues.length > 0 && <Badge label="ISSUES" color="#ff6b6b" />}
          <View style={[styles.divisionBadge, { backgroundColor: item.division === 'NYC' ? '#4da6ff' : '#ff9500' }]}>
            <Text style={styles.divisionText}>{item.division}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <Ionicons name="speedometer-outline" size={16} color={colors.text} />
          <Text style={[styles.metricLabel, { color: colors.text }]}>Mileage</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>{item.mileage.toLocaleString()} mi</Text>
        </View>
        <View style={styles.metricCell}>
          <Ionicons name="card-outline" size={16} color={colors.text} />
          <Text style={[styles.metricLabel, { color: colors.text }]}>Plate</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>{item.plate}</Text>
        </View>
        <View style={styles.metricCell}>
          <Ionicons name="calendar-outline" size={16} color={colors.text} />
          <Text style={[styles.metricLabel, { color: colors.text }]}>Reg. Exp</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>{item.registration.expiryDate}</Text>
        </View>
        <View style={styles.metricCell}>
          <Ionicons name="build-outline" size={16} color={colors.text} />
          <Text style={[styles.metricLabel, { color: colors.text }]}>Last Serv.</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>{item.maintenance.lastService}</Text>
        </View>
      </View>

      {item.maintenance.issues.length > 0 && (
        <View style={styles.issueRow}>
          <Ionicons name="alert-circle" size={16} color="#ff6b6b" />
          <Text style={styles.issueText}>{item.maintenance.issues.join(', ')}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
        <Text style={[styles.locationText, { color: colors.text }]}>{item.location || 'Location TBD'}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderDivisionSelector = () => (
    <View style={[styles.divisionSelector, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        style={[
          styles.divisionButton,
          selectedDivision === 'NYC' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setSelectedDivision('NYC')}
      >
        <Text style={[
          styles.divisionButtonText,
          { color: selectedDivision === 'NYC' ? '#fff' : colors.text }
        ]}>
          NYC Trucks
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.divisionButton,
          selectedDivision === 'DMV' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setSelectedDivision('DMV')}
      >
        <Text style={[
          styles.divisionButtonText,
          { color: selectedDivision === 'DMV' ? '#fff' : colors.text }
        ]}>
          DMV Trucks
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Truck Dashboard</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {renderDivisionSelector()}
      <Toolbar />
      <Stats />

      <FlatList
        data={filteredTrucks}
        keyExtractor={(item) => item.id}
        renderItem={renderTruckCard}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color={colors.text} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No {selectedDivision} trucks found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  refreshButton: { padding: 8 },

  divisionSelector: { flexDirection: 'row', margin: 16, borderRadius: 12, padding: 4 },
  divisionButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  divisionButtonText: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },

  toolbar: { paddingHorizontal: 16, marginBottom: 8 },
  searchBox: { flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  sortPills: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'transparent' },
  pillText: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },

  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, opacity: 0.7, marginTop: 2, fontFamily: 'Inter_500Medium' },

  list: { flex: 1 },
  listContent: { padding: 16 },
  truckCard: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  vehicleInfo: { flex: 1 },
  vehicleNumber: { fontSize: 20, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 4 },
  driverName: { fontSize: 14, fontWeight: '500', fontFamily: 'Inter_500Medium', opacity: 0.8 },
  rightHeader: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  divisionBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  divisionText: { color: '#fff', fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  metricCell: { width: '48%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, gap: 4 },
  metricLabel: { fontSize: 11, opacity: 0.7, fontFamily: 'Inter_500Medium' },
  metricValue: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },

  issueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  issueText: { color: '#ff6b6b', fontSize: 12, fontFamily: 'Inter_500Medium' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  statusText: { fontSize: 12, fontFamily: 'Inter_500Medium', opacity: 0.7 },
  locationText: { fontSize: 12, fontFamily: 'Inter_500Medium', opacity: 0.7 },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyText: { fontSize: 16, marginTop: 16, opacity: 0.6, fontFamily: 'Inter_500Medium' },
});
