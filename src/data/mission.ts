// «Миссия дня» — 2–3 маленьких дела на сегодня с галочками. Геймификация без ощущения игры.
export interface MissionTask { id: string; e: string; text: string }

/** Задачи дня по возрасту. Стабильны в течение дня, меняются со сменой суток. */
export function missionFor(ageM: number, daySeed: number): MissionTask[] {
  const pool: MissionTask[] = [];
  // всегда — момент на память
  pool.push({ id: 'photo', e: '📸', text: 'Сфотографировать момент дня' });
  // развитие / игра
  pool.push({ id: 'play', e: '🧩', text: 'Поиграть в игру дня' });
  // по возрасту
  if (ageM < 6) {
    pool.push({ id: 'tummy', e: '🤸', text: 'Полежать на животике' });
    pool.push({ id: 'talk', e: '🗣', text: 'Поговорить лицом к лицу' });
  } else if (ageM < 12) {
    pool.push({ id: 'repeat', e: '🥑', text: 'Повторить знакомый продукт' });
    pool.push({ id: 'texture', e: '🍽', text: 'Дать что-то новое на текстуру' });
  } else {
    pool.push({ id: 'book', e: '📖', text: 'Почитать книжку вместе' });
    pool.push({ id: 'words', e: '🗣', text: 'Назвать 3 новых предмета вслух' });
  }
  // выбираем 3 стабильно по дню
  const start = daySeed % pool.length;
  const picked: MissionTask[] = [];
  for (let i = 0; i < 3; i++) picked.push(pool[(start + i) % pool.length]);
  // гарантируем уникальность id
  const seen = new Set<string>();
  return picked.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
}
