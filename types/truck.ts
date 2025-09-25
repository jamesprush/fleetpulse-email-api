export interface Truck {
  id: string;
  vehicleNumber: string;        // e.g. "z203", "z420"
  division: 'NYC' | 'DMV';
  driver: string;
  status: string;              // e.g. "Active", "Maintenance", "Out of Service", custom text
  plate: string;
  mileage: number;
  registration: {
    number: string;
    expiryDate: string;        // MM/DD/YYYY
    state?: string;
  };
  oilChange: {
    lastChange: string;        // MM/DD/YYYY
    nextDue: string;           // MM/DD/YYYY
    mileageAtLastChange: number;
  };
  maintenance: {
    lastService: string;       // MM/DD/YYYY
    nextService: string;       // MM/DD/YYYY
    issues: string[];          // outstanding issues
    priority?: 'low' | 'med' | 'high';
  };
  inspections?: {
    lastInspection?: string;
    nextInspection?: string;
    passed?: boolean;
  };
  location?: string;           // depot or current area
  tags?: string[];             // e.g. ['spare', 'loaner']
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
  search?: string;
  sortBy: 'VEHICLE_NUMBER' | 'MILEAGE' | 'LAST_SERVICE' | 'DRIVER';
  sortOrder: 'ASC' | 'DESC';
}
