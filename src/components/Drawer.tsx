import { createPortal } from 'react-dom';
import { useStore } from '../state/store';
import './drawer.css';

interface Item { e: string; label: string; sub?: string; onClick: () => void; danger?: boolean; sparkle?: boolean }

export function Drawer({ open, onClose, onKnowledge, onMom, onSOS }: {
  open: boolean; onClose: () => void;
  onKnowledge: () => void; onMom: () => void; onSOS: () => void;
}) {
  const { profile, ageMonthsReal, showToast } = useStore();
  const soon = (t: string) => { onClose(); showToast('🛠', t, 'Скоро — этот раздел в разработке'); };

  const sections: { title: string; items: Item[] }[] = [
    { title: '', items: [
      { e: '🚨', label: 'SOS · Экстренная помощь', danger: true, onClick: () => { onClose(); onSOS(); } },
    ] },
    { title: 'Знания и поддержка', items: [
      { e: '📖', label: 'База знаний', sub: 'Сон, развитие, питание, поведение', onClick: () => { onClose(); onKnowledge(); } },
      { e: '🤍', label: 'Пространство мамы', sub: 'Настроение, поддержка, дневник', onClick: () => { onClose(); onMom(); } },
    ] },
    { title: 'Семья', items: [
      { e: '👨‍👩‍👧', label: 'Семейный доступ', sub: 'Подключить папу или бабушку', onClick: () => soon('Семейный доступ') },
      { e: '🔗', label: 'Передача смены', sub: 'Памятка для того, кто с малышом', onClick: () => soon('Передача смены') },
    ] },
    { title: 'Приложение', items: [
      { e: '✨', label: 'bubka+', sub: 'Всё без ограничений', sparkle: true, onClick: () => soon('Подписка bubka+') },
      { e: '⚙️', label: 'Настройки и профиль', onClick: () => soon('Настройки') },
      { e: '💬', label: 'Обратная связь', onClick: () => { onClose(); showToast('💌', 'Спасибо!', 'Мы читаем каждое письмо'); } },
    ] },
  ];

  if (!open) return null;
  return createPortal(
    <div className="dr-scrim" onClick={onClose}>
      <div className="dr-panel" onClick={(e) => e.stopPropagation()}>
        <div className="dr-kid">
          <div className="dr-ava">{profile?.photo ? <img src={profile.photo} alt="" /> : '👶'}</div>
          <div className="grow">
            <b>{profile?.name}</b>
            <span>{ageMonthsReal != null ? `${ageMonthsReal} мес` : ''}</span>
          </div>
        </div>
        {sections.map((sec, si) => (
          <div key={si} className="dr-group">
            {sec.title && <div className="dr-sec">{sec.title}</div>}
            {sec.items.map((it, i) => (
              <button key={i} className={`dr-item ${it.danger ? 'danger' : ''} ${it.sparkle ? 'sparkle' : ''}`} onClick={it.onClick}>
                <span className="dr-e">{it.e}</span>
                <span className="grow">
                  <b>{it.label}</b>
                  {it.sub && <span className="dr-sub">{it.sub}</span>}
                </span>
                {!it.danger && <span className="dr-chev">›</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
