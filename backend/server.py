from fastapi import FastAPI, APIRouter, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import json
import csv
import io
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Data directory
DATA_DIR = ROOT_DIR.parent / 'data'
DATA_DIR.mkdir(exist_ok=True)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JSON file helpers
def read_json(filename):
    filepath = DATA_DIR / filename
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def write_json(filename, data):
    filepath = DATA_DIR / filename
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

# Initialize data files if they don't exist
for fname in ['teachers.json', 'rooms.json', 'subjects.json', 'timetable.json', 'conflicts.json']:
    if not (DATA_DIR / fname).exists():
        write_json(fname, [])

# Constants
DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
TIME_SLOTS = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00']

# Pydantic models
class TeacherInput(BaseModel):
    name: str
    subjects: List[str] = []
    availability: Dict[str, List[str]] = {}

class RoomInput(BaseModel):
    name: str
    capacity: int = 30
    type: str = "Classroom"
    facilities: List[str] = []

class SubjectInput(BaseModel):
    name: str
    code: str = ""
    credits: int = 3
    type: str = "Theory"
    requiredSessions: int = 3

# Create app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# ========== Health ==========
@api_router.get("/health")
async def health():
    return {"status": "OK", "message": "Server is running"}

# ========== GET all data ==========
@api_router.get("/data")
async def get_data():
    return {
        "success": True,
        "data": {
            "teachers": read_json('teachers.json'),
            "rooms": read_json('rooms.json'),
            "subjects": read_json('subjects.json'),
            "timetable": read_json('timetable.json'),
        }
    }

# ========== Teachers CRUD ==========
@api_router.post("/teachers")
async def add_teacher(body: TeacherInput):
    teachers = read_json('teachers.json')
    new_teacher = {
        "id": f"T{str(len(teachers) + 1).zfill(3)}",
        "name": body.name,
        "subjects": body.subjects,
        "availability": body.availability,
    }
    teachers.append(new_teacher)
    write_json('teachers.json', teachers)
    return {"success": True, "data": new_teacher}

@api_router.put("/teachers/{teacher_id}")
async def update_teacher(teacher_id: str, body: TeacherInput):
    teachers = read_json('teachers.json')
    idx = next((i for i, t in enumerate(teachers) if t['id'] == teacher_id), None)
    if idx is None:
        return {"success": False, "error": "Teacher not found"}
    if body.name:
        teachers[idx]['name'] = body.name
    if body.subjects:
        teachers[idx]['subjects'] = body.subjects
    if body.availability:
        teachers[idx]['availability'] = body.availability
    write_json('teachers.json', teachers)
    return {"success": True, "data": teachers[idx]}

@api_router.delete("/teachers/{teacher_id}")
async def delete_teacher(teacher_id: str):
    teachers = read_json('teachers.json')
    idx = next((i for i, t in enumerate(teachers) if t['id'] == teacher_id), None)
    if idx is None:
        return {"success": False, "error": "Teacher not found"}
    removed = teachers.pop(idx)
    write_json('teachers.json', teachers)
    return {"success": True, "data": removed}

# ========== Rooms CRUD ==========
@api_router.post("/rooms")
async def add_room(body: RoomInput):
    rooms = read_json('rooms.json')
    new_room = {
        "id": f"R{str(len(rooms) + 200)}",
        "name": body.name,
        "capacity": body.capacity,
        "type": body.type,
        "facilities": body.facilities,
    }
    rooms.append(new_room)
    write_json('rooms.json', rooms)
    return {"success": True, "data": new_room}

@api_router.put("/rooms/{room_id}")
async def update_room(room_id: str, body: RoomInput):
    rooms = read_json('rooms.json')
    idx = next((i for i, r in enumerate(rooms) if r['id'] == room_id), None)
    if idx is None:
        return {"success": False, "error": "Room not found"}
    if body.name:
        rooms[idx]['name'] = body.name
    rooms[idx]['capacity'] = body.capacity
    if body.type:
        rooms[idx]['type'] = body.type
    if body.facilities:
        rooms[idx]['facilities'] = body.facilities
    write_json('rooms.json', rooms)
    return {"success": True, "data": rooms[idx]}

