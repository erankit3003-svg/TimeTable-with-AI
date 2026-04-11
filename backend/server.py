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

DATA_DIR = ROOT_DIR.parent / 'data'
DATA_DIR.mkdir(exist_ok=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def read_json(filename):
    filepath = DATA_DIR / filename
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        if filename == 'config.json':
            return {}
        return []

def write_json(filename, data):
    filepath = DATA_DIR / filename
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

for fname in ['teachers.json', 'rooms.json', 'subjects.json', 'timetable.json', 'conflicts.json']:
    if not (DATA_DIR / fname).exists():
        write_json(fname, [])
if not (DATA_DIR / 'config.json').exists():
    write_json('config.json', {})

# Default slots used by CSV import for teacher availability
DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
DEFAULT_SLOTS = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00']

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

class GenerateConfig(BaseModel):
    className: str = "Class A"
    workingDays: int = 5
    hoursPerDay: float = 6
    durationMinutes: int = 45
    startTime: str = "09:00"
    subjects: List[Dict[str, Any]] = []

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
            "config": read_json('config.json'),
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
def compute_time_slots(hours_per_day, duration_minutes, start_time="09:00"):
    total_minutes = int(hours_per_day * 60)
    num_slots = total_minutes // duration_minutes
    sh, sm = map(int, start_time.split(':'))
    current = sh * 60 + sm
    half = num_slots // 2
    slots = []
    for i in range(num_slots):
        if i == half and num_slots > 2:
            current += 30  # 30-min lunch break
        s_h, s_m = divmod(current, 60)
        end = current + duration_minutes
        e_h, e_m = divmod(end, 60)
        slots.append(f"{s_h:02d}:{s_m:02d}-{e_h:02d}:{e_m:02d}")
        current = end
    return slots

@api_router.post("/generate")
async def generate(config: GenerateConfig):
    ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    days = ALL_DAYS[:config.workingDays]
    slots = compute_time_slots(config.hoursPerDay, config.durationMinutes, config.startTime)

    subjects = config.subjects
    remaining = {s['name']: int(s.get('credits', 1)) for s in subjects}

    timetable = []
    teacher_schedule = {}

    for day in days:
        day_used = set()
        for slot in slots:
            # Sort by remaining credits desc, pick first that fits constraints
            candidates = sorted(
                [s for s in subjects
                 if remaining.get(s['name'], 0) > 0
                 and s['name'] not in day_used],
                key=lambda s: remaining[s['name']],
                reverse=True
            )
            # Also filter teacher conflicts (same teacher same slot)
            chosen = None
            for c in candidates:
                t_key = (c.get('teacher', 'TBA'), day, slot)
                if t_key not in teacher_schedule:
                    chosen = c
                    break

            if chosen:
                timetable.append({
                    'id': f"TT{len(timetable)+1:04d}",
                    'day': day,
                    'timeSlot': slot,
                    'subject': chosen['name'],
                    'teacher': chosen.get('teacher', 'TBA'),
                    'type': chosen.get('type', 'Theory'),
                })
                day_used.add(chosen['name'])
                remaining[chosen['name']] -= 1
                teacher_schedule[(chosen.get('teacher', 'TBA'), day, slot)] = True
            else:
                timetable.append({
                    'id': f"TT{len(timetable)+1:04d}",
                    'day': day,
                    'timeSlot': slot,
                    'subject': 'Free Period',
                    'teacher': '-',
                    'type': 'Free',
                })

    unmet = {k: v for k, v in remaining.items() if v > 0}

    result = {
        'timetable': timetable,
        'days': days,
        'slots': slots,
        'className': config.className,
    }

    write_json('timetable.json', result)
    write_json('config.json', {
        'className': config.className,
        'workingDays': config.workingDays,
        'hoursPerDay': config.hoursPerDay,
        'durationMinutes': config.durationMinutes,
        'startTime': config.startTime,
        'subjects': config.subjects,
    })

    return {
        'success': True,
        'data': result,
        'stats': {
            'totalSessions': len([t for t in timetable if t['subject'] != 'Free Period']),
            'totalFree': len([t for t in timetable if t['subject'] == 'Free Period']),
            'totalSlots': len(timetable),
            'subjects': len(subjects),
            'days': len(days),
            'slotsPerDay': len(slots),
        },
        'unmetCredits': unmet,
    }

# ========== Config ==========
@api_router.get("/config")
async def get_config():
    return {"success": True, "data": read_json('config.json')}

# ========== Conflict Detection ==========
def detect_conflicts(timetable):
    conflicts = []
    teacher_slots = {}
    for entry in timetable:
        if entry.get('subject') == 'Free Period':
            continue
        key = f"{entry['day']}-{entry['timeSlot']}"
        teacher = entry.get('teacher', '')
        if not teacher or teacher == '-':
            continue
        if teacher not in teacher_slots:
            teacher_slots[teacher] = {}
        if key in teacher_slots[teacher]:
            conflicts.append({
                'type': 'Teacher Conflict',
                'severity': 'High',
                'teacher': teacher,
                'day': entry['day'],
                'timeSlot': entry['timeSlot'],
                'subjects': [teacher_slots[teacher][key]['subject'], entry['subject']],
                'entryIds': [teacher_slots[teacher][key]['id'], entry['id']],
            })
        else:
            teacher_slots[teacher][key] = entry
    return conflicts

class ConflictBody(BaseModel):
    timetable: Optional[List[Dict[str, Any]]] = None

@api_router.post("/conflict")
async def check_conflict(body: ConflictBody = ConflictBody()):
    tt_data = read_json('timetable.json')
    if body.timetable:
        timetable = body.timetable
    elif isinstance(tt_data, dict):
        timetable = tt_data.get('timetable', [])
    else:
        timetable = tt_data
    conflicts = detect_conflicts(timetable)
    write_json('conflicts.json', conflicts)
    return {
        'success': True,
        'conflicts': conflicts,
        'count': len(conflicts),
        'hasConflicts': len(conflicts) > 0,
    }

# ========== Optimize (re-detect) ==========
@api_router.post("/optimize")
async def optimize():
    tt_data = read_json('timetable.json')
    timetable = tt_data.get('timetable', []) if isinstance(tt_data, dict) else tt_data
    conflicts = detect_conflicts(timetable)
    return {
        'success': True,
        'message': 'No conflicts found' if not conflicts else f'{len(conflicts)} conflict(s) detected',
        'conflicts': conflicts,
        'timetable': timetable,
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
                if d in DEFAULT_DAYS:
                    availability[d] = list(DEFAULT_SLOTS)
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
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=sample_teachers.csv"})

@api_router.get("/sample/rooms")
async def sample_rooms_csv():
    from starlette.responses import Response
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['name', 'capacity', 'type', 'facilities'])
    writer.writerow(['Room 101', '40', 'Classroom', 'Projector;Whiteboard'])
    writer.writerow(['Room 102', '35', 'Classroom', 'Whiteboard'])
    writer.writerow(['Computer Lab 1', '30', 'Lab', 'Computers;Projector'])
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=sample_rooms.csv"})

@api_router.get("/sample/subjects")
async def sample_subjects_csv():
    from starlette.responses import Response
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['name', 'code', 'credits', 'type', 'required_sessions'])
    writer.writerow(['Mathematics', 'MATH101', '4', 'Theory', '4'])
    writer.writerow(['Physics', 'PHY101', '4', 'Theory', '3'])
    writer.writerow(['Programming', 'CS102', '4', 'Practical', '2'])
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=sample_subjects.csv"})

app.include_router(api_router)
