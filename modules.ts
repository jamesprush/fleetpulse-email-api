// modules.ts
// Standalone types so this file works before we add AuthContext.
export type Role = 'driver' | 'manager' | 'admin';

export type ModuleDef = {
  id: string;
  title: string;
  subtitle?: string;
  icon: { pack: 'Ionicons'; name: string };
  // We'll wire this to a stack in App later:
  route: 'NotesStack';
  roles: Role[]; // who can see it
};

export const MODULES: ModuleDef[] = [
  {
    id: 'notes',
    title: 'FleetPulse Notes',
    subtitle: 'DMV • NYC • Training',
    icon: { pack: 'Ionicons', name: 'document-text-outline' },
    route: 'NotesStack',
    roles: ['manager', 'admin'],
  },
  // Add more modules later (Dashboard, Roster, Comms, etc.)
];
