import React, { useRef } from 'react';

const PrintIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
);

const TimetableGrid = ({ timetable, conflicts, onExport, onDetectConflicts, onOptimize, optimizing, optimizeResult }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00'];
  const printRef = useRef(null);

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

  const handlePrint = () => {
    const grid = getTimetableGrid();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;

    const cellsHtml = timeSlots.map(slot => {
      const cells = days.map(day => {
        const sessions = grid[day][slot];
        const isConflict = hasConflict(day, slot);
        if (sessions.length === 0) return '<td class="cell empty-cell">&mdash;</td>';
        const inner = sessions.map(s => {
          const conflictClass = isConflict ? ' conflict' : '';
          return `<div class="session${conflictClass}">
            <div class="subj">${s.subject}</div>
            <div class="meta">${s.teacher}</div>
            <div class="meta">${s.room}</div>
            <span class="type type-${s.type === 'Practical' ? 'prac' : 'theory'}">${s.type}</span>
          </div>`;
        }).join('');
        return `<td class="cell${isConflict ? ' cell-conflict' : ''}">${inner}</td>`;
      }).join('');
      return `<tr><td class="time-col">${slot}</td>${cells}</tr>`;
    }).join('');

    const dayHeaders = days.map(d => `<th>${d}</th>`).join('');

    // Teacher summary table
    const teacherMap = {};
    timetable.forEach(s => {
      if (!teacherMap[s.teacher]) teacherMap[s.teacher] = [];
      teacherMap[s.teacher].push({ day: s.day, slot: s.timeSlot, subject: s.subject, room: s.room });
    });
    const teacherRows = Object.entries(teacherMap).map(([name, sessions]) =>
      `<tr><td class="t-name">${name}</td><td>${sessions.length}</td><td>${[...new Set(sessions.map(s => s.subject))].join(', ')}</td></tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Timetable - Print</title>
<style>
  @page { size: A4 landscape; margin: 12mm 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1d23; font-size: 10px; line-height: 1.4; }

  .header { text-align: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #0f172a; }
  .header h1 { font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
  .header p { font-size: 10px; color: #64748b; margin-top: 2px; }
  .meta-row { display: flex; justify-content: space-between; font-size: 9px; color: #64748b; margin-bottom: 10px; }

  table { width: 100%; border-collapse: collapse; }
  th { background: #0f172a; color: #fff; font-weight: 600; font-size: 10px; padding: 6px 4px; text-align: center; }
  th:first-child { text-align: left; padding-left: 8px; background: #1e293b; min-width: 75px; }

  .time-col { background: #f8fafc; font-weight: 600; font-size: 9px; color: #475569; padding: 6px 8px; white-space: nowrap; border: 1px solid #d1d5db; }
  .cell { border: 1px solid #d1d5db; padding: 3px; vertical-align: top; min-width: 110px; }
  .empty-cell { text-align: center; color: #cbd5e1; font-size: 12px; vertical-align: middle; }
  .cell-conflict { background: #fef2f2; }

  .session { background: #eff6ff; border-left: 2.5px solid #2563eb; padding: 3px 5px; border-radius: 3px; margin-bottom: 2px; }
  .session.conflict { background: #fee2e2; border-left-color: #dc2626; }
  .subj { font-weight: 700; font-size: 9.5px; color: #1e293b; }
  .meta { font-size: 8px; color: #64748b; }
  .type { display: inline-block; font-size: 7px; font-weight: 600; padding: 0.5px 4px; border-radius: 2px; margin-top: 2px; }
  .type-theory { background: #e0e7ff; color: #3730a3; }
  .type-prac { background: #fef3c7; color: #92400e; }

  .legend { margin-top: 10px; display: flex; gap: 16px; font-size: 9px; color: #64748b; align-items: center; }
  .legend-box { width: 12px; height: 12px; border-radius: 2px; display: inline-block; vertical-align: middle; margin-right: 3px; }
  .leg-normal { background: #eff6ff; border-left: 2px solid #2563eb; }
  .leg-conflict { background: #fee2e2; border-left: 2px solid #dc2626; }

  .summary { margin-top: 16px; page-break-inside: avoid; }
  .summary h3 { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
  .summary table th { background: #f8fafc; color: #475569; font-size: 9px; text-align: left; padding: 4px 8px; }
  .summary table td { padding: 4px 8px; font-size: 9px; border-bottom: 1px solid #f1f5f9; }
  .t-name { font-weight: 600; color: #1e293b; }

  .footer { margin-top: 14px; padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8px; color: #94a3b8; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none; }
  }
</style>
</head><body>
  <div class="header">
    <h1>Weekly Timetable</h1>
    <p>AI-Based Dynamic Scheduling System</p>
  </div>
  <div class="meta-row">
    <span>Generated: ${dateStr} at ${timeStr}</span>
    <span>Total Sessions: ${timetable.length} | Conflicts: ${conflicts.length}</span>
  </div>
  <table>
    <thead><tr><th>Time</th>${dayHeaders}</tr></thead>
    <tbody>${cellsHtml}</tbody>
  </table>
  <div class="legend">
    <span><span class="legend-box leg-normal"></span>Normal Session</span>
    <span><span class="legend-box leg-conflict"></span>Conflict</span>
    <span style="margin-left: 8px;"><span class="type type-theory">Theory</span></span>
    <span><span class="type type-prac">Practical</span></span>
  </div>
  <div class="summary">
    <h3>Teacher Summary</h3>
    <table>
      <thead><tr><th>Teacher</th><th>Sessions</th><th>Subjects</th></tr></thead>
      <tbody>${teacherRows}</tbody>
    </table>
  </div>
  <div class="footer">Timetable Generator &mdash; Printed on ${dateStr}</div>
  <script>window.onload = function() { window.print(); }</script>
</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
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
            <button data-testid="print-timetable-btn" className="btn btn-outline" onClick={handlePrint}>
              <PrintIcon />
              Print / PDF
            </button>
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
