import { useMemo } from 'react';
import { useStore } from '../state/store';
import { helloNow, ageTextOf } from '../lib/day';
import { AvatarRing } from '../components/AvatarRing';
import { digestFor } from '../data/digest';
import './Today.css';

export function Today({ goTab }: { goTab: (t: string) => void }) {
  const { profile, ageMonths, ageMonthsReal, ageWeeks } = useStore();
  const week = ageWeeks ?? 0;
  const cards = useMemo(() => digestFor(ageMonths ?? 0, Math.floor(week)), [ageMonths, week]);
  if (!profile) return null;

  const hero = cards[0];
  const rest = cards.slice(1);
  const ageLine = ageMonthsReal != null ? ageTextOf(profile.birthDate, ageMonthsReal) : '';
  const weekInYear = (week % 52) + 1;

  // куда ведёт кнопка карточки
  const go = (domain: string) => {
    if (domain === 'feeding') goTab('feeding');
    else if (domain === 'development') goTab('dev');
    else goTab('today');
  };

  return (
    <div className="today">
      <div className="td-head rise">
        <AvatarRing onClick={() => goTab('baby')} />
        <div className="grow">
          <div className="td-hello">{helloNow()}</div>
          <h1 className="td-name">{profile.name}</h1>
          <div className="td-age">{ageLine} · {weekInYear}-я неделя</div>
        </div>
      </div>

      {hero && (
        <button className="td-hero rise" onClick={() => go(hero.domain)}>
          <div className="td-hero-eye">{hero.eyebrow} · сегодня</div>
          <div className="td-hero-row">
            <span className="td-hero-e">{hero.e}</span>
            <div className="grow">
              <div className="td-hero-title">{hero.title}</div>
              <div className="td-hero-text">{hero.text}</div>
            </div>
          </div>
          {hero.cta && <div className="td-hero-cta">{hero.cta} →</div>}
        </button>
      )}

      {rest.length > 0 && <div className="td-sec rise">На этой неделе</div>}
      {rest.map((c, i) => (
        <button key={i} className="td-card rise" onClick={() => go(c.domain)}>
          <span className="td-card-e">{c.e}</span>
          <div className="grow">
            <div className="td-card-eye">{c.eyebrow}</div>
            <div className="td-card-title">{c.title}</div>
            <div className="td-card-text">{c.text}</div>
            {c.cta && <div className="td-card-cta">{c.cta} ›</div>}
          </div>
        </button>
      ))}

      <div className="td-trust rise">Собрано по современным рекомендациям ВОЗ, AAP, NHS и данным исследований.</div>
    </div>
  );
}
