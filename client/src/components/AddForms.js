import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00'];

const AddForms = ({ onRefresh, apiUrl, data }) => {
  const [activeForm, setActiveForm] = useState('teacher');

  // Teacher form
  const [teacherName, setTeacherName] = useState('');
  const [teacherSubjects, setTeacherSubjects] = useState('');
  const [teacherDays, setTeacherDays] = useState([]);

  // Room form
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState(30);
  const [roomType, setRoomType] = useState('Classroom');
  const [roomFacilities, setRoomFacilities] = useState('');

  // Subject form
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectCredits, setSubjectCredits] = useState(3);
  const [subjectType, setSubjectType] = useState('Theory');
  const [subjectSessions, setSubjectSessions] = useState(3);

  const [submitting, setSubmitting] = useState(false);

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
      await axios.post(`${apiUrl}/teachers`, {
        name: teacherName.trim(),
        subjects: teacherSubjects.split(',').map(s => s.trim()).filter(Boolean),
        availability
      });
      toast.success(`Teacher "${teacherName}" added`);
      setTeacherName(''); setTeacherSubjects(''); setTeacherDays([]);
      onRefresh();
    } catch (err) {
      toast.error('Failed to add teacher');
    }
    setSubmitting(false);
  };

  const addRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) { toast.error('Room name is required'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${apiUrl}/rooms`, {
        name: roomName.trim(),
        capacity: parseInt(roomCapacity),
        type: roomType,
        facilities: roomFacilities.split(',').map(f => f.trim()).filter(Boolean)
      });
      toast.success(`Room "${roomName}" added`);
      setRoomName(''); setRoomCapacity(30); setRoomType('Classroom'); setRoomFacilities('');
      onRefresh();
    } catch (err) {
      toast.error('Failed to add room');
    }
    setSubmitting(false);
  };

  const addSubject = async (e) => {
    e.preventDefault();
    if (!subjectName.trim() || !subjectCode.trim()) { toast.error('Name and code are required'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${apiUrl}/subjects`, {
        name: subjectName.trim(),
        code: subjectCode.trim().toUpperCase(),
        credits: parseInt(subjectCredits),
        type: subjectType,
        requiredSessions: parseInt(subjectSessions)
      });
      toast.success(`Subject "${subjectName}" added`);
      setSubjectName(''); setSubjectCode(''); setSubjectCredits(3); setSubjectType('Theory'); setSubjectSessions(3);
      onRefresh();
    } catch (err) {
      toast.error('Failed to add subject');
    }
    setSubmitting(false);
  };

  return (
    <div className="add-forms-page">
      {/* Form Selector */}
      <div className="form-tabs">
        {[
          { key: 'teacher', label: 'Add Teacher', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { key: 'room', label: 'Add Room', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { key: 'subject', label: 'Add Subject', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> }
        ].map(tab => (
          <button
            key={tab.key}
            data-testid={`form-tab-${tab.key}`}
            className={`form-tab ${activeForm === tab.key ? 'active' : ''}`}
            onClick={() => setActiveForm(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Teacher Form */}
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

      {/* Room Form */}
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

      {/* Subject Form */}
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

      {/* Current Data Summary */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="form-title" style={{ marginBottom: '1rem' }}>Current Data Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-num">{data.teachers.length}</span>
            <span className="summary-label">Teachers</span>
          </div>
          <div className="summary-item">
            <span className="summary-num">{data.rooms.length}</span>
            <span className="summary-label">Rooms</span>
          </div>
          <div className="summary-item">
            <span className="summary-num">{data.subjects.length}</span>
            <span className="summary-label">Subjects</span>
          </div>
          <div className="summary-item">
            <span className="summary-num">{data.timetable.length}</span>
            <span className="summary-label">Sessions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddForms;
