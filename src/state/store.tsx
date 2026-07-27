import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PersistedV2, Profile } from '../types';

const KEY = 'bubka-app-v1';
const DAY = 'bubka-app-day';

export interface DayLog { date: string; feed: number; diaper: number; water: number; sleepMin: number; sleepStart?: number; awakeSince: number }

interface Store {
  profile: Profile | null;
  ageMonths: number | null;
  ageMonthsReal: number | null;
  ageWeeks: number | null;
  setProfile: (p: Profile) => void;
  resetAll: () => void;
  toast: { icon: string; title: string; sub?: string } | null;
  showToast: (icon: string, title: string, sub?: string) => void;
  day: DayLog;
  bump: (k: 'feed' | 'diaper') => void;
  addWater: (ml: number) => void;
  toggleSleep: () => void;
}

const Ctx = createContext<Store | null>(null);
const today = () => new Date().toDateString();

function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return (JSON.parse(raw) as PersistedV2).profile;
    if (new URLSearchParams(location.search).has('demo')) {
      const bd = new Date(); bd.setMonth(bd.getMonth() - 8); bd.setDate(bd.getDate() - 12);
      return { name: 'Мия', birthDate: bd.toISOString().slice(0, 10), approach: 'both' };
    }
  } catch { /* ignore */ }
  return null;
}
function loadDay(): DayLog {
  try {
    const d = JSON.parse(localStorage.getItem(DAY) || 'null') as DayLog | null;
    if (d && d.date === today()) return { ...d, awakeSince: d.awakeSince ?? Date.now() };
  } catch { /* ignore */ }
  const demo = new URLSearchParams(location.search).has('demo');
  return { date: today(), feed: demo ? 3 : 0, diaper: demo ? 4 : 0, water: demo ? 90 : 0, sleepMin: demo ? 160 : 0,
    awakeSince: demo ? Date.now() - 55 * 60000 : Date.now() };
}

export function monthsBetween(birthDate: string): number {
  const bd = new Date(birthDate), now = new Date();
  let m = (now.getFullYear() - bd.getFullYear()) * 12 + (now.getMonth() - bd.getMonth());
  if (now.getDate() < bd.getDate()) m--;
  return Math.max(0, m);
}
const weeksBetween = (b: string) => Math.max(0, Math.floor((Date.now() - new Date(b).getTime()) / (7 * 864e5)));

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(loadProfile);
  const [day, setDay] = useState<DayLog>(loadDay);
  const [toast, setToast] = useState<Store['toast']>(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: 2, profile } as PersistedV2));
      localStorage.setItem('bubka-app-mtime', String(Date.now()));
      window.dispatchEvent(new Event('bubka-saved'));
    } catch { /* quota */ }
  }, [profile]);
  useEffect(() => { try { localStorage.setItem(DAY, JSON.stringify(day)); } catch { /* quota */ } }, [day]);

  const setProfile = useCallback((p: Profile) => setProfileState(p), []);
  const resetAll = useCallback(() => { localStorage.removeItem(KEY); setProfileState(null); }, []);
  const showToast = useCallback((icon: string, title: string, sub?: string) => {
    setToast({ icon, title, sub });
    window.clearTimeout((showToast as unknown as { t?: number }).t);
    (showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const bump = useCallback((k: 'feed' | 'diaper') => setDay((d) => ({ ...d, [k]: d[k] + 1 })), []);
  const addWater = useCallback((ml: number) => setDay((d) => ({ ...d, water: d.water + ml })), []);
  const toggleSleep = useCallback(() => setDay((d) => {
    if (d.sleepStart) {
      const mins = Math.max(1, Math.round((Date.now() - d.sleepStart) / 60000));
      return { ...d, sleepMin: d.sleepMin + mins, sleepStart: undefined, awakeSince: Date.now() };
    }
    return { ...d, sleepStart: Date.now() };
  }), []);

  const ageMonthsReal = profile ? monthsBetween(profile.birthDate) : null;
  const ageMonths = ageMonthsReal != null && profile
    ? Math.max(0, ageMonthsReal - ((profile.earlyWeeks ?? 0) >= 4 ? Math.round((profile.earlyWeeks ?? 0) / 4.345) : 0))
    : null;
  const ageWeeks = profile ? weeksBetween(profile.birthDate) : null;

  return (
    <Ctx.Provider value={{ profile, ageMonths, ageMonthsReal, ageWeeks, setProfile, resetAll, toast, showToast, day, bump, addWater, toggleSleep }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be inside StoreProvider');
  return s;
}
