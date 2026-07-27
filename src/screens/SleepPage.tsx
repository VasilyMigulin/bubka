import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../state/store';
import { sleepNorm, SLEEP_ARTICLES } from '../data/sleep';
import './pages.css';

export function SleepPage({ onClose }: { onClose: () => void }) {
  const { ageMonths, day, toggleSleep } = useStore();
  const [open, setOpen] = useState<number | null>(null);
  const norm = sleepNorm(ageMonths ?? 6);
  const sleeping = !!day.sleepStart;
  const arts = SLEEP_ARTICLES.filter((a) => (ageMonths ?? 6) >= a.minM && (ageMonths ?? 6) <= a.maxM);
  const sleepShown = day.sleepMin + (day.sleepStart ? Math.round((Date.now() - day.sleepStart) / 60000) : 0);
  const fmt = (m: number) => { const h = Math.floor(m / 60); return h ? `${h} ч ${m % 60} мин` : `${m} мин`; };

  return createPortal(
    <div className="page page-dusk">
      <button className="pg-back" onClick={onClose} aria-label="Назад">‹</button>
      <div className="pg-hero pg-hero-dusk">
        <div className="pg-blob">🌙</div>
        <div className="pg-eyebrow">Сон малыша</div>
        <h1>{norm.label}</h1>
        <p>Сон — это половина спокойствия в доме. Вот ориентиры для вашего возраста и то, что реально помогает.</p>
      </div>

      <div className="pg-body">
        <div className="sleep-live">
          <div className="grow">
            <div className="sl-state">{sleeping ? '🌙 Малыш спит' : '🧸 Бодрствует'}</div>
            <div className="sl-sub">За день сна {fmt(sleepShown)}</div>
          </div>
          <button className="btn btn-dusk" onClick={toggleSleep}>{sleeping ? 'Проснулся' : 'Начать сон'}</button>
        </div>

        <div className="pg-sec">Норма для возраста</div>
        <div className="norm-grid">
          <div className="norm"><div className="nv">{norm.total}</div><div className="nl">всего сна<br />в сутки</div></div>
          <div className="norm"><div className="nv">{norm.naps}</div><div className="nl">дневных<br />снов</div></div>
          <div className="norm"><div className="nv">{norm.wake}</div><div className="nl">окно<br />бодрствования</div></div>
        </div>
        <p className="pg-note">Это ориентир, а не норматив. Малыши разные — смотрите на самочувствие, а не только на цифры.</p>

        <div className="pg-sec">Что помогает</div>
        {arts.map((a, i) => (
          <button key={i} className={`kb-card ${open === i ? 'open' : ''}`} onClick={() => setOpen(open === i ? null : i)}>
            <span className="kb-e">{a.e}</span>
            <div className="grow">
              <div className="kb-title">{a.title}<span className="kb-chev">{open === i ? '−' : '+'}</span></div>
              {open === i && <div className="kb-text">{a.text}</div>}
            </div>
          </button>
        ))}

        <div className="pg-trust">Ориентиры сна — по линии ВОЗ и Американской академии медицины сна. Не заменяет консультацию врача.</div>
      </div>
    </div>,
    document.body,
  );
}
