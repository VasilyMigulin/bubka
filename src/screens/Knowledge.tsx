import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ARTICLES, articlesBySphere, SPHERES, type Article, type Sphere } from '../data/knowledge';
import './pages.css';

/** База знаний: сферы → статьи → чтение. Открывается из бургер-меню и из блоков главной. */
export function Knowledge({ initial, onClose }: { initial?: Sphere; onClose: () => void }) {
  const [sphere, setSphere] = useState<Sphere | null>(initial ?? null);
  const [article, setArticle] = useState<Article | null>(null);

  return createPortal(
    <>
    <div className="page">
      <button className="pg-back" onClick={onClose} aria-label="Закрыть">‹</button>
      <div className="pg-hero" style={{ background: 'linear-gradient(160deg, var(--elev), var(--bg) 82%)' }}>
        <div className="pg-blob">📖</div>
        <div className="pg-eyebrow">База знаний</div>
        <h1>{sphere ? SPHERES.find((s) => s.key === sphere)!.label : 'Всё, что важно знать'}</h1>
        <p>{sphere ? 'Самое важное — простым языком.' : 'Коротко и по делу, по каждой сфере жизни малыша.'}</p>
      </div>

      <div className="pg-body">
        {!sphere ? (
          <div className="kb-spheres">
            {SPHERES.map((s) => {
              const n = articlesBySphere(s.key).length;
              return (
                <button key={s.key} className="kb-sphere" onClick={() => setSphere(s.key)}>
                  <span className="kb-sphere-e">{s.e}</span>
                  <div className="grow">
                    <div className="kb-sphere-l">{s.label}</div>
                    <div className="kb-sphere-n">{n} {n === 1 ? 'статья' : n < 5 ? 'статьи' : 'статей'}</div>
                  </div>
                  <span className="kb-sphere-arrow" style={{ color: s.color }}>›</span>
                </button>
              );
            })}
          </div>
        ) : (
          <>
            {!initial && <button className="kb-up" onClick={() => setSphere(null)}>‹ Все сферы</button>}
            {articlesBySphere(sphere).map((a) => (
              <button key={a.id} className="kb-item" onClick={() => setArticle(a)}>
                <span className="kb-item-e">{a.e}</span>
                <div className="grow">
                  <div className="kb-item-t">{a.title}{a.core && <span className="kb-core">важное</span>}</div>
                  <div className="kb-item-l">{a.lead}</div>
                </div>
                <span className="kb-item-arrow">›</span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>

    {article && createPortal(
      <div className="page">
        <button className="pg-back" onClick={() => setArticle(null)} aria-label="Назад">‹</button>
        <div className="pg-hero" style={{ background: 'linear-gradient(160deg, var(--elev), var(--bg) 82%)' }}>
          <div className="pg-blob">{article.e}</div>
          <div className="pg-eyebrow">{SPHERES.find((s) => s.key === article.sphere)!.label}</div>
          <h1>{article.title}</h1>
          <p>{article.lead}</p>
        </div>
        <div className="pg-body art-body">
          {article.blocks.map((b, i) => (
            <div key={i}>
              {b.h && <div className="art-h">{b.h}</div>}
              {b.p && <p className="art-p">{b.p}</p>}
            </div>
          ))}
          <div className="pg-trust">Ориентир, а не замена консультации врача. Основано на рекомендациях ВОЗ, AAP, NHS и данных исследований.</div>
        </div>
      </div>,
      document.body,
    )}
    </>,
    document.body,
  );
}

export { ARTICLES };
