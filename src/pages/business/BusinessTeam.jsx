// src/pages/business/BusinessTeam.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['av-teal', 'av-blue', 'av-purple', 'av-coral'];
const APP_URL = import.meta.env.REACT_APP_URL || window.location.origin || "reactappUrl";

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function BusinessTeam() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState({ name: '', role: '', email: '' });
  const [saving,    setSaving]    = useState(false);
  const bizId = user?.business_id;

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/businesses/${bizId}/employees`);
      setEmployees(data);
    } catch {
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  }, [bizId]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleAdd = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const { data } = await api.post(`/businesses/${bizId}/employees`, form);
      toast.success(`${data.name} added to team`);
      setEmployees(e => [...e, data]);
      setShowModal(false);
      setForm({ name: '', role: '', email: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (emp) => {
    if (!window.confirm(`Remove ${emp.name} from the team?`)) return;
    try {
      await api.delete(`/businesses/${bizId}/employees/${emp.id}`);
      toast.success(`${emp.name} removed`);
      setEmployees(e => e.filter(x => x.id !== emp.id));
    } catch {
      toast.error('Failed to remove employee');
    }
  };

  const downloadQR = async (emp) => {
    try {
      const res = await api.get(`/businesses/${bizId}/employees/${emp.id}/qr`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `${emp.slug}-qr.png`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download QR');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Team</h1>
          <p className="page-sub">Each employee has their own review link & QR code</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add employee</button>
      </div>

      {loading ? (
        <div className="loading">Loading team…</div>
      ) : employees.length === 0 ? (
        <div className="empty-state">No employees yet. Add your first team member.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Review URL</th>
                <th>Avg rating</th>
                <th>Reviews</th>
                <th>Private</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`avatar ${COLORS[i % COLORS.length]}`}>{initials(emp.name)}</div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{emp.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{emp.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="slug-pill">/{emp.slug}</span>
                  </td>
                  <td>
                    {emp.avg_rating
                      ? <span className={`badge ${emp.avg_rating >= 4 ? 'badge-green' : emp.avg_rating >= 3 ? 'badge-amber' : 'badge-red'}`}>★ {emp.avg_rating}</span>
                      : <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>No reviews</span>
                    }
                  </td>
                  <td>{emp.total_reviews}</td>
                  <td>{emp.private_count}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="action-link" onClick={() => downloadQR(emp)}>QR code</button>
                      <button className="action-link" style={{ color: '#791F1F' }}
                        onClick={() => handleDeactivate(emp)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add employee modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <h2 className="modal-title">Add team member</h2>
            <div className="form-group">
              <label className="form-label">Full name *</label>
              <input className="form-input" placeholder="Priya Sharma"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input className="form-input" placeholder="Senior Stylist, Trainer…"
                value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email (optional)</label>
              <input className="form-input" type="email" placeholder="employee@salon.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleAdd}>
                {saving ? 'Adding…' : 'Add employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}