import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './components/Dashboard';
import TimetableGrid from './components/TimetableGrid';
import AddForms from './components/AddForms';
import ConfigForm from './components/ConfigForm';
import Flowchart from './components/Flowchart';
import { Toaster, toast } from './components/Toast';

const API_URL = (process.env.REACT_APP_BACKEND_URL || '') + '/api';

function App() {
  const [activeTab, setActiveTab] = useState('generate');
  const [data, setData] = useState({
    teachers: [],
    rooms: [],
    subjects: [],
    timetable: {},
    config: {},
  });
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [generatedResult, setGeneratedResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/data`);
      if (response.data.success) {
        const d = response.data.data;
        setData(d);
        // Restore generated result from saved timetable
        if (d.timetable && d.timetable.timetable && d.timetable.days) {
          setGeneratedResult(d.timetable);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    }
  };

  const generateTimetable = async (config) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/generate`, config);
      if (response.data.success) {
        const result = response.data.data;
        setGeneratedResult(result);
        setData(prev => ({ ...prev, timetable: result, config: config }));
        setConflicts([]);

        const stats = response.data.stats;
        toast.success(`Timetable generated! ${stats.totalSessions} sessions, ${stats.totalFree} free periods`);

        if (response.data.unmetCredits && Object.keys(response.data.unmetCredits).length > 0) {
          const unmet = response.data.unmetCredits;
          const names = Object.entries(unmet).map(([k, v]) => `${k} (${v} short)`).join(', ');
          toast.warning(`Unmet credits: ${names}`);
        }

        setActiveTab('timetable');
      }
    } catch (error) {
      console.error('Error generating timetable:', error);
      toast.error('Failed to generate timetable');
    }
    setLoading(false);
  };

  const detectConflicts = async () => {
    try {
      const response = await axios.post(`${API_URL}/conflict`);
      if (response.data.success) {
        setConflicts(response.data.conflicts);
        if (response.data.count > 0) {
          toast.warning(`${response.data.count} conflict(s) detected`);
        } else {
          toast.success('No conflicts found');
        }
      }
    } catch (error) {
      toast.error('Failed to detect conflicts');
    }
  };

  const exportTimetable = () => {
    const exportData = generatedResult || data.timetable;
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timetable_${(generatedResult?.className || 'export').replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Timetable exported');
  };

  const sessionCount = generatedResult?.timetable?.filter(t => t.subject !== 'Free Period').length || 0;

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
              <span className="stat-num" data-testid="subjects-count">{data.subjects.length}</span>
              <span className="stat-lbl">Subjects</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num" data-testid="sessions-count">{sessionCount}</span>
              <span className="stat-lbl">Sessions</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="app-nav">
        <div className="nav-inner">
          {[
            { key: 'generate', label: 'Generate' },
            { key: 'timetable', label: 'Timetable View' },
            { key: 'dashboard', label: 'Data Manager' },
            { key: 'add-data', label: 'Add Data' },
            { key: 'flowchart', label: 'Algorithm Flow' },
          ].map(tab => (
            <button
              key={tab.key}
              data-testid={`${tab.key}-tab`}
              className={`nav-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {activeTab === 'generate' && (
          <ConfigForm
            onGenerate={generateTimetable}
            loading={loading}
            data={data}
            savedConfig={data.config}
          />
        )}
        {activeTab === 'timetable' && (
          <TimetableGrid
            result={generatedResult}
            conflicts={conflicts}
            onExport={exportTimetable}
            onDetectConflicts={detectConflicts}
          />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard
            data={data}
            onGenerate={() => setActiveTab('generate')}
            onRefresh={fetchData}
            loading={loading}
            conflicts={conflicts}
            onDetectConflicts={detectConflicts}
            apiUrl={API_URL}
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