@api_router.delete("/rooms/{room_id}")
async def delete_room(room_id: str):
    rooms = read_json('rooms.json')
    idx = next((i for i, r in enumerate(rooms) if r['id'] == room_id), None)
    if idx is None:
        return {"success": False, "error": "Room not found"}
    removed = rooms.pop(idx)
    write_json('rooms.json', rooms)
    return {"success": True, "data": removed}

# ========== Subjects CRUD ==========
@api_router.post("/subjects")
async def add_subject(body: SubjectInput):
    subjects = read_json('subjects.json')
    new_subject = {
        "id": f"SUB{str(len(subjects) + 1).zfill(3)}",
        "name": body.name,
        "code": body.code.upper() if body.code else "",
        "credits": body.credits,
        "type": body.type,
        "requiredSessions": body.requiredSessions,
    }
    subjects.append(new_subject)
    write_json('subjects.json', subjects)
    return {"success": True, "data": new_subject}

@api_router.put("/subjects/{subject_id}")
async def update_subject(subject_id: str, body: SubjectInput):
    subjects = read_json('subjects.json')
    idx = next((i for i, s in enumerate(subjects) if s['id'] == subject_id), None)
    if idx is None:
        return {"success": False, "error": "Subject not found"}
    if body.name:
        subjects[idx]['name'] = body.name
    if body.code:
        subjects[idx]['code'] = body.code.upper()
    subjects[idx]['credits'] = body.credits
    if body.type:
        subjects[idx]['type'] = body.type
    subjects[idx]['requiredSessions'] = body.requiredSessions
    write_json('subjects.json', subjects)
    return {"success": True, "data": subjects[idx]}

@api_router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str):
    subjects = read_json('subjects.json')
    idx = next((i for i, s in enumerate(subjects) if s['id'] == subject_id), None)
    if idx is None:
        return {"success": False, "error": "Subject not found"}
    removed = subjects.pop(idx)
    write_json('subjects.json', subjects)
    return {"success": True, "data": removed}

# ========== Timetable Generation ==========
def generate_timetable(teachers, rooms, subjects):
    timetable = []
    teacher_alloc = {t['id']: {} for t in teachers}
    room_alloc = {r['id']: {} for r in rooms}

    sorted_subjects = sorted(subjects, key=lambda s: s.get('requiredSessions', 3), reverse=True)

    for subject in sorted_subjects:
        required = subject.get('requiredSessions', 3)
        allocated = 0
        eligible = [t for t in teachers if subject['name'] in (t.get('subjects') or [])]
        if not eligible:
            continue

        for day in DAYS:
            if allocated >= required:
                break
            for slot in TIME_SLOTS:
                if allocated >= required:
                    break
                key = f"{day}-{slot}"

                teacher = next((t for t in eligible
                    if t.get('availability', {}).get(day) and slot in t['availability'][day]
                    and key not in teacher_alloc.get(t['id'], {})), None)
                if not teacher:
                    continue

                prefer_lab = subject.get('type') == 'Practical'
                room = next((r for r in rooms
                    if key not in room_alloc.get(r['id'], {})
                    and (r.get('type') == 'Lab' if prefer_lab else r.get('type') != 'Lab')), None)
                if not room:
                    room = next((r for r in rooms if key not in room_alloc.get(r['id'], {})), None)
                if not room:
                    continue

                teacher_alloc[teacher['id']][key] = True
                room_alloc[room['id']][key] = True

                timetable.append({
                    "id": f"TT{str(len(timetable) + 1).zfill(4)}",
                    "day": day,
                    "timeSlot": slot,
                    "subject": subject['name'],
                    "subjectCode": subject.get('code', ''),
                    "teacher": teacher['name'],
                    "teacherId": teacher['id'],
                    "room": room['name'],
                    "roomId": room['id'],
                    "type": subject.get('type', 'Theory'),
                })
                allocated += 1

    return timetable

