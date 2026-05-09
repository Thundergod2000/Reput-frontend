// src/pages/admin/AdminAnalytics.jsx
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading analytics…</div>;
  if (!data)   return null;

  const { overview, per_business, recent_reviews } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Analytics</h1>
          <p className="page-sub">Across all businesses</p>
        </div>
      </div>

      {/* Overview */}
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '1.5rem' }}>
        <div className="metric-card"><div className="metric-val">{overview.total_businesses}</div><div className="metric-lbl">Businesses</div></div>
        <div className="metric-card"><div className="metric-val">{overview.total_employees}</div><div className="metric-lbl">Employees</div></div>
        <div className="metric-card"><div className="metric-val">{overview.total_reviews}</div><div className="metric-lbl">Total reviews</div></div>
        <div className="metric-card"><div className="metric-val green">{overview.avg_rating ?? '—'}</div><div className="metric-lbl">Platform avg rating</div></div>
        <div className="metric-card"><div className="metric-val">{overview.google_count}</div><div className="metric-lbl">Sent to Google</div></div>
        <div className="metric-card"><div className="metric-val amber">{overview.private_count}</div><div className="metric-lbl">Private reviews</div></div>
      </div>

      {/* Per-business table */}
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>By business</h2>
      <div className="table-wrap" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Business</th>
              <th>Reviews</th>
              <th>Avg rating</th>
              <th>To Google</th>
              <th>Private</th>
              <th>Redirect rate</th>
            </tr>
          </thead>
          <tbody>
            {per_business.map(b => (
              <tr key={b.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{b.category} · {b.city}</div>
                </td>
                <td>{b.total_reviews}</td>
                <td>
                  {b.avg_rating
                    ? <span className={`badge ${b.avg_rating >= 4 ? 'badge-green' : b.avg_rating >= 3 ? 'badge-amber' : 'badge-red'}`}>★ {b.avg_rating}</span>
                    : <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>
                  }
                </td>
                <td>{b.google_count}</td>
                <td>{b.private_count}</td>
                <td>
                  {b.total_reviews > 0
                    ? <span className={`badge ${b.redirect_rate >= 70 ? 'badge-green' : b.redirect_rate >= 50 ? 'badge-amber' : 'badge-red'}`}>{b.redirect_rate}%</span>
                    : <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent reviews */}
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Recent reviews</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {recent_reviews.map(r => (
          <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>
              {r.rating >= 4 ? '😊' : r.rating >= 3 ? '😐' : '😞'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span className={`badge ${r.rating >= 4 ? 'badge-green' : r.rating >= 3 ? 'badge-amber' : 'badge-red'}`}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} {r.rating}/5
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.business_name}</span>
                {r.employee_name && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>· {r.employee_name}</span>}
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{timeAgo(r.created_at)}</span>
              </div>
              {r.comment
                ? <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.comment}</p>
                : <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No comment.</p>
              }
            </div>
            <span className={`badge ${r.sent_to_google ? 'badge-green' : 'badge-amber'}`}>
              {r.sent_to_google ? 'Google ✓' : 'Private'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}