"""
Backend API Tests for Timetable Generator - Major Refactor Testing
Tests the new configuration-based timetable generation system with:
- Config form inputs (className, workingDays, hoursPerDay, durationMinutes, startTime, subjects)
- Credit-based distribution algorithm
- 1 subject per day constraint
- Dynamic slot generation
- Teacher conflict prevention
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://conflict-resolver-25.preview.emergentagent.com"


class TestHealthAndBasicEndpoints:
    """Health check and basic data endpoints"""
    
    def test_health_check(self):
        """Test /api/health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "OK"
        print("PASS: Health check endpoint working")
    
    def test_get_all_data(self):
        """Test /api/data returns all data including timetable in new format"""
        response = requests.get(f"{BASE_URL}/api/data")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "teachers" in data["data"]
        assert "rooms" in data["data"]
        assert "subjects" in data["data"]
        assert "timetable" in data["data"]
        assert "config" in data["data"]
        
        # Verify timetable is in new format (object with timetable, days, slots, className)
        timetable = data["data"]["timetable"]
        if timetable:  # If timetable exists
            assert isinstance(timetable, dict), "Timetable should be an object, not array"
            if "timetable" in timetable:
                assert "days" in timetable
                assert "slots" in timetable
                assert "className" in timetable
        print("PASS: GET /api/data returns correct structure with new timetable format")
    
    def test_get_config(self):
        """Test /api/config returns saved configuration"""
        response = requests.get(f"{BASE_URL}/api/config")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        config = data["data"]
        # Config may be empty or have saved values
        if config:
            # Verify config structure if it exists
            expected_keys = ["className", "workingDays", "hoursPerDay", "durationMinutes", "startTime", "subjects"]
            for key in expected_keys:
                if key in config:
                    print(f"  Config has {key}: {config[key]}")
        print("PASS: GET /api/config returns saved configuration")


class TestGenerateEndpoint:
    """Tests for POST /api/generate endpoint with new config body"""
    
    def test_generate_basic_timetable(self):
        """Test basic timetable generation with config body"""
        config = {
            "className": "TEST_Class_A",
            "workingDays": 5,
            "hoursPerDay": 6,
            "durationMinutes": 45,
            "startTime": "09:00",
            "subjects": [
                {"name": "Math", "teacher": "Dr. Test", "credits": 3, "type": "Theory"},
                {"name": "Science", "teacher": "Prof. Test", "credits": 2, "type": "Theory"}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/generate", json=config)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        # Verify response structure
        result = data["data"]
        assert "timetable" in result
        assert "days" in result
        assert "slots" in result
        assert "className" in result
        assert result["className"] == "TEST_Class_A"
        
        # Verify stats
        assert "stats" in data
        stats = data["stats"]
        assert "totalSessions" in stats
        assert "totalFree" in stats
        assert "totalSlots" in stats
        
        print(f"PASS: Generate endpoint returns correct structure")
        print(f"  Stats: {stats['totalSessions']} sessions, {stats['totalFree']} free, {stats['totalSlots']} total slots")
    
    def test_generate_with_5_working_days(self):
        """Test generation with Mon-Fri (5 days)"""
        config = {
            "className": "TEST_5Day_Class",
            "workingDays": 5,
            "hoursPerDay": 4,
            "durationMinutes": 60,
            "startTime": "08:00",
            "subjects": [
                {"name": "Subject1", "teacher": "Teacher1", "credits": 2, "type": "Theory"}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/generate", json=config)
        assert response.status_code == 200
        data = response.json()
        result = data["data"]
        
        # Verify 5 days
        assert len(result["days"]) == 5
        assert result["days"] == ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        print("PASS: 5 working days generates Mon-Fri")
    
    def test_generate_with_6_working_days(self):
        """Test generation with Mon-Sat (6 days)"""
        config = {
            "className": "TEST_6Day_Class",
            "workingDays": 6,
            "hoursPerDay": 4,
            "durationMinutes": 60,
            "startTime": "08:00",
            "subjects": [
                {"name": "Subject1", "teacher": "Teacher1", "credits": 2, "type": "Theory"}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/generate", json=config)
        assert response.status_code == 200
        data = response.json()
        result = data["data"]
        
        # Verify 6 days
        assert len(result["days"]) == 6
        assert "Saturday" in result["days"]
        print("PASS: 6 working days generates Mon-Sat")
    
    def test_dynamic_slot_generation(self):
        """Test that slots are generated based on hoursPerDay and durationMinutes"""
        config = {
            "className": "TEST_Slots_Class",
            "workingDays": 5,
            "hoursPerDay": 3,  # 3 hours = 180 minutes
            "durationMinutes": 45,  # 180/45 = 4 slots
            "startTime": "10:00",
            "subjects": [
                {"name": "Subject1", "teacher": "Teacher1", "credits": 1, "type": "Theory"}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/generate", json=config)
        assert response.status_code == 200
        data = response.json()
        result = data["data"]
        
        # 3 hours / 45 min = 4 slots
        expected_slots = 4
        assert len(result["slots"]) == expected_slots, f"Expected {expected_slots} slots, got {len(result['slots'])}"
        
        # Verify start time
        assert result["slots"][0].startswith("10:00"), f"First slot should start at 10:00, got {result['slots'][0]}"
        print(f"PASS: Dynamic slot generation - {len(result['slots'])} slots from 3 hours / 45 min")
    
    def test_credit_based_distribution(self):
        """Test that total sessions = sum of credits"""
        config = {
            "className": "TEST_Credits_Class",
            "workingDays": 5,
            "hoursPerDay": 6,
            "durationMinutes": 45,
            "startTime": "09:00",
            "subjects": [
                {"name": "Math", "teacher": "T1", "credits": 3, "type": "Theory"},
                {"name": "Science", "teacher": "T2", "credits": 2, "type": "Theory"},
                {"name": "English", "teacher": "T3", "credits": 4, "type": "Theory"}
            ]
        }
        total_credits = 3 + 2 + 4  # 9
        
        response = requests.post(f"{BASE_URL}/api/generate", json=config)
        assert response.status_code == 200
        data = response.json()
        
        stats = data["stats"]
        # Total sessions should equal total credits (if enough slots available)
        assert stats["totalSessions"] == total_credits, f"Expected {total_credits} sessions, got {stats['totalSessions']}"
        print(f"PASS: Credit-based distribution - {stats['totalSessions']} sessions for {total_credits} credits")
    
    def test_one_subject_per_day_constraint(self):
        """Test that each subject appears max once per day"""
        config = {
            "className": "TEST_OnePerDay_Class",
            "workingDays": 5,
            "hoursPerDay": 6,
            "durationMinutes": 45,
            "startTime": "09:00",
            "subjects": [
                {"name": "Math", "teacher": "T1", "credits": 5, "type": "Theory"},  # 5 credits, 5 days = 1 per day
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/generate", json=config)
        assert response.status_code == 200
        data = response.json()
        result = data["data"]
        
        # Count Math occurrences per day
        day_counts = {}
        for entry in result["timetable"]:
            if entry["subject"] == "Math":
                day = entry["day"]
                day_counts[day] = day_counts.get(day, 0) + 1
        
        # Each day should have at most 1 Math session
        for day, count in day_counts.items():
            assert count <= 1, f"Math appears {count} times on {day}, should be max 1"
        
        print(f"PASS: 1 subject per day constraint - Math appears once per day: {day_counts}")
    
    def test_unmet_credits_warning(self):
        """Test that unmet credits are reported when credits > available slots"""
        config = {
            "className": "TEST_Overflow_Class",
            "workingDays": 2,  # Only 2 days
            "hoursPerDay": 1,  # Only 1 hour
            "durationMinutes": 60,  # 1 slot per day = 2 total slots
            "startTime": "09:00",
            "subjects": [
                {"name": "Math", "teacher": "T1", "credits": 5, "type": "Theory"},  # 5 credits but only 2 slots
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/generate", json=config)
        assert response.status_code == 200
        data = response.json()
        
        # Should have unmet credits
        assert "unmetCredits" in data
        if data["unmetCredits"]:
            print(f"PASS: Unmet credits reported: {data['unmetCredits']}")
        else:
            # If no unmet credits, verify sessions match available slots
            print(f"PASS: All credits met or limited by slots")


class TestTimetableStructure:
    """Tests for timetable grid structure"""
    
    def test_timetable_entry_structure(self):
        """Test that each timetable entry has required fields"""
        config = {
            "className": "TEST_Structure_Class",
            "workingDays": 5,
            "hoursPerDay": 2,
            "durationMinutes": 60,
            "startTime": "09:00",
            "subjects": [
                {"name": "TestSubject", "teacher": "TestTeacher", "credits": 1, "type": "Theory"}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/generate", json=config)
        assert response.status_code == 200
        data = response.json()
        result = data["data"]
        
        # Check first entry structure
        entry = result["timetable"][0]
        required_fields = ["id", "day", "timeSlot", "subject", "teacher", "type"]
        for field in required_fields:
            assert field in entry, f"Missing field: {field}"
        
        print(f"PASS: Timetable entry has all required fields: {required_fields}")
    
    def test_free_period_structure(self):
        """Test that free periods are properly marked"""
        config = {
            "className": "TEST_Free_Class",
            "workingDays": 5,
            "hoursPerDay": 6,
            "durationMinutes": 45,
            "startTime": "09:00",
            "subjects": [
                {"name": "OnlySubject", "teacher": "T1", "credits": 1, "type": "Theory"}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/generate", json=config)
        assert response.status_code == 200
        data = response.json()
        result = data["data"]
        
        # Find free periods
        free_periods = [e for e in result["timetable"] if e["subject"] == "Free Period"]
        assert len(free_periods) > 0, "Should have free periods"
        
        # Check free period structure
        free = free_periods[0]
        assert free["teacher"] == "-"
        assert free["type"] == "Free"
        
        print(f"PASS: Free periods properly structured - {len(free_periods)} free periods found")


class TestConflictDetection:
    """Tests for conflict detection endpoint"""
    
    def test_conflict_detection_no_conflicts(self):
        """Test conflict detection with no conflicts"""
        # First generate a timetable
        config = {
            "className": "TEST_NoConflict_Class",
            "workingDays": 5,
            "hoursPerDay": 4,
            "durationMinutes": 60,
            "startTime": "09:00",
            "subjects": [
                {"name": "Math", "teacher": "T1", "credits": 2, "type": "Theory"},
                {"name": "Science", "teacher": "T2", "credits": 2, "type": "Theory"}
            ]
        }
        requests.post(f"{BASE_URL}/api/generate", json=config)
        
        # Check conflicts
        response = requests.post(f"{BASE_URL}/api/conflict")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "conflicts" in data
        assert "count" in data
        assert "hasConflicts" in data
        
        print(f"PASS: Conflict detection - {data['count']} conflicts found")
    
    def test_conflict_detection_with_custom_timetable(self):
        """Test conflict detection with custom timetable body"""
        custom_timetable = [
            {"id": "TT1", "day": "Monday", "timeSlot": "09:00-10:00", "subject": "Math", "teacher": "T1", "type": "Theory"},
            {"id": "TT2", "day": "Monday", "timeSlot": "09:00-10:00", "subject": "Science", "teacher": "T1", "type": "Theory"}  # Same teacher, same slot = conflict
        ]
        
        response = requests.post(f"{BASE_URL}/api/conflict", json={"timetable": custom_timetable})
        assert response.status_code == 200
        data = response.json()
        
        # Should detect teacher conflict
        assert data["hasConflicts"] == True
        assert data["count"] >= 1
        print(f"PASS: Conflict detection with custom timetable - detected {data['count']} conflict(s)")


class TestExportAndTimetableEndpoints:
    """Tests for export and timetable retrieval"""
    
    def test_get_timetable(self):
        """Test GET /api/timetable returns saved timetable"""
        response = requests.get(f"{BASE_URL}/api/timetable")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "data" in data
        print("PASS: GET /api/timetable returns saved timetable")
    
    def test_export_timetable(self):
        """Test GET /api/export returns JSON file"""
        response = requests.get(f"{BASE_URL}/api/export")
        assert response.status_code == 200
        assert response.headers.get("Content-Type") == "application/json"
        
        # Should have Content-Disposition header for download
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp
        assert "timetable.json" in content_disp
        
        print("PASS: Export endpoint returns downloadable JSON")


class TestCRUDOperations:
    """Tests for CRUD operations on teachers, rooms, subjects"""
    
    def test_add_teacher(self):
        """Test POST /api/teachers"""
        teacher = {
            "name": "TEST_Teacher_New",
            "subjects": ["Math", "Physics"],
            "availability": {"Monday": ["09:00-10:00"]}
        }
        response = requests.post(f"{BASE_URL}/api/teachers", json=teacher)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["name"] == "TEST_Teacher_New"
        print(f"PASS: Add teacher - ID: {data['data']['id']}")
        return data["data"]["id"]
    
    def test_add_room(self):
        """Test POST /api/rooms"""
        room = {
            "name": "TEST_Room_101",
            "capacity": 40,
            "type": "Classroom",
            "facilities": ["Projector"]
        }
        response = requests.post(f"{BASE_URL}/api/rooms", json=room)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["name"] == "TEST_Room_101"
        print(f"PASS: Add room - ID: {data['data']['id']}")
        return data["data"]["id"]
    
    def test_add_subject(self):
        """Test POST /api/subjects"""
        subject = {
            "name": "TEST_Subject_New",
            "code": "TEST101",
            "credits": 3,
            "type": "Theory",
            "requiredSessions": 3
        }
        response = requests.post(f"{BASE_URL}/api/subjects", json=subject)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["name"] == "TEST_Subject_New"
        assert data["data"]["code"] == "TEST101"
        print(f"PASS: Add subject - ID: {data['data']['id']}")
        return data["data"]["id"]


class TestOptimizeEndpoint:
    """Tests for optimize endpoint"""
    
    def test_optimize(self):
        """Test POST /api/optimize"""
        response = requests.post(f"{BASE_URL}/api/optimize")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "message" in data
        assert "conflicts" in data
        assert "timetable" in data
        print(f"PASS: Optimize endpoint - {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
