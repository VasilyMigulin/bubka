import { useState } from 'react';
import { StoreProvider, useStore } from './state/store';
import { Onboarding } from './screens/Onboarding';
import { Today } from './screens/Today';
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
        <button className={`ai-fab ${aiOpen ? 'on' : ''}`} onClick={() => setAiOpen(true)} aria-label="ИИ-помощник">✦</button>
        {TABS.slice(2).map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <span className="ti">{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>

      {aiOpen && (
        <div className="ai-scrim" onClick={() => setAiOpen(false)}>
          <div className="ai-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <div className="ai-hero">✦</div>
            <div className="ai-title">Помощник bubka</div>
            <p className="ai-sub">Спросите что угодно про малыша — сон, еду, развитие. Помощник знает возраст и контекст. Скоро подключим.</p>
            <button className="btn btn-primary" onClick={() => setAiOpen(false)}>Понятно</button>
          </div>
        </div>
      )}

      <Toast />
    </div>
  );
}

export function App() {
  return <StoreProvider><Shell /></StoreProvider>;
}
