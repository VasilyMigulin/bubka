import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../state/store';
import { MOOD_REPLY, MOM_DAILY } from '../data/mom';
import { Breathing } from '../components/Breathing';
import './pages.css';

const MOODS = [
  { v: 4, e: '😄', l: 'Отлично' },
  { v: 3, e: '🙂', l: 'Нормально' },
  { v: 2, e: '😐', l: 'Так себе' },
  { v: 1, e: '😔', l: 'Тяжело' },
  { v: 0, e: '🥲', l: 'На пределе' },
];
const MKEY = 'bubka-app-mom-journal';
const DOW = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

interface MomEntry { ts: number; mood: number; note?: string }

export function MomPage({ onClose, onKnowledge }: { onClose: () => void; onKnowledge: () => void }) {
  const { showToast } = useStore();
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [breath, setBreath] = useState(false);
  const [entries, setEntries] = useState<MomEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(MKEY) || '[]') as MomEntry[]; } catch { return []; }
  });

  const daily = useMemo(() => MOM_DAILY[Math.floor(Date.now() / 864e5) % MOM_DAILY.length], []);

  // неделя настроения: последние 7 дней
  const week = useMemo(() => {
    const days: { dow: string; mood?: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const e = entries.find((x) => new Date(x.ts).toDateString() === key);
      days.push({ dow: DOW[d.getDay()], mood: e?.mood });
    }
    return days;
  }, [entries]);

  // стрик: сколько дней подряд отмечались (с сегодня или вчера)
  const streak = useMemo(() => {
    const set = new Set(entries.map((e) => new Date(e.ts).toDateString()));
    let n = 0; const d = new Date();
    if (!set.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (set.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }, [entries]);

  const save = () => {
    if (mood == null) return;
    const e: MomEntry = { ts: Date.now(), mood, note: note.trim() || undefined };
    const next = [e, ...entries].slice(0, 90);
    setEntries(next);
    try { localStorage.setItem(MKEY, JSON.stringify(next)); } catch { /* quota */ }
    setNote(''); setMood(null);
    showToast('🤍', 'Записано', 'Спасибо, что заглянули к себе');
  };

  const reply = mood != null ? MOOD_REPLY[mood] : null;
  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  return createPortal(
    <div className="page page-accent">
      <button className="pg-back" onClick={onClose} aria-label="Назад">‹</button>
      <div className="pg-hero pg-hero-accent">
        <div className="pg-blob">🤍</div>
        <div className="pg-eyebrow">Пространство мамы</div>
        <h1>Минутка для себя</h1>
        <p>Это место — только для вас, не для статистики. Загляните на минуту: как вы, что нового сегодня.</p>
      </div>

      <div className="pg-body">
        {/* Ежедневная карточка — меняется каждый день */}
        <div className="mom-daily rise">
          <div className="md-k">Сегодня для вас</div>
          <div className="md-e">{daily.e}</div>
          <div className="md-t">{daily.title}</div>
          <div className="md-x">{daily.text}</div>
        </div>

        {/* Неделя настроения */}
        {entries.length > 0 && (
          <>
            <div className="pg-sec">Ваша неделя</div>
            <div className="mweek">
              {week.map((d, i) => (
                <div key={i} className={`md ${d.mood == null ? 'empty' : ''}`}>
                  <div className="dd">{d.dow}</div>
                  <div className="mm">{d.mood != null ? MOODS.find((m) => m.v === d.mood)?.e : '·'}</div>
                </div>
              ))}
            </div>
            {streak > 1 && <div className="mstreak">🔥 Вы заглядываете к себе {streak} дня подряд — это забота</div>}
          </>
        )}

        {/* Чек-ин */}
        <div className="pg-sec">Как вы сейчас?</div>
        <div className="mood-pick">
          {MOODS.map((m) => (
            <button key={m.v} className={`mood ${mood === m.v ? 'on' : ''}`} onClick={() => setMood(m.v)}>
              <span className="mood-e">{m.e}</span>
              <span className="mood-l">{m.l}</span>
            </button>
          ))}
        </div>
        {reply && <div className="mom-reply rise"><b>{reply.title}</b><p>{reply.text}</p></div>}

        <textarea className="mom-note" style={{ marginTop: 12 }} rows={3}
          placeholder="Пара слов о сегодняшнем дне — если хочется. Радость, усталость, тревога."
          value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn btn-accent" disabled={mood == null} onClick={save}>
          {mood == null ? 'Отметьте настроение ↑' : 'Сохранить в дневник'}
        </button>

        <div className="pg-sec">Быстрая передышка</div>
        <button className="breath-cta" onClick={() => setBreath(true)}>
          <span className="breath-e">🫧</span>
          <div className="grow"><b>Подышать 30 секунд</b><span>Дыхание 4-7-8 — снижает тревогу и напряжение прямо сейчас</span></div>
          <span className="breath-arrow">›</span>
        </button>
        <div className="mom-affirm-close">Что бы ни было сегодня — вы уже многое делаете правильно 🤍</div>

        <div className="pg-sec">Поддержка</div>
        <button className="kb-link" onClick={() => { onClose(); onKnowledge(); }}>
          📖 <span>Больше про заботу о себе — в базе знаний</span><span className="kl-arrow">›</span>
        </button>

        {entries.length > 0 && (
          <>
            <div className="pg-sec">Ваш дневник · {entries.length}</div>
            {entries.slice(0, 12).map((e, i) => (
              <div key={i} className="mom-entry">
                <span className="me-mood">{MOODS.find((m) => m.v === e.mood)?.e}</span>
                <div className="grow">
                  <div className="me-date">{fmtDate(e.ts)}</div>
                  {e.note && <div className="me-note">{e.note}</div>}
                </div>
              </div>
            ))}
          </>
        )}

        <div className="pg-trust">Если тяжело почти каждый день дольше двух недель — обсудите это с врачом. Послеродовая депрессия лечится, и просить помощи — правильно.</div>
      </div>
      {breath && <Breathing onClose={() => setBreath(false)} />}
    </div>,
    document.body,
  );
}
