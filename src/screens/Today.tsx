import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { helloNow } from '../lib/day';
import { AvatarRing } from '../components/AvatarRing';
import { Drawer } from '../components/Drawer';
import { digestFor } from '../data/digest';
import { mainToday } from '../data/main';
import { soonFor } from '../data/soon';
import { missionFor } from '../data/mission';
import { PHASES, phaseKey, activityFor, ritualSteps } from '../data/sleepPhases';
import { markSkill } from '../data/skills';
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

const MOM_MOODS = [
  { v: 3, e: '😊', l: 'Спокойно', r: 'Здорово! Запомните этот день — такие силы дают трудным дням 💛' },
  { v: 1, e: '😐', l: 'Устала', r: 'Вы делаете много. Сегодня не стремитесь к идеалу — упростите день, где можно.' },
  { v: 0, e: '😣', l: 'Очень тяжело', r: 'Вы не одни. Если малыш съел меньше — это не страшно. Попросите близких о часе передышки.' },
];
const MJKEY = 'bubka-app-mom-journal';

export function Today({ goTab }: { goTab: (t: string) => void }) {
  const { profile, setProfile, ageMonths, ageMonthsReal, ageWeeks, day, bump, addWater, toggleSleep, showToast } = useStore();
  const [, tick] = useState(0);
  const [skillTick, setSkillTick] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [kb, setKb] = useState<Sphere | 'all' | null>(null);
  const [mom, setMom] = useState(false);
  const [momMood, setMomMood] = useState<number | null>(null);
  const sleeping = !!day.sleepStart;
  const youngSleep = (ageMonths ?? 0) <= 15;

  useEffect(() => {
    if (!youngSleep) return;
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [youngSleep, sleeping]);

  const week = ageWeeks ?? 0;
  const cards = useMemo(() => digestFor(ageMonths ?? 0, Math.floor(week)), [ageMonths, week]);
  const daySeed = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 864e5);

  // Миссия дня
  const MKEY = `bubka-app-mission-${new Date().toDateString()}`;
  const tasks = useMemo(() => missionFor(ageMonths ?? 6, daySeed), [ageMonths, daySeed]);
  const [done, setDone] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(MKEY) || '[]') as string[]); } catch { return new Set(); }
  });
  const toggleTask = (id: string) => setDone((prev) => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id);
    localStorage.setItem(MKEY, JSON.stringify([...n]));
    if (n.size === tasks.length) showToast('🎉', 'Миссия дня выполнена!', 'Вы сегодня большие молодцы');
    return n;
  });
  const allDone = done.size >= tasks.length;

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
  const toWindow = Math.round(win - awakeMs / 60000);
  const nextSleepAt = day.awakeSince + win * 60000;
  const pk = phaseKey(r);
  const phase = PHASES[pk];
  const activity = activityFor(pk, daySeed);
  const sleepMs = sleeping ? Date.now() - day.sleepStart! : 0;
  const overdue = !sleeping && youngSleep && r >= 1;

  const main = useMemo(() => mainToday(ageMonths ?? 6, daySeed, overdue), [ageMonths, daySeed, overdue]);
  const hour = new Date().getHours();
  const evening = hour >= 18 || hour < 5;
  const MOMENTS = ['как ест сам', 'улыбку после сна', 'любимую игрушку в руках', 'как играет с вами', 'новое движение или навык', 'спящего малыша', 'первую пробу нового вкуса'];
  const moment = MOMENTS[Math.floor(week) % MOMENTS.length];
  const soon = useMemo(() => soonFor(ageMonths ?? 6), [ageMonths, skillTick]);

  const go = (d: Domain) => {
    if (d === 'feeding') goTab('feeding');
    else if (d === 'development' || d === 'leap' || d === 'behavior') goTab('dev');
    else if (d === 'sleep') setKb('sleep');
    else if (d === 'mom') setMom(true);
  };
  const doMain = () => { if (main.domain === 'sleep' && overdue) toggleSleep(); else go(main.domain); };

  const pickMood = (m: typeof MOM_MOODS[number]) => {
    setMomMood(m.v);
    try {
      const arr = JSON.parse(localStorage.getItem(MJKEY) || '[]');
      arr.unshift({ ts: Date.now(), mood: m.v }); localStorage.setItem(MJKEY, JSON.stringify(arr.slice(0, 90)));
    } catch { /* quota */ }
  };

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

      {/* Вечерний режим */}
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

      {/* ✨ Одно главное на сегодня — с «почему» */}
      <button className={`main-card rise ${overdue ? 'urgent' : ''}`} onClick={doMain}>
        <div className="mc-glow" style={{ background: `radial-gradient(circle, ${TINT_COLOR[main.domain]} 0%, transparent 70%)` }} />
        <div className="mc-kick">✨ {main.kicker}</div>
        <div className="mc-e">{main.e}</div>
        <div className="mc-title">{main.title}</div>
        {main.why && <div className="mc-why">Почему: {main.why}</div>}
        <div className="mc-cta">{main.cta} →</div>
      </button>

      {/* 🎯 Миссия дня */}
      <div className="mission rise">
        <div className="mission-head">
          <div className="grow">
            <div className="mission-k">🎯 Миссия дня</div>
            <div className="mission-p">{allDone ? 'Выполнено! 🎉' : `${done.size} из ${tasks.length} выполнено`}</div>
          </div>
          <div className="mission-bar"><i style={{ width: `${(done.size / tasks.length) * 100}%` }} /></div>
        </div>
        {allDone ? (
          <div className="mission-done">🎉 Миссия дня выполнена! Вы сегодня большие молодцы — и малыш, и вы.</div>
        ) : tasks.map((t) => (
          <button key={t.id} className={`mtask ${done.has(t.id) ? 'on' : ''}`} onClick={() => toggleTask(t.id)}>
            <span className="mt-box">{done.has(t.id) ? '✓' : ''}</span>
            <span className="mt-e">{t.e}</span>
            <span className="grow">{t.text}</span>
          </button>
        ))}
      </div>

      {/* ❤️ Сегодня с малышом — лента */}
      <div className="sec-head rise"><b>Сегодня с малышом</b><span>каждый день новое</span></div>
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

      {/* 😴 Сон — фазы бодрствования, динамичный */}
      {youngSleep && (
        <div className={`sleep2 rise ${sleeping ? 'is-sleep' : `ph-${pk}`}`}>
          {sleeping ? (
            <>
              <div className="s2-top">
                <div className="grow">
                  <div className="s2-state">🌙 Малыш спит</div>
                  <div className="s2-time">{mss(sleepMs)}</div>
                  <div className="s2-sub">Таймер идёт · за день сна {fmtMin(sleepShown)}. Спокойных снов 🤍</div>
                </div>
              </div>
              <button className="btn s2-btn" onClick={toggleSleep}>Проснулся</button>
            </>
          ) : (
            <>
              <div className="s2-top">
                <div className="grow">
                  <div className="s2-state">Бодрствует</div>
                  <div className="s2-time">{hhmm(awakeMs)}</div>
                  <div className="s2-sub">{overdue
                    ? <><b>Окно прошло</b> — ловите зевки и потирание глаз</>
                    : toWindow <= 20
                      ? <>До вероятной усталости <b>~{toWindow} мин</b></>
                      : <>Следующий сон примерно в <b>{clock(nextSleepAt)}</b></>}</div>
                </div>
                <div className="s2-emoji">{phase.e}</div>
              </div>

              {/* Шкала фаз */}
              <div className="s2-track">
                <div className="s2-zones">
                  <span className={`s2-zone z-active ${pk === 'active' ? 'on' : ''}`} />
                  <span className={`s2-zone z-calm ${pk === 'calm' ? 'on' : ''}`} />
                  <span className={`s2-zone z-ritual ${pk === 'ritual' || pk === 'overdue' ? 'on' : ''}`} />
                </div>
                <div className="s2-marker" style={{ left: `${Math.min(99, r * 100)}%` }} />
              </div>
              <div className="s2-zlabels"><span>Активно</span><span>Спокойно</span><span>Ритуал</span></div>

              {/* Текущая фаза: занятие (актив/спокойно) или полный ритуал */}
              {pk === 'ritual' || pk === 'overdue' ? (
                <div className="s2-ritual">
                  <div className="s2-now-t">{phase.label} · ритуал перед сном</div>
                  {!profile.sleepMode && (
                    <div className="s2-mode">
                      <span>Как укладываете малыша?</span>
                      <div className="s2-mode-btns">
                        <button onClick={() => setProfile({ ...profile, sleepMode: 'crib' })}>🛏 В кроватке</button>
                        <button onClick={() => setProfile({ ...profile, sleepMode: 'cosleep' })}>🤱 Совместный сон</button>
                      </div>
                    </div>
                  )}
                  <ol className="s2-steps">
                    {ritualSteps(profile.sleepMode).map((st, i) => (
                      <li key={i}><span className="rst-e">{st.e}</span>{st.text}</li>
                    ))}
                  </ol>
                  <button className="s2-more" style={{ marginTop: 4 }} onClick={() => setKb('sleep')}>📖 Подробнее про ритуал и фазы</button>
                </div>
              ) : (
                <div className="s2-now">
                  <div className="s2-now-t">{phase.label}</div>
                  <div className="s2-act">Чем занять сейчас: <b>{activity}</b></div>
                </div>
              )}

              <div className="s2-actions">
                <button className="btn s2-btn" onClick={toggleSleep}>Начать сон</button>
                <button className="s2-more" onClick={() => setKb('sleep')}>📖 Про фазы и ритуал</button>
              </div>
              <div className="s2-hint">Ориентируйтесь на признаки малыша — время лишь подсказка.</div>
            </>
          )}
        </div>
      )}

      {/* 🔮 Что скоро — таймлайн */}
      <div className="sec-head rise"><b>Что скоро</b><span>взгляд вперёд</span></div>
      <div className="soon-tl rise">
        {ageBar.days <= 25 && (
          <div className="tl-item">
            <span className="tl-dot" /><span className="tl-when">через {ageBar.days} дн</span>
            <span className="tl-e">🎂</span><span className="grow">{profile.name} исполнится {(ageMonthsReal ?? 0) + 1} мес</span>
          </div>
        )}
        {soon.map((s, i) => (
          <div key={i} className="tl-item">
            <span className="tl-dot" /><span className="tl-when">{s.when}</span>
            <span className="tl-e">{s.e}</span>
            <span className="grow">
              {s.text}
              {s.skill && <button className="tl-know" onClick={() => { markSkill(s.skill!); setSkillTick((t) => t + 1); showToast('🎉', 'Отметили навык', 'Подсказки подстроятся под малыша'); }}>✓ уже умеет</button>}
            </span>
            {s.sphere && <button className="tl-arrow" onClick={() => setKb(s.sphere as Sphere)} aria-label="Открыть">›</button>}
          </div>
        ))}
      </div>

      {/* 🤍 Как вы, мама? — интерактивно */}
      <div className="mom-card rise">
        <button className="mom-card-main" onClick={() => setMom(true)}>
          <span className="mom-card-e">🤍</span>
          <div className="grow">
            <div className="mom-card-t">Как вы сегодня, мама?</div>
            <div className="mom-card-s">Минутка только для вас</div>
          </div>
          <span className="mom-card-arrow">›</span>
        </button>
        {momMood == null ? (
          <div className="mom-quick">
            {MOM_MOODS.map((m) => (
              <button key={m.v} className="mq" onClick={() => pickMood(m)}><span>{m.e}</span>{m.l}</button>
            ))}
          </div>
        ) : (
          <div className="mom-quick-reply">{MOM_MOODS.find((m) => m.v === momMood)!.r}
            <button className="mqr-more" onClick={() => setMom(true)}>Открыть пространство мамы →</button>
          </div>
        )}
      </div>

      {/* 📊 День в цифрах */}
      <div className="sec-head rise"><b>День в цифрах</b><span onClick={() => goTab('baby')}>журнал ›</span></div>
      <div className="glance rise">
        <button onClick={() => setKb('sleep')}><div className="ge">😴</div><div className="gv">{fmtMin(sleepShown)}</div><div className="gl">сон</div></button>
        <button onClick={() => goTab('baby')}><div className="ge">🍽</div><div className="gv">{day.feed}</div><div className="gl">кормлений</div></button>
        <button onClick={() => goTab('baby')}><div className="ge">💧</div><div className="gv">{day.water}</div><div className="gl">мл воды</div></button>
        <button onClick={() => goTab('baby')}><div className="ge">🧷</div><div className="gv">{day.diaper}</div><div className="gl">подгуз.</div></button>
      </div>
      <div className="quick rise">
        <button onClick={() => { bump('feed'); showToast('🍼', 'Кормление', `Сегодня уже ${day.feed + 1}`); }}><span className="qe">🍼</span>Кормление</button>
        <button onClick={() => { bump('diaper'); showToast('🧷', 'Подгузник', 'Записано'); }}><span className="qe">🧷</span>Подгузник</button>
        <button onClick={() => { addWater(30); showToast('💧', 'Вода', `+30 мл · всего ${day.water + 30}`); }}><span className="qe">💧</span>Вода</button>
        <button onClick={() => showToast('📷', 'Фото', 'Скоро — добавим в дневник')}><span className="qe">📷</span>Фото</button>
      </div>

      {/* Разделы */}
      <div className="sec-head rise"><b>Разделы</b><span>всё под рукой</span></div>
      <div className="tiles rise">
        <button className="tile" onClick={() => goTab('feeding')}><span className="tl-e">🥑</span>Прикорм</button>
        <button className="tile" onClick={() => setKb('sleep')}><span className="tl-e">😴</span>Сон</button>
        <button className="tile" onClick={() => goTab('dev')}><span className="tl-e">🧩</span>Развитие</button>
        <button className="tile" onClick={() => goTab('baby')}><span className="tl-e">📔</span>Дневник</button>
        <button className="tile" onClick={() => window.dispatchEvent(new Event('bubka-open-ai'))}><span className="tl-e">✦</span>Бубка</button>
        <button className="tile" onClick={() => goTab('baby')}><span className="tl-e">📊</span>Статистика</button>
      </div>

      {/* ✨ Бубка — большая карточка */}
      <button className="ai-card rise" onClick={() => window.dispatchEvent(new Event('bubka-open-ai'))}>
        <div className="ai-card-spark">✦</div>
        <div className="grow">
          <div className="ai-card-t">Спросите Бубку</div>
          <div className="ai-card-s">Не ест · плохо спит · что приготовить — подскажу и покажу, что почитать</div>
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
