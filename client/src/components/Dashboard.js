import React from 'react';

const Dashboard = ({ data, onGenerate, onRefresh, loading, conflicts, onDetectConflicts }) => {
  return (
    <div className="dashboard">
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
          <button data-testid="generate-timetable-btn" className="btn btn-primary" onClick={onGenerate} disabled={loading}>
            {loading ? (
              <><span className="spinner"></span> Generating...</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Generate Timetable</>
            )}
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
                  <span className="conflict-detail">
                    {conflict.teacher || conflict.room} &mdash; {conflict.day} {conflict.timeSlot}
                  </span>
                  {conflict.subjects && (
                    <span className="conflict-subjects">Subjects: {conflict.subjects.join(', ')}</span>
                  )}
                </div>
                <span className={`badge badge-${conflict.severity.toLowerCase()}`}>{conflict.severity}</span>
              </div>
            ))}
            {conflicts.length > 5 && (
              <p className="conflict-more">+{conflicts.length - 5} more conflicts</p>
            )}
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
                <tr><th>ID</th><th>Name</th><th>Subjects</th><th>Available Days</th></tr>
              </thead>
              <tbody>
                {data.teachers.map(t => (
                  <tr key={t.id} data-testid={`teacher-row-${t.id}`}>
                    <td className="cell-id">{t.id}</td>
                    <td className="cell-name">{t.name}</td>
                    <td>{t.subjects?.join(', ') || 'N/A'}</td>
                    <td>{Object.keys(t.availability || {}).length} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <p className="empty-msg">No teachers added yet</p>
          </div>
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
                <tr><th>ID</th><th>Name</th><th>Type</th><th>Capacity</th><th>Facilities</th></tr>
              </thead>
              <tbody>
                {data.rooms.map(r => (
                  <tr key={r.id} data-testid={`room-row-${r.id}`}>
                    <td className="cell-id">{r.id}</td>
                    <td className="cell-name">{r.name}</td>
                    <td><span className={`tag ${r.type === 'Lab' ? 'tag-blue' : 'tag-green'}`}>{r.type}</span></td>
                    <td>{r.capacity}</td>
                    <td className="cell-small">{r.facilities?.join(', ') || 'N/A'}</td>
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
                <tr><th>Code</th><th>Name</th><th>Type</th><th>Credits</th><th>Sessions</th></tr>
              </thead>
              <tbody>
                {data.subjects.map(s => (
                  <tr key={s.id} data-testid={`subject-row-${s.id}`}>
                    <td className="cell-id">{s.code}</td>
                    <td className="cell-name">{s.name}</td>
                    <td><span className={`tag ${s.type === 'Practical' ? 'tag-amber' : 'tag-indigo'}`}>{s.type}</span></td>
                    <td>{s.credits}</td>
                    <td>{s.requiredSessions}</td>
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
