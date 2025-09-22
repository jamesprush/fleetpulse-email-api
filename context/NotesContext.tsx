import React, { createContext, useContext, useState } from 'react';

/* ------------------ Types ------------------ */

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
export type Day = typeof DAYS[number];

export type DivisionKey = 'dmv' | 'nyc';

export type DayLog = {
  dmv: string;
  nyc: string;
  academy: string;   // ✅ added academy so Overview/Training tabs stay in sync
};
export type WeeklyLog = Record<Day, DayLog>;

export type WriteupItem = { text: string; done: boolean };
export type WeeklyWriteups = Record<Day, { dmv: WriteupItem[]; nyc: WriteupItem[] }>;

export type TrainingItem = {
  driver: string;
  location: string;  // abbreviation like 'ADVHUN', 'ELIRIM'
  trainer: string;
  van: string;
  division: 'dmv' | 'nyc';
  done: boolean;
};
export type WeeklyTraining = Record<Day, TrainingItem[]>;

export type NotesContextType = {
  weeklyLog: WeeklyLog;
  setWeeklyLog: React.Dispatch<React.SetStateAction<WeeklyLog>>;

  writeups: WeeklyWriteups;
  addWriteup: (day: Day, division: DivisionKey, text: string) => void;
  toggleWriteup: (day: Day, division: DivisionKey, index: number) => void;
  removeWriteup: (day: Day, division: DivisionKey, index: number) => void;

  training: WeeklyTraining;
  addTraining: (day: Day, item: Omit<TrainingItem, 'done'>) => void;
  toggleTraining: (day: Day, index: number) => void;
  removeTraining: (day: Day, index: number) => void;
};

/* ------------------ Helpers ------------------ */

const initWeeklyLog = (): WeeklyLog =>
  DAYS.reduce((acc, d) => {
    acc[d] = { dmv: '', nyc: '', academy: '' };
    return acc;
  }, {} as WeeklyLog);

const initWriteups = (): WeeklyWriteups =>
  DAYS.reduce((acc, d) => {
    acc[d] = { dmv: [], nyc: [] };
    return acc;
  }, {} as WeeklyWriteups);

const initTraining = (): WeeklyTraining =>
  DAYS.reduce((acc, d) => {
    acc[d] = [];
    return acc;
  }, {} as WeeklyTraining);

/* ------------------ Context ------------------ */

const NotesContext = createContext<NotesContextType | null>(null);

export const NotesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [weeklyLog, setWeeklyLog] = useState<WeeklyLog>(initWeeklyLog);
  const [writeups, setWriteups] = useState<WeeklyWriteups>(initWriteups);
  const [training, setTraining] = useState<WeeklyTraining>(initTraining);

  // --- Write-ups ---
  const addWriteup = (day: Day, division: DivisionKey, text: string) => {
    setWriteups(prev => {
      const updated = [...prev[day][division], { text: text.trim(), done: false }];
      return { ...prev, [day]: { ...prev[day], [division]: updated } };
    });
  };

  const toggleWriteup = (day: Day, division: DivisionKey, index: number) => {
    setWriteups(prev => {
      const items = [...prev[day][division]];
      if (items[index]) {
        items[index] = { ...items[index], done: !items[index].done };
      }
      return { ...prev, [day]: { ...prev[day], [division]: items } };
    });
  };

  const removeWriteup = (day: Day, division: DivisionKey, index: number) => {
    setWriteups(prev => {
      const items = [...prev[day][division]];
      items.splice(index, 1);
      return { ...prev, [day]: { ...prev[day], [division]: items } };
    });
  };

  // --- Training ---
  const addTraining = (day: Day, item: Omit<TrainingItem, 'done'>) => {
    console.log('Context addTraining called:', { day, item });
    setTraining(prev => {
      const updated = [...prev[day], { ...item, done: false }];
      console.log('Training state updated:', { day, updated });
      return { ...prev, [day]: updated };
    });
  };

  const toggleTraining = (day: Day, index: number) => {
    setTraining(prev => {
      const items = [...prev[day]];
      if (items[index]) {
        items[index] = { ...items[index], done: !items[index].done };
      }
      return { ...prev, [day]: items };
    });
  };

  const removeTraining = (day: Day, index: number) => {
    setTraining(prev => {
      const items = [...prev[day]];
      items.splice(index, 1);
      return { ...prev, [day]: items };
    });
  };

  return (
    <NotesContext.Provider
      value={{
        weeklyLog,
        setWeeklyLog,
        writeups,
        addWriteup,
        toggleWriteup,
        removeWriteup,
        training,
        addTraining,
        toggleTraining,
        removeTraining,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

/* ------------------ Hook ------------------ */

export const useNotes = () => {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
};
