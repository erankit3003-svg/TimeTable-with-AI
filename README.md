# AI-Based Dynamic Timetable Generation System

A complete web application for automated timetable generation with constraint optimization and conflict detection.

## 🚀 Features

### Phase 1 (Implemented)
- ✅ **Timetable Generation**: Greedy + constraint-based algorithm
- ✅ **Conflict Detection**: Automatic detection of teacher and room conflicts
- ✅ **Professional Dashboard**: Data-focused UI with clean tables
- ✅ **Interactive Grid View**: Visual weekly timetable
- ✅ **Data Management**: Teachers, Rooms, and Subjects management
- ✅ **Export Functionality**: Export timetable as JSON
- ✅ **Real-time Stats**: Live tracking of sessions and resources

### Phase 2 (Future Enhancement)
- ⏳ Partial re-optimization
- ⏳ Impact minimization
- ⏳ Adaptive learning from conflicts

## 💻 Tech Stack

**Frontend:**
- React 19
- Axios for API calls
- Professional CSS styling
- Responsive design

**Backend:**
- Node.js + Express
- CORS enabled
- RESTful API architecture

**Data Storage:**
- Local JSON files (no database required)
- Easy backup and version control

## 📁 Project Structure

```
/project-root
├── server/              # Node.js backend
│   ├── server.js       # Express server
│   └── package.json
├── client/              # React frontend
│   ├── components/
│   │   ├── Dashboard.js
│   │   └── TimetableGrid.js
│   ├── App.js
│   ├── App.css
│   └── package.json
└── data/                # JSON data files
    ├── teachers.json
    ├── rooms.json
    ├── subjects.json
    ├── timetable.json
    └── conflicts.json
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Step 1: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 2: Install Frontend Dependencies
```bash
cd client
npm install
```

### Step 3: Start the Backend Server
```bash
cd server
node server.js
```
Server will run on: `http://localhost:5000`

### Step 4: Start the Frontend (in a new terminal)
```bash
cd client
npm start
```
Client will run on: `http://localhost:3000`

## 📌 API Endpoints

### Data Management
- `GET /api/data` - Get all data (teachers, rooms, subjects, timetable)
- `GET /api/timetable` - Get current timetable
- `POST /api/teachers` - Add new teacher
- `POST /api/rooms` - Add new room
- `POST /api/subjects` - Add new subject

### Timetable Operations
- `POST /api/generate` - Generate new timetable
- `POST /api/conflict` - Detect conflicts in timetable
- `POST /api/optimize` - Partial re-optimization (Phase 2)
- `GET /api/export` - Export timetable as JSON
- `GET /api/health` - Health check

## 🧠 Algorithm Details

### Constraint System (Priority-based)
1. **High Priority**: Teacher availability
2. **Medium Priority**: Room availability
3. **Low Priority**: Time preferences

### Generation Logic
- Uses greedy algorithm with constraint checking
- Allocates sessions based on:
  - Subject requirements
  - Teacher availability by day/time
  - Room type (Lab for Practical, Classroom for Theory)
  - No teacher/room conflicts

### Conflict Detection
- Scans entire timetable for:
  - Teacher double-booking (High severity)
  - Room double-booking (Medium severity)
- Returns detailed conflict list with affected resources

## 📊 Sample Data Included

- **5 Teachers** with subject specializations and availability
- **6 Rooms** (3 Classrooms + 3 Labs)
- **7 Subjects** (Theory + Practical)

## 🚀 Deployment on Linux Server

### Option 1: Simple Deployment
```bash
# Build frontend
cd client
npm run build

# Serve static files from backend
cd ../server
node server.js
```
Access at: `http://your-server-ip:5000`

### Option 2: Using PM2 (Process Manager)
```bash
npm install -g pm2
cd server
pm2 start server.js --name timetable-api
pm2 save
pm2 startup
```

### Option 3: With Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📝 Usage Guide

1. **View Data**: Check Dashboard tab to see all teachers, rooms, and subjects
2. **Generate Timetable**: Click "Generate Timetable" button
3. **View Schedule**: Switch to "Timetable View" tab to see the grid
4. **Detect Conflicts**: Click "Detect Conflicts" to check for scheduling issues
5. **Export**: Click "Export JSON" to download timetable data

## 🔧 Customization

### Add New Data
Edit JSON files in `/data` directory:
- `teachers.json` - Add teachers with availability
- `rooms.json` - Add rooms with facilities
- `subjects.json` - Add subjects with requirements

### Modify Time Slots
Edit in `server/server.js`:
```javascript
const timeSlots = ['09:00-10:00', '10:00-11:00', ...]
```

### Change Algorithm
Update `generateTimetable()` function in `server/server.js`

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Change PORT in server.js or use environment variable
PORT=8080 node server.js
```

**CORS errors:**
- Ensure CORS is enabled in server.js (already configured)
- Check frontend API_URL in client/.env

**Cannot connect to backend:**
- Verify backend is running on port 5000
- Check firewall settings

## 📝 License

MIT License - Free to use and modify

## 👥 Support

For issues or questions, please check:
- API health: `http://localhost:5000/api/health`
- Console logs in browser dev tools
- Server logs in terminal

---

**Built with ❤️ for efficient academic scheduling**