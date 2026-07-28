// Модель данных большого приложения bubka (компаньон 0–3).

export type FeedingApproach = 'puree' | 'blw' | 'both';

export interface Profile {
  name: string;
  birthDate: string;        // ISO yyyy-mm-dd
  approach: FeedingApproach;
  photo?: string;
  earlyWeeks?: number;      // недоношенность → скорректированный возраст
  sleepMode?: 'crib' | 'cosleep'; // как укладывают: раздельно / совместный сон
}

/** Сфера дайджеста — из какой части жизни малыша карточка. */
export type Domain = 'development' | 'sleep' | 'feeding' | 'leap' | 'behavior' | 'mom';

export interface DigestCard {
  domain: Domain;
  minM: number;             // от скольких месяцев показывать
  maxM: number;             // до скольких (включительно нижняя граница диапазона)
  e: string;                // эмодзи
  eyebrow: string;          // подпись сферы
  title: string;
  text: string;
  cta?: string;             // текст действия
}

export interface PersistedV2 {
  v: 2;
  profile: Profile | null;
}
