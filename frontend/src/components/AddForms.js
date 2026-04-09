import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from './Toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00'];

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
);

const AddForms = ({ onRefresh, apiUrl, data }) => {
  const [activeForm, setActiveForm] = useState('teacher');
  const [teacherName, setTeacherName] = useState('');
  const [teacherSubjects, setTeacherSubjects] = useState('');
  const [teacherDays, setTeacherDays] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState(30);
  const [roomType, setRoomType] = useState('Classroom');
  const [roomFacilities, setRoomFacilities] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectCredits, setSubjectCredits] = useState(3);
  const [subjectType, setSubjectType] = useState('Theory');
  const [subjectSessions, setSubjectSessions] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const fileInputRef = useRef(null);

  const toggleDay = (day) => {
    setTeacherDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const addTeacher = async (e) => {
    e.preventDefault();
    if (!teacherName.trim()) { toast.error('Teacher name is required'); return; }
    setSubmitting(true);
    try {
      const availability = {};
      teacherDays.forEach(day => { availability[day] = [...SLOTS]; });
      await axios.post(`${apiUrl}/teachers`, { name: teacherName.trim(), subjects: teacherSubjects.split(',').map(s => s.trim()).filter(Boolean), availability });
      toast.success(`Teacher "${teacherName}" added`);
      setTeacherName(''); setTeacherSubjects(''); setTeacherDays([]);
      onRefresh();
    } catch (err) { toast.error('Failed to add teacher'); }
    setSubmitting(false);
  };

  const addRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) { toast.error('Room name is required'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${apiUrl}/rooms`, { name: roomName.trim(), capacity: parseInt(roomCapacity), type: roomType, facilities: roomFacilities.split(',').map(f => f.trim()).filter(Boolean) });
      toast.success(`Room "${roomName}" added`);
      setRoomName(''); setRoomCapacity(30); setRoomType('Classroom'); setRoomFacilities('');
      onRefresh();
    } catch (err) { toast.error('Failed to add room'); }
    setSubmitting(false);
  };

  const addSubject = async (e) => {
    e.preventDefault();
    if (!subjectName.trim() || !subjectCode.trim()) { toast.error('Name and code are required'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${apiUrl}/subjects`, { name: subjectName.trim(), code: subjectCode.trim().toUpperCase(), credits: parseInt(subjectCredits), type: subjectType, requiredSessions: parseInt(subjectSessions) });
      toast.success(`Subject "${subjectName}" added`);
      setSubjectName(''); setSubjectCode(''); setSubjectCredits(3); setSubjectType('Theory'); setSubjectSessions(3);
      onRefresh();
    } catch (err) { toast.error('Failed to add subject'); }
    setSubmitting(false);
  };

  // CSV Upload
  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { toast.error('Please select a CSV file'); return; }
    setUploading(true);
    setUploadResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${apiUrl}/upload/${activeForm}s`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setUploadResult({ success: true, added: res.data.added, errors: res.data.errors, total: res.data.total });
        toast.success(`${res.data.added} ${activeForm}(s) imported`);
        onRefresh();
      } else {
        setUploadResult({ success: false, error: res.data.error });
        toast.error(res.data.error || 'Upload failed');
      }
    } catch (err) {
      toast.error('Upload failed');
      setUploadResult({ success: false, error: err.message });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Sample CSV download
  const downloadSample = () => {
    const link = document.createElement('a');
    link.href = `${apiUrl}/sample/${activeForm}s`;
    link.download = `sample_${activeForm}s.csv`;
    link.click();
    toast.info(`Downloading sample ${activeForm}s CSV`);
  };

  const CSV_FORMATS = {
    teacher: { columns: 'name, subjects, available_days', example: 'Dr. Sharma, Mathematics;Statistics, Monday;Tuesday;Wednesday', note: 'Use semicolons (;) to separate multiple subjects and days' },
    room: { columns: 'name, capacity, type, facilities', example: 'Room 101, 40, Classroom, Projector;Whiteboard', note: 'Type must be "Classroom" or "Lab". Use semicolons (;) for multiple facilities' },
    subject: { columns: 'name, code, credits, type, required_sessions', example: 'Mathematics, MATH101, 4, Theory, 4', note: 'Type must be "Theory" or "Practical"' },
  };

  const currentFormat = CSV_FORMATS[activeForm];

  return (
    <div className="add-forms-page">
      {/* Tab Selector */}
      <div className="form-tabs">
        {[
          { key: 'teacher', label: 'Teachers', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { key: 'room', label: 'Rooms', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { key: 'subject', label: 'Subjects', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> }
        ].map(tab => (
          <button key={tab.key} data-testid={`form-tab-${tab.key}`} className={`form-tab ${activeForm === tab.key ? 'active' : ''}`} onClick={() => { setActiveForm(tab.key); setUploadResult(null); }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* CSV Upload Section */}
      <div className="card csv-upload-card" data-testid="csv-upload-section">
        <div className="csv-header">
          <div>
            <h3 className="form-title" style={{ marginBottom: '0.25rem' }}>
              <UploadIcon /> Import {activeForm.charAt(0).toUpperCase() + activeForm.slice(1)}s via CSV
            </h3>
            <p className="csv-desc">Upload a CSV file to bulk-import data. Existing records are preserved.</p>
          </div>
          <button className="btn btn-outline" onClick={downloadSample} data-testid="download-sample-btn">
            <DownloadIcon /> Sample CSV
          </button>
        </div>

        {/* CSV Format Guide */}
        <div className="csv-format" data-testid="csv-format-guide">
          <div className="csv-format-header">
            <FileIcon />
            <span>CSV Format</span>
          </div>
          <div className="csv-format-body">
            <div className="csv-columns"><strong>Columns:</strong> {currentFormat.columns}</div>
            <div className="csv-example"><strong>Example row:</strong> <code>{currentFormat.example}</code></div>
            <div className="csv-note">{currentFormat.note}</div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="csv-dropzone" data-testid="csv-dropzone" onClick={() => fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} data-testid="csv-file-input" />
          {uploading ? (
            <div className="csv-uploading">
              <span className="spinner spinner-blue"></span>
              <span>Uploading...</span>
            </div>
          ) : (
            <>
              <UploadIcon />
              <span className="csv-dropzone-text">Click to select CSV file</span>
              <span className="csv-dropzone-hint">Only .csv files accepted</span>
            </>
          )}
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <div className={`csv-result ${uploadResult.success ? 'csv-result-ok' : 'csv-result-err'}`} data-testid="csv-upload-result">
            {uploadResult.success ? (
              <>
                <div className="csv-result-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <strong>{uploadResult.added} {activeForm}(s) imported successfully</strong>
                </div>
                <span className="csv-result-total">Total {activeForm}s now: {uploadResult.total}</span>
                {uploadResult.errors?.length > 0 && (
                  <div className="csv-result-errors">
                    <strong>Skipped rows:</strong>
                    {uploadResult.errors.map((e, i) => <div key={i} className="csv-err-line">{e}</div>)}
                  </div>
                )}
              </>
            ) : (
              <div className="csv-result-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <strong>Upload failed: {uploadResult.error}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="or-divider"><span>OR add manually</span></div>

      {/* Manual Forms */}
      {activeForm === 'teacher' && (
        <form className="card form-card" onSubmit={addTeacher} data-testid="add-teacher-form">
          <h3 className="form-title">Add New Teacher</h3>
          <div className="form-group">
            <label className="form-label">Teacher Name *</label>
            <input data-testid="teacher-name-input" className="form-input" type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="e.g. Dr. Smith" />
          </div>
          <div className="form-group">
            <label className="form-label">Subjects (comma-separated)</label>
            <input data-testid="teacher-subjects-input" className="form-input" type="text" value={teacherSubjects} onChange={e => setTeacherSubjects(e.target.value)} placeholder="e.g. Mathematics, Physics" />
          </div>
          <div className="form-group">
            <label className="form-label">Available Days</label>
            <div className="day-selector">
              {DAYS.map(day => (
                <button key={day} type="button" data-testid={`day-btn-${day}`} className={`day-btn ${teacherDays.includes(day) ? 'active' : ''}`} onClick={() => toggleDay(day)}>
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <button data-testid="submit-teacher-btn" className="btn btn-primary form-submit" type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Teacher'}
          </button>
        </form>
      )}

      {activeForm === 'room' && (
        <form className="card form-card" onSubmit={addRoom} data-testid="add-room-form">
          <h3 className="form-title">Add New Room</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Room Name *</label>
              <input data-testid="room-name-input" className="form-input" type="text" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="e.g. Room 201" />
            </div>
            <div className="form-group">
              <label className="form-label">Capacity</label>
              <input data-testid="room-capacity-input" className="form-input" type="number" min="1" max="500" value={roomCapacity} onChange={e => setRoomCapacity(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select data-testid="room-type-select" className="form-input" value={roomType} onChange={e => setRoomType(e.target.value)}>
                <option value="Classroom">Classroom</option>
                <option value="Lab">Lab</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Facilities (comma-separated)</label>
              <input data-testid="room-facilities-input" className="form-input" type="text" value={roomFacilities} onChange={e => setRoomFacilities(e.target.value)} placeholder="e.g. Projector, Whiteboard" />
            </div>
          </div>
          <button data-testid="submit-room-btn" className="btn btn-primary form-submit" type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Room'}
          </button>
        </form>
      )}

      {activeForm === 'subject' && (
        <form className="card form-card" onSubmit={addSubject} data-testid="add-subject-form">
          <h3 className="form-title">Add New Subject</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Subject Name *</label>
              <input data-testid="subject-name-input" className="form-input" type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. Algorithms" />
            </div>
            <div className="form-group">
              <label className="form-label">Subject Code *</label>
              <input data-testid="subject-code-input" className="form-input" type="text" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} placeholder="e.g. CS201" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select data-testid="subject-type-select" className="form-input" value={subjectType} onChange={e => setSubjectType(e.target.value)}>
                <option value="Theory">Theory</option>
                <option value="Practical">Practical</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Credits</label>
              <input data-testid="subject-credits-input" className="form-input" type="number" min="1" max="10" value={subjectCredits} onChange={e => setSubjectCredits(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Required Sessions</label>
              <input data-testid="subject-sessions-input" className="form-input" type="number" min="1" max="10" value={subjectSessions} onChange={e => setSubjectSessions(e.target.value)} />
            </div>
          </div>
          <button data-testid="submit-subject-btn" className="btn btn-primary form-submit" type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Subject'}
          </button>
        </form>
      )}

      {/* Data Summary */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="form-title" style={{ marginBottom: '1rem' }}>Current Data Summary</h3>
        <div className="summary-grid">
          <div className="summary-item"><span className="summary-num">{data.teachers.length}</span><span className="summary-label">Teachers</span></div>
          <div className="summary-item"><span className="summary-num">{data.rooms.length}</span><span className="summary-label">Rooms</span></div>
          <div className="summary-item"><span className="summary-num">{data.subjects.length}</span><span className="summary-label">Subjects</span></div>
          <div className="summary-item"><span className="summary-num">{data.timetable.length}</span><span className="summary-label">Sessions</span></div>
        </div>
      </div>
    </div>
  );
};

export default AddForms;
