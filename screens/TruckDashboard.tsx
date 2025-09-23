import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  RefreshControl 
} from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Truck, TruckDashboardFilters } from '../types/truck';

// Sample data - replace with FleetIO API calls
const sampleTrucks: Truck[] = [
  {
    id: "1",
    vehicleNumber: "z203",
    division: "NYC",
    driver: "Ty Robinson",
    status: "c/o (MERCOM)",
    plate: "ABC-123",
    mileage: 125430,
    registration: {
      number: "REG-203",
      expiryDate: "2025-12-15"
    },
    oilChange: {
      lastChange: "2025-08-15",
      nextDue: "2025-11-15",
      mileageAtLastChange: 120000
    },
    maintenance: {
      lastService: "2025-09-01",
      nextService: "2025-12-01",
      issues: ["Brake pads need replacement"]
    },
    location: "New York Depot",
    notes: "Regular maintenance scheduled",
    createdBy: "System",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "2",
    vehicleNumber: "z420",
    division: "NYC",
    driver: "Christian J.",
    status: "(Fleet)",
    plate: "XYZ-789",
    mileage: 98750,
    registration: {
      number: "REG-420",
      expiryDate: "2026-03-20"
    },
    oilChange: {
      lastChange: "2025-07-20",
      nextDue: "2025-10-20",
      mileageAtLastChange: 95000
    },
    maintenance: {
      lastService: "2025-08-15",
      nextService: "2025-11-15",
      issues: []
    },
    location: "Brooklyn Terminal",
    createdBy: "System",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "3",
    vehicleNumber: "dmv001",
    division: "DMV",
    driver: "TBD",
    status: "Available",
    plate: "DMV-001",
    mileage: 45000,
    registration: {
      number: "REG-DMV001",
      expiryDate: "2026-01-10"
    },
    oilChange: {
      lastChange: "2025-06-10",
      nextDue: "2025-09-10",
      mileageAtLastChange: 42000
    },
    maintenance: {
      lastService: "2025-07-05",
      nextService: "2025-10-05",
      issues: []
    },
    location: "DMV Depot",
    notes: "Ready for deployment",
    createdBy: "System",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
];

export default function TruckDashboard() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [selectedDivision, setSelectedDivision] = useState<'NYC' | 'DMV'>('NYC');
  const [trucks, setTrucks] = useState<Truck[]>(sampleTrucks);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<TruckDashboardFilters>({
    division: 'NYC',
    status: 'ALL',
    sortBy: 'VEHICLE_NUMBER',
    sortOrder: 'ASC'
  });

  const filteredTrucks = trucks.filter(truck => {
    if (filters.division !== 'ALL' && truck.division !== filters.division) {
      return false;
    }
    if (filters.status !== 'ALL' && truck.status !== filters.status) {
      return false;
    }
    return true;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleTruckPress = (truck: Truck) => {
    Alert.alert(
      truck.vehicleNumber,
      `Driver: ${truck.driver}\nMileage: ${truck.mileage.toLocaleString()}\nPlate: ${truck.plate}\nLocation: ${truck.location || 'N/A'}`,
      [{ text: 'OK' }]
    );
  };

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
        <View style={[styles.divisionBadge, { backgroundColor: item.division === 'NYC' ? '#4da6ff' : '#ff9500' }]}>
          <Text style={styles.divisionText}>{item.division}</Text>
        </View>
      </View>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="speedometer-outline" size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {item.mileage.toLocaleString()} mi
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="car-outline" size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {item.plate}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {item.location || 'Location TBD'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="construct-outline" size={16} color={item.maintenance.issues.length > 0 ? '#ff6b6b' : colors.text} />
          <Text style={[
            styles.detailText, 
            { color: item.maintenance.issues.length > 0 ? '#ff6b6b' : colors.text }
          ]}>
            {item.maintenance.issues.length > 0 ? 'Maintenance Required' : 'All Good'}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
        {item.maintenance.issues.length > 0 && (
          <View style={styles.issueIndicator}>
            <Text style={styles.issueText}>!</Text>
          </View>
        )}
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

  const nycTrucks = filteredTrucks.filter(truck => truck.division === selectedDivision);
  const truckCount = nycTrucks.length;

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

      <View style={styles.statsBar}>
        <Text style={[styles.statsText, { color: colors.text }]}>
          {truckCount} {selectedDivision} truck{truckCount !== 1 ? 's' : ''}
        </Text>
        <Text style={[styles.statsSubtext, { color: colors.text }]}>
          {nycTrucks.filter(t => t.maintenance.issues.length > 0).length} need attention
        </Text>
      </View>

      <FlatList
        data={nycTrucks}
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  refreshButton: {
    padding: 8,
  },
  divisionSelector: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  divisionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  divisionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  statsSubtext: {
    fontSize: 12,
    opacity: 0.7,
    fontFamily: 'Inter_500Medium',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  truckCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNumber: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    opacity: 0.8,
  },
  divisionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  divisionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    opacity: 0.7,
  },
  issueIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  issueText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    opacity: 0.6,
    fontFamily: 'Inter_500Medium',
  },
});
