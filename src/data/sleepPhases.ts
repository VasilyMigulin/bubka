// Фазы бодрствования с цветами и ежедневными подсказками-занятиями.
export type PhaseKey = 'active' | 'calm' | 'ritual' | 'overdue';

export interface Phase { key: PhaseKey; e: string; label: string; hint: string }

export const PHASES: Record<PhaseKey, Phase> = {
  active: { key: 'active', e: '🤸', label: 'Активное бодрствование', hint: 'Энергии много — самое время двигаться и играть' },
  calm: { key: 'calm', e: '🧸', label: 'Спокойное бодрствование', hint: 'Снижаем обороты — тихие игры и приглушённый свет' },
  ritual: { key: 'ritual', e: '🛁', label: 'Пора к ритуалу', hint: 'Готовимся ко сну — предсказуемо и спокойно' },
  overdue: { key: 'overdue', e: '😴', label: 'Пора укладывать', hint: 'Ловим признаки усталости и укладываем' },
};

export function phaseKey(r: number): PhaseKey {
  if (r < 0.55) return 'active';
  if (r < 0.82) return 'calm';
  if (r < 1) return 'ritual';
  return 'overdue';
}

// Занятия по фазам — ротируются по дню.
const ACTIVITIES: Record<PhaseKey, string[]> = {
  active: ['догонялки на четвереньках 🐛', 'танцы на руках под музыку 💃', 'катаем мячик друг другу 🏐', 'прятки «ку-ку» 🙈', 'гримасы в зеркало 🪞', 'тянемся за игрушкой 🧸'],
  calm: ['книжка с плотными страницами 📖', 'собираем пирамидку 🧩', 'перебираем разные фактуры 🧺', 'тихие обнимашки и разговор 🤍', 'пальчиковые игры ✋', 'наблюдаем в окно 🪟'],
  ritual: ['тёплая ванна 🛁', 'колыбельная и покачивание 🎵', 'приглушите свет, задёрните шторы 🌙', 'спокойный массаж с кремом 💆', 'обнимашки в кроватке 🧸', 'шёпотом про хороший день 💛'],
  overdue: ['уложить без стимуляции — свет прочь, тишина 🌑', 'на ручки и покачать 🤱', 'спокойно в кроватку, рядом мама 😴'],
};

export function activityFor(key: PhaseKey, daySeed: number): string {
  const pool = ACTIVITIES[key];
  return pool[daySeed % pool.length];
}
