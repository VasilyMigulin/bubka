import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './state/store';
import { Onboarding } from './screens/Onboarding';
import { Today } from './screens/Today';
import { AiSheet } from './screens/AiSheet';
import { Knowledge } from './screens/Knowledge';
import type { Sphere } from './data/knowledge';
import './App.css';

type Tab = 'today' | 'dev' | 'feeding' | 'baby';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'today', label: 'Сегодня', icon: '☀️' },
  { key: 'dev', label: 'Развитие', icon: '🧩' },
  { key: 'feeding', label: 'Питание', icon: '🥑' },
  { key: 'baby', label: 'Малыш', icon: '👶' },
];

function Placeholder({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>🚧</div>
      <h2 style={{ fontSize: 22, fontWeight: 780 }}>{title}</h2>
      <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8, lineHeight: 1.5 }}>{sub}</p>
    </div>
  );
}

function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className="toast-wrap"><div className="toast">
      <span className="toast-e">{toast.icon}</span>
      <div><div className="toast-t">{toast.title}</div>{toast.sub && <div className="toast-s">{toast.sub}</div>}</div>
    </div></div>
  );
}

function Shell() {
  const { profile } = useStore();
  const [tab, setTab] = useState<Tab>('today');
  const [aiOpen, setAiOpen] = useState(false);
  const [aiKb, setAiKb] = useState<Sphere | null>(null);
  const [hint, setHint] = useState(() => !localStorage.getItem('bubka-ai-hint-seen'));

  useEffect(() => {
    const h = () => { setAiOpen(true); setHint(false); localStorage.setItem('bubka-ai-hint-seen', '1'); };
    window.addEventListener('bubka-open-ai', h);
    return () => window.removeEventListener('bubka-open-ai', h);
  }, []);

  const openAi = () => { setAiOpen(true); setHint(false); localStorage.setItem('bubka-ai-hint-seen', '1'); };

  if (!profile) return <Onboarding />;

  return (
    <div className="app">
      <div className="app-scroll" key={tab}>
        {tab === 'today' && <Today goTab={(t) => setTab(t as Tab)} />}
        {tab === 'dev' && <Placeholder title="Развитие" sub="Тест навыков, игры на каждый день, скачки роста. Скоро — собираем этот раздел." />}
        {tab === 'feeding' && <Placeholder title="Питание" sub="Каталог продуктов, подача по возрасту, рецепты и дневник прикорма. Переносим из bubka plate." />}
        {tab === 'baby' && <Placeholder title="Малыш" sub="Дневник, рост и вес по ВОЗ, зубки, ачивки и фильм месяца. Скоро." />}
      </div>

      <nav className="tabbar">
        {TABS.slice(0, 2).map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <span className="ti">{t.icon}</span>{t.label}
          </button>
        ))}
        <div className="fab-wrap">
          {hint && (
            <div className="fab-hint">
              <b>Спросите Бубку</b>
              <span>Ваш помощник всегда рядом 💛</span>
              <i />
            </div>
          )}
          <button className={`ai-fab ${aiOpen ? 'on' : ''}`} onClick={openAi} aria-label="Бубка — помощник">
            <span className="fab-pulse" />✨
          </button>
        </div>
        {TABS.slice(2).map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <span className="ti">{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>

      {aiOpen && <AiSheet onClose={() => setAiOpen(false)} onSphere={(s) => setAiKb(s)} />}
      {aiKb && <Knowledge initial={aiKb} onClose={() => setAiKb(null)} />}

      <Toast />
    </div>
  );
}

export function App() {
  return <StoreProvider><Shell /></StoreProvider>;
}