@api_router.post("/generate")
async def generate():
    teachers = read_json('teachers.json')
    rooms = read_json('rooms.json')
    subjects = read_json('subjects.json')

    timetable = generate_timetable(teachers, rooms, subjects)
    write_json('timetable.json', timetable)

    conflicts = detect_conflicts(timetable)

    return {
        "success": True,
        "data": timetable,
        "conflicts": conflicts,
        "stats": {
            "totalSessions": len(timetable),
            "teachers": len(teachers),
            "rooms": len(rooms),
            "subjects": len(subjects),
            "conflictCount": len(conflicts),
        }
    }

# ========== Conflict Detection ==========
def detect_conflicts(timetable):
    conflicts = []
    teacher_slots = {}
    room_slots = {}

    for entry in timetable:
        key = f"{entry['day']}-{entry['timeSlot']}"

        tid = entry['teacherId']
        if tid not in teacher_slots:
            teacher_slots[tid] = {}
        if key in teacher_slots[tid]:
            conflicts.append({
                "type": "Teacher Conflict",
                "severity": "High",
                "teacher": entry['teacher'],
                "teacherId": tid,
                "day": entry['day'],
                "timeSlot": entry['timeSlot'],
                "subjects": [teacher_slots[tid][key]['subject'], entry['subject']],
                "entryIds": [teacher_slots[tid][key]['id'], entry['id']],
            })
        else:
            teacher_slots[tid][key] = entry

        rid = entry['roomId']
        if rid not in room_slots:
            room_slots[rid] = {}
        if key in room_slots[rid]:
            conflicts.append({
                "type": "Room Conflict",
                "severity": "Medium",
                "room": entry['room'],
                "roomId": rid,
                "day": entry['day'],
                "timeSlot": entry['timeSlot'],
                "subjects": [room_slots[rid][key]['subject'], entry['subject']],
                "entryIds": [room_slots[rid][key]['id'], entry['id']],
            })
        else:
            room_slots[rid][key] = entry

    return conflicts

class ConflictBody(BaseModel):
    timetable: Optional[List[Dict[str, Any]]] = None

@api_router.post("/conflict")
async def check_conflict(body: ConflictBody = ConflictBody()):
    timetable = body.timetable if body.timetable else read_json('timetable.json')
    conflicts = detect_conflicts(timetable)
    write_json('conflicts.json', conflicts)
    return {
        "success": True,
        "conflicts": conflicts,
        "count": len(conflicts),
        "hasConflicts": len(conflicts) > 0,
    }

