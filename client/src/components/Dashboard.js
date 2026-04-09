import React from 'react';

const Dashboard = ({ data, onGenerate, onRefresh, loading, conflicts, onDetectConflicts }) => {
  return (
    <div className="dashboard">
      {/* Action Bar */}
      <div className="action-bar">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
            Timetable Management
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            Generate and manage your academic schedule
          </p>
        </div>
        <div className="action-buttons">
          <button
            data-testid="refresh-data-btn"
            className="btn-outline"
            onClick={onRefresh}
          >
            🔄 Refresh Data
          </button>
          <button
            data-testid="detect-conflicts-btn"
            className="btn-secondary"
            onClick={() => onDetectConflicts()}
            disabled={data.timetable.length === 0}
          >
            🔍 Detect Conflicts
          </button>
          <button
            data-testid="generate-timetable-btn"
            className="btn-primary"
            onClick={onGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Generating...
              </>
            ) : (
              <>
                ⚡ Generate Timetable
              </>
            )}
          </button>
        </div>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="conflicts-section" data-testid="conflicts-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#dc2626' }}>
              {conflicts.length} Conflict{conflicts.length !== 1 ? 's' : ''} Detected
            </h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '1rem' }}>
            The following conflicts need to be resolved for optimal scheduling
          </p>
          <div className="conflict-list">
            {conflicts.slice(0, 5).map((conflict, index) => (
              <div key={index} className="conflict-item" data-testid={`conflict-item-${index}`}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
                    {conflict.type}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    {conflict.teacher || conflict.room} - {conflict.day} {conflict.timeSlot}
                  </div>
                  {conflict.subjects && (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      Subjects: {conflict.subjects.join(', ')}
                    </div>
                  )}
                </div>
                <span className={`conflict-badge ${conflict.severity.toLowerCase()}`}>
                  {conflict.severity}
                </span>
              </div>
            ))}
            {conflicts.length > 5 && (
              <div style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center', marginTop: '0.5rem' }}>
                +{conflicts.length - 5} more conflicts
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teachers Section */}
      <div className="data-section">
        <div className="section-header">
          <h3 className="section-title">👨‍🏫 Teachers</h3>
          <span className="section-badge" data-testid="teachers-badge">{data.teachers.length} Total</span>
        </div>
        {data.teachers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Subjects</th>
                  <th>Available Days</th>
                </tr>
              </thead>
              <tbody>
                {data.teachers.map((teacher) => (
                  <tr key={teacher.id} data-testid={`teacher-row-${teacher.id}`}>
                    <td><strong>{teacher.id}</strong></td>
                    <td>{teacher.name}</td>
                    <td>{teacher.subjects?.join(', ') || 'N/A'}</td>
                    <td>{Object.keys(teacher.availability || {}).length} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">👨‍🏫</div>
            <div className="empty-message">No Teachers Available</div>
            <div className="empty-description">Add teachers to start generating timetables</div>
          </div>
        )}
      </div>

      {/* Rooms Section */}
      <div className="data-section">
        <div className="section-header">
          <h3 className="section-title">🏫 Rooms</h3>
          <span className="section-badge" data-testid="rooms-badge">{data.rooms.length} Total</span>
        </div>
        {data.rooms.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Facilities</th>
                </tr>
              </thead>
              <tbody>
                {data.rooms.map((room) => (
                  <tr key={room.id} data-testid={`room-row-${room.id}`}>
                    <td><strong>{room.id}</strong></td>
                    <td>{room.name}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: room.type === 'Lab' ? '#dbeafe' : '#f0fdf4',
                        color: room.type === 'Lab' ? '#1e40af' : '#15803d'
                      }}>
                        {room.type}
                      </span>
                    </td>
                    <td>{room.capacity}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{room.facilities?.join(', ') || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🏫</div>
            <div className="empty-message">No Rooms Available</div>
            <div className="empty-description">Add rooms to start generating timetables</div>
          </div>
        )}
      </div>

      {/* Subjects Section */}
      <div className="data-section">
        <div className="section-header">
          <h3 className="section-title">📚 Subjects</h3>
          <span className="section-badge" data-testid="subjects-badge">{data.subjects.length} Total</span>
        </div>
        {data.subjects.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Credits</th>
                  <th>Required Sessions</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((subject) => (
                  <tr key={subject.id} data-testid={`subject-row-${subject.id}`}>
                    <td><strong>{subject.code}</strong></td>
                    <td>{subject.name}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: subject.type === 'Practical' ? '#fef3c7' : '#e0e7ff',
                        color: subject.type === 'Practical' ? '#92400e' : '#3730a3'
                      }}>
                        {subject.type}
                      </span>
                    </td>
                    <td>{subject.credits}</td>
                    <td>{subject.requiredSessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <div className="empty-message">No Subjects Available</div>
            <div className="empty-description">Add subjects to start generating timetables</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;