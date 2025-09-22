// context/AuthContext.tsx
import React, {createContext, useContext, useMemo, useState} from 'react';

export type Role = 'driver' | 'manager' | 'admin';

type User = {
  id: string;
  name: string;
  roles: Role[];
};

type AuthCtx = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  hasRole: (...roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  // Stubbed: you can swap with real login later.
  const [user, setUser] = useState<User>({
    id: 'u_1',
    name: 'James',
    roles: ['admin', 'manager'],
  });

  const value = useMemo<AuthCtx>(() => ({
    user,
    setUser,
    hasRole: (...roles: Role[]) => {
      if (!user) return false;
      return roles.some(r => user.roles.includes(r));
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