# ========== Partial Re-Optimization + Impact Minimization ==========
@api_router.post("/optimize")
async def optimize():
    timetable = read_json('timetable.json')
    teachers = read_json('teachers.json')
    rooms = read_json('rooms.json')

    current_conflicts = detect_conflicts(timetable)
    if not current_conflicts:
        return {
            "success": True,
            "message": "No conflicts to optimize",
            "originalConflicts": 0,
            "remainingConflicts": 0,
            "resolved": 0,
            "affectedTeachers": 0,
            "affectedClasses": 0,
            "changes": [],
            "timetable": timetable,
        }

    # Build occupancy maps
    teacher_occ = {}
    room_occ = {}
    for entry in timetable:
        key = f"{entry['day']}-{entry['timeSlot']}"
        teacher_occ.setdefault(entry['teacherId'], set()).add(key)
        room_occ.setdefault(entry['roomId'], set()).add(key)

    changes = []
    affected_teachers = set()
    affected_subjects = set()

    for conflict in current_conflicts:
        entry_id = conflict['entryIds'][1]
        entry_idx = next((i for i, e in enumerate(timetable) if e['id'] == entry_id), None)
        if entry_idx is None:
            continue

        entry = timetable[entry_idx]
        teacher = next((t for t in teachers if t['id'] == entry['teacherId']), None)
        if not teacher:
            continue

        old_key = f"{entry['day']}-{entry['timeSlot']}"
        if entry['teacherId'] in teacher_occ:
            teacher_occ[entry['teacherId']].discard(old_key)
        if entry['roomId'] in room_occ:
            room_occ[entry['roomId']].discard(old_key)

        best_slot = None
        best_score = float('inf')

        for day in DAYS:
            for slot in TIME_SLOTS:
                key = f"{day}-{slot}"
                avail = teacher.get('availability', {}).get(day, [])
                if slot not in avail:
                    continue
                if key in teacher_occ.get(entry['teacherId'], set()):
                    continue

                free_room = next((r for r in rooms if key not in room_occ.get(r['id'], set())), None)
                if not free_room:
                    continue

                score = 0
                if day != entry['day']:
                    score += 2
                if free_room['id'] != entry['roomId']:
                    score += 1
                score += DAYS.index(day) * 0.1 + TIME_SLOTS.index(slot) * 0.01

                if score < best_score:
                    best_score = score
                    best_slot = {"day": day, "timeSlot": slot, "roomId": free_room['id'], "roomName": free_room['name']}

        if best_slot:
            old_day = entry['day']
            old_slot_val = entry['timeSlot']
            old_room = entry['room']

            timetable[entry_idx]['day'] = best_slot['day']
            timetable[entry_idx]['timeSlot'] = best_slot['timeSlot']
            timetable[entry_idx]['room'] = best_slot['roomName']
            timetable[entry_idx]['roomId'] = best_slot['roomId']

            new_key = f"{best_slot['day']}-{best_slot['timeSlot']}"
            teacher_occ.setdefault(entry['teacherId'], set()).add(new_key)
            room_occ.setdefault(best_slot['roomId'], set()).add(new_key)

            affected_teachers.add(entry['teacherId'])
            affected_subjects.add(entry['subject'])

            changes.append({
                "sessionId": entry['id'],
                "subject": entry['subject'],
                "teacher": entry['teacher'],
                "from": {"day": old_day, "timeSlot": old_slot_val, "room": old_room},
                "to": {"day": best_slot['day'], "timeSlot": best_slot['timeSlot'], "room": best_slot['roomName']},
            })

    write_json('timetable.json', timetable)
    remaining = detect_conflicts(timetable)
    write_json('conflicts.json', remaining)

    return {
        "success": True,
        "message": f"Optimization complete. {len(changes)} session(s) rescheduled.",
        "originalConflicts": len(current_conflicts),
        "remainingConflicts": len(remaining),
        "resolved": len(current_conflicts) - len(remaining),
        "affectedTeachers": len(affected_teachers),
        "affectedClasses": len(affected_subjects),
        "changes": changes,
        "timetable": timetable,
    }

# ========== Timetable & Export ==========
@api_router.get("/timetable")
async def get_timetable():
    return {"success": True, "data": read_json('timetable.json')}

