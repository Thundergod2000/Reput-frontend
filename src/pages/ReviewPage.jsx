// src/pages/ReviewPage.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['av-teal', 'av-blue', 'av-purple', 'av-coral'];
const HINTS  = ['', 'Poor experience', 'Not great', 'It was okay', 'Pretty good!', 'Excellent!'];

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function ReviewPage() {
  const { businessSlug, employeeSlug } = useParams();
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(null); // employee id
  const [rating,   setRating]   = useState(0);
  const [comment,  setComment]  = useState('');
  const [name,     setName]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result,   setResult]   = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const endpoint = employeeSlug
      ? `/public/${businessSlug}/${employeeSlug}`
      : `/public/${businessSlug}`;
    api.get(endpoint)
      .then(({ data }) => {
        setData(data);
        if (data.preselected_employee) setSelected(data.preselected_employee.id);
      })
      .catch(() => setError('Business not found or no longer active.'))
      .finally(() => setLoading(false));
  }, [businessSlug, employeeSlug]);

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      const { data: res } = await api.post(`/public/${businessSlug}/reviews`, {
        rating,
        comment: comment.trim() || undefined,
        reviewer_name: name.trim() || undefined,
        employee_id: selected || undefined,
      });
      setResult(res);
      setSubmitted(true);
      if (res.sent_to_google && res.google_url) {
        setTimeout(() => { window.location.href = res.google_url; }, 2500);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <CenteredMsg msg="Loading…" />;
  if (error)   return <CenteredMsg msg={error} isError />;

  const { business, employees } = data;

  if (submitted) {
    const toGoogle = result?.sent_to_google;
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--green-light)', color: 'var(--green-dark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, margin: '0 auto 1rem',
          }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            {toGoogle ? 'Thanks! Redirecting to Google…' : 'Thanks for your feedback!'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 300, margin: '0 auto' }}>
            {toGoogle
              ? 'Your kind words will help others discover ' + business.name + '.'
              : 'Your review has been shared privately with ' + business.name + ' to help them improve.'}
          </p>
          {toGoogle && (
            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-tertiary)' }}>
              Not redirected? <a href={result.google_url} style={{ color: 'var(--green-dark)' }}>Click here</a>
            </p>
          )}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Business header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div className="avatar av-teal" style={{ width: 60, height: 60, fontSize: 20, margin: '0 auto 12px' }}>
          {initials(business.name)}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>{business.name}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
          {[business.category, business.city].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* Employee selection — only show if multiple and not preselected via URL */}
      {employees.length > 1 && !employeeSlug && (
        <div className="card" style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, textAlign: 'center' }}>
            Who served you today?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {employees.map((emp, i) => (
              <div key={emp.id}
                onClick={() => setSelected(emp.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  border: `${selected === emp.id ? 2 : 0.5}px solid ${selected === emp.id ? 'var(--green)' : 'var(--border)'}`,
                  cursor: 'pointer', background: 'var(--bg-primary)', transition: 'border-color 0.15s',
                }}
              >
                <div className={`avatar ${COLORS[i % COLORS.length]}`}>
                  {initials(emp.name)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{emp.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{emp.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* If employee pre-selected via URL, show a simple label */}
      {employeeSlug && employees[0] && (
        <div className="card" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar av-teal">{initials(employees[0].name)}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{employees[0].name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{employees[0].role}</div>
          </div>
        </div>
      )}

      {/* Star rating */}
      <div className="card" style={{ marginBottom: 14, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Rate your experience
        </p>
        <div className="star-row" style={{ justifyContent: 'center' }}>
          {[1,2,3,4,5].map(s => (
            <span key={s} className={`star-icon${rating >= s ? ' lit' : ''}`}
              onClick={() => setRating(s)}>★</span>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, minHeight: 18 }}>
          {HINTS[rating] || 'Tap a star to rate'}
        </p>
      </div>

      {/* Comment */}
      <div className="card" style={{ marginBottom: 14 }}>
        <label className="form-label">Tell us more (optional)</label>
        <textarea className="form-input" rows={3}
          placeholder="What did you love? Anything we can improve?"
          value={comment} onChange={e => setComment(e.target.value)} />
        <div style={{ marginTop: 10 }}>
          <label className="form-label">Your name (optional)</label>
          <input className="form-input" type="text" placeholder="e.g. Priya M."
            value={name} onChange={e => setName(e.target.value)} />
        </div>
      </div>

      {/* Routing notice */}
      {rating > 0 && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12,
          padding: '10px 14px', background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: rating >= 4 ? 'var(--green)' : '#F5A623', marginTop: 4, flexShrink: 0 }} />
          {rating >= 4
            ? 'Great score! After submitting you\'ll be redirected to leave a Google review.'
            : 'Your feedback will be shared privately with the business to help them improve.'}
        </div>
      )}

      <button className="btn btn-primary" style={{ width: '100%' }}
        disabled={!rating || submitting}
        onClick={handleSubmit}>
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 12 }}>
        4★–5★ ratings are shared on Google · 1★–3★ stay private with the business
      </p>
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: 460, margin: '0 auto' }}>{children}</div>
    </div>
  );
}

function CenteredMsg({ msg, isError }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: 15, color: isError ? '#791F1F' : 'var(--text-secondary)' }}>{msg}</p>
    </div>
  );
}