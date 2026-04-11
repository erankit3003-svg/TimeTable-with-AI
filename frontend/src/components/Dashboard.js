import React, { useState } from 'react';
import axios from 'axios';
import { toast } from './Toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00'];

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

const Dashboard = ({ data, onGenerate, onRefresh, loading, conflicts, onDetectConflicts, apiUrl }) => {
  const [editModal, setEditModal] = useState(null); // { type, item }
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const openEdit = (type, item) => {
    setEditModal({ type, item });
    if (type === 'teacher') {
      setEditForm({ name: item.name, subjects: item.subjects?.join(', ') || '', days: Object.keys(item.availability || {}) });
    } else if (type === 'room') {
      setEditForm({ name: item.name, capacity: item.capacity, type: item.type, facilities: item.facilities?.join(', ') || '' });
    } else if (type === 'subject') {
      setEditForm({ name: item.name, code: item.code, credits: item.credits, type: item.type, requiredSessions: item.requiredSessions });
    }
  };

  const closeEdit = () => { setEditModal(null); setEditForm({}); };

  const saveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    const { type, item } = editModal;
    try {
      let payload = {};
      if (type === 'teacher') {
        const availability = {};
        (editForm.days || []).forEach(d => { availability[d] = [...SLOTS]; });
        payload = { name: editForm.name, subjects: editForm.subjects.split(',').map(s => s.trim()).filter(Boolean), availability };
      } else if (type === 'room') {
        payload = { name: editForm.name, capacity: parseInt(editForm.capacity), type: editForm.type, facilities: editForm.facilities.split(',').map(f => f.trim()).filter(Boolean) };
      } else if (type === 'subject') {
        payload = { name: editForm.name, code: editForm.code, credits: parseInt(editForm.credits), type: editForm.type, requiredSessions: parseInt(editForm.requiredSessions) };
      }
      await axios.put(`${apiUrl}/${type}s/${item.id}`, payload);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated`);
      closeEdit();
      onRefresh();
    } catch (err) {
      toast.error('Failed to update');
    }
    setSaving(false);
  };

  const handleDelete = async (type, id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${apiUrl}/${type}s/${id}`);
      toast.success(`${name} deleted`);
      onRefresh();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const toggleEditDay = (day) => {
    setEditForm(prev => {
      const days = prev.days || [];
      return { ...prev, days: days.includes(day) ? days.filter(d => d !== day) : [...days, day] };
    });
  };

  return (
    <div className="dashboard">
      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" data-testid="edit-modal-overlay" onClick={closeEdit}>
          <div className="modal-box" onClick={e => e.stopPropagation()} data-testid="edit-modal">
            <div className="modal-header">
              <h3 className="modal-title">Edit {editModal.type.charAt(0).toUpperCase() + editModal.type.slice(1)}</h3>
              <button className="modal-close" onClick={closeEdit} data-testid="edit-modal-close"><XIcon /></button>
            </div>
            <div className="modal-body">
              {editModal.type === 'teacher' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" data-testid="edit-teacher-name" value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subjects (comma-separated)</label>
                    <input className="form-input" data-testid="edit-teacher-subjects" value={editForm.subjects || ''} onChange={e => setEditForm(p => ({ ...p, subjects: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Available Days</label>
                    <div className="day-selector">
                      {DAYS.map(day => (
                        <button key={day} type="button" className={`day-btn ${(editForm.days || []).includes(day) ? 'active' : ''}`} onClick={() => toggleEditDay(day)}>{day.slice(0, 3)}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {editModal.type === 'room' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" data-testid="edit-room-name" value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Capacity</label>
                      <input className="form-input" data-testid="edit-room-capacity" type="number" value={editForm.capacity || 30} onChange={e => setEditForm(p => ({ ...p, capacity: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select className="form-input" data-testid="edit-room-type" value={editForm.type || 'Classroom'} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}>
                        <option value="Classroom">Classroom</option>
                        <option value="Lab">Lab</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Facilities (comma-separated)</label>
                    <input className="form-input" data-testid="edit-room-facilities" value={editForm.facilities || ''} onChange={e => setEditForm(p => ({ ...p, facilities: e.target.value }))} />
                  </div>
                </>
              )}
              {editModal.type === 'subject' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input className="form-input" data-testid="edit-subject-name" value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Code</label>
                      <input className="form-input" data-testid="edit-subject-code" value={editForm.code || ''} onChange={e => setEditForm(p => ({ ...p, code: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select className="form-input" data-testid="edit-subject-type" value={editForm.type || 'Theory'} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}>
                        <option value="Theory">Theory</option>
                        <option value="Practical">Practical</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Credits</label>
                      <input className="form-input" data-testid="edit-subject-credits" type="number" min="1" value={editForm.credits || 3} onChange={e => setEditForm(p => ({ ...p, credits: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sessions</label>
                      <input className="form-input" data-testid="edit-subject-sessions" type="number" min="1" value={editForm.requiredSessions || 3} onChange={e => setEditForm(p => ({ ...p, requiredSessions: e.target.value }))} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeEdit}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving} data-testid="edit-save-btn">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="action-bar">
        <div>
          <h2 className="action-title">Timetable Management</h2>
          <p className="action-desc">Generate and manage your academic schedule</p>
        </div>
        <div className="action-buttons">
          <button data-testid="refresh-data-btn" className="btn btn-outline" onClick={onRefresh}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            Refresh
          </button>
          <button data-testid="detect-conflicts-btn" className="btn btn-warn" onClick={() => onDetectConflicts()} disabled={data.timetable.length === 0}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Detect Conflicts
          </button>
          <button data-testid="generate-timetable-btn" className="btn btn-primary" onClick={onGenerate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Go to Generate
          </button>
        </div>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="alert-box alert-danger" data-testid="conflicts-section">
          <div className="alert-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <strong>{conflicts.length} Conflict{conflicts.length !== 1 ? 's' : ''} Detected</strong>
          </div>
          <p className="alert-desc">Schedule conflicts need resolution. Use Optimize on the Timetable View.</p>
          <div className="conflict-list">
            {conflicts.slice(0, 5).map((conflict, index) => (
              <div key={index} className="conflict-item" data-testid={`conflict-item-${index}`}>
                <div className="conflict-info">
                  <span className="conflict-type">{conflict.type}</span>
                  <span className="conflict-detail">{conflict.teacher || conflict.room} &mdash; {conflict.day} {conflict.timeSlot}</span>
                  {conflict.subjects && <span className="conflict-subjects">Subjects: {conflict.subjects.join(', ')}</span>}
                </div>
                <span className={`badge badge-${conflict.severity.toLowerCase()}`}>{conflict.severity}</span>
              </div>
            ))}
            {conflicts.length > 5 && <p className="conflict-more">+{conflicts.length - 5} more</p>}
          </div>
        </div>
      )}

      {/* Teachers */}
      <section className="card">
        <div className="card-header">
          <h3 className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Teachers
          </h3>
          <span className="card-badge" data-testid="teachers-badge">{data.teachers.length}</span>
        </div>
        {data.teachers.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Subjects</th><th>Available Days</th><th style={{width:'90px'}}>Actions</th></tr>
              </thead>
              <tbody>
                {data.teachers.map(t => (
                  <tr key={t.id} data-testid={`teacher-row-${t.id}`}>
                    <td className="cell-id">{t.id}</td>
                    <td className="cell-name">{t.name}</td>
                    <td>{t.subjects?.join(', ') || 'N/A'}</td>
                    <td>{Object.keys(t.availability || {}).length} days</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn icon-edit" data-testid={`edit-teacher-${t.id}`} title="Edit" onClick={() => openEdit('teacher', t)}><EditIcon /></button>
                        <button className="icon-btn icon-delete" data-testid={`delete-teacher-${t.id}`} title="Delete" onClick={() => handleDelete('teacher', t.id, t.name)}><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty"><p className="empty-msg">No teachers added yet</p></div>
        )}
      </section>

      {/* Rooms */}
      <section className="card">
        <div className="card-header">
          <h3 className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Rooms
          </h3>
          <span className="card-badge" data-testid="rooms-badge">{data.rooms.length}</span>
        </div>
        {data.rooms.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Type</th><th>Capacity</th><th>Facilities</th><th style={{width:'90px'}}>Actions</th></tr>
              </thead>
              <tbody>
                {data.rooms.map(r => (
                  <tr key={r.id} data-testid={`room-row-${r.id}`}>
                    <td className="cell-id">{r.id}</td>
                    <td className="cell-name">{r.name}</td>
                    <td><span className={`tag ${r.type === 'Lab' ? 'tag-blue' : 'tag-green'}`}>{r.type}</span></td>
                    <td>{r.capacity}</td>
                    <td className="cell-small">{r.facilities?.join(', ') || 'N/A'}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn icon-edit" data-testid={`edit-room-${r.id}`} title="Edit" onClick={() => openEdit('room', r)}><EditIcon /></button>
                        <button className="icon-btn icon-delete" data-testid={`delete-room-${r.id}`} title="Delete" onClick={() => handleDelete('room', r.id, r.name)}><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty"><p className="empty-msg">No rooms added yet</p></div>
        )}
      </section>

      {/* Subjects */}
      <section className="card">
        <div className="card-header">
          <h3 className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Subjects
          </h3>
          <span className="card-badge" data-testid="subjects-badge">{data.subjects.length}</span>
        </div>
        {data.subjects.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Code</th><th>Name</th><th>Type</th><th>Credits</th><th>Sessions</th><th style={{width:'90px'}}>Actions</th></tr>
              </thead>
              <tbody>
                {data.subjects.map(s => (
                  <tr key={s.id} data-testid={`subject-row-${s.id}`}>
                    <td className="cell-id">{s.code}</td>
                    <td className="cell-name">{s.name}</td>
                    <td><span className={`tag ${s.type === 'Practical' ? 'tag-amber' : 'tag-indigo'}`}>{s.type}</span></td>
                    <td>{s.credits}</td>
                    <td>{s.requiredSessions}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn icon-edit" data-testid={`edit-subject-${s.id}`} title="Edit" onClick={() => openEdit('subject', s)}><EditIcon /></button>
                        <button className="icon-btn icon-delete" data-testid={`delete-subject-${s.id}`} title="Delete" onClick={() => handleDelete('subject', s.id, s.name)}><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty"><p className="empty-msg">No subjects added yet</p></div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
