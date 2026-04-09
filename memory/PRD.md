# Timetable Generator - PRD

## Original Problem Statement
AI-Based Dynamic Timetable Generation System with Real-Time Constraint Optimization

## Architecture
- **Backend**: Node.js + Express (port 3001)
- **Frontend**: React (built, served statically via Express)
- **Data Storage**: Local JSON files (no database)
- **Algorithm**: Greedy + constraint-based (rule-based, no AI/LLM)

## User Choices
- Backend: Node.js + Express (for easy Linux hosting)
- Algorithm: Rule-based only (no API cost)
- Design: Professional dashboard (data-focused)
- Data: Local JSON files only
- Forms: Add only (no edit/delete)

## Core Requirements
1. Timetable generation with constraint-based scheduling
2. Conflict detection (teacher + room double-booking)
3. Partial re-optimization (reschedule only affected slots)
4. Impact minimization (min affected teachers/classes)
5. Professional dashboard UI with grid view
6. Input forms for teachers, rooms, subjects
7. Export timetable as JSON

## What's Been Implemented (Feb 2026)

### Phase 1 - Core Features (COMPLETE)
- Timetable generation (greedy algorithm with constraint checking)
- Conflict detection (teacher + room conflicts, severity levels)
- Partial re-optimization with impact minimization scoring
- Professional dashboard with data tables
- Interactive weekly timetable grid
- Add forms for teachers, rooms, subjects
- Export timetable as JSON download
- Real-time statistics display

### API Endpoints
- GET /api/health - Health check
- GET /api/data - All data
- GET /api/timetable - Current timetable
- POST /api/teachers - Add teacher
- POST /api/rooms - Add room
- POST /api/subjects - Add subject
- POST /api/generate - Generate timetable
- POST /api/conflict - Detect conflicts
- POST /api/optimize - Partial re-optimization
- GET /api/export - Export timetable

## Testing Results
- Backend: 100% (11/11 API endpoints working)
- Frontend: 100% (All UI components working)
- Overall: 100%

## Prioritized Backlog

### P0 (Done)
- [x] Timetable generation
- [x] Conflict detection
- [x] Dashboard UI
- [x] Grid view
- [x] Add forms
- [x] Export JSON
- [x] Partial re-optimization
- [x] Impact minimization

### P1 (Next)
- [ ] Edit/Delete teachers, rooms, subjects
- [ ] Adaptive learning from conflict history
- [ ] Flowchart UI for scheduling visualization

### P2 (Future)
- [ ] Multiple timetable comparison
- [ ] Print/PDF export
- [ ] Multi-class/section support
- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] User authentication for admin
- [ ] Real-time collaboration

## Next Tasks
1. Add edit/delete CRUD operations
2. Implement adaptive learning (store conflict patterns, use in next generation)
3. Add flowchart visualization
4. Multi-class scheduling support
