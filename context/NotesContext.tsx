import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  setWriteups: React.Dispatch<React.SetStateAction<WeeklyWriteups>>;
  addWriteup: (day: Day, division: DivisionKey, text: string) => void;
  toggleWriteup: (day: Day, division: DivisionKey, index: number) => void;
  removeWriteup: (day: Day, division: DivisionKey, index: number) => void;

  training: WeeklyTraining;
  setTraining: React.Dispatch<React.SetStateAction<WeeklyTraining>>;
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

  // Load data from storage on app start
  useEffect(() => {
    loadDataFromStorage();
  }, []);

  // Save data to storage whenever it changes
  useEffect(() => {
    saveDataToStorage();
  }, [weeklyLog, writeups, training]);

  const loadDataFromStorage = async () => {
    try {
      const [savedLog, savedWriteups, savedTraining] = await Promise.all([
        AsyncStorage.getItem('fleetpulse_weeklyLog'),
        AsyncStorage.getItem('fleetpulse_writeups'),
        AsyncStorage.getItem('fleetpulse_training'),
      ]);

      if (savedLog) {
        const parsedLog = JSON.parse(savedLog);
        setWeeklyLog(parsedLog);
      }

      if (savedWriteups) {
        const parsedWriteups = JSON.parse(savedWriteups);
        setWriteups(parsedWriteups);
      }

      if (savedTraining) {
        const parsedTraining = JSON.parse(savedTraining);
        setTraining(parsedTraining);
      }
    } catch (error) {
      console.error('Error loading data from storage:', error);
    }
  };

  const saveDataToStorage = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('fleetpulse_weeklyLog', JSON.stringify(weeklyLog)),
        AsyncStorage.setItem('fleetpulse_writeups', JSON.stringify(writeups)),
        AsyncStorage.setItem('fleetpulse_training', JSON.stringify(training)),
      ]);
    } catch (error) {
      console.error('Error saving data to storage:', error);
    }
  };

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
        setWriteups,
        addWriteup,
        toggleWriteup,
        removeWriteup,
        training,
        setTraining,
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
