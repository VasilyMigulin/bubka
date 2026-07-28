// Журнал навыков: мама отмечает, что малыш уже умеет — приложение подстраивается.
const KEY = 'bubka-app-skills';

export function masteredSkills(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]') as string[]); } catch { return new Set(); }
}
export function markSkill(id: string): void {
  const s = masteredSkills(); s.add(id);
  localStorage.setItem(KEY, JSON.stringify([...s]));
}
export function unmarkSkill(id: string): void {
  const s = masteredSkills(); s.delete(id);
  localStorage.setItem(KEY, JSON.stringify([...s]));
}
