import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './components/Dashboard';
import TimetableGrid from './components/TimetableGrid';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({
    teachers: [],
    rooms: [],
    subjects: [],
    timetable: []
  });
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);

  // Fetch initial data
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
    try {
      const response = await axios.post(`${API_URL}/generate`);
      if (response.data.success) {
        setData(prev => ({ ...prev, timetable: response.data.data }));
        toast.success(`Timetable generated! ${response.data.stats.totalSessions} sessions created`);
        
        // Auto-detect conflicts
        detectConflicts(response.data.data);
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

  const exportTimetable = () => {
    const dataStr = JSON.stringify(data.timetable, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'timetable.json';
    link.click();
    toast.success('Timetable exported successfully');
  };

  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-section">
              <div className="logo-icon">📅</div>
              <div>
                <h1 className="app-title" data-testid="app-title">Timetable Generator</h1>
                <p className="app-subtitle">AI-Based Dynamic Scheduling System</p>
              </div>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-label">Teachers</span>
              <span className="stat-value" data-testid="teachers-count">{data.teachers.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Rooms</span>
              <span className="stat-value" data-testid="rooms-count">{data.rooms.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Subjects</span>
              <span className="stat-value" data-testid="subjects-count">{data.subjects.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Sessions</span>
              <span className="stat-value" data-testid="sessions-count">{data.timetable.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="app-nav">
        <button
          data-testid="dashboard-tab"
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          data-testid="timetable-tab"
          className={`nav-btn ${activeTab === 'timetable' ? 'active' : ''}`}
          onClick={() => setActiveTab('timetable')}
        >
          Timetable View
        </button>
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
          />
        )}
        {activeTab === 'timetable' && (
          <TimetableGrid
            timetable={data.timetable}
            conflicts={conflicts}
            onExport={exportTimetable}
            onDetectConflicts={() => detectConflicts()}
          />
        )}
      </main>
    </div>
  );
}

export default App;