import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../state/store';
import { ARTICLES, type Sphere } from '../data/knowledge';
import './pages.css';

// Быстрые заботы → в какую сферу/статью базы знаний вести.
const CONCERNS: { e: string; label: string; sphere: Sphere; minM?: number; maxM?: number }[] = [
  { e: '😴', label: 'Плохо спит', sphere: 'sleep' },
  { e: '🍽', label: 'Мало ест', sphere: 'feeding' },
  { e: '😣', label: 'Капризит без причины', sphere: 'behavior' },
  { e: '🦷', label: 'Режутся зубы?', sphere: 'safety' },
  { e: '🧠', label: 'Всё ли по возрасту', sphere: 'development' },
  { e: '🤍', label: 'Тяжело мне самой', sphere: 'mom' },
];

export function AiSheet({ onClose, onSphere }: { onClose: () => void; onSphere: (s: Sphere) => void }) {
  const { profile, ageMonths } = useStore();
  const [q, setQ] = useState('');

  // «умный» поиск-заглушка: подбираем статьи по словам, пока без настоящего ИИ
  const found = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (s.length < 3) return [];
    return ARTICLES.filter((a) =>
      a.title.toLowerCase().includes(s) || a.lead.toLowerCase().includes(s) ||
      a.blocks.some((b) => (b.p ?? '').toLowerCase().includes(s))).slice(0, 4);
  }, [q]);

  return createPortal(
    <div className="ai-scrim" onClick={onClose}>
      <div className="ai-sheet2" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="ai-spark">✦</div>
        <div className="ai-h">Что вас беспокоит{profile ? '' : ' сегодня'}?</div>
        <p className="ai-p">Спросите про малыша — я подскажу и покажу, что почитать. {ageMonths != null ? `С учётом возраста (${ageMonths} мес).` : ''}</p>

        <input className="ai-input" placeholder="Например: почему не спит ночью…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus={false} />

        {q.trim().length >= 3 ? (
          found.length ? (
            <div className="ai-results">
              {found.map((a) => (
                <button key={a.id} className="ai-res" onClick={() => { onClose(); onSphere(a.sphere); }}>
                  <span className="ai-res-e">{a.e}</span>
                  <div className="grow"><b>{a.title}</b><span>{a.lead}</span></div>
                  <span className="ai-res-arrow">›</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="ai-empty">Пока не нашёл точного ответа. Настоящий ИИ-помощник подключим скоро — он будет отвечать словами и с учётом всех данных малыша. А пока загляните в подсказки ниже 👇</div>
          )
        ) : (
          <>
            <div className="ai-lbl">Частые вопросы</div>
            <div className="ai-chips">
              {CONCERNS.map((c) => (
                <button key={c.label} className="ai-chip" onClick={() => { onClose(); onSphere(c.sphere); }}>
                  <span>{c.e}</span>{c.label}
                </button>
              ))}
            </div>
            <div className="ai-soon">✦ Живой ИИ-помощник в разработке — он свяжет сон, питание и развитие в один умный ответ.</div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