@api_router.get("/export")
async def export_timetable():
    from starlette.responses import Response
    timetable = read_json('timetable.json')
    return Response(
        content=json.dumps(timetable, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=timetable.json"}
    )

# ========== CSV Upload ==========

@api_router.post("/upload/teachers")
async def upload_teachers_csv(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = content.decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(text))
        teachers = read_json('teachers.json')
        added = 0
        errors = []
        for i, row in enumerate(reader, 1):
            name = row.get('name', '').strip()
            if not name:
                errors.append(f"Row {i}: missing name")
                continue
            subjects = [s.strip() for s in row.get('subjects', '').split(';') if s.strip()]
            avail_days = [d.strip() for d in row.get('available_days', '').split(';') if d.strip()]
            availability = {}
            for d in avail_days:
                if d in DAYS:
                    availability[d] = list(TIME_SLOTS)
            new_id = f"T{str(len(teachers) + 1).zfill(3)}"
            teachers.append({"id": new_id, "name": name, "subjects": subjects, "availability": availability})
            added += 1
        write_json('teachers.json', teachers)
        return {"success": True, "added": added, "errors": errors, "total": len(teachers)}
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.post("/upload/rooms")
async def upload_rooms_csv(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = content.decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(text))
        rooms = read_json('rooms.json')
        added = 0
        errors = []
        for i, row in enumerate(reader, 1):
            name = row.get('name', '').strip()
            if not name:
                errors.append(f"Row {i}: missing name")
                continue
            capacity = int(row.get('capacity', '30').strip() or '30')
            rtype = row.get('type', 'Classroom').strip() or 'Classroom'
            facilities = [f.strip() for f in row.get('facilities', '').split(';') if f.strip()]
            new_id = f"R{str(len(rooms) + 200)}"
            rooms.append({"id": new_id, "name": name, "capacity": capacity, "type": rtype, "facilities": facilities})
            added += 1
        write_json('rooms.json', rooms)
        return {"success": True, "added": added, "errors": errors, "total": len(rooms)}
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.post("/upload/subjects")
async def upload_subjects_csv(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = content.decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(text))
        subjects = read_json('subjects.json')
        added = 0
        errors = []
        for i, row in enumerate(reader, 1):
            name = row.get('name', '').strip()
            code = row.get('code', '').strip()
            if not name or not code:
                errors.append(f"Row {i}: missing name or code")
                continue
            credits = int(row.get('credits', '3').strip() or '3')
            stype = row.get('type', 'Theory').strip() or 'Theory'
            sessions = int(row.get('required_sessions', '3').strip() or '3')
            new_id = f"SUB{str(len(subjects) + 1).zfill(3)}"
            subjects.append({"id": new_id, "name": name, "code": code.upper(), "credits": credits, "type": stype, "requiredSessions": sessions})
            added += 1
        write_json('subjects.json', subjects)
        return {"success": True, "added": added, "errors": errors, "total": len(subjects)}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ========== Sample CSV Downloads ==========

@api_router.get("/sample/teachers")
async def sample_teachers_csv():
    from starlette.responses import Response
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['name', 'subjects', 'available_days'])
    writer.writerow(['Dr. Sharma', 'Mathematics;Statistics', 'Monday;Tuesday;Wednesday;Thursday;Friday'])
    writer.writerow(['Prof. Kumar', 'Physics;Electronics', 'Monday;Tuesday;Wednesday;Thursday;Friday'])
    writer.writerow(['Ms. Patel', 'Chemistry;Biology', 'Monday;Tuesday;Wednesday;Thursday;Friday'])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sample_teachers.csv"}
    )

@api_router.get("/sample/rooms")
async def sample_rooms_csv():
    from starlette.responses import Response
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['name', 'capacity', 'type', 'facilities'])
    writer.writerow(['Room 101', '40', 'Classroom', 'Projector;Whiteboard'])
    writer.writerow(['Room 102', '35', 'Classroom', 'Whiteboard'])
    writer.writerow(['Computer Lab 1', '30', 'Lab', 'Computers;Projector'])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sample_rooms.csv"}
    )

@api_router.get("/sample/subjects")
async def sample_subjects_csv():
    from starlette.responses import Response
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['name', 'code', 'credits', 'type', 'required_sessions'])
    writer.writerow(['Mathematics', 'MATH101', '4', 'Theory', '4'])
    writer.writerow(['Physics', 'PHY101', '4', 'Theory', '3'])
    writer.writerow(['Programming', 'CS102', '4', 'Practical', '2'])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sample_subjects.csv"}
    )

app.include_router(api_router)
