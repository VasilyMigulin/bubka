import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { helloNow } from '../lib/day';
import { AvatarRing } from '../components/AvatarRing';
import { digestFor } from '../data/digest';
import { mainToday } from '../data/main';
import { SleepPage } from './SleepPage';
import { MomPage } from './MomPage';
import type { Domain } from '../types';
import './Today.css';

const TINT: Record<Domain, string> = {
  development: 'tint-terra', sleep: 'tint-dusk', feeding: 'tint-accent',
  leap: 'tint-terra', behavior: 'tint-sand', mom: 'tint-accent',
};
const TINT_COLOR: Record<Domain, string> = {
  development: 'var(--terra)', sleep: 'var(--dusk)', feeding: 'var(--accent)',
  leap: 'var(--terra)', behavior: 'var(--sand)', mom: 'var(--accent)',
};

const hhmm = (ms: number) => { const m = Math.floor(ms / 60000); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
const mss = (ms: number) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const fmtMin = (min: number) => { const h = Math.floor(min / 60), m = min % 60; return h ? `${h}:${String(m).padStart(2, '0')}` : `${m}м`; };

function wakeWindow(ageM: number): number {
  if (ageM < 1) return 50; if (ageM < 3) return 75; if (ageM < 5) return 105;
  if (ageM < 8) return 150; if (ageM < 12) return 195; return 255;
}

export function Today({ goTab }: { goTab: (t: string) => void }) {
  const { profile, ageMonths, ageMonthsReal, ageWeeks, day, bump, addWater, toggleSleep, showToast } = useStore();
  const [, tick] = useState(0);
  const [sleepOpen, setSleepOpen] = useState(false);
  const [momOpen, setMomOpen] = useState(false);
  const sleeping = !!day.sleepStart;
  const youngSleep = (ageMonths ?? 0) <= 15;

  useEffect(() => {
    if (!youngSleep) return;
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [youngSleep, sleeping]);

  const week = ageWeeks ?? 0;
  const cards = useMemo(() => digestFor(ageMonths ?? 0, Math.floor(week)), [ageMonths, week]);

  // прогресс возраста внутри месяца
  const ageBar = useMemo(() => {
    if (!profile || ageMonthsReal == null) return { frac: 0, days: 0 };
    const bd = new Date(profile.birthDate);
    const prev = new Date(bd); prev.setMonth(bd.getMonth() + ageMonthsReal);
    const next = new Date(bd); next.setMonth(bd.getMonth() + ageMonthsReal + 1);
    const frac = Math.min(1, Math.max(0, (Date.now() - prev.getTime()) / (next.getTime() - prev.getTime())));
    const days = Math.max(0, Math.ceil((next.getTime() - Date.now()) / 864e5));
    return { frac, days };
  }, [profile, ageMonthsReal]);

  if (!profile) return null;

  const sleepShown = day.sleepMin + (day.sleepStart ? Math.round((Date.now() - day.sleepStart) / 60000) : 0);
  const awakeMs = Date.now() - day.awakeSince;
  const win = wakeWindow(ageMonths ?? 6);
  const toWindowMin = Math.round(win - awakeMs / 60000);
  const sleepMs = sleeping ? Date.now() - day.sleepStart! : 0;
  const overdue = !sleeping && youngSleep && toWindowMin <= 0;
  const frac = sleeping ? Math.min(1, sleepMs / (90 * 60000)) : Math.min(1, awakeMs / (win * 60000));
  const R = 34, C = 2 * Math.PI * R;

  const daySeed = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 864e5);
  const main = useMemo(() => mainToday(ageMonths ?? 6, daySeed, overdue), [ageMonths, daySeed, overdue]);

  const go = (d: Domain) => {
    if (d === 'feeding') goTab('feeding');
    else if (d === 'development' || d === 'leap' || d === 'behavior') goTab('dev');
    else if (d === 'sleep') setSleepOpen(true);
    else if (d === 'mom') setMomOpen(true);
  };
  const doMain = () => { if (main.domain === 'sleep' && overdue) toggleSleep(); else go(main.domain); };

  return (
    <div className="today">
      <div className="greet rise">
        <AvatarRing onClick={() => goTab('baby')} />
        <div className="grow">
          <div className="greet-hello">{helloNow()}</div>
          <h1 className="greet-name">{profile.name}</h1>
          <div className="agebar"><i style={{ right: `${100 - ageBar.frac * 100}%` }} /></div>
          <div className="agebar-lbl"><span>{ageMonthsReal} мес</span><span>до {(ageMonthsReal ?? 0) + 1} мес — {ageBar.days} дн</span></div>
        </div>
      </div>

      {/* ✨ Одно главное на сегодня */}
      <button className={`main-card rise ${overdue ? 'urgent' : ''}`} onClick={doMain}>
        <div className="mc-glow" style={{ background: `radial-gradient(circle, ${TINT_COLOR[main.domain]} 0%, transparent 70%)` }} />
        <div className="mc-kick">✨ {main.kicker}</div>
        <div className="mc-e">{main.e}</div>
        <div className="mc-title">{main.title}</div>
        <div className="mc-cta">{main.cta} →</div>
      </button>

      {/* Трекер сна (ведёт в раздел сна) */}
      {youngSleep && (
        <div className={`hero-now rise ${sleeping ? 'sleeping' : ''}`}>
          <button className="hn-open" onClick={() => setSleepOpen(true)}>
            <div className="top">
              <div className="grow">
                <div className="state">{sleeping ? 'Малыш спит' : 'Бодрствует'}</div>
                <div className="big-time">{sleeping ? mss(sleepMs) : hhmm(awakeMs)}</div>
                <div className="until">{sleeping
                  ? <>Таймер идёт · за день <b>{fmtMin(sleepShown)}</b></>
                  : toWindowMin > 0
                    ? <>Окно сна через <b>~{toWindowMin} мин</b> · нажмите — про сон ›</>
                    : <><b>Пора укладывать</b> · нажмите — про сон ›</>}</div>
              </div>
              <svg className="arc" viewBox="0 0 96 96">
                <circle className="arc-track" cx="48" cy="48" r={R} />
                <circle className="arc-prog" cx="48" cy="48" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 48 48)" />
                <text x="48" y="60" textAnchor="middle" className="arc-moon">{sleeping ? '🌙' : '🧸'}</text>
              </svg>
            </div>
          </button>
          <button className="btn btn-dusk" onClick={toggleSleep}>{sleeping ? 'Проснулся' : 'Начать сон'}</button>
        </div>
      )}

      {/* Как вы, мама? */}
      <button className="mom-card rise" onClick={() => setMomOpen(true)}>
        <span className="mom-card-e">🤍</span>
        <div className="grow">
          <div className="mom-card-t">Как вы сегодня, мама?</div>
          <div className="mom-card-s">Одна минута для себя — отметить настроение, выдохнуть, получить поддержку</div>
        </div>
        <span className="mom-card-arrow">›</span>
      </button>

      {/* День в цифрах */}
      <div className="sec-head rise"><b>День в цифрах</b><span onClick={() => goTab('baby')}>журнал ›</span></div>
      <div className="glance rise">
        <button onClick={() => setSleepOpen(true)}><div className="ge">😴</div><div className="gv">{fmtMin(sleepShown)}</div><div className="gl">сон</div></button>
        <button onClick={() => goTab('baby')}><div className="ge">🥣</div><div className="gv">{day.feed}</div><div className="gl">еда</div></button>
        <button onClick={() => goTab('baby')}><div className="ge">💧</div><div className="gv">{day.water}</div><div className="gl">мл воды</div></button>
        <button onClick={() => goTab('baby')}><div className="ge">🩲</div><div className="gv">{day.diaper}</div><div className="gl">подгуз.</div></button>
      </div>

      <div className="quick rise">
        <button onClick={() => { bump('feed'); showToast('🍼', 'Кормление', `Сегодня уже ${day.feed + 1}`); }}><span className="qe">🍼</span>Кормление</button>
        <button onClick={() => { bump('diaper'); showToast('🩲', 'Подгузник', 'Записано'); }}><span className="qe">🩲</span>Подгузник</button>
        <button onClick={() => { addWater(30); showToast('💧', 'Вода', `+30 мл · всего ${day.water + 30}`); }}><span className="qe">💧</span>Вода</button>
        <button onClick={() => showToast('📷', 'Фото', 'Скоро — добавим в дневник')}><span className="qe">📷</span>Фото</button>
      </div>

      {/* Лента */}
      <div className="sec-head rise"><b>Сегодня с малышом</b><span>{cards.length} карточек</span></div>
      <div className="carousel rise">
        {cards.map((c, i) => (
          <button key={i} className={`c-card ${TINT[c.domain]}`} onClick={() => go(c.domain)}>
            <div className="ce">{c.e}</div>
            <div className="ck2" style={{ color: TINT_COLOR[c.domain] }}>{c.eyebrow}</div>
            <div className="cn">{c.title}</div>
            <div className="cs">{c.text}</div>
          </button>
        ))}
      </div>

      <div className="td-trust rise">Собрано по современным рекомендациям ВОЗ, AAP, NHS и данным исследований.</div>

      {sleepOpen && <SleepPage onClose={() => setSleepOpen(false)} />}
      {momOpen && <MomPage onClose={() => setMomOpen(false)} />}
    </div>
  );
}
