import { useMemo } from 'react';
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

function fmtDur(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}` : `${m}м`;
}

export function Today({ goTab }: { goTab: (t: string) => void }) {
  const { profile, ageMonths, ageMonthsReal, ageWeeks, day, bump, addWater, toggleSleep, showToast } = useStore();
  const week = ageWeeks ?? 0;
  const cards = useMemo(() => digestFor(ageMonths ?? 0, Math.floor(week)), [ageMonths, week]);
  if (!profile) return null;

  const ageLine = ageMonthsReal != null ? ageTextOf(profile.birthDate, ageMonthsReal) : '';
  const weekInYear = (week % 52) + 1;
  const sleeping = !!day.sleepStart;
  const sleepShown = day.sleepMin + (day.sleepStart ? Math.round((Date.now() - day.sleepStart) / 60000) : 0);
  const youngSleep = (ageMonths ?? 0) <= 15; // до ~15 мес сон на первом плане

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
          <h2>{helloNow()}</h2>
          <div className="age">{profile.name} · {ageLine}</div>
        </div>
        <span className="wk-chip">{weekInYear} нед</span>
      </div>

      {/* Hero: сон (для малышей) или фокус дня (для старших) */}
      {youngSleep ? (
        <div className={`hero-now rise ${sleeping ? 'sleeping' : ''}`}>
          <div className="top">
            <div className="grow">
              <div className="state">{sleeping ? 'Малыш спит' : 'Сон за день'}</div>
              <div className="big-time">{sleeping ? fmtDur(Math.round((Date.now() - day.sleepStart!) / 60000)) : fmtDur(sleepShown)}</div>
              <div className="until">{sleeping
                ? <>Идёт сон · всего за день <b>{fmtDur(sleepShown)}</b></>
                : <>Отметьте, когда уложите — посчитаем сон и подскажем окна по возрасту</>}</div>
            </div>
            <div className="arc-moon">{sleeping ? '🌙' : '🧸'}</div>
          </div>
          <button className="btn btn-dusk" onClick={toggleSleep}>{sleeping ? 'Проснулся' : 'Начать сон'}</button>
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

      {/* День в цифрах */}
      <div className="sec-head rise"><b>День в цифрах</b><span onClick={() => goTab('baby')}>журнал ›</span></div>
      <div className="glance rise">
        <button onClick={() => goTab('baby')}><div className="ge">😴</div><div className="gv">{fmtDur(sleepShown)}</div><div className="gl">сон</div></button>
        <button onClick={() => goTab('baby')}><div className="ge">🥣</div><div className="gv">{day.feed}</div><div className="gl">еда</div></button>
        <button onClick={() => goTab('baby')}><div className="ge">💧</div><div className="gv">{day.water}</div><div className="gl">мл воды</div></button>
        <button onClick={() => goTab('baby')}><div className="ge">🩲</div><div className="gv">{day.diaper}</div><div className="gl">подгуз.</div></button>
      </div>

      {/* Быстрая запись */}
      <div className="quick rise">
        <button onClick={() => { bump('feed'); showToast('🍼', 'Кормление', `Сегодня уже ${day.feed + 1}`); }}><span className="qe">🍼</span>Кормление</button>
        <button onClick={() => { bump('diaper'); showToast('🩲', 'Подгузник', 'Записано'); }}><span className="qe">🩲</span>Подгузник</button>
        <button onClick={() => { addWater(30); showToast('💧', 'Вода', `+30 мл · всего ${day.water + 30}`); }}><span className="qe">💧</span>Вода</button>
        <button onClick={() => showToast('📷', 'Фото', 'Скоро — добавим в дневник')}><span className="qe">📷</span>Фото</button>
      </div>

      {/* Сегодня с малышом — карусель */}
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
