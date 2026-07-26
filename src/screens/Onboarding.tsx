import { useState } from 'react';
import { useStore } from '../state/store';
import type { FeedingApproach } from '../types';

const APPROACHES: { key: FeedingApproach; e: string; label: string }[] = [
  { key: 'puree', e: '🥣', label: 'Пюре с ложки' },
  { key: 'blw', e: '✋', label: 'Кусочки (BLW)' },
  { key: 'both', e: '🤝', label: 'И то, и то' },
];

export function Onboarding() {
  const { setProfile } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [approach, setApproach] = useState<FeedingApproach>('both');

  const next = () => {
    if (step === 0 && !name.trim()) return;
    if (step === 1 && !birth) return;
    if (step === 2) { setProfile({ name: name.trim(), birthDate: birth, approach }); return; }
    setStep(step + 1);
  };

  const now = new Date();
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="onb">
      <div className="onb-top"><div className="onb-logo">✦</div><div className="onb-brand">bubka</div></div>
      <div className="onb-body">
        {step === 0 && (
          <div className="onb-step">
            <h1>Как зовут малыша?</h1>
            <p>Познакомимся — и настроим приложение под ваш возраст.</p>
            <input className="em-input" style={{ width: '100%' }} autoFocus placeholder="Имя малыша"
              value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && next()} />
          </div>
        )}
        {step === 1 && (
          <div className="onb-step">
            <h1>Когда {name.trim()} родился?</h1>
            <p>Возраст — главный настройщик: покажем только актуальное сейчас.</p>
            <input className="em-input" style={{ width: '100%' }} type="date"
              max={now.toISOString().slice(0, 10)} min={`${years[years.length - 1]}-01-01`}
              value={birth} onChange={(e) => setBirth(e.target.value)} />
          </div>
        )}
        {step === 2 && (
          <div className="onb-step">
            <h1>Как вы кормите?</h1>
            <p>Пригодится для раздела питания. Можно поменять позже.</p>
            <div className="onb-opts">
              {APPROACHES.map((a) => (
                <button key={a.key} className={`onb-opt ${approach === a.key ? 'on' : ''}`} onClick={() => setApproach(a.key)}>
                  <span className="onb-opt-e">{a.e}</span><b>{a.label}</b>
                  <span className="onb-radio">{approach === a.key ? '●' : '○'}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="onb-foot">
        <div className="onb-dots">{[0, 1, 2].map((i) => <span key={i} className={i === step ? 'on' : ''} />)}</div>
        <button className="btn btn-primary" onClick={next}>{step === 2 ? 'Начать 🎉' : 'Дальше'}</button>
        {step > 0 && <button className="onb-back" onClick={() => setStep(step - 1)}>Назад</button>}
      </div>

      <style>{`
        .onb { min-height:100dvh; max-width:440px; margin:0 auto; background:var(--bg); display:flex; flex-direction:column; padding:0 24px calc(24px + env(safe-area-inset-bottom)); }
        .onb-top { text-align:center; padding:8vh 0 0; }
        .onb-logo { font-size:44px; }
        .onb-brand { font-size:13px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--accent); margin-top:6px; }
        .onb-body { flex:1; display:flex; align-items:center; }
        .onb-step h1 { font-size:26px; font-weight:780; letter-spacing:-.02em; }
        .onb-step p { font-size:14px; color:var(--text2); line-height:1.5; margin:8px 0 18px; }
        .onb-opts { display:flex; flex-direction:column; gap:9px; }
        .onb-opt { display:flex; align-items:center; gap:12px; border:1.5px solid var(--hairline); background:var(--card); border-radius:16px;
          padding:14px 15px; font-family:inherit; font-size:15px; font-weight:650; color:var(--text); cursor:pointer; }
        .onb-opt.on { border-color:var(--accent); background:var(--accent-soft); }
        .onb-opt-e { font-size:22px; } .onb-opt b { flex:1; text-align:left; } .onb-radio { color:var(--accent); }
        .onb-foot { padding-top:16px; }
        .onb-dots { display:flex; gap:6px; justify-content:center; margin-bottom:14px; }
        .onb-dots span { width:7px; height:7px; border-radius:99px; background:var(--hairline); transition:all .3s; }
        .onb-dots span.on { background:var(--accent); width:18px; }
        .onb-back { display:block; margin:10px auto 0; border:none; background:none; font-family:inherit; font-size:13px; font-weight:650; color:var(--text2); cursor:pointer; }
      `}</style>
    </div>
  );
}
