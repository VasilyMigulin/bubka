// «Одно главное на сегодня» — единственное приоритетное решение дня.
// Ротация по дням даёт ощущение «каждый день другое», sleep-overdue перебивает всё.
import type { Domain } from '../types';

export interface MainAction {
  minM: number; maxM: number; domain: Domain;
  e: string; kicker: string; title: string; cta: string; why?: string;
}

export const MAIN_ACTIONS: MainAction[] = [
  // 0–3 мес
  { minM: 0, maxM: 3, domain: 'sleep', e: '💤', kicker: 'Сегодня главное', title: 'Ловите ранние признаки усталости — зевки и потирание глаз', cta: 'Про окна сна' },
  { minM: 0, maxM: 3, domain: 'development', e: '👀', kicker: 'Сегодня главное', title: 'Побудьте лицом к лицу — разговаривайте и показывайте эмоции', cta: 'Почему это важно' },
  { minM: 0, maxM: 3, domain: 'mom', e: '🤍', kicker: 'Сегодня — про вас', title: 'Поспите, когда спит малыш. Порядок подождёт', cta: 'Поддержка для мамы' },
  // 4–5 мес
  { minM: 3, maxM: 5, domain: 'development', e: '🤸', kicker: 'Сегодня главное', title: 'Больше времени на животике — укрепляем спину и шею', cta: 'Как играть' },
  { minM: 4, maxM: 5, domain: 'feeding', e: '🥄', kicker: 'Сегодня главное', title: 'Проверьте признаки готовности к прикорму', cta: 'Открыть чек-лист' },
  { minM: 3, maxM: 5, domain: 'sleep', e: '💤', kicker: 'Сегодня главное', title: 'Регресс 4 месяцев — держите ритуал, это временно', cta: 'Пережить регресс' },
  // 6–8 мес
  { minM: 6, maxM: 8, domain: 'feeding', e: '🐟', kicker: 'Сегодня главное', title: 'Познакомить с рыбой — треска мягкая и без костей', cta: 'Как подать', why: 'рыба — источник омега-3 и белка, важна после полугода' },
  { minM: 6, maxM: 8, domain: 'development', e: '🧠', kicker: 'Сегодня главное', title: 'Игра дня: перекладываем помпоны — учим пинцетный захват', cta: 'Как играть', why: 'пинцетный захват готовит руку к самостоятельной еде' },
  { minM: 6, maxM: 8, domain: 'feeding', e: '🥑', kicker: 'Сегодня главное', title: 'Повторите знакомое — авокадо или брокколи снова', cta: 'Почему повторять', why: 'вкус принимается с 8–15 попытки, повторы важнее новинок' },
  { minM: 8, maxM: 8, domain: 'sleep', e: '🌙', kicker: 'Сегодня главное', title: 'Увеличьте окно бодрствования на 15 минут', cta: 'Про режим', why: 'малыш подрос — старое окно стало коротким, отсюда протесты на укладывание' },
  // 9–12 мес
  { minM: 9, maxM: 12, domain: 'development', e: '👋', kicker: 'Сегодня главное', title: 'Учим махать «пока» и показывать пальцем', cta: 'Игры на общение' },
  { minM: 9, maxM: 12, domain: 'feeding', e: '🍽', kicker: 'Сегодня главное', title: 'Дайте есть руками — мягкие кусочки и ложку', cta: 'Идеи блюд' },
  { minM: 9, maxM: 12, domain: 'sleep', e: '😴', kicker: 'Сегодня главное', title: 'Скоро переход на 1 сон — понаблюдайте за утренним', cta: 'Как перейти' },
  // 12–18 мес
  { minM: 12, maxM: 18, domain: 'development', e: '📖', kicker: 'Сегодня главное', title: 'Читайте книжку — показывайте и называйте картинки', cta: 'Игры на речь' },
  { minM: 12, maxM: 18, domain: 'feeding', e: '🍲', kicker: 'Сегодня главное', title: 'Готовьте вместе — общий стол без соли и сахара', cta: 'Что приготовить' },
  { minM: 15, maxM: 18, domain: 'behavior', e: '🫂', kicker: 'Сегодня главное', title: 'Первые истерики — назовите чувство: «тебе обидно»', cta: 'Как реагировать' },
  // 18–36 мес
  { minM: 18, maxM: 36, domain: 'development', e: '🗣', kicker: 'Сегодня главное', title: 'Расширяйте фразы: он «мяч» — вы «да, большой синий мяч»', cta: 'Игры на речь' },
  { minM: 24, maxM: 36, domain: 'behavior', e: '🤝', kicker: 'Сегодня главное', title: 'Давайте выбор из двух — «яблоко или банан?». Меньше «нет»', cta: 'Про кризис 2 лет' },
  { minM: 18, maxM: 36, domain: 'feeding', e: '👨‍🍳', kicker: 'Сегодня главное', title: 'Пусть помогает готовить — мытьё, перемешивание', cta: 'Идеи' },
];

/** Одно главное действие на сегодня: sleep-overdue перебивает, иначе ротация по дню. */
export function mainToday(ageM: number, daySeed: number, sleepOverdue: boolean): MainAction {
  if (sleepOverdue) {
    const s = MAIN_ACTIONS.find((a) => a.domain === 'sleep' && ageM >= a.minM && ageM <= a.maxM);
    if (s) return { ...s, e: '🌙', kicker: 'Сейчас важно', title: 'Окно бодрствования заканчивается — пора укладывать', cta: 'Начать сон' };
  }
  const pool = MAIN_ACTIONS.filter((a) => ageM >= a.minM && ageM <= a.maxM);
  if (!pool.length) return MAIN_ACTIONS[0];
  return pool[daySeed % pool.length];
}
