"use client";

import React, {
  createContext, useContext, useEffect,
  useState, useCallback, ReactNode, useRef,
} from "react";
import {
  AppState, Observation, Harvest, Notification,
  loadState, saveState,
  addObservation as storeAddObs,
  addHarvest as storeAddHarvest,
  markNotificationRead as storeMark,
  markAllNotificationsRead as storeMarkAll,
  getDueNotifications,
  GROWTH_MODELS,
} from "@/lib/store";
import {
  OnChainThrow, OnChainHarvest,
  fetchThrowsForAddress, fetchHarvestsForAddress,
} from "@/lib/algorand";
import { useWallet } from "./WalletContext";
import { v4 as uuid } from "uuid";

// ─── Unified throw type (on-chain + local fallback) ───────────────────────────

export interface UnifiedThrow extends OnChainThrow {
  // local-only fields (observations are still localStorage)
  localId: string;
}

interface Ctx {
  // Auth
  userName: string;
  setUserName: (n: string) => void;

  // Throws (from chain)
  throws: UnifiedThrow[];
  throwsLoading: boolean;
  throwsError: string | null;
  refreshThrows: () => Promise<void>;

  // Pending throws (optimistic, before chain confirms)
  pendingThrows: UnifiedThrow[];
  addPendingThrow: (t: UnifiedThrow) => void;

  // Observations (localStorage)
  observations: Observation[];
  addObservation: (data: Omit<Observation, "id" | "observedAt">) => Observation;

  // Harvests (from chain + localStorage fallback)
  onChainHarvests: OnChainHarvest[];
  localHarvests: Harvest[];
  addLocalHarvest: (data: Omit<Harvest, "id" | "harvestedAt">) => Harvest;

  // Notifications (localStorage, seeded from throw data)
  notifications: Notification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: number;

  // Local state management
  reload: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { address } = useWallet();

  // On-chain state
  const [throws, setThrows]               = useState<UnifiedThrow[]>([]);
  const [throwsLoading, setThrowsLoading] = useState(false);
  const [throwsError, setThrowsError]     = useState<string | null>(null);
  const [pendingThrows, setPending]       = useState<UnifiedThrow[]>([]);
  const [onChainHarvests, setHarvests]    = useState<OnChainHarvest[]>([]);

  // Local state
  const [localState, setLocalState] = useState<AppState>({
    user: null, throws: [], observations: [], harvests: [], notifications: [],
  });

  const isFetching = useRef(false);

  const reload = useCallback(() => {
    setLocalState(loadState());
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Refresh every minute for notification delivery
  useEffect(() => {
    const t = setInterval(reload, 60_000);
    return () => clearInterval(t);
  }, [reload]);

  // Fetch on-chain data whenever wallet connects
  const refreshThrows = useCallback(async () => {
    if (!address || isFetching.current) return;
    isFetching.current = true;
    setThrowsLoading(true);
    setThrowsError(null);

    try {
      const [chainThrows, chainHarvests] = await Promise.all([
        fetchThrowsForAddress(address),
        fetchHarvestsForAddress(address),
      ]);

      const unified: UnifiedThrow[] = chainThrows.map((t) => ({
        ...t,
        localId: `chain-${t.asaId}`,
      }));

      setThrows(unified);
      setHarvests(chainHarvests);
      setPending([]);

      // Seed notifications for any throws that don't have them yet
      seedNotificationsForThrows(unified);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load throws";
      setThrowsError(msg);
      console.warn("refreshThrows failed:", err);
    } finally {
      setThrowsLoading(false);
      isFetching.current = false;
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      refreshThrows();
    } else {
      setThrows([]);
      setHarvests([]);
      setPending([]);
    }
  }, [address, refreshThrows]);

  // ── Notification seeding ────────────────────────────────────────────────────

  function seedNotificationsForThrows(unifiedThrows: UnifiedThrow[]) {
    const state = loadState();
    const existingThrowIds = new Set(
      state.notifications.map((n) => n.throwId)
    );

    let changed = false;
    const newNotifs: Notification[] = [];

    for (const t of unifiedThrows) {
      const throwKey = `chain-${t.asaId}`;
      if (existingThrowIds.has(throwKey)) continue;

      const model = GROWTH_MODELS.find((m) => m.id === t.growthModelId);
      if (!model) continue;

      const throwDate = new Date(t.throwDate);
      const now = new Date();

      for (const stage of model.stages) {
        const stageDate = new Date(throwDate);
        stageDate.setDate(stageDate.getDate() + stage.dayStart);
        if (stageDate < now) continue;

        newNotifs.push({
          id:           uuid(),
          throwId:      throwKey,
          stageId:      stage.id,
          stageName:    stage.name,
          stageIcon:    stage.icon,
          title:        `${stage.icon} ${stage.name} stage starting`,
          body:         stage.whatToExpect,
          scheduledFor: stageDate.toISOString(),
          read:         false,
          createdAt:    new Date().toISOString(),
        });
      }
      changed = true;
    }

    if (changed) {
      const updated = {
        ...state,
        notifications: [...newNotifs, ...state.notifications],
      };
      saveState(updated);
      setLocalState(updated);
    }
  }

  // ── Observations (localStorage) ─────────────────────────────────────────────

  const addObservation = useCallback(
    (data: Omit<Observation, "id" | "observedAt">) => {
      const o = storeAddObs(data);
      reload();
      return o;
    },
    [reload]
  );

  // ── Local harvests (fallback when not yet on chain) ──────────────────────────

  const addLocalHarvest = useCallback(
    (data: Omit<Harvest, "id" | "harvestedAt">) => {
      const h = storeAddHarvest(data);
      reload();
      return h;
    },
    [reload]
  );

  // ── Pending throws (optimistic UI) ───────────────────────────────────────────

  const addPendingThrow = useCallback((t: UnifiedThrow) => {
    setPending((prev) => [t, ...prev]);
  }, []);

  // ── Notifications ────────────────────────────────────────────────────────────

  const markRead = useCallback((id: string) => {
    storeMark(id);
    reload();
  }, [reload]);

  const markAllRead = useCallback(() => {
    storeMarkAll();
    reload();
  }, [reload]);

  const dueNotifs = getDueNotifications(localState.notifications);

  // ── Username (stored locally alongside wallet) ────────────────────────────

  const [userName, setUserNameState] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("eden-pods-username") ?? "";
  });

  const setUserName = (name: string) => {
    localStorage.setItem("eden-pods-username", name);
    setUserNameState(name);
  };

  // All throws = confirmed on-chain + pending (optimistic)
  const allThrows = [...pendingThrows, ...throws];

  return (
    <AppCtx.Provider value={{
      userName,
      setUserName,
      throws: allThrows,
      throwsLoading,
      throwsError,
      refreshThrows,
      pendingThrows,
      addPendingThrow,
      observations:    localState.observations,
      addObservation,
      onChainHarvests,
      localHarvests:   localState.harvests,
      addLocalHarvest,
      notifications:   localState.notifications,
      markRead,
      markAllRead,
      unreadCount:     dueNotifs.length,
      reload,
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
