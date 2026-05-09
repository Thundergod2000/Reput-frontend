// src/pages/admin/AdminBusinesses.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const emptyForm = { name: '', category: '', city: '', google_url: '', owner_email: '' };

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [form,       setForm]       = useState(emptyForm);
  const [saving,     setSaving]     = useState(false);
  const [editBiz,    setEditBiz]    = useState(null); // business being edited

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/businesses');
      setBusinesses(data);
    } catch {
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  const openCreate = () => { setForm(emptyForm); setEditBiz(null); setShowModal(true); };
  const openEdit   = (biz) => {
    setForm({ name: biz.name, category: biz.category || '', city: biz.city || '', google_url: biz.google_url || '', owner_email: biz.owner_email });
    setEditBiz(biz);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.owner_email) return toast.error('Name and owner email are required');
    setSaving(true);
    try {
      if (editBiz) {
        const { data } = await api.patch(`/admin/businesses/${editBiz.id}`, form);
        setBusinesses(bs => bs.map(b => b.id === data.id ? { ...b, ...data } : b));
        toast.success('Business updated');
      } else {
        const { data } = await api.post('/admin/businesses', form);
        setBusinesses(bs => [data, ...bs]);
        toast.success(`${data.name} created! QR code generated.`);
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (biz) => {
    if (!window.confirm(`Deactivate ${biz.name}?`)) return;
    try {
      await api.delete(`/admin/businesses/${biz.id}`);
      setBusinesses(bs => bs.map(b => b.id === biz.id ? { ...b, is_active: false } : b));
      toast.success('Business deactivated');
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  const downloadQR = async (biz) => {
    try {
      const res = await api.get(`/admin/businesses/${biz.id}/qr`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `${biz.slug}-qr.png`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download QR');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Businesses</h1>
          <p className="page-sub">Manage all clients on ReviewLoop</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add business</button>
      </div>

      {loading ? (
        <div className="loading">Loading businesses…</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Slug / URL</th>
                <th>Avg rating</th>
                <th>Reviews</th>
                <th>Private</th>
                <th>Employees</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map(biz => (
                <tr key={biz.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{biz.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{biz.category} · {biz.city}</div>
                  </td>
                  <td><span className="slug-pill">/{biz.slug}</span></td>
                  <td>
                    {biz.avg_rating
                      ? <span className={`badge ${biz.avg_rating >= 4 ? 'badge-green' : biz.avg_rating >= 3 ? 'badge-amber' : 'badge-red'}`}>★ {biz.avg_rating}</span>
                      : <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>
                    }
                  </td>
                  <td>{biz.total_reviews}</td>
                  <td>{biz.private_count}</td>
                  <td>{biz.employee_count}</td>
                  <td>
                    <span className={`badge ${biz.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {biz.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button className="action-link" onClick={() => openEdit(biz)}>Edit</button>
                      <button className="action-link" onClick={() => downloadQR(biz)}>QR</button>
                      {biz.is_active && (
                        <button className="action-link" style={{ color: '#791F1F' }}
                          onClick={() => handleDeactivate(biz)}>Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <h2 className="modal-title">{editBiz ? 'Edit business' : 'Add new business'}</h2>
            <div className="form-group">
              <label className="form-label">Business name *</label>
              <input className="form-input" placeholder="Glow Studio"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-input" placeholder="Salon, Gym, Spa…"
                value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" placeholder="Mumbai"
                value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Google My Business URL</label>
              <input className="form-input" type="url" placeholder="https://g.page/…"
                value={form.google_url} onChange={e => setForm(f => ({ ...f, google_url: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Owner email *</label>
              <input className="form-input" type="email" placeholder="owner@salon.com"
                value={form.owner_email} onChange={e => setForm(f => ({ ...f, owner_email: e.target.value }))} />
              {!editBiz && (
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 5 }}>
                  A login account will be created and credentials emailed to the owner.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : editBiz ? 'Save changes' : 'Create & generate QR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}