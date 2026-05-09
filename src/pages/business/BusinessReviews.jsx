// src/pages/business/BusinessReviews.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STAR_MAP = { 1: '★☆☆☆☆', 2: '★★☆☆☆', 3: '★★★☆☆', 4: '★★★★☆', 5: '★★★★★' };

function ratingBadge(r) {
  if (r >= 4) return 'badge-green';
  if (r >= 3) return 'badge-amber';
  return 'badge-red';
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts);
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function BusinessReviews() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('private'); // private | all

  const bizId = user?.business_id;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, reviewsRes] = await Promise.all([
        api.get(`/businesses/${bizId}/reviews/stats`),
        api.get(`/businesses/${bizId}/reviews?type=${tab}&limit=50`),
      ]);
      setStats(statsRes.data);
      setReviews(reviewsRes.data.reviews);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [bizId, tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markRead = async (id) => {
    try {
      await api.patch(`/businesses/${bizId}/reviews/${id}/read`);
      setReviews(rs => rs.map(r => r.id === id ? { ...r, is_read: true } : r));
    } catch {}
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reviews</h1>
          <p className="page-sub">Private feedback from your customers</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="metric-grid">
          <div className="metric-card"><div className="metric-val">{stats.total_reviews}</div><div className="metric-lbl">Total reviews</div></div>
          <div className="metric-card"><div className="metric-val green">{stats.avg_rating ?? '—'}</div><div className="metric-lbl">Avg rating</div></div>
          <div className="metric-card"><div className="metric-val">{stats.google_count}</div><div className="metric-lbl">Sent to Google</div></div>
          <div className="metric-card"><div className="metric-val amber">{stats.private_count}</div><div className="metric-lbl">Private ({stats.unread_count} unread)</div></div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {[['private','Private only'],['all','All reviews']].map(([v, l]) => (
          <div key={v} className={`tab-item${tab === v ? ' active' : ''}`} onClick={() => setTab(v)}>{l}</div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="loading">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="empty-state">No reviews yet in this category.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reviews.map(review => (
            <div key={review.id} className="card" style={{ opacity: review.is_read ? 0.8 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge ${ratingBadge(review.rating)}`}>
                      {STAR_MAP[review.rating]} {review.rating}/5
                    </span>
                    {review.employee_name && (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        via {review.employee_name}
                      </span>
                    )}
                    {!review.is_read && !review.sent_to_google && (
                      <span className="badge badge-gray">Unread</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {review.reviewer_name ? `${review.reviewer_name} · ` : ''}{timeAgo(review.created_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {review.sent_to_google
                    ? <span className="badge badge-green">Google ✓</span>
                    : <span className="badge badge-amber">Private</span>
                  }
                  {!review.is_read && !review.sent_to_google && (
                    <button className="btn btn-ghost btn-sm" onClick={() => markRead(review.id)}>
                      Mark read
                    </button>
                  )}
                </div>
              </div>
              {review.comment
                ? <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{review.comment}</p>
                : <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No comment left.</p>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}