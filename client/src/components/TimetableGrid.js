import React from 'react';

const TimetableGrid = ({ timetable, conflicts, onExport, onDetectConflicts, onOptimize, optimizing, optimizeResult }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00'];

  const getTimetableGrid = () => {
    const grid = {};
    days.forEach(day => {
      grid[day] = {};
      timeSlots.forEach(slot => { grid[day][slot] = []; });
    });
    timetable.forEach(session => {
      if (grid[session.day]?.[session.timeSlot]) {
        grid[session.day][session.timeSlot].push(session);
      }
    });
    return grid;
  };

  const hasConflict = (day, timeSlot) => {
    return conflicts.some(c => c.day === day && c.timeSlot === timeSlot);
  };

  const grid = getTimetableGrid();

  if (timetable.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p className="empty-msg">No Timetable Generated</p>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Go to Dashboard and click "Generate Timetable"</p>
      </div>
    );
  }

  return (
    <div className="timetable-page">
      {/* Header Bar */}
      <div className="card">
        <div className="tt-header">
          <div>
            <h2 className="tt-title">Weekly Timetable</h2>
            <p className="tt-subtitle">
              {timetable.length} sessions
              {conflicts.length > 0 && (
                <span className="tt-conflict-count">{conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
          <div className="tt-actions">
            <button data-testid="detect-conflicts-grid-btn" className="btn btn-outline" onClick={onDetectConflicts}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Check Conflicts
            </button>
            {conflicts.length > 0 && (
              <button data-testid="optimize-btn" className="btn btn-danger" onClick={onOptimize} disabled={optimizing}>
                {optimizing ? (
                  <><span className="spinner spinner-dark"></span> Optimizing...</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg> Optimize</>
                )}
              </button>
            )}
            <button data-testid="export-timetable-btn" className="btn btn-primary" onClick={onExport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Optimization Result */}
      {optimizeResult && optimizeResult.changes?.length > 0 && (
        <div className="alert-box alert-success" data-testid="optimize-result">
          <div className="alert-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <strong>Optimization Complete</strong>
          </div>
          <div className="optimize-stats">
            <div className="opt-stat">
              <span className="opt-num">{optimizeResult.changes.length}</span>
              <span className="opt-label">Rescheduled</span>
            </div>
            <div className="opt-stat">
              <span className="opt-num">{optimizeResult.affectedTeachers}</span>
              <span className="opt-label">Teachers Affected</span>
            </div>
            <div className="opt-stat">
              <span className="opt-num">{optimizeResult.affectedClasses}</span>
              <span className="opt-label">Subjects Affected</span>
            </div>
            <div className="opt-stat">
              <span className="opt-num">{optimizeResult.remainingConflicts}</span>
              <span className="opt-label">Remaining Conflicts</span>
            </div>
          </div>
          <div className="change-list">
            {optimizeResult.changes.map((change, i) => (
              <div key={i} className="change-item" data-testid={`change-item-${i}`}>
                <span className="change-subject">{change.subject}</span>
                <span className="change-teacher">{change.teacher}</span>
                <span className="change-arrow">
                  <span className="change-from">{change.from.day} {change.from.timeSlot} ({change.from.room})</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  <span className="change-to">{change.to.day} {change.to.timeSlot} ({change.to.room})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="card tt-grid-wrap">
        <div className="tt-grid-scroll">
          <table className="tt-table">
            <thead>
              <tr>
                <th className="tt-th-time">Time</th>
                {days.map(day => (
                  <th key={day} data-testid={`day-header-${day}`}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(slot => (
                <tr key={slot}>
                  <td className="tt-td-time" data-testid={`time-slot-${slot}`}>{slot}</td>
                  {days.map(day => {
                    const sessions = grid[day][slot];
                    const isConflict = hasConflict(day, slot);
                    return (
                      <td key={`${day}-${slot}`} className={`tt-cell ${isConflict ? 'tt-cell-conflict' : ''}`} data-testid={`cell-${day}-${slot}`}>
                        {sessions.map((s, idx) => (
                          <div key={idx} className={`session ${isConflict ? 'session-conflict' : ''}`} data-testid={`session-${s.id}`}>
                            <div className="session-subject">{s.subject}</div>
                            <div className="session-info">{s.teacher}</div>
                            <div className="session-info">{s.room}</div>
                            <span className={`session-type ${s.type === 'Practical' ? 'type-practical' : 'type-theory'}`}>{s.type}</span>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="tt-legend">
        <div className="legend-item">
          <div className="legend-swatch legend-normal"></div>
          <span>Normal</span>
        </div>
        <div className="legend-item">
          <div className="legend-swatch legend-conflict"></div>
          <span>Conflict</span>
        </div>
        <div className="legend-item">
          <span className="session-type type-theory" style={{ fontSize: '0.7rem' }}>Theory</span>
        </div>
        <div className="legend-item">
          <span className="session-type type-practical" style={{ fontSize: '0.7rem' }}>Practical</span>
        </div>
      </div>
    </div>
  );
};

export default TimetableGrid;
