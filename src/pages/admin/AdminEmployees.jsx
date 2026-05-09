// src/pages/admin/AdminEmployees.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['av-teal', 'av-blue', 'av-purple', 'av-coral'];
function initials(name) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }

export default function AdminEmployees() {
  const [businesses, setBusinesses] = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [form,       setForm]       = useState({ name: '', role: '', email: '', business_id: '' });
  const [saving,     setSaving]     = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: bizList } = await api.get('/admin/businesses');
      setBusinesses(bizList);
      // Fetch employees for all businesses in parallel
      const results = await Promise.all(
        bizList.map(b =>
          api.get(`/businesses/${b.id}/employees`)
            .then(r => r.data.map(e => ({ ...e, business_name: b.name, business_slug: b.slug })))
            .catch(() => [])
        )
      );
      setEmployees(results.flat());
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAdd = async () => {
    if (!form.name || !form.business_id) return toast.error('Name and business are required');
    setSaving(true);
    try {
      const { data } = await api.post(`/businesses/${form.business_id}/employees`, {
        name: form.name, role: form.role, email: form.email,
      });
      const biz = businesses.find(b => b.id === form.business_id);
      setEmployees(e => [...e, { ...data, business_name: biz?.name, business_slug: biz?.slug }]);
      toast.success(`${data.name} added`);
      setShowModal(false);
      setForm({ name: '', role: '', email: '', business_id: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (emp) => {
    if (!window.confirm(`Remove ${emp.name} from ${emp.business_name}?`)) return;
    try {
      await api.delete(`/businesses/${emp.business_id}/employees/${emp.id}`);
      setEmployees(e => e.filter(x => x.id !== emp.id));
      toast.success('Employee removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const downloadQR = async (emp) => {
    try {
      const res = await api.get(`/businesses/${emp.business_id}/employees/${emp.id}/qr`, { responseType: 'blob' });
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
          <h1 className="page-title">All Employees</h1>
          <p className="page-sub">Every employee across all businesses</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add employee</button>
      </div>

      {loading ? (
        <div className="loading">Loading employees…</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Business</th>
                <th>Review URL</th>
                <th>Avg rating</th>
                <th>Reviews</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`avatar ${COLORS[i % COLORS.length]}`} style={{ width: 30, height: 30, fontSize: 10 }}>
                        {initials(emp.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{emp.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{emp.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{emp.business_name}</td>
                  <td><span className="slug-pill">/{emp.business_slug}/{emp.slug}</span></td>
                  <td>
                    {emp.avg_rating
                      ? <span className={`badge ${emp.avg_rating >= 4 ? 'badge-green' : emp.avg_rating >= 3 ? 'badge-amber' : 'badge-red'}`}>★ {emp.avg_rating}</span>
                      : <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>
                    }
                  </td>
                  <td>{emp.total_reviews}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="action-link" onClick={() => downloadQR(emp)}>QR</button>
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

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <h2 className="modal-title">Add employee</h2>
            <div className="form-group">
              <label className="form-label">Business *</label>
              <select className="form-input"
                value={form.business_id} onChange={e => setForm(f => ({ ...f, business_id: e.target.value }))}>
                <option value="">Select business…</option>
                {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
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
              <input className="form-input" type="email"
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