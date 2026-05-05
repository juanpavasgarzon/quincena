import { useState, useCallback, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DraftLineItem } from "@/features/periods/usePeriods";

// MMKV is lazy-initialized so the app doesn't crash in Expo Go (missing native module)
let storage: import("react-native-mmkv").MMKV | null = null;
try {
  const { MMKV } = require("react-native-mmkv") as typeof import("react-native-mmkv");
  storage = new MMKV({ id: "period-draft" });
} catch {
  // Fallback: AsyncStorage below
}

const DRAFT_KEY = "current_draft";
const ASYNC_DRAFT_KEY = "quincena_period_draft_v1";

export interface PeriodDraft {
  period_label: string;
  period_sub: string;
  income: number;
  items: DraftLineItem[];
}

function persistDraft(draft: PeriodDraft) {
  const json = JSON.stringify(draft);
  try {
    if (storage) {
      storage.set(DRAFT_KEY, json);
      return;
    }
  } catch {
    /* use async */
  }
  AsyncStorage.setItem(ASYNC_DRAFT_KEY, json).catch(() => {});
}

export function clearDraft() {
  try {
    storage?.delete(DRAFT_KEY);
  } catch {
    /* noop */
  }
  AsyncStorage.removeItem(ASYNC_DRAFT_KEY).catch(() => {});
}

/** Lectura síncrona solo con MMKV */
export function loadDraft(): PeriodDraft | null {
  try {
    const raw = storage?.getString(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PeriodDraft;
  } catch {
    return null;
  }
}

export function usePeriodDraft(initialDraft: PeriodDraft) {
  const [draft, setDraftState] = useState<PeriodDraft>(() => {
    if (storage) {
      return loadDraft() ?? initialDraft;
    }
    return initialDraft;
  });
  const [draftHydrated, setDraftHydrated] = useState(!!storage);

  useEffect(() => {
    if (storage) return;
    let alive = true;
    AsyncStorage.getItem(ASYNC_DRAFT_KEY)
      .then((raw) => {
        if (!alive) return;
        if (!raw) {
          setDraftHydrated(true);
          return;
        }
        try {
          const parsed = JSON.parse(raw) as PeriodDraft;
          setDraftState(parsed);
        } catch {
          /* noop */
        } finally {
          setDraftHydrated(true);
        }
      })
      .catch(() => {
        if (alive) setDraftHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setDraft = useCallback((update: Partial<PeriodDraft> | ((prev: PeriodDraft) => PeriodDraft)) => {
    setDraftState((prev) => {
      const next = typeof update === "function" ? update(prev) : { ...prev, ...update };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => persistDraft(next), 400);
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { draft, setDraft, draftHydrated };
}
