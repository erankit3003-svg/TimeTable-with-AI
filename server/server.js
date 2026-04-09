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

// Constants
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00'];

// ========== API Routes ==========

// GET all data
app.get('/api/data', async (req, res) => {
  try {
    const [teachers, rooms, subjects, timetable] = await Promise.all([
      readJSON(teachersFile),
      readJSON(roomsFile),
      readJSON(subjectsFile),
      readJSON(timetableFile)
    ]);
    res.json({ success: true, data: { teachers, rooms, subjects, timetable } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Add new teacher
app.post('/api/teachers', async (req, res) => {
  try {
    const teachers = await readJSON(teachersFile);
    const { name, subjects, availability } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

    const newTeacher = {
      id: `T${String(teachers.length + 1).padStart(3, '0')}`,
      name,
      subjects: subjects || [],
      availability: availability || {}
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
    const { name, capacity, type, facilities } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

    const newRoom = {
      id: `R${String(rooms.length + 200)}`,
      name,
      capacity: capacity || 30,
      type: type || 'Classroom',
      facilities: facilities || []
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
    const { name, code, credits, type, requiredSessions } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, error: 'Name and code are required' });

    const newSubject = {
      id: `SUB${String(subjects.length + 1).padStart(3, '0')}`,
      name,
      code,
      credits: credits || 3,
      type: type || 'Theory',
      requiredSessions: requiredSessions || 3
    };
    subjects.push(newSubject);
    await writeJSON(subjectsFile, subjects);
    res.json({ success: true, data: newSubject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Timetable Generation (Greedy + Constraint) ==========
const generateTimetable = (teachers, rooms, subjects) => {
  const timetable = [];
  const teacherAllocations = {};
  const roomAllocations = {};

  teachers.forEach(t => teacherAllocations[t.id] = {});
  rooms.forEach(r => roomAllocations[r.id] = {});

  // Sort subjects by required sessions (descending) - harder to schedule first
  const sortedSubjects = [...subjects].sort((a, b) => (b.requiredSessions || 3) - (a.requiredSessions || 3));

  sortedSubjects.forEach(subject => {
    const requiredSessions = subject.requiredSessions || 3;
    let sessionsAllocated = 0;

    const eligibleTeachers = teachers.filter(t =>
      t.subjects && t.subjects.includes(subject.name)
    );
    if (eligibleTeachers.length === 0) return;

    // Spread sessions across different days
    for (let dayIdx = 0; dayIdx < DAYS.length && sessionsAllocated < requiredSessions; dayIdx++) {
      const day = DAYS[dayIdx];
      for (let slotIdx = 0; slotIdx < TIME_SLOTS.length && sessionsAllocated < requiredSessions; slotIdx++) {
        const slot = TIME_SLOTS[slotIdx];
        const key = `${day}-${slot}`;

        const availableTeacher = eligibleTeachers.find(teacher => {
          const isAvailable = teacher.availability[day]?.includes(slot);
          const isFree = !teacherAllocations[teacher.id][key];
          return isAvailable && isFree;
        });
        if (!availableTeacher) continue;

        // Prefer labs for practical, classrooms for theory
        const preferLab = subject.type === 'Practical';
        let availableRoom = rooms.find(room => {
          const isFree = !roomAllocations[room.id][key];
          return preferLab ? (room.type === 'Lab' && isFree) : (room.type !== 'Lab' && isFree);
        });
        // Fallback: any free room
        if (!availableRoom) {
          availableRoom = rooms.find(room => !roomAllocations[room.id][key]);
        }
        if (!availableRoom) continue;

        teacherAllocations[availableTeacher.id][key] = true;
        roomAllocations[availableRoom.id][key] = true;

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
    const [teachers, rooms, subjects] = await Promise.all([
      readJSON(teachersFile),
      readJSON(roomsFile),
      readJSON(subjectsFile)
    ]);

    const timetable = generateTimetable(teachers, rooms, subjects);
    await writeJSON(timetableFile, timetable);

    // Auto-detect conflicts
    const conflicts = detectConflicts(timetable);

    res.json({
      success: true,
      data: timetable,
      conflicts,
      stats: {
        totalSessions: timetable.length,
        teachers: teachers.length,
        rooms: rooms.length,
        subjects: subjects.length,
        conflictCount: conflicts.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Conflict Detection ==========
const detectConflicts = (timetable) => {
  const conflicts = [];
  const teacherSlots = {};
  const roomSlots = {};

  timetable.forEach((entry) => {
    const key = `${entry.day}-${entry.timeSlot}`;

    // Teacher conflict
    if (!teacherSlots[entry.teacherId]) teacherSlots[entry.teacherId] = {};
    if (teacherSlots[entry.teacherId][key]) {
      conflicts.push({
        type: 'Teacher Conflict',
        severity: 'High',
        teacher: entry.teacher,
        teacherId: entry.teacherId,
        day: entry.day,
        timeSlot: entry.timeSlot,
        subjects: [teacherSlots[entry.teacherId][key].subject, entry.subject],
        entryIds: [teacherSlots[entry.teacherId][key].id, entry.id]
      });
    } else {
      teacherSlots[entry.teacherId][key] = entry;
    }

    // Room conflict
    if (!roomSlots[entry.roomId]) roomSlots[entry.roomId] = {};
    if (roomSlots[entry.roomId][key]) {
      conflicts.push({
        type: 'Room Conflict',
        severity: 'Medium',
        room: entry.room,
        roomId: entry.roomId,
        day: entry.day,
        timeSlot: entry.timeSlot,
        subjects: [roomSlots[entry.roomId][key].subject, entry.subject],
        entryIds: [roomSlots[entry.roomId][key].id, entry.id]
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
    if (!timetable) timetable = await readJSON(timetableFile);

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

// ========== Partial Re-Optimization + Impact Minimization ==========
app.post('/api/optimize', async (req, res) => {
  try {
    const timetable = await readJSON(timetableFile);
    const teachers = await readJSON(teachersFile);
    const rooms = await readJSON(roomsFile);
    const prevConflicts = await readJSON(conflictsFile);

    // Detect current conflicts
    const currentConflicts = detectConflicts(timetable);
    if (currentConflicts.length === 0) {
      return res.json({
        success: true,
        message: 'No conflicts to optimize',
        conflicts: 0,
        affectedTeachers: 0,
        affectedClasses: 0,
        changes: []
      });
    }

    // Build occupancy map from current timetable
    const teacherOccupied = {};
    const roomOccupied = {};
    timetable.forEach(entry => {
      const key = `${entry.day}-${entry.timeSlot}`;
      if (!teacherOccupied[entry.teacherId]) teacherOccupied[entry.teacherId] = new Set();
      if (!roomOccupied[entry.roomId]) roomOccupied[entry.roomId] = new Set();
      teacherOccupied[entry.teacherId].add(key);
      roomOccupied[entry.roomId].add(key);
    });

    const changes = [];
    const affectedTeacherIds = new Set();
    const affectedSubjects = new Set();

    // Process each conflict - only reschedule the SECOND entry
    currentConflicts.forEach(conflict => {
      const entryId = conflict.entryIds[1]; // The second (conflicting) entry
      const entryIdx = timetable.findIndex(e => e.id === entryId);
      if (entryIdx === -1) return;

      const entry = timetable[entryIdx];
      const teacher = teachers.find(t => t.id === entry.teacherId);
      if (!teacher) return;

      // Remove from occupancy maps
      const oldKey = `${entry.day}-${entry.timeSlot}`;
      teacherOccupied[entry.teacherId]?.delete(oldKey);
      roomOccupied[entry.roomId]?.delete(oldKey);

      // Find best alternative slot with MINIMUM impact
      let bestSlot = null;
      let bestScore = Infinity;

      for (const day of DAYS) {
        for (const slot of TIME_SLOTS) {
          const key = `${day}-${slot}`;

          // Teacher must be available and free
          const isAvailable = teacher.availability[day]?.includes(slot);
          const isTeacherFree = !teacherOccupied[entry.teacherId]?.has(key);
          if (!isAvailable || !isTeacherFree) continue;

          // Find a free room
          const freeRoom = rooms.find(r => !roomOccupied[r.id]?.has(key));
          if (!freeRoom) continue;

          // Impact score: prefer same day (less disruption), prefer same room
          let score = 0;
          if (day !== entry.day) score += 2; // Day change = more impact
          if (freeRoom.id !== entry.roomId) score += 1; // Room change = some impact
          // Prefer earlier slots (less disruption)
          score += DAYS.indexOf(day) * 0.1 + TIME_SLOTS.indexOf(slot) * 0.01;

          if (score < bestScore) {
            bestScore = score;
            bestSlot = { day, timeSlot: slot, roomId: freeRoom.id, roomName: freeRoom.name };
          }
        }
      }

      if (bestSlot) {
        const oldDay = entry.day;
        const oldSlot = entry.timeSlot;
        const oldRoom = entry.room;

        // Apply change
        timetable[entryIdx].day = bestSlot.day;
        timetable[entryIdx].timeSlot = bestSlot.timeSlot;
        timetable[entryIdx].room = bestSlot.roomName;
        timetable[entryIdx].roomId = bestSlot.roomId;

        // Update occupancy
        const newKey = `${bestSlot.day}-${bestSlot.timeSlot}`;
        teacherOccupied[entry.teacherId].add(newKey);
        if (!roomOccupied[bestSlot.roomId]) roomOccupied[bestSlot.roomId] = new Set();
        roomOccupied[bestSlot.roomId].add(newKey);

        affectedTeacherIds.add(entry.teacherId);
        affectedSubjects.add(entry.subject);

        changes.push({
          sessionId: entry.id,
          subject: entry.subject,
          teacher: entry.teacher,
          from: { day: oldDay, timeSlot: oldSlot, room: oldRoom },
          to: { day: bestSlot.day, timeSlot: bestSlot.timeSlot, room: bestSlot.roomName }
        });
      }
    });

    // Save updated timetable
    await writeJSON(timetableFile, timetable);

    // Re-check conflicts after optimization
    const remainingConflicts = detectConflicts(timetable);
    await writeJSON(conflictsFile, remainingConflicts);

    // Store conflict history for adaptive learning
    const conflictHistory = await readJSON(conflictsFile);
    const historyEntry = {
      timestamp: new Date().toISOString(),
      conflictsResolved: currentConflicts.length - remainingConflicts.length,
      changesApplied: changes.length
    };

    res.json({
      success: true,
      message: `Optimization complete. ${changes.length} session(s) rescheduled.`,
      originalConflicts: currentConflicts.length,
      remainingConflicts: remainingConflicts.length,
      resolved: currentConflicts.length - remainingConflicts.length,
      affectedTeachers: affectedTeacherIds.size,
      affectedClasses: affectedSubjects.size,
      changes,
      timetable
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
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app;
