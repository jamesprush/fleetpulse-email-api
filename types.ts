// types.ts
export type RootStackParamList = {
  Hub: undefined;          // NEW: FleetPulse hub
  NotesStack: undefined;   // NEW: parent for your existing Notes tabs/flows

  // Inside NotesStack:
  Home: undefined;         // your tabs (Overview, Write-ups, Training)
  WeeklyLog: undefined;
  Details: { noteId: string };
};
