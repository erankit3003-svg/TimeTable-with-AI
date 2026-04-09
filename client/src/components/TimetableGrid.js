import React from 'react';

const TimetableGrid = ({ timetable, conflicts, onExport, onDetectConflicts }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00'];

  // Organize timetable by day and time slot
  const getTimetableGrid = () => {
    const grid = {};
    days.forEach(day => {
      grid[day] = {};
      timeSlots.forEach(slot => {
        grid[day][slot] = [];
      });
    });

    timetable.forEach(session => {
      if (grid[session.day] && grid[session.day][session.timeSlot]) {
        grid[session.day][session.timeSlot].push(session);
      }
    });

    return grid;
  };

  // Check if a session has conflicts
  const hasConflict = (day, timeSlot) => {
    return conflicts.some(
      conflict => conflict.day === day && conflict.timeSlot === timeSlot
    );
  };

  const grid = getTimetableGrid();

  if (timetable.length === 0) {
    return (
      <div className="timetable-container">
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <div className="empty-message">No Timetable Generated</div>
          <div className="empty-description">
            Go to Dashboard and click "Generate Timetable" to create a schedule
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
            Weekly Timetable
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            {timetable.length} sessions scheduled
            {conflicts.length > 0 && (
              <span style={{ color: '#dc2626', fontWeight: 600, marginLeft: '0.5rem' }}>
                • {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            data-testid="detect-conflicts-grid-btn"
            className="btn-secondary"
            onClick={onDetectConflicts}
          >
            🔍 Check Conflicts
          </button>
          <button
            data-testid="export-timetable-btn"
            className="btn-primary"
            onClick={onExport}
          >
            📥 Export JSON
          </button>
        </div>
      </div>

      <div className="timetable-grid">
        <table className="timetable-table">
          <thead>
            <tr>
              <th style={{ minWidth: '120px' }}>Time / Day</th>
              {days.map(day => (
                <th key={day} data-testid={`day-header-${day}`}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(slot => (
              <tr key={slot}>
                <td data-testid={`time-slot-${slot}`}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{slot}</div>
                </td>
                {days.map(day => (
                  <td key={`${day}-${slot}`} data-testid={`cell-${day}-${slot}`}>
                    {grid[day][slot].map((session, index) => (
                      <div
                        key={index}
                        className={`session-card ${hasConflict(day, slot) ? 'conflict' : ''}`}
                        data-testid={`session-${session.id}`}
                      >
                        <div className="session-subject">{session.subject}</div>
                        <div className="session-detail">
                          👨‍🏫 {session.teacher}
                        </div>
                        <div className="session-detail">
                          🚪 {session.room}
                        </div>
                        <div className="session-detail">
                          <span style={{
                            padding: '0.125rem 0.375rem',
                            borderRadius: '4px',
                            fontSize: '0.625rem',
                            fontWeight: 600,
                            background: session.type === 'Practical' ? '#fef3c7' : '#e0e7ff',
                            color: session.type === 'Practical' ? '#92400e' : '#3730a3'
                          }}>
                            {session.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '8px',
        display: 'flex',
        gap: '2rem',
        flexWrap: 'wrap',
        fontSize: '0.875rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: '#eff6ff',
            borderLeft: '3px solid #1e3a8a',
            borderRadius: '4px'
          }}></div>
          <span style={{ color: '#64748b' }}>Normal Session</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: '#fee2e2',
            borderLeft: '3px solid #dc2626',
            borderRadius: '4px'
          }}></div>
          <span style={{ color: '#64748b' }}>Conflict Detected</span>
        </div>
      </div>
    </div>
  );
};

export default TimetableGrid;