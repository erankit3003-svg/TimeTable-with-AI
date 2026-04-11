import React from 'react';

const TimetableGrid = ({ result, conflicts, onExport, onDetectConflicts }) => {
  if (!result || !result.timetable || result.timetable.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }} data-testid="empty-timetable">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p className="empty-msg">No Timetable Generated</p>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>Go to the Generate tab and configure your timetable</p>
      </div>
    );
  }

  const { timetable, days, slots, className } = result;

  // Build grid: slot -> day -> entry
  const grid = {};
  slots.forEach(slot => {
    grid[slot] = {};
    days.forEach(day => { grid[slot][day] = null; });
  });
  timetable.forEach(entry => {
    if (grid[entry.timeSlot]) {
      grid[entry.timeSlot][entry.day] = entry;
    }
  });

  const hasConflict = (day, timeSlot) => {
    return (conflicts || []).some(c => c.day === day && c.timeSlot === timeSlot);
  };

  const sessionCount = timetable.filter(t => t.subject !== 'Free Period').length;
  const freeCount = timetable.filter(t => t.subject === 'Free Period').length;

  // Detect lunch break gap
  const lunchAfterIndex = slots.length > 2 ? Math.floor(slots.length / 2) - 1 : -1;

  // Print / PDF handler
  const handlePrint = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const dayHeaders = days.map(d => `<th>${d}</th>`).join('');

    const rowsHtml = slots.map((slot, si) => {
      const cells = days.map(day => {
        const entry = grid[slot]?.[day];
        const isConflict = hasConflict(day, slot);
        if (!entry || entry.subject === 'Free Period') {
          return `<td class="cell free-cell">Free</td>`;
        }
        return `<td class="cell${isConflict ? ' cell-conflict' : ''}">
          <div class="session${isConflict ? ' conflict' : ''}">
            <div class="subj">${entry.subject}</div>
            <div class="meta">${entry.teacher}</div>
            <span class="type type-${entry.type === 'Practical' ? 'prac' : 'theory'}">${entry.type}</span>
          </div>
        </td>`;
      }).join('');

      const lunchRow = si === lunchAfterIndex
        ? `</tr><tr><td colspan="${days.length + 1}" class="lunch-row">LUNCH BREAK</td>`
        : '';

      return `<tr><td class="time-col">${slot}</td>${cells}${lunchRow}</tr>`;
    }).join('');

    // Teacher summary
    const teacherMap = {};
    timetable.filter(t => t.subject !== 'Free Period').forEach(s => {
      if (!teacherMap[s.teacher]) teacherMap[s.teacher] = new Set();
      teacherMap[s.teacher].add(s.subject);
    });
    const teacherRows = Object.entries(teacherMap).map(([name, subjs]) =>
      `<tr><td class="t-name">${name}</td><td>${subjs.size}</td><td>${[...subjs].join(', ')}</td></tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${className} - Timetable</title>
<style>
  @page { size: A4 landscape; margin: 12mm 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1d23; font-size: 10px; line-height: 1.4; }
  .header { text-align: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #0f172a; }
  .header h1 { font-size: 20px; font-weight: 700; color: #0f172a; }
  .header .class-name { font-size: 14px; color: #2563eb; font-weight: 600; margin-top: 2px; }
  .header p { font-size: 10px; color: #64748b; margin-top: 2px; }
  .meta-row { display: flex; justify-content: space-between; font-size: 9px; color: #64748b; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #0f172a; color: #fff; font-weight: 600; font-size: 10px; padding: 7px 4px; text-align: center; }
  th:first-child { text-align: left; padding-left: 8px; background: #1e293b; min-width: 90px; }
  .time-col { background: #f8fafc; font-weight: 600; font-size: 9px; color: #475569; padding: 6px 8px; white-space: nowrap; border: 1px solid #d1d5db; font-family: 'Courier New', monospace; }
  .cell { border: 1px solid #d1d5db; padding: 4px; vertical-align: top; min-width: 100px; }
  .free-cell { text-align: center; color: #94a3b8; font-size: 9px; font-style: italic; background: #fafafa; }
  .cell-conflict { background: #fef2f2; }
  .lunch-row { text-align: center; background: #fef3c7; color: #92400e; font-weight: 700; font-size: 9px; padding: 4px; letter-spacing: 0.1em; border: 1px solid #fde68a; }
  .session { background: #eff6ff; border-left: 2.5px solid #2563eb; padding: 3px 5px; border-radius: 3px; }
  .session.conflict { background: #fee2e2; border-left-color: #dc2626; }
  .subj { font-weight: 700; font-size: 10px; color: #1e293b; }
  .meta { font-size: 8px; color: #64748b; }
  .type { display: inline-block; font-size: 7px; font-weight: 600; padding: 0.5px 4px; border-radius: 2px; margin-top: 2px; }
  .type-theory { background: #e0e7ff; color: #3730a3; }
  .type-prac { background: #fef3c7; color: #92400e; }
  .summary { margin-top: 16px; page-break-inside: avoid; }
  .summary h3 { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .summary table th { background: #f8fafc; color: #475569; font-size: 9px; text-align: left; padding: 4px 8px; }
  .summary table td { padding: 4px 8px; font-size: 9px; border-bottom: 1px solid #f1f5f9; }
  .t-name { font-weight: 600; color: #1e293b; }
  .footer { margin-top: 14px; padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8px; color: #94a3b8; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
  <div class="header">
    <h1>Weekly Timetable</h1>
    <div class="class-name">${className}</div>
    <p>${days.join(', ')}</p>
  </div>
  <div class="meta-row">
    <span>Generated: ${dateStr} at ${timeStr}</span>
    <span>Sessions: ${sessionCount} | Free: ${freeCount} | Conflicts: ${(conflicts || []).length}</span>
  </div>
  <table>
    <thead><tr><th>Time Slot</th>${dayHeaders}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="summary">
    <h3>Teacher Summary</h3>
    <table>
      <thead><tr><th>Teacher</th><th>Subjects</th><th>Teaching</th></tr></thead>
      <tbody>${teacherRows}</tbody>
    </table>
  </div>
  <div class="footer">Timetable Generator &mdash; ${className} &mdash; ${dateStr}</div>
  <script>window.onload = function() { window.print(); }</script>
</body></html>`;

    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
      alert('Please allow popups for PDF export');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="timetable-page" data-testid="timetable-page">
      {/* Header */}
      <div className="card">
        <div className="tt-header">
          <div>
            <h2 className="tt-title" data-testid="tt-class-name">{className}</h2>
            <p className="tt-subtitle">
              {sessionCount} sessions &middot; {freeCount} free
              {(conflicts || []).length > 0 && (
                <span className="tt-conflict-count"> &middot; {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
          <div className="tt-actions">
            <button data-testid="detect-conflicts-grid-btn" className="btn btn-outline" onClick={onDetectConflicts}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Check Conflicts
            </button>
            <button data-testid="print-timetable-btn" className="btn btn-outline" onClick={handlePrint}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print / PDF
            </button>
            <button data-testid="export-timetable-btn" className="btn btn-primary" onClick={onExport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="card tt-grid-wrap">
        <div className="tt-grid-scroll">
          <table className="tt-table" data-testid="timetable-grid">
            <thead>
              <tr>
                <th className="tt-th-time">Time Slot</th>
                {days.map(day => (
                  <th key={day} data-testid={`day-header-${day}`}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, si) => (
                <React.Fragment key={slot}>
                  <tr>
                    <td className="tt-td-time" data-testid={`time-slot-${slot}`}>{slot}</td>
                    {days.map(day => {
                      const entry = grid[slot]?.[day];
                      const isConflict = hasConflict(day, slot);
                      const isFree = !entry || entry.subject === 'Free Period';

                      return (
                        <td
                          key={`${day}-${slot}`}
                          className={`tt-cell ${isConflict ? 'tt-cell-conflict' : ''} ${isFree ? 'tt-cell-free' : ''}`}
                          data-testid={`cell-${day}-${slot}`}
                        >
                          {isFree ? (
                            <div className="free-period" data-testid={`free-${day}-${slot}`}>Free</div>
                          ) : (
                            <div className={`session ${isConflict ? 'session-conflict' : ''}`} data-testid={`session-${entry.id}`}>
                              <div className="session-subject">{entry.subject}</div>
                              <div className="session-info">{entry.teacher}</div>
                              <span className={`session-type ${entry.type === 'Practical' ? 'type-practical' : 'type-theory'}`}>{entry.type}</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {/* Lunch break indicator */}
                  {si === lunchAfterIndex && (
                    <tr key="lunch" className="lunch-break-row">
                      <td colSpan={days.length + 1} className="lunch-break-cell" data-testid="lunch-break">
                        LUNCH BREAK
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="tt-legend">
        <div className="legend-item">
          <div className="legend-swatch legend-normal"></div>
          <span>Session</span>
        </div>
        <div className="legend-item">
          <div className="legend-swatch legend-free"></div>
          <span>Free Period</span>
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
