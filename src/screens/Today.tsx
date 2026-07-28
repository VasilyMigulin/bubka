import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { helloNow } from '../lib/day';
import { AvatarRing } from '../components/AvatarRing';
import { Drawer } from '../components/Drawer';
import { digestFor } from '../data/digest';
import { mainToday } from '../data/main';
import { soonFor } from '../data/soon';
import { Knowledge } from './Knowledge';
import { MomPage } from './MomPage';
import type { Sphere } from '../data/knowledge';
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
const clock = (ts: number) => new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

function wakeWindow(ageM: number): number {
  if (ageM < 1) return 50; if (ageM < 3) return 75; if (ageM < 5) return 105;
  if (ageM < 8) return 150; if (ageM < 12) return 195; return 255;
}
function phaseOf(r: number): { e: string; label: string; rec: string } {
  if (r < 0.5) return { e: '🤸', label: 'Активное бодрствование', rec: 'Самое время для активных игр и движения' };
  if (r < 0.78) return { e: '🧸', label: 'Спокойная часть', rec: 'Снижайте активность: тихие игры, книжки, приглушённый свет' };
  if (r < 1) return { e: '🛁', label: 'Пора к ритуалу', rec: 'Притушите свет, спокойные объятия, колыбельная' };
  return { e: '😴', label: 'Пора укладывать', rec: 'Ловите признаки усталости: зевки, потирание глаз' };
}

