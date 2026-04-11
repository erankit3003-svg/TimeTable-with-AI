import React, { useState, useEffect } from 'react';
import { toast } from './Toast';

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);
const LoadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);

const ConfigForm = ({ onGenerate, loading, data, savedConfig }) => {
  const [className, setClassName] = useState('Class 10-A');
  const [workingDays, setWorkingDays] = useState(5);
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [startTime, setStartTime] = useState('09:00');
  const [subjects, setSubjects] = useState([
    { name: '', teacher: '', credits: 3, type: 'Theory' }
  ]);

  // Load saved config on mount
  useEffect(() => {
    if (savedConfig && savedConfig.className) {
      setClassName(savedConfig.className);
      setWorkingDays(savedConfig.workingDays || 5);
      setHoursPerDay(savedConfig.hoursPerDay || 6);
      setDurationMinutes(savedConfig.durationMinutes || 45);
      setStartTime(savedConfig.startTime || '09:00');
      if (savedConfig.subjects?.length > 0) {
        setSubjects(savedConfig.subjects);
      }
    }
  }, [savedConfig]);

  const addSubjectRow = () => {
    setSubjects([...subjects, { name: '', teacher: '', credits: 3, type: 'Theory' }]);
  };

  const removeSubjectRow = (index) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index, field, value) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], [field]: field === 'credits' ? (parseInt(value) || 1) : value };
    setSubjects(updated);
  };

  // Load subjects from existing data
  const loadFromExisting = () => {
    if (!data.subjects?.length && !data.teachers?.length) {
      toast.warning('No existing subjects or teachers found. Add them in the Data tab first.');
      return;
    }
    const loaded = data.subjects.map(s => {
      const teacher = data.teachers.find(t => t.subjects?.includes(s.name));
      return {
        name: s.name,
        teacher: teacher?.name || '',
        credits: s.credits || s.requiredSessions || 3,
        type: s.type || 'Theory',
      };
    });
    if (loaded.length > 0) {
      setSubjects(loaded);
      toast.success(`Loaded ${loaded.length} subjects from existing data`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validSubjects = subjects.filter(s => s.name.trim());
    if (validSubjects.length === 0) {
      toast.error('Add at least one subject with a name');
      return;
    }
    if (hoursPerDay <= 0 || durationMinutes <= 0) {
      toast.error('Hours and duration must be positive');
      return;
    }
    onGenerate({
      className: className.trim() || 'Class A',
      workingDays,
      hoursPerDay: parseFloat(hoursPerDay),
      durationMinutes: parseInt(durationMinutes),
      startTime,
      subjects: validSubjects.map(s => ({
        name: s.name.trim(),
        teacher: s.teacher.trim() || 'TBA',
        credits: parseInt(s.credits) || 1,
        type: s.type || 'Theory',
      })),
    });
  };

  // Computed preview
  const numSlots = Math.floor((hoursPerDay * 60) / durationMinutes) || 0;
  const totalCredits = subjects.reduce((sum, s) => sum + (parseInt(s.credits) || 0), 0);
  const totalSlots = numSlots * workingDays;
  const freeSlots = totalSlots - totalCredits; // Allow negative for overflow detection

  const dayNames = workingDays === 6
    ? 'Mon - Sat'
    : 'Mon - Fri';

  return (
    <div className="config-page" data-testid="config-page">
      <form onSubmit={handleSubmit}>
        {/* Class Configuration */}
        <div className="card config-card">
          <div className="config-section-header">
            <h3 className="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Class Configuration
            </h3>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Class Name</label>
              <input
                data-testid="config-class-name"
                className="form-input"
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="e.g. Class 10-A"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Working Days</label>
              <div className="day-toggle" data-testid="config-working-days">
                <button
                  type="button"
                  className={`toggle-btn ${workingDays === 5 ? 'active' : ''}`}
                  onClick={() => setWorkingDays(5)}
                  data-testid="days-5-btn"
                >
                  Mon-Fri
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${workingDays === 6 ? 'active' : ''}`}
                  onClick={() => setWorkingDays(6)}
                  data-testid="days-6-btn"
                >
                  Mon-Sat
                </button>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                data-testid="config-start-time"
                className="form-input"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hours Per Day</label>
              <input
                data-testid="config-hours"
                className="form-input"
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={hoursPerDay}
                onChange={e => setHoursPerDay(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Period Duration (min)</label>
              <input
                data-testid="config-duration"
                className="form-input"
                type="number"
                min="15"
                max="120"
                step="5"
                value={durationMinutes}
                onChange={e => setDurationMinutes(parseInt(e.target.value) || 30)}
              />
            </div>
          </div>

          {/* Preview Stats */}
          <div className="config-preview" data-testid="config-preview">
            <div className="preview-stat">
              <span className="preview-num" data-testid="preview-slots">{numSlots}</span>
              <span className="preview-label">Periods/Day</span>
            </div>
            <div className="preview-stat">
              <span className="preview-num">{dayNames}</span>
              <span className="preview-label">{workingDays} Days</span>
            </div>
            <div className="preview-stat">
              <span className="preview-num">{totalSlots}</span>
              <span className="preview-label">Total Slots/Week</span>
            </div>
            <div className="preview-stat">
              <span className="preview-num">{totalCredits}</span>
              <span className="preview-label">Credits Needed</span>
            </div>
            <div className="preview-stat">
              <span className={`preview-num ${freeSlots < 0 ? 'preview-warn' : ''}`}>{freeSlots < 0 ? 'Over by ' + Math.abs(freeSlots) : freeSlots}</span>
              <span className="preview-label">{freeSlots < 0 ? 'Overflow!' : 'Free Periods'}</span>
            </div>
          </div>
        </div>

        {/* Subjects & Teachers */}
        <div className="card config-card" style={{ marginTop: '1.25rem' }}>
          <div className="config-section-header">
            <h3 className="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              Subjects & Teachers
              <span className="card-badge">{subjects.filter(s => s.name.trim()).length}</span>
            </h3>
            <button type="button" className="btn btn-outline" onClick={loadFromExisting} data-testid="load-existing-btn">
              <LoadIcon /> Load from Data
            </button>
          </div>

          <div className="subject-table-wrap" data-testid="subjects-config-table">
            <table className="subject-config-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Subject Name</th>
                  <th style={{ width: '25%' }}>Teacher</th>
                  <th style={{ width: '15%' }}>Credits/Week</th>
                  <th style={{ width: '15%' }}>Type</th>
                  <th style={{ width: '15%' }}></th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s, i) => (
                  <tr key={i} data-testid={`subject-row-${i}`}>
                    <td>
                      <input
                        className="form-input"
                        data-testid={`subject-name-${i}`}
                        value={s.name}
                        onChange={e => updateSubject(i, 'name', e.target.value)}
                        placeholder="e.g. Mathematics"
                        list="existing-subjects"
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        data-testid={`subject-teacher-${i}`}
                        value={s.teacher}
                        onChange={e => updateSubject(i, 'teacher', e.target.value)}
                        placeholder="e.g. Dr. Sharma"
                        list="existing-teachers"
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        data-testid={`subject-credits-${i}`}
                        type="number"
                        min="1"
                        max="10"
                        value={s.credits}
                        onChange={e => updateSubject(i, 'credits', e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        className="form-input"
                        data-testid={`subject-type-${i}`}
                        value={s.type}
                        onChange={e => updateSubject(i, 'type', e.target.value)}
                      >
                        <option value="Theory">Theory</option>
                        <option value="Practical">Practical</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="icon-btn icon-delete"
                        data-testid={`remove-subject-${i}`}
                        onClick={() => removeSubjectRow(i)}
                        disabled={subjects.length <= 1}
                        title="Remove"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" className="btn btn-outline" onClick={addSubjectRow} data-testid="add-subject-row-btn" style={{ marginTop: '0.75rem' }}>
            <PlusIcon /> Add Subject
          </button>

          {/* Autocomplete datalists */}
          <datalist id="existing-subjects">
            {(data.subjects || []).map(s => <option key={s.id} value={s.name} />)}
          </datalist>
          <datalist id="existing-teachers">
            {(data.teachers || []).map(t => <option key={t.id} value={t.name} />)}
          </datalist>
        </div>

        {/* Capacity Warning */}
        {freeSlots < 0 && (
          <div className="alert-box alert-danger" style={{ marginTop: '1rem' }} data-testid="capacity-warning">
            <div className="alert-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <strong>Credit Overflow</strong>
            </div>
            <p className="alert-desc">
              Total credits ({totalCredits}) exceed available slots ({totalSlots}). Some subjects won't get all their sessions. Reduce credits or increase hours/days.
            </p>
          </div>
        )}

        {/* Generate Button */}
        <button
          type="submit"
          className="btn btn-primary config-generate-btn"
          disabled={loading}
          data-testid="config-generate-btn"
        >
          {loading ? (
            <><span className="spinner"></span> Generating Timetable...</>
          ) : (
            <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Generate Timetable</>
          )}
        </button>
      </form>
    </div>
  );
};

export default ConfigForm;
