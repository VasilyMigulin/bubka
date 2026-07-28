import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './breathing.css';

// Дыхание 4-7-8: вдох 4с, задержка 7с, выдох 8с. Один цикл ~19с, два ~38с.
const PHASES = [
  { label: 'Вдох', sub: 'медленно через нос', dur: 4, scale: 1 },
  { label: 'Задержите', sub: 'мягко, без напряжения', dur: 7, scale: 1 },
  { label: 'Выдох', sub: 'через рот, отпускайте', dur: 8, scale: 0.55 },
];

export function Breathing({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState(0);
  const [left, setLeft] = useState(PHASES[0].dur);
  const [round, setRound] = useState(1);
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (done) return;
    timer.current = window.setInterval(() => {
      setLeft((l) => {
        if (l > 1) return l - 1;
        setPhase((p) => {
          const np = (p + 1) % PHASES.length;
          if (np === 0) setRound((r) => { if (r >= 2) { setDone(true); return r; } return r + 1; });
          setLeft(PHASES[np].dur);
          return np;
        });
        return PHASES[(phase + 1) % PHASES.length].dur;
      });
    }, 1000);
    return () => window.clearInterval(timer.current);
  }, [phase, done]);

  const cur = PHASES[phase];

  return createPortal(
    <div className="br-scrim" onClick={onClose}>
      <div className="br-inner" onClick={(e) => e.stopPropagation()}>
        <button className="br-x" onClick={onClose} aria-label="Закрыть">✕</button>
        {done ? (
          <div className="br-done">
            <div className="br-done-e">🤍</div>
            <div className="br-done-t">Вы молодец.</div>
            <p>Даже полминуты для себя — это забота. Сегодня вы уже многое делаете правильно.</p>
            <button className="btn br-btn" onClick={onClose}>Спасибо</button>
          </div>
        ) : (
          <>
            <div className="br-round">Дыхание · круг {round} из 2</div>
            <div className="br-circle-wrap">
              <div className="br-circle" style={{ transform: `scale(${cur.scale})`, transitionDuration: `${cur.dur}s` }} />
              <div className="br-count">{left}</div>
            </div>
            <div className="br-label">{cur.label}</div>
            <div className="br-sub">{cur.sub}</div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
