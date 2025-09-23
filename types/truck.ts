export interface Truck {
  id: string;
  vehicleNumber: string;        // e.g. "z203", "z420"
  division: 'NYC' | 'DMV';
  driver: string;
  status: string;              // e.g. "c/o (MERCOM)", "(Fleet)"
  plate: string;
  mileage: number;
  registration: {
    number: string;
    expiryDate: string;
  };
  oilChange: {
    lastChange: string;
    nextDue: string;
    mileageAtLastChange: number;
  };
  maintenance: {
    lastService: string;
    nextService: string;
    issues: string[];
  };
  location?: string;
  notes?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface FleetIOData {
  // FleetIO API response structure
  id: number;
  name: string;
  vin: string;
  license_plate: string;
  mileage: number;
  fuel_type: string;
  engine_type: string;
  year: number;
  make: string;
  model: string;
  // Add more fields as needed from FleetIO API
}

export interface TruckDashboardFilters {
  division: 'NYC' | 'DMV' | 'ALL';
  status: 'ALL' | 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  sortBy: 'VEHICLE_NUMBER' | 'MILEAGE' | 'LAST_SERVICE' | 'DRIVER';
  sortOrder: 'ASC' | 'DESC';
}
