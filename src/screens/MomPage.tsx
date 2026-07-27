import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../state/store';
import { AFFIRMATIONS, MOOD_REPLY, MOM_TIPS } from '../data/mom';
import './pages.css';

const MOODS = [
  { v: 4, e: '😄', l: 'Отлично' },
  { v: 3, e: '🙂', l: 'Нормально' },
  { v: 2, e: '😐', l: 'Так себе' },
  { v: 1, e: '😔', l: 'Тяжело' },
  { v: 0, e: '🥲', l: 'На пределе' },
];
const MKEY = 'bubka-app-mom-journal';

interface MomEntry { ts: number; mood: number; note?: string }

export function MomPage({ onClose }: { onClose: () => void }) {
  const { showToast } = useStore();
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<MomEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(MKEY) || '[]') as MomEntry[]; } catch { return []; }
  });
  const affirmation = useMemo(() => AFFIRMATIONS[Math.floor(Date.now() / 864e5) % AFFIRMATIONS.length], []);

  const save = () => {
    if (mood == null) return;
    const e: MomEntry = { ts: Date.now(), mood, note: note.trim() || undefined };
    const next = [e, ...entries].slice(0, 60);
    setEntries(next);
    try { localStorage.setItem(MKEY, JSON.stringify(next)); } catch { /* quota */ }
    setNote('');
    showToast('🤍', 'Записано', 'Спасибо, что поделились — это важно');
  };

  const reply = mood != null ? MOOD_REPLY[mood] : null;
  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  return createPortal(
    <div className="page page-accent">
      <button className="pg-back" onClick={onClose} aria-label="Назад">‹</button>
      <div className="pg-hero pg-hero-accent">
        <div className="pg-blob">🤍</div>
        <div className="pg-eyebrow">Пространство мамы</div>
        <h1>Как вы сегодня?</h1>
        <p>Это место — только для вас, не для статистики. Здесь можно выдохнуть, поделиться и получить поддержку.</p>
      </div>

      <div className="pg-body">
        <div className="affirm">{affirmation}</div>

        <div className="pg-sec">Отметьте настроение</div>
        <div className="mood-pick">
          {MOODS.map((m) => (
            <button key={m.v} className={`mood ${mood === m.v ? 'on' : ''}`} onClick={() => setMood(m.v)}>
              <span className="mood-e">{m.e}</span>
              <span className="mood-l">{m.l}</span>
            </button>
          ))}
        </div>

        {reply && (
          <div className="mom-reply rise">
            <b>{reply.title}</b>
            <p>{reply.text}</p>
          </div>
        )}

        <div className="pg-sec">Хотите поделиться?</div>
        <textarea className="mom-note" rows={3} placeholder="Что на душе сегодня — радость, усталость, тревога. Любые слова."
          value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn btn-accent" disabled={mood == null} onClick={save}>
          {mood == null ? 'Сначала отметьте настроение ↑' : 'Сохранить в дневник'}
        </button>

        <div className="pg-sec">Забота о себе</div>
        {MOM_TIPS.map((t, i) => (
          <div key={i} className="mom-tip">
            <span className="mt-e">{t.e}</span>
            <div><div className="mt-title">{t.title}</div><div className="mt-text">{t.text}</div></div>
          </div>
        ))}

        {entries.length > 0 && (
          <>
            <div className="pg-sec">Ваш дневник</div>
            {entries.slice(0, 10).map((e, i) => (
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
    </div>,
    document.body,
  );
}
