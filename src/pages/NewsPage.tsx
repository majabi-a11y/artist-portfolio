import { newsPosts } from '../data/artworks';

const categoryLabels: Record<string, string> = {
  exhibition: 'Exposition',
  press: 'Presse',
  event: 'Événement',
  studio: 'Atelier',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function NewsPage() {
  return (
    <div className="page" id="news-page">
      <div className="page-header">
        <h1>Journal</h1>
        <p>Notes et actualités de l'atelier</p>
      </div>

      <div className="stagger-children">
        {newsPosts.map((post) => (
          <div key={post.id} className="news-card" id={`news-${post.id}`}>
            <div className="news-category-label">
              <span className={`news-category-dot ${post.category}`} />
              {categoryLabels[post.category]}
            </div>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <div className="news-date">{formatDate(post.date)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
