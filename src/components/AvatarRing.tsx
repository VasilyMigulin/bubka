import { useStore } from '../state/store';

/** Аватар-коллекция: фото + кольцо недель текущего года жизни + значки-вехи. */
// Значок-веха по достигнутому возрасту — «малыш растёт».
function charmFor(ageM: number): string {
  if (ageM >= 12) return '🎂';
  if (ageM >= 9) return '🧩';
  if (ageM >= 6) return '🥑';
  if (ageM >= 4) return '🤸';
  if (ageM >= 1) return '🌱';
  return '🐣';
}

export function AvatarRing({ onClick }: { onClick?: () => void }) {
  const { profile, ageWeeks, ageMonthsReal } = useStore();
  const weeksInYear = ((ageWeeks ?? 0) % 52);
  const pct = weeksInYear / 52;
  const R = 26, C = 2 * Math.PI * R;

  return (
    <button className="av-ring-wrap" onClick={onClick} aria-label="Профиль малыша">
      <svg className="av-ring" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={R} fill="none" stroke="var(--elev)" strokeWidth="3.5" />
        <circle cx="30" cy="30" r={R} fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 30 30)" />
      </svg>
      <div className="av-photo">{profile?.photo ? <img src={profile.photo} alt={profile.name} /> : '👶'}</div>
      <span className="av-charm">{charmFor(ageMonthsReal ?? 0)}</span>
      <style>{`
        .av-ring-wrap { position:relative; flex:none; width:58px; height:58px; border:none; background:none; padding:0; cursor:pointer;
          display:flex; align-items:center; justify-content:center; }
        .av-ring { position:absolute; inset:0; width:58px; height:58px; }
        .av-ring circle:last-child { transition:stroke-dashoffset .8s ease; }
        .av-photo { width:44px; height:44px; border-radius:50%; background:var(--sand-soft); display:flex; align-items:center;
          justify-content:center; font-size:22px; overflow:hidden; }
        .av-photo img { width:100%; height:100%; object-fit:cover; }
        .av-charm { position:absolute; right:-2px; bottom:-2px; width:22px; height:22px; border-radius:50%; background:var(--card);
          box-shadow:var(--shadow); border:1.5px solid var(--bg); display:flex; align-items:center; justify-content:center; font-size:12px; }
      `}</style>
    </button>
  );
}
