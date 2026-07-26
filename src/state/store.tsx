import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PersistedV2, Profile } from '../types';

const KEY = 'bubka-app-v1';

interface Store {
  profile: Profile | null;
  ageMonths: number | null;       // скорректированный (для недоношенных)
  ageMonthsReal: number | null;
  ageWeeks: number | null;
  setProfile: (p: Profile) => void;
  resetAll: () => void;
  toast: { icon: string; title: string; sub?: string } | null;
  showToast: (icon: string, title: string, sub?: string) => void;
}

const Ctx = createContext<Store | null>(null);

function load(): Profile | null {
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

export function monthsBetween(birthDate: string): number {
  const bd = new Date(birthDate), now = new Date();
  let m = (now.getFullYear() - bd.getFullYear()) * 12 + (now.getMonth() - bd.getMonth());
  if (now.getDate() < bd.getDate()) m--;
  return Math.max(0, m);
}
function weeksBetween(birthDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(birthDate).getTime()) / (7 * 864e5)));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(load);
  const [toast, setToast] = useState<Store['toast']>(null);

  useEffect(() => {
    const data: PersistedV2 = { v: 2, profile };
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      localStorage.setItem('bubka-app-mtime', String(Date.now()));
      window.dispatchEvent(new Event('bubka-saved'));
    } catch { /* quota */ }
  }, [profile]);

  const setProfile = useCallback((p: Profile) => setProfileState(p), []);
  const resetAll = useCallback(() => { localStorage.removeItem(KEY); setProfileState(null); }, []);
  const showToast = useCallback((icon: string, title: string, sub?: string) => {
    setToast({ icon, title, sub });
    window.clearTimeout((showToast as unknown as { t?: number }).t);
    (showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const ageMonthsReal = profile ? monthsBetween(profile.birthDate) : null;
  const ageMonths = ageMonthsReal != null && profile
    ? Math.max(0, ageMonthsReal - ((profile.earlyWeeks ?? 0) >= 4 ? Math.round((profile.earlyWeeks ?? 0) / 4.345) : 0))
    : null;
  const ageWeeks = profile ? weeksBetween(profile.birthDate) : null;

  return (
    <Ctx.Provider value={{ profile, ageMonths, ageMonthsReal, ageWeeks, setProfile, resetAll, toast, showToast }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be inside StoreProvider');
  return s;
}
