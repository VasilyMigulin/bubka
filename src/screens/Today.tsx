import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { helloNow, ageTextOf } from '../lib/day';
import { AvatarRing } from '../components/AvatarRing';
import { digestFor, DOMAIN_LABEL } from '../data/digest';
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

/** Типичное окно бодрствования по возрасту (мин). */
function wakeWindow(ageM: number): number {
  if (ageM < 1) return 50; if (ageM < 3) return 75; if (ageM < 5) return 105;
  if (ageM < 8) return 150; if (ageM < 12) return 195; return 255;
}

export function Today({ goTab }: { goTab: (t: string) => void }) {
  const { profile, ageMonths, ageMonthsReal, ageWeeks, day, bump, addWater, toggleSleep, showToast } = useStore();
  const [, tick] = useState(0);
  const sleeping = !!day.sleepStart;
  const youngSleep = (ageMonths ?? 0) <= 15;

  // живой таймер: пока спит или бодрствует (для малышей) — обновляем раз в секунду
  useEffect(() => {
    if (!youngSleep) return;
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [youngSleep, sleeping]);

  const week = ageWeeks ?? 0;
  const cards = useMemo(() => digestFor(ageMonths ?? 0, Math.floor(week)), [ageMonths, week]);
  if (!profile) return null;

  const ageLine = ageMonthsReal != null ? ageTextOf(profile.birthDate, ageMonthsReal) : '';
  const weekInYear = (week % 52) + 1;
  const sleepShown = day.sleepMin + (day.sleepStart ? Math.round((Date.now() - day.sleepStart) / 60000) : 0);

  // окно сна для бодрствующего
  const awakeMs = Date.now() - day.awakeSince;
  const win = wakeWindow(ageMonths ?? 6);
  const toWindowMin = Math.round(win - awakeMs / 60000);
  const sleepMs = sleeping ? Date.now() - day.sleepStart! : 0;

  // дуга-индикатор: доля прошедшего (сон → к ~90 мин; бодрствование → к окну)
  const frac = sleeping ? Math.min(1, sleepMs / (90 * 60000)) : Math.min(1, awakeMs / (win * 60000));
  const R = 34, C = 2 * Math.PI * R;

  const go = (d: Domain) => {
    if (d === 'feeding') goTab('feeding');
    else if (d === 'development' || d === 'leap') goTab('dev');
    else showToast(cards.find((c) => c.domain === d)?.e ?? 'ℹ️', DOMAIN_LABEL[d], 'Раздел скоро откроется');
  };

  return (
    <div className="today">
      <div className="greet rise">
        <AvatarRing onClick={() => goTab('baby')} />
        <div className="grow">
          <div className="greet-hello">{helloNow()}</div>
          <h1 className="greet-name">{profile.name}</h1>
          <div className="age">{ageLine} · {weekInYear}-я неделя</div>
        </div>
      </div>

      {youngSleep ? (
        <div className={`hero-now rise ${sleeping ? 'sleeping' : ''}`}>
          <div className="top">
            <div className="grow">
              <div className="state">{sleeping ? 'Малыш спит' : 'Бодрствует'}</div>
              <div className="big-time">{sleeping ? mss(sleepMs) : hhmm(awakeMs)}</div>
              <div className="until">{sleeping
                ? <>Таймер идёт · за день сна <b>{fmtMin(sleepShown)}</b></>
                : toWindowMin > 0
                  ? <>Окно сна примерно через <b>{toWindowMin} мин</b> · за день сна {fmtMin(sleepShown)}</>
                  : <><b>Пора укладывать</b> — окно бодрствования подходит к концу</>}</div>
            </div>
            <svg className="arc" viewBox="0 0 96 96">
              <circle className="arc-track" cx="48" cy="48" r={R} />
              <circle className="arc-prog" cx="48" cy="48" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 48 48)" />
              <text x="48" y="60" textAnchor="middle" className="arc-moon">{sleeping ? '🌙' : '🧸'}</text>
            </svg>
          </div>
          <button className="btn btn-dusk" onClick={toggleSleep}>{sleeping ? 'Проснулся' : 'Начать сон'}</button>
          <button className="sleep-ai" onClick={() => showToast('✦', 'Анализ сна', 'Скоро — ИИ разберёт ритм по возрасту')}>✦ Окна сна по возрасту · как это работает ›</button>
        </div>
      ) : cards[0] && (
        <button className="hero-now hero-day rise" onClick={() => go(cards[0].domain)}>
          <div className="hd-eye" style={{ color: TINT_COLOR[cards[0].domain] }}>{cards[0].eyebrow} · сегодня</div>
          <div className="hd-row"><span className="hd-e">{cards[0].e}</span>
            <div className="grow"><div className="hd-title">{cards[0].title}</div><div className="hd-text">{cards[0].text}</div></div>
          </div>
          {cards[0].cta && <div className="hd-cta">{cards[0].cta} →</div>}
        </button>
      )}

      <div className="sec-head rise"><b>День в цифрах</b><span onClick={() => goTab('baby')}>журнал ›</span></div>
      <div className="glance rise">
        <button onClick={() => goTab('baby')}><div className="ge">😴</div><div className="gv">{fmtMin(sleepShown)}</div><div className="gl">сон</div></button>
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
    </div>
  );
}
