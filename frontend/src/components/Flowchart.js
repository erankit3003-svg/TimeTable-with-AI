import React, { useState } from 'react';

const STEPS = [
  {
    id: 1,
    title: 'Load Input Data',
    desc: 'Read teachers, rooms, and subjects from JSON files',
    detail: 'The system loads all configuration data: teacher availability schedules, room capacities and types, subject requirements including credit hours and session counts.',
    color: '#2563eb',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  },
  {
    id: 2,
    title: 'Sort Subjects by Difficulty',
    desc: 'Subjects with more required sessions are scheduled first',
    detail: 'Subjects are sorted in descending order of required sessions. This ensures harder-to-schedule subjects (with more sessions) get priority placement, reducing the chance of unschedulable entries later.',
    color: '#7c3aed',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
  },
  {
    id: 3,
    title: 'Find Eligible Teacher',
    desc: 'Match teacher to subject + check availability for day/slot',
    detail: 'For each subject, the algorithm finds teachers who can teach it. Then for each day and time slot, it checks: (1) Is the teacher qualified for this subject? (2) Is the teacher available on this day/slot? (3) Is the teacher not already assigned to another session at this time?',
    color: '#059669',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
  },
  {
    id: 4,
    title: 'Find Available Room',
    desc: 'Match room type (Lab/Classroom) + check no conflicts',
    detail: 'The algorithm prefers Labs for Practical subjects and Classrooms for Theory subjects. It checks that the room is not already booked for the same day and time slot. If the preferred type is unavailable, any free room is used as fallback.',
    color: '#d97706',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  },
  {
    id: 5,
    title: 'Allocate Session',
    desc: 'Assign teacher + room to time slot, mark as occupied',
    detail: 'Once both a teacher and room are found, the session is created. The teacher and room are marked as occupied for that day/slot combination, preventing future double-bookings. The session entry records subject, teacher, room, day, and time.',
    color: '#2563eb',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
  },
  {
    id: 6,
    title: 'Conflict Detection',
    desc: 'Scan for teacher double-booking (High) and room clashes (Medium)',
    detail: 'After generation, the full timetable is scanned. For every session, the system checks if any other session shares the same teacher+day+slot or room+day+slot. Teacher conflicts are marked as HIGH severity, room conflicts as MEDIUM.',
    color: '#dc2626',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  },
  {
    id: 7,
    title: 'Partial Re-Optimization',
    desc: 'Reschedule only conflicting sessions with minimum impact',
    detail: 'Instead of regenerating the entire timetable, only conflicting sessions are moved. The algorithm scores each alternative slot by impact: same-day moves score lower (less disruption), same-room moves score lower. The slot with the minimum impact score is chosen.',
    color: '#059669',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
  },
  {
    id: 8,
    title: 'Output Final Timetable',
    desc: 'Save to JSON, display in grid, export option available',
    detail: 'The finalized timetable is saved to timetable.json and displayed in the weekly grid view. Users can export as JSON for backup or integration with other systems. Conflict-free sessions are shown in blue, conflicts in red.',
    color: '#7c3aed',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  }
];

const CONSTRAINTS = [
  { label: 'Teacher Availability', priority: 'High', color: '#dc2626', desc: 'Teacher must be available on that day and time slot' },
  { label: 'Room Availability', priority: 'Medium', color: '#d97706', desc: 'Room must not be double-booked at the same time' },
  { label: 'Room Type Preference', priority: 'Low', color: '#2563eb', desc: 'Labs preferred for Practical, Classrooms for Theory' },
];

const Flowchart = () => {
  const [activeStep, setActiveStep] = useState(null);

  return (
    <div className="flowchart-page">
      {/* Title */}
      <div className="card">
        <h2 className="fc-title">Scheduling Algorithm Flowchart</h2>
        <p className="fc-desc">Visual representation of the timetable generation and optimization process</p>
      </div>

      {/* Constraint Priority */}
      <div className="card">
        <h3 className="fc-section-title">Constraint Priority System</h3>
        <div className="constraint-grid">
          {CONSTRAINTS.map((c, i) => (
            <div key={i} className="constraint-card" style={{ borderLeftColor: c.color }} data-testid={`constraint-${i}`}>
              <div className="constraint-header">
                <span className="constraint-label">{c.label}</span>
                <span className="constraint-priority" style={{ background: c.color + '18', color: c.color }}>{c.priority}</span>
              </div>
              <p className="constraint-desc">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Flowchart Steps */}
      <div className="card fc-steps-card">
        <h3 className="fc-section-title">Algorithm Flow</h3>
        <div className="fc-flow">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="fc-step-wrapper">
              <div
                className={`fc-step ${activeStep === step.id ? 'fc-step-active' : ''}`}
                style={{ '--step-color': step.color }}
                onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                data-testid={`flow-step-${step.id}`}
              >
                <div className="fc-step-num" style={{ background: step.color }}>{step.id}</div>
                <div className="fc-step-icon" style={{ color: step.color }}>{step.icon}</div>
                <div className="fc-step-content">
                  <h4 className="fc-step-title">{step.title}</h4>
                  <p className="fc-step-desc">{step.desc}</p>
                </div>
                <svg className="fc-step-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: activeStep === step.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              {activeStep === step.id && (
                <div className="fc-step-detail" data-testid={`flow-detail-${step.id}`}>
                  <p>{step.detail}</p>
                </div>
              )}
              {idx < STEPS.length - 1 && (
                <div className="fc-connector">
                  <svg width="2" height="28" viewBox="0 0 2 28"><line x1="1" y1="0" x2="1" y2="28" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 3"/></svg>
                  {(idx === 4) && <span className="fc-connector-label">For each subject</span>}
                  {(idx === 5) && <span className="fc-connector-label fc-connector-branch">If conflicts found</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Impact Minimization Explanation */}
      <div className="card">
        <h3 className="fc-section-title">Impact Minimization Scoring</h3>
        <p className="fc-desc" style={{ marginBottom: '1rem' }}>When rescheduling a conflicting session, each alternative slot receives an impact score. The slot with the lowest score is selected.</p>
        <div className="impact-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Factor</th><th>Score</th><th>Reasoning</th></tr>
            </thead>
            <tbody>
              <tr><td className="cell-name">Same day move</td><td><span className="tag tag-green">+0</span></td><td>Minimal disruption, same day schedule</td></tr>
              <tr><td className="cell-name">Different day move</td><td><span className="tag tag-amber">+2</span></td><td>Affects teacher's weekly plan</td></tr>
              <tr><td className="cell-name">Room change</td><td><span className="tag tag-blue">+1</span></td><td>Students/teacher must go to different room</td></tr>
              <tr><td className="cell-name">Same room kept</td><td><span className="tag tag-green">+0</span></td><td>No room change needed</td></tr>
              <tr><td className="cell-name">Earlier day preference</td><td><span className="tag tag-indigo">+0.1/day</span></td><td>Prefer scheduling early in the week</td></tr>
              <tr><td className="cell-name">Earlier slot preference</td><td><span className="tag tag-indigo">+0.01/slot</span></td><td>Prefer morning/early afternoon slots</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Flowchart;
