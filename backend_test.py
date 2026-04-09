#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class TimetableAPITester:
    def __init__(self, base_url="https://conflict-resolver-25.preview.emergentagent.com"):
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

    def test_update_teacher(self, teacher_id):
        """Test PUT /api/teachers/:id endpoint"""
        try:
            update_data = {
                "name": f"Updated Teacher {datetime.now().strftime('%H%M%S')}",
                "subjects": ["Updated Subject", "Another Subject"],
                "availability": {
                    "Monday": ["09:00-10:00", "10:00-11:00", "11:00-12:00"],
                    "Wednesday": ["14:00-15:00"]
                }
            }
            
            response = requests.put(f"{self.api_url}/teachers/{teacher_id}", json=update_data, timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("success") and "data" in data
                if success:
                    print(f"   ✏️ Updated teacher: {teacher_id}")
            
            self.log_test("PUT Update Teacher", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("PUT Update Teacher", False, str(e))
            return False

    def test_update_room(self, room_id):
        """Test PUT /api/rooms/:id endpoint"""
        try:
            update_data = {
                "name": f"Updated Room {datetime.now().strftime('%H%M%S')}",
                "capacity": 50,
                "type": "Lab",
                "facilities": ["Computers", "Projector", "Air Conditioning"]
            }
            
            response = requests.put(f"{self.api_url}/rooms/{room_id}", json=update_data, timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("success") and "data" in data
                if success:
                    print(f"   ✏️ Updated room: {room_id}")
            
            self.log_test("PUT Update Room", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("PUT Update Room", False, str(e))
            return False

    def test_update_subject(self, subject_id):
        """Test PUT /api/subjects/:id endpoint"""
        try:
            update_data = {
                "name": f"Updated Subject {datetime.now().strftime('%H%M%S')}",
                "code": f"UPD{datetime.now().strftime('%H%M')}",
                "credits": 4,
                "type": "Practical",
                "requiredSessions": 4
            }
            
            response = requests.put(f"{self.api_url}/subjects/{subject_id}", json=update_data, timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("success") and "data" in data
                if success:
                    print(f"   ✏️ Updated subject: {subject_id}")
            
            self.log_test("PUT Update Subject", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("PUT Update Subject", False, str(e))
            return False

    def test_delete_teacher(self, teacher_id):
        """Test DELETE /api/teachers/:id endpoint"""
        try:
            response = requests.delete(f"{self.api_url}/teachers/{teacher_id}", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("success") and "data" in data
                if success:
                    print(f"   🗑️ Deleted teacher: {teacher_id}")
            
            self.log_test("DELETE Teacher", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("DELETE Teacher", False, str(e))
            return False

    def test_delete_room(self, room_id):
        """Test DELETE /api/rooms/:id endpoint"""
        try:
            response = requests.delete(f"{self.api_url}/rooms/{room_id}", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("success") and "data" in data
                if success:
                    print(f"   🗑️ Deleted room: {room_id}")
            
            self.log_test("DELETE Room", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("DELETE Room", False, str(e))
            return False

    def test_delete_subject(self, subject_id):
        """Test DELETE /api/subjects/:id endpoint"""
        try:
            response = requests.delete(f"{self.api_url}/subjects/{subject_id}", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get("success") and "data" in data
                if success:
                    print(f"   🗑️ Deleted subject: {subject_id}")
            
            self.log_test("DELETE Subject", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("DELETE Subject", False, str(e))
            return False

    def test_crud_operations(self):
        """Test full CRUD cycle for all entities"""
        print("\n🔄 Testing CRUD Operations")
        
        # Create entities for testing
        teacher_id = None
        room_id = None
        subject_id = None
        
        # Create teacher
        try:
            test_teacher = {
                "name": f"CRUD Test Teacher {datetime.now().strftime('%H%M%S')}",
                "subjects": ["CRUD Test Subject"],
                "availability": {"Monday": ["09:00-10:00"]}
            }
            response = requests.post(f"{self.api_url}/teachers", json=test_teacher, timeout=10)
            if response.status_code == 200:
                teacher_id = response.json()["data"]["id"]
                print(f"   📝 Created test teacher: {teacher_id}")
        except Exception as e:
            print(f"   ❌ Failed to create test teacher: {e}")
        
        # Create room
        try:
            test_room = {
                "name": f"CRUD Test Room {datetime.now().strftime('%H%M%S')}",
                "capacity": 25,
                "type": "Classroom"
            }
            response = requests.post(f"{self.api_url}/rooms", json=test_room, timeout=10)
            if response.status_code == 200:
                room_id = response.json()["data"]["id"]
                print(f"   📝 Created test room: {room_id}")
        except Exception as e:
            print(f"   ❌ Failed to create test room: {e}")
        
        # Create subject
        try:
            test_subject = {
                "name": f"CRUD Test Subject {datetime.now().strftime('%H%M%S')}",
                "code": f"CRD{datetime.now().strftime('%H%M')}",
                "credits": 3,
                "type": "Theory"
            }
            response = requests.post(f"{self.api_url}/subjects", json=test_subject, timeout=10)
            if response.status_code == 200:
                subject_id = response.json()["data"]["id"]
                print(f"   📝 Created test subject: {subject_id}")
        except Exception as e:
            print(f"   ❌ Failed to create test subject: {e}")
        
        # Test updates
        update_results = []
        if teacher_id:
            update_results.append(self.test_update_teacher(teacher_id))
        if room_id:
            update_results.append(self.test_update_room(room_id))
        if subject_id:
            update_results.append(self.test_update_subject(subject_id))
        
        # Test deletes
        delete_results = []
        if teacher_id:
            delete_results.append(self.test_delete_teacher(teacher_id))
        if room_id:
            delete_results.append(self.test_delete_room(room_id))
        if subject_id:
            delete_results.append(self.test_delete_subject(subject_id))
        
        # Test 404 errors for non-existent entities
        self.test_crud_404_errors()
        
        return all(update_results + delete_results)

    def test_crud_404_errors(self):
        """Test 404 errors for non-existent entities"""
        try:
            # Test update non-existent teacher
            response = requests.put(f"{self.api_url}/teachers/NONEXISTENT", json={"name": "Test"}, timeout=5)
            teacher_404 = response.status_code == 404
            
            # Test update non-existent room
            response = requests.put(f"{self.api_url}/rooms/NONEXISTENT", json={"name": "Test"}, timeout=5)
            room_404 = response.status_code == 404
            
            # Test update non-existent subject
            response = requests.put(f"{self.api_url}/subjects/NONEXISTENT", json={"name": "Test"}, timeout=5)
            subject_404 = response.status_code == 404
            
            # Test delete non-existent entities
            response = requests.delete(f"{self.api_url}/teachers/NONEXISTENT", timeout=5)
            teacher_del_404 = response.status_code == 404
            
            response = requests.delete(f"{self.api_url}/rooms/NONEXISTENT", timeout=5)
            room_del_404 = response.status_code == 404
            
            response = requests.delete(f"{self.api_url}/subjects/NONEXISTENT", timeout=5)
            subject_del_404 = response.status_code == 404
            
            success = all([teacher_404, room_404, subject_404, teacher_del_404, room_del_404, subject_del_404])
            self.log_test("CRUD 404 Error Handling", success, "Non-existent entity handling")
            return success
        except Exception as e:
            self.log_test("CRUD 404 Error Handling", False, str(e))
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

    def test_sample_csv_downloads(self):
        """Test sample CSV download endpoints"""
        endpoints = [
            ("teachers", "sample_teachers.csv"),
            ("rooms", "sample_rooms.csv"),
            ("subjects", "sample_subjects.csv")
        ]
        
        all_success = True
        for entity, filename in endpoints:
            try:
                response = requests.get(f"{self.api_url}/sample/{entity}", timeout=10)
                success = response.status_code == 200
                if success:
                    content_type = response.headers.get('Content-Type', '')
                    content_disposition = response.headers.get('Content-Disposition', '')
                    success = ('text/csv' in content_type and 
                             'attachment' in content_disposition and 
                             filename in content_disposition and
                             len(response.text) > 0)
                    if success:
                        lines = response.text.strip().split('\n')
                        print(f"   📄 Sample {entity} CSV: {len(lines)} lines")
                
                self.log_test(f"GET Sample {entity.title()} CSV", success, f"Status: {response.status_code}")
                if not success:
                    all_success = False
            except Exception as e:
                self.log_test(f"GET Sample {entity.title()} CSV", False, str(e))
                all_success = False
        
        return all_success

    def test_csv_uploads(self):
        """Test CSV upload endpoints"""
        import tempfile
        import os
        
        # Test data for each entity type
        test_data = {
            "teachers": "name,subjects,available_days\nTest Teacher CSV,Mathematics;Physics,Monday;Tuesday;Wednesday\nAnother Teacher,Chemistry,Thursday;Friday",
            "rooms": "name,capacity,type,facilities\nTest Room CSV,40,Classroom,Projector;Whiteboard\nLab Room CSV,30,Lab,Computers;Projector",
            "subjects": "name,code,credits,type,required_sessions\nTest Subject CSV,TST101,3,Theory,3\nPractical Subject,PRC101,4,Practical,2"
        }
        
        all_success = True
        for entity, csv_content in test_data.items():
            try:
                # Create temporary CSV file
                with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
                    f.write(csv_content)
                    temp_file = f.name
                
                # Upload CSV file
                with open(temp_file, 'rb') as f:
                    files = {'file': (f'test_{entity}.csv', f, 'text/csv')}
                    response = requests.post(f"{self.api_url}/upload/{entity}", files=files, timeout=15)
                
                success = response.status_code == 200
                if success:
                    data = response.json()
                    success = data.get("success") and "added" in data
                    if success:
                        added_count = data.get("added", 0)
                        errors_count = len(data.get("errors", []))
                        print(f"   📤 Uploaded {entity}: {added_count} added, {errors_count} errors")
                
                self.log_test(f"POST Upload {entity.title()} CSV", success, f"Status: {response.status_code}")
                if not success:
                    all_success = False
                
                # Clean up temp file
                os.unlink(temp_file)
                
            except Exception as e:
                self.log_test(f"POST Upload {entity.title()} CSV", False, str(e))
                all_success = False
        
        return all_success

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
        
        # Basic CRUD operations (CREATE)
        self.test_add_teacher()
        self.test_add_room()
        self.test_add_subject()
        
        # Full CRUD operations (UPDATE & DELETE)
        self.test_crud_operations()
        
        # CSV Features - Sample Downloads
        print("\n📄 Testing CSV Sample Downloads")
        self.test_sample_csv_downloads()
        
        # CSV Features - File Uploads
        print("\n📤 Testing CSV File Uploads")
        self.test_csv_uploads()
        
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