export function Today({ goTab }: { goTab: (t: string) => void }) {
  const { profile, ageMonths, ageMonthsReal, ageWeeks, day, bump, addWater, toggleSleep, showToast } = useStore();
  const [, tick] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [kb, setKb] = useState<Sphere | 'all' | null>(null);
  const [mom, setMom] = useState(false);
  const sleeping = !!day.sleepStart;
  const youngSleep = (ageMonths ?? 0) <= 15;

  useEffect(() => {
    if (!youngSleep) return;
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [youngSleep, sleeping]);

  const week = ageWeeks ?? 0;
  const cards = useMemo(() => digestFor(ageMonths ?? 0, Math.floor(week)), [ageMonths, week]);

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
  const win = wakeWindow(ageMonths ?? 6);
  const awakeMs = Date.now() - day.awakeSince;
  const r = awakeMs / (win * 60000);
  const nextSleepAt = day.awakeSince + win * 60000;
  const phase = phaseOf(r);
  const sleepMs = sleeping ? Date.now() - day.sleepStart! : 0;
  const overdue = !sleeping && youngSleep && r >= 1;
  const frac = sleeping ? Math.min(1, sleepMs / (90 * 60000)) : Math.min(1, r);
  const R = 34, C = 2 * Math.PI * R;

  const daySeed = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 864e5);
  const main = useMemo(() => mainToday(ageMonths ?? 6, daySeed, overdue), [ageMonths, daySeed, overdue]);

  const hour = new Date().getHours();
  const evening = hour >= 18 || hour < 5;
  const MOMENTS = ['как ест сам', 'улыбку после сна', 'любимую игрушку в руках', 'как играет с вами', 'новое движение или навык', 'спящего малыша', 'первую пробу нового вкуса'];
  const moment = MOMENTS[Math.floor(week) % MOMENTS.length];

  const go = (d: Domain) => {
    if (d === 'feeding') goTab('feeding');
    else if (d === 'development' || d === 'leap' || d === 'behavior') goTab('dev');
    else if (d === 'sleep') setKb('sleep');
    else if (d === 'mom') setMom(true);
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
        <button className="burger" onClick={() => setDrawer(true)} aria-label="Меню">☰</button>
      </div>

      {/* ✨ Одно главное на сегодня */}
      <button className={`main-card rise ${overdue ? 'urgent' : ''}`} onClick={doMain}>
        <div className="mc-glow" style={{ background: `radial-gradient(circle, ${TINT_COLOR[main.domain]} 0%, transparent 70%)` }} />
        <div className="mc-kick">✨ {main.kicker}</div>
        <div className="mc-e">{main.e}</div>
        <div className="mc-title">{main.title}</div>
        <div className="mc-cta">{main.cta} →</div>
      </button>

      {/* Вечерний режим — экран меняется по времени суток */}
      {evening && (
        <button className="evening-card rise" onClick={() => setMom(true)}>
          <div className="ev-row">
            <span className="ev-e">🌙</span>
            <div className="grow">
              <div className="ev-t">Как прошёл день?</div>
              <div className="ev-s">Сегодня: сон {fmtMin(sleepShown)} · {day.feed} {day.feed === 1 ? 'кормление' : day.feed < 5 ? 'кормления' : 'кормлений'}. Уложить малыша и выдохнуть — день был не зря.</div>
            </div>
          </div>
          <div className="ev-cta">Отметить настроение и отдохнуть →</div>
        </button>
      )}

      {/* Трекер сна с предсказанием и фазой */}
      {youngSleep && (
        <div className={`hero-now rise ${sleeping ? 'sleeping' : ''}`}>
          <div className="top">
            <div className="grow">
              <div className="state">{sleeping ? 'Малыш спит' : phase.label}</div>
              <div className="big-time">{sleeping ? mss(sleepMs) : hhmm(awakeMs)}</div>
              <div className="until">{sleeping
                ? <>Таймер идёт · за день сна <b>{fmtMin(sleepShown)}</b></>
                : overdue
                  ? <><b>Окно бодрствования прошло</b> — ловите признаки усталости</>
                  : <>Следующий сон примерно в <b>{clock(nextSleepAt)}</b></>}</div>
            </div>
            <svg className="arc" viewBox="0 0 96 96">
              <circle className="arc-track" cx="48" cy="48" r={R} />
              <circle className="arc-prog" cx="48" cy="48" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 48 48)" />
              <text x="48" y="60" textAnchor="middle" className="arc-moon">{sleeping ? '🌙' : phase.e}</text>
            </svg>
          </div>
          {!sleeping && <div className="sleep-rec">{phase.rec}</div>}
          <div className="sleep-actions">
            <button className="btn btn-dusk" onClick={toggleSleep}>{sleeping ? 'Проснулся' : 'Начать сон'}</button>
            <button className="sleep-more" onClick={() => setKb('sleep')}>📖 Всё про сон</button>
          </div>
          {!sleeping && <div className="sleep-hint">Ориентируйтесь на признаки малыша — время лишь подсказка.</div>}
        </div>
      )}

      {/* Как вы, мама? */}
      <button className="mom-card rise" onClick={() => setMom(true)}>
        <span className="mom-card-e">🤍</span>
        <div className="grow">
          <div className="mom-card-t">Как вы сегодня, мама?</div>
          <div className="mom-card-s">Минутка для себя — настроение, поддержка и кое-что новое каждый день</div>
        </div>
        <span className="mom-card-arrow">›</span>
      </button>

      {/* День в цифрах */}
      <div className="sec-head rise"><b>День в цифрах</b><span onClick={() => goTab('baby')}>журнал ›</span></div>
      <div className="glance rise">
        <button onClick={() => setKb('sleep')}><div className="ge">😴</div><div className="gv">{fmtMin(sleepShown)}</div><div className="gl">сон</div></button>
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

      {/* Быстрые действия — навигация по разделам */}
      <div className="sec-head rise"><b>Разделы</b><span>всё под рукой</span></div>
      <div className="tiles rise">
        <button className="tile" onClick={() => goTab('feeding')}><span className="tl-e">🥑</span>Прикорм</button>
        <button className="tile" onClick={() => setKb('sleep')}><span className="tl-e">😴</span>Сон</button>
        <button className="tile" onClick={() => goTab('dev')}><span className="tl-e">🧩</span>Развитие</button>
        <button className="tile" onClick={() => goTab('baby')}><span className="tl-e">📔</span>Дневник</button>
        <button className="tile" onClick={() => window.dispatchEvent(new Event('bubka-open-ai'))}><span className="tl-e">✦</span>Спросить ИИ</button>
        <button className="tile" onClick={() => goTab('baby')}><span className="tl-e">📊</span>Статистика</button>
      </div>

      {/* Что скоро */}
      <div className="sec-head rise"><b>Что скоро</b><span>взгляд вперёд</span></div>
      <div className="soon rise">
        {ageBar.days <= 25 && (
          <div className="soon-row">
            <span className="soon-when">через {ageBar.days} дн</span>
            <span className="soon-e">🎂</span>
            <span className="grow">{profile.name} исполнится {(ageMonthsReal ?? 0) + 1} {(ageMonthsReal ?? 0) + 1 === 1 ? 'месяц' : (ageMonthsReal ?? 0) + 1 < 5 ? 'месяца' : 'месяцев'}</span>
          </div>
        )}
        {soonFor(ageMonths ?? 6).map((s, i) => (
          <button key={i} className="soon-row" onClick={() => s.sphere && setKb(s.sphere as Sphere)} disabled={!s.sphere}>
            <span className="soon-when">{s.when}</span>
            <span className="soon-e">{s.e}</span>
            <span className="grow">{s.text}</span>
            {s.sphere && <span className="soon-arrow">›</span>}
          </button>
        ))}
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
        <button className="c-card c-moment" onClick={() => showToast('📸', 'Момент недели', 'Скоро — сохраним в дневник малыша')}>
          <div className="ce">📸</div>
          <div className="ck2" style={{ color: 'var(--sand)' }}>Момент недели</div>
          <div className="cn">Снимите {moment}</div>
          <div className="cs">Такие кадры быстро забываются — сохраните этот на память</div>
        </button>
      </div>

      {/* ✦ ИИ — большая карточка внизу */}
      <button className="ai-card rise" onClick={() => window.dispatchEvent(new Event('bubka-open-ai'))}>
        <div className="ai-card-spark">✦</div>
        <div className="grow">
          <div className="ai-card-t">Что вас беспокоит сегодня?</div>
          <div className="ai-card-s">Не ест · плохо спит · что приготовить — спросите, подскажу и покажу, что почитать</div>
        </div>
        <span className="ai-card-arrow">›</span>
      </button>

      <div className="td-trust rise">Собрано по современным рекомендациям ВОЗ, AAP, NHS и данным исследований.</div>

      <Drawer open={drawer} onClose={() => setDrawer(false)}
        onKnowledge={() => setKb('all')} onMom={() => setMom(true)}
        onSOS={() => showToast('🚨', 'Экстренная помощь', 'Скоро — инструкции при подавился/аллергия')} />
      {kb && <Knowledge initial={kb === 'all' ? undefined : kb} onClose={() => setKb(null)} />}
      {mom && <MomPage onClose={() => setMom(false)} onKnowledge={() => setKb('mom')} />}
    </div>
  );
}
