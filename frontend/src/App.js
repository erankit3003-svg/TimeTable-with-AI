import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './components/Dashboard';
import TimetableGrid from './components/TimetableGrid';
import AddForms from './components/AddForms';
import Flowchart from './components/Flowchart';
import { Toaster, toast } from './components/Toast';

const API_URL = (process.env.REACT_APP_BACKEND_URL || '') + '/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({
    teachers: [],
    rooms: [],
    subjects: [],
    timetable: []
  });
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [optimizeResult, setOptimizeResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/data`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    }
  };

  const generateTimetable = async () => {
    setLoading(true);
    setOptimizeResult(null);
    try {
      const response = await axios.post(`${API_URL}/generate`);
      if (response.data.success) {
        setData(prev => ({ ...prev, timetable: response.data.data }));
        setConflicts(response.data.conflicts || []);
        toast.success(`Timetable generated! ${response.data.stats.totalSessions} sessions created`);
        if (response.data.conflicts?.length > 0) {
          toast.warning(`${response.data.conflicts.length} conflict(s) detected`);
        }
        setActiveTab('timetable');
      }
    } catch (error) {
      console.error('Error generating timetable:', error);
      toast.error('Failed to generate timetable');
    }
    setLoading(false);
  };

  const detectConflicts = async (timetable = null) => {
    try {
      const response = await axios.post(`${API_URL}/conflict`, {
        timetable: timetable || data.timetable
      });
      if (response.data.success) {
        setConflicts(response.data.conflicts);
        if (response.data.count > 0) {
          toast.warning(`${response.data.count} conflict(s) detected`);
        } else {
          toast.success('No conflicts found');
        }
      }
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      toast.error('Failed to detect conflicts');
    }
  };

  const optimizeTimetable = async () => {
    setOptimizing(true);
    setOptimizeResult(null);
    try {
      const response = await axios.post(`${API_URL}/optimize`);
      if (response.data.success) {
        setOptimizeResult(response.data);
        if (response.data.timetable) {
          setData(prev => ({ ...prev, timetable: response.data.timetable }));
        }
        // Re-detect conflicts after optimization
        const conflictRes = await axios.post(`${API_URL}/conflict`);
        if (conflictRes.data.success) {
          setConflicts(conflictRes.data.conflicts);
        }
        if (response.data.changes?.length > 0) {
          toast.success(`${response.data.changes.length} session(s) rescheduled`);
        } else {
          toast.info(response.data.message);
        }
      }
    } catch (error) {
      console.error('Error optimizing:', error);
      toast.error('Optimization failed');
    }
    setOptimizing(false);
  };

  const exportTimetable = () => {
    const dataStr = JSON.stringify(data.timetable, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'timetable.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Timetable exported');
  };

  return (
    <div className="app-root">
      <Toaster />

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <rect x="6" y="13" width="4" height="3" rx="0.5"/>
                <rect x="14" y="13" width="4" height="3" rx="0.5"/>
              </svg>
            </div>
            <div>
              <h1 className="app-title" data-testid="app-title">Timetable Generator</h1>
              <p className="app-subtitle">Dynamic Scheduling with Constraint Optimization</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-pill">
              <span className="stat-num" data-testid="teachers-count">{data.teachers.length}</span>
              <span className="stat-lbl">Teachers</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num" data-testid="rooms-count">{data.rooms.length}</span>
              <span className="stat-lbl">Rooms</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num" data-testid="subjects-count">{data.subjects.length}</span>
              <span className="stat-lbl">Subjects</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num" data-testid="sessions-count">{data.timetable.length}</span>
              <span className="stat-lbl">Sessions</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="app-nav">
        <div className="nav-inner">
          {['dashboard', 'timetable', 'add-data', 'flowchart'].map(tab => (
            <button
              key={tab}
              data-testid={`${tab}-tab`}
              className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'dashboard' && 'Dashboard'}
              {tab === 'timetable' && 'Timetable View'}
              {tab === 'add-data' && 'Add Data'}
              {tab === 'flowchart' && 'Algorithm Flow'}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {activeTab === 'dashboard' && (
          <Dashboard
            data={data}
            onGenerate={generateTimetable}
            onRefresh={fetchData}
            loading={loading}
            conflicts={conflicts}
            onDetectConflicts={detectConflicts}
            apiUrl={API_URL}
          />
        )}
        {activeTab === 'timetable' && (
          <TimetableGrid
            timetable={data.timetable}
            conflicts={conflicts}
            onExport={exportTimetable}
            onDetectConflicts={() => detectConflicts()}
            onOptimize={optimizeTimetable}
            optimizing={optimizing}
            optimizeResult={optimizeResult}
          />
        )}
        {activeTab === 'add-data' && (
          <AddForms
            onRefresh={fetchData}
            apiUrl={API_URL}
            data={data}
          />
        )}
        {activeTab === 'flowchart' && (
          <Flowchart />
        )}
      </main>
    </div>
  );
}

export default App;
