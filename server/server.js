const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Data file paths
const dataDir = path.join(__dirname, '../data');
const teachersFile = path.join(dataDir, 'teachers.json');
const roomsFile = path.join(dataDir, 'rooms.json');
const subjectsFile = path.join(dataDir, 'subjects.json');
const timetableFile = path.join(dataDir, 'timetable.json');
const conflictsFile = path.join(dataDir, 'conflicts.json');

// Helper functions to read/write JSON files
const readJSON = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

const writeJSON = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
};

// API Routes

// GET all data
app.get('/api/data', async (req, res) => {
  try {
    const teachers = await readJSON(teachersFile);
    const rooms = await readJSON(roomsFile);
    const subjects = await readJSON(subjectsFile);
    const timetable = await readJSON(timetableFile);

    res.json({
      success: true,
      data: {
        teachers,
        rooms,
        subjects,
        timetable
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Add new teacher
app.post('/api/teachers', async (req, res) => {
  try {
    const teachers = await readJSON(teachersFile);
    const newTeacher = {
      id: `T${String(teachers.length + 1).padStart(3, '0')}`,
      ...req.body
    };
    teachers.push(newTeacher);
    await writeJSON(teachersFile, teachers);
    res.json({ success: true, data: newTeacher });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Add new room
app.post('/api/rooms', async (req, res) => {
  try {
    const rooms = await readJSON(roomsFile);
    const newRoom = {
      id: `R${String(rooms.length + 101)}`,
      ...req.body
    };
    rooms.push(newRoom);
    await writeJSON(roomsFile, rooms);
    res.json({ success: true, data: newRoom });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Add new subject
app.post('/api/subjects', async (req, res) => {
  try {
    const subjects = await readJSON(subjectsFile);
    const newSubject = {
      id: `SUB${String(subjects.length + 1).padStart(3, '0')}`,
      ...req.body
    };
    subjects.push(newSubject);
    await writeJSON(subjectsFile, subjects);
    res.json({ success: true, data: newSubject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Timetable Generation Algorithm (Greedy + Constraint-based)
const generateTimetable = (teachers, rooms, subjects) => {
  const timetable = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00'];
  
  // Track allocated slots
  const teacherAllocations = {};
  const roomAllocations = {};
  
  // Initialize tracking
  teachers.forEach(t => teacherAllocations[t.id] = {});
  rooms.forEach(r => roomAllocations[r.id] = {});
  
  // For each subject, allocate required sessions
  subjects.forEach(subject => {
    const requiredSessions = subject.requiredSessions || 3;
    let sessionsAllocated = 0;
    
    // Find teachers who can teach this subject
    const eligibleTeachers = teachers.filter(t => 
      t.subjects && t.subjects.includes(subject.name)
    );
    
    if (eligibleTeachers.length === 0) return;
    
    // Try to allocate sessions
    for (let day of days) {
      if (sessionsAllocated >= requiredSessions) break;
      
      for (let slot of timeSlots) {
        if (sessionsAllocated >= requiredSessions) break;
        
        // Find available teacher
        const availableTeacher = eligibleTeachers.find(teacher => {
          const teacherKey = `${day}-${slot}`;
          const isTeacherAvailable = teacher.availability[day]?.includes(slot);
          const isTeacherFree = !teacherAllocations[teacher.id][teacherKey];
          return isTeacherAvailable && isTeacherFree;
        });
        
        if (!availableTeacher) continue;
        
        // Find available room (prefer labs for practical subjects)
        const preferLab = subject.type === 'Practical';
        let availableRoom = rooms.find(room => {
          const roomKey = `${day}-${slot}`;
          const isRoomFree = !roomAllocations[room.id][roomKey];
          if (preferLab) {
            return room.type === 'Lab' && isRoomFree;
          }
          return isRoomFree;
        });
        
        // If no preferred room, try any room
        if (!availableRoom) {
          availableRoom = rooms.find(room => {
            const roomKey = `${day}-${slot}`;
            return !roomAllocations[room.id][roomKey];
          });
        }
        
        if (!availableRoom) continue;
        
        // Allocate the session
        const allocationKey = `${day}-${slot}`;
        teacherAllocations[availableTeacher.id][allocationKey] = true;
        roomAllocations[availableRoom.id][allocationKey] = true;
        
        timetable.push({
          id: `TT${String(timetable.length + 1).padStart(4, '0')}`,
          day,
          timeSlot: slot,
          subject: subject.name,
          subjectCode: subject.code,
          teacher: availableTeacher.name,
          teacherId: availableTeacher.id,
          room: availableRoom.name,
          roomId: availableRoom.id,
          type: subject.type
        });
        
        sessionsAllocated++;
      }
    }
  });
  
  return timetable;
};

// POST - Generate timetable
app.post('/api/generate', async (req, res) => {
  try {
    const teachers = await readJSON(teachersFile);
    const rooms = await readJSON(roomsFile);
    const subjects = await readJSON(subjectsFile);
    
    const timetable = generateTimetable(teachers, rooms, subjects);
    await writeJSON(timetableFile, timetable);
    
    res.json({
      success: true,
      data: timetable,
      stats: {
        totalSessions: timetable.length,
        teachers: teachers.length,
        rooms: rooms.length,
        subjects: subjects.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Conflict Detection
const detectConflicts = (timetable) => {
  const conflicts = [];
  const teacherSlots = {};
  const roomSlots = {};
  
  timetable.forEach((entry, index) => {
    const key = `${entry.day}-${entry.timeSlot}`;
    
    // Check teacher conflicts
    if (!teacherSlots[entry.teacherId]) {
      teacherSlots[entry.teacherId] = {};
    }
    
    if (teacherSlots[entry.teacherId][key]) {
      conflicts.push({
        type: 'Teacher Conflict',
        severity: 'High',
        teacher: entry.teacher,
        day: entry.day,
        timeSlot: entry.timeSlot,
        subjects: [teacherSlots[entry.teacherId][key].subject, entry.subject]
      });
    } else {
      teacherSlots[entry.teacherId][key] = entry;
    }
    
    // Check room conflicts
    if (!roomSlots[entry.roomId]) {
      roomSlots[entry.roomId] = {};
    }
    
    if (roomSlots[entry.roomId][key]) {
      conflicts.push({
        type: 'Room Conflict',
        severity: 'Medium',
        room: entry.room,
        day: entry.day,
        timeSlot: entry.timeSlot,
        subjects: [roomSlots[entry.roomId][key].subject, entry.subject]
      });
    } else {
      roomSlots[entry.roomId][key] = entry;
    }
  });
  
  return conflicts;
};

// POST - Detect conflicts
app.post('/api/conflict', async (req, res) => {
  try {
    let timetable = req.body.timetable;
    
    if (!timetable) {
      timetable = await readJSON(timetableFile);
    }
    
    const conflicts = detectConflicts(timetable);
    await writeJSON(conflictsFile, conflicts);
    
    res.json({
      success: true,
      conflicts,
      count: conflicts.length,
      hasConflicts: conflicts.length > 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Partial Re-optimization
app.post('/api/optimize', async (req, res) => {
  try {
    const { conflictingSlots } = req.body;
    const timetable = await readJSON(timetableFile);
    const teachers = await readJSON(teachersFile);
    const rooms = await readJSON(roomsFile);
    
    if (!conflictingSlots || conflictingSlots.length === 0) {
      return res.json({
        success: false,
        message: 'No conflicting slots provided'
      });
    }
    
    // Track changes
    const affectedSessions = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00'];
    
    // Try to resolve each conflict
    conflictingSlots.forEach(conflict => {
      const { day, timeSlot, teacherId } = conflict;
      
      // Find conflicting entries
      const conflictingEntries = timetable.filter(entry => 
        entry.day === day && entry.timeSlot === timeSlot && entry.teacherId === teacherId
      );
      
      if (conflictingEntries.length > 1) {
        // Keep first, reschedule others
        for (let i = 1; i < conflictingEntries.length; i++) {
          const entryToReschedule = conflictingEntries[i];
          
          // Find alternative slot
          let rescheduled = false;
          for (let altDay of days) {
            if (rescheduled) break;
            for (let altSlot of timeSlots) {
              const teacher = teachers.find(t => t.id === entryToReschedule.teacherId);
              const isTeacherAvailable = teacher?.availability[altDay]?.includes(altSlot);
              
              // Check if slot is free
              const slotFree = !timetable.some(e => 
                e.day === altDay && e.timeSlot === altSlot && 
                (e.teacherId === entryToReschedule.teacherId || e.roomId === entryToReschedule.roomId)
              );
              
              if (isTeacherAvailable && slotFree) {
                // Reschedule
                const index = timetable.indexOf(entryToReschedule);
                timetable[index].day = altDay;
                timetable[index].timeSlot = altSlot;
                affectedSessions.push(timetable[index]);
                rescheduled = true;
                break;
              }
            }
          }
        }
      }
    });
    
    await writeJSON(timetableFile, timetable);
    
    res.json({
      success: true,
      message: 'Optimization completed',
      affectedSessions: affectedSessions.length,
      details: affectedSessions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Get timetable
app.get('/api/timetable', async (req, res) => {
  try {
    const timetable = await readJSON(timetableFile);
    res.json({ success: true, data: timetable });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Export timetable as JSON
app.get('/api/export', async (req, res) => {
  try {
    const timetable = await readJSON(timetableFile);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=timetable.json');
    res.send(JSON.stringify(timetable, null, 2));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});

module.exports = app;