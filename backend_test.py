#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class TimetableAPITester:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_health_check(self):
        """Test health endpoint"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=5)
            success = response.status_code == 200 and response.json().get("status") == "OK"
            self.log_test("Health Check", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Health Check", False, str(e))
            return False

    def test_get_all_data(self):
        """Test GET /api/data endpoint"""
        try:
            response = requests.get(f"{self.api_url}/data", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("success") and "data" in data
                if success:
                    teachers_count = len(data["data"].get("teachers", []))
                    rooms_count = len(data["data"].get("rooms", []))
                    subjects_count = len(data["data"].get("subjects", []))
                    print(f"   📊 Data loaded: {teachers_count} teachers, {rooms_count} rooms, {subjects_count} subjects")
            
            self.log_test("GET All Data", success, f"Status: {response.status_code}")
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("GET All Data", False, str(e))
            return False, {}

    def test_add_teacher(self):
        """Test POST /api/teachers endpoint"""
        try:
            test_teacher = {
                "name": f"Test Teacher {datetime.now().strftime('%H%M%S')}",
                "subjects": ["Test Subject"],
                "availability": {
                    "Monday": ["09:00-10:00", "10:00-11:00"],
                    "Tuesday": ["09:00-10:00"]
                }
            }
            
            response = requests.post(f"{self.api_url}/teachers", json=test_teacher, timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("success") and "data" in data
                if success:
                    teacher_id = data["data"].get("id")
                    print(f"   👨‍🏫 Created teacher: {teacher_id}")
            
            self.log_test("POST Add Teacher", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("POST Add Teacher", False, str(e))
            return False

    def test_add_room(self):
        """Test POST /api/rooms endpoint"""
        try:
            test_room = {
                "name": f"Test Room {datetime.now().strftime('%H%M%S')}",
                "capacity": 30,
                "type": "Classroom",
                "facilities": ["Projector", "Whiteboard"]
            }
            
            response = requests.post(f"{self.api_url}/rooms", json=test_room, timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("success") and "data" in data
                if success:
                    room_id = data["data"].get("id")
                    print(f"   🏫 Created room: {room_id}")
            
            self.log_test("POST Add Room", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("POST Add Room", False, str(e))
            return False

    def test_add_subject(self):
        """Test POST /api/subjects endpoint"""
        try:
            test_subject = {
                "name": f"Test Subject {datetime.now().strftime('%H%M%S')}",
                "code": f"TST{datetime.now().strftime('%H%M')}",
                "credits": 3,
                "type": "Theory",
                "requiredSessions": 2
            }
            
            response = requests.post(f"{self.api_url}/subjects", json=test_subject, timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("success") and "data" in data
                if success:
                    subject_id = data["data"].get("id")
                    print(f"   📚 Created subject: {subject_id}")
            
            self.log_test("POST Add Subject", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("POST Add Subject", False, str(e))
            return False

    def test_generate_timetable(self):
        """Test POST /api/generate endpoint"""
        try:
            response = requests.post(f"{self.api_url}/generate", timeout=30)
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("success") and "data" in data
                if success:
                    sessions_count = len(data["data"])
                    conflicts_count = len(data.get("conflicts", []))
                    print(f"   📅 Generated {sessions_count} sessions, {conflicts_count} conflicts")
            
            self.log_test("POST Generate Timetable", success, f"Status: {response.status_code}")
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("POST Generate Timetable", False, str(e))
            return False, {}

    def test_detect_conflicts(self, timetable_data=None):
        """Test POST /api/conflict endpoint"""
        try:
            payload = {}
            if timetable_data:
                payload["timetable"] = timetable_data
            
            response = requests.post(f"{self.api_url}/conflict", json=payload, timeout=15)
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("success") and "conflicts" in data
                if success:
                    conflicts_count = data.get("count", 0)
                    print(f"   🔍 Detected {conflicts_count} conflicts")
            
            self.log_test("POST Detect Conflicts", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("POST Detect Conflicts", False, str(e))
            return False

    def test_optimize_timetable(self):
        """Test POST /api/optimize endpoint"""
        try:
            response = requests.post(f"{self.api_url}/optimize", timeout=30)
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("success")
                if success:
                    changes_count = len(data.get("changes", []))
                    remaining_conflicts = data.get("remainingConflicts", 0)
                    print(f"   ⚡ Optimization: {changes_count} changes, {remaining_conflicts} remaining conflicts")
            
            self.log_test("POST Optimize Timetable", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("POST Optimize Timetable", False, str(e))
            return False

    def test_get_timetable(self):
        """Test GET /api/timetable endpoint"""
        try:
            response = requests.get(f"{self.api_url}/timetable", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("success") and "data" in data
                if success:
                    sessions_count = len(data["data"])
                    print(f"   📋 Retrieved {sessions_count} timetable sessions")
            
            self.log_test("GET Timetable", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("GET Timetable", False, str(e))
            return False

    def test_export_timetable(self):
        """Test GET /api/export endpoint"""
        try:
            response = requests.get(f"{self.api_url}/export", timeout=10)
            success = response.status_code == 200
            if success:
                # Check if response is JSON and has content
                try:
                    json.loads(response.text)
                    content_disposition = response.headers.get('Content-Disposition', '')
                    success = 'attachment' in content_disposition and 'timetable.json' in content_disposition
                    print(f"   💾 Export headers: {content_disposition}")
                except:
                    success = False
            
            self.log_test("GET Export Timetable", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("GET Export Timetable", False, str(e))
            return False

    def test_validation_errors(self):
        """Test API validation"""
        try:
            # Test empty teacher name
            response = requests.post(f"{self.api_url}/teachers", json={"name": ""}, timeout=5)
            teacher_validation = response.status_code == 400
            
            # Test empty subject name/code
            response = requests.post(f"{self.api_url}/subjects", json={"name": "", "code": ""}, timeout=5)
            subject_validation = response.status_code == 400
            
            # Test empty room name
            response = requests.post(f"{self.api_url}/rooms", json={"name": ""}, timeout=5)
            room_validation = response.status_code == 400
            
            success = teacher_validation and subject_validation and room_validation
            self.log_test("API Validation Errors", success, "Empty field validation")
            return success
        except Exception as e:
            self.log_test("API Validation Errors", False, str(e))
            return False

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting Timetable API Test Suite")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ Server not responding, stopping tests")
            return False
        
        # Data retrieval
        data_success, initial_data = self.test_get_all_data()
        
        # CRUD operations
        self.test_add_teacher()
        self.test_add_room()
        self.test_add_subject()
        
        # Core timetable functionality
        generate_success, timetable_data = self.test_generate_timetable()
        if generate_success:
            self.test_detect_conflicts(timetable_data.get("data"))
            self.test_optimize_timetable()
        
        # Additional endpoints
        self.test_get_timetable()
        self.test_export_timetable()
        
        # Validation
        self.test_validation_errors()
        
        # Summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed - check details above")
            return False

def main():
    tester = TimetableAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())