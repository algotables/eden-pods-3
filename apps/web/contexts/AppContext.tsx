"use client";

import React, {
  createContext, useContext, useEffect,
  useState, useCallback, ReactNode,
} from "react";
import {
  AppState, User, Throw, Observation, Harvest,
  loadState, saveState, signIn as storeSignIn, signOut as storeSignOut,
  addThrow as storeAddThrow, addObservation as storeAddObs,
  addHarvest as storeAddHarvest, markNotificationRead as storeMark,
  markAllNotificationsRead as storeMarkAll, getDueNotifications,
} from "@/lib/store";

interface Ctx extends AppState {
  signIn: (name: string) => void;
  signOut: () => void;
  addThrow: (data: Omit<Throw, "id" | "createdAt">) => Throw;
  addObservation: (data: Omit<Observation, "id" | "observedAt">) => Observation;
  addHarvest: (data: Omit<Harvest, "id" | "harvestedAt">) => Harvest;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: number;
  reload: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null, throws: [], observations: [], harvests: [], notifications: [],
  });

  const reload = useCallback(() => {
    setState(loadState());
  }, []);

  // Load from localStorage on mount
  useEffect(() => { reload(); }, [reload]);

  // Refresh every minute so scheduled notifications appear automatically
  useEffect(() => {
    const t = setInterval(reload, 60_000);
    return () => clearInterval(t);
  }, [reload]);

  const signIn = (name: string) => {
    storeSignIn(name);
    reload();
  };

  const signOut = () => {
    storeSignOut();
    reload();
  };

  const addThrow = (data: Omit<Throw, "id" | "createdAt">) => {
    const t = storeAddThrow(data);
    reload();
    return t;
  };

  const addObservation = (data: Omit<Observation, "id" | "observedAt">) => {
    const o = storeAddObs(data);
    reload();
    return o;
  };

  const addHarvest = (data: Omit<Harvest, "id" | "harvestedAt">) => {
    const h = storeAddHarvest(data);
    reload();
    return h;
  };

  const markRead = (id: string) => {
    storeMark(id);
    reload();
  };

  const markAllRead = () => {
    storeMarkAll();
    reload();
  };

  const dueNotifs = getDueNotifications(state.notifications);
  const unreadCount = dueNotifs.length;

  return (
    <AppCtx.Provider value={{
      ...state, signIn, signOut,
      addThrow, addObservation, addHarvest,
      markRead, markAllRead, unreadCount, reload,
    }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
