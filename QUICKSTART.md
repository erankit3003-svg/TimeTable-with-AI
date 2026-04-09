# Timetable Generator - Quick Start Guide

## ✅ System is Ready!

### 📍 Project Location
- **Root Directory**: `/app`
- **Backend**: `/app/server`
- **Frontend**: `/app/client`
- **Data Files**: `/app/data`

### 🚀 Quick Start

#### Method 1: Simple Start (Development)

**Terminal 1 - Start Backend:**
```bash
cd /app/server
node server.js
```
Server runs on: `http://localhost:3001`

**Terminal 2 - Start Frontend:**
```bash
cd /app/client
npm start
```
Frontend runs on: `http://localhost:3000`

#### Method 2: Production Build (Recommended for Deployment)

**Step 1: Build Frontend**
```bash
cd /app/client
npm run build
```

**Step 2: Start Server (serves both API and static files)**
```bash
cd /app/server
node server.js
```

Access at: `http://localhost:3001`

### 🔧 Quick Commands

```bash
# Test Backend API
curl http://localhost:3001/api/health

# Get All Data
curl http://localhost:3001/api/data

# Generate Timetable
curl -X POST http://localhost:3001/api/generate

# Detect Conflicts
curl -X POST http://localhost:3001/api/conflict

# Check Server Status
ps aux | grep "node server.js"

# View Server Logs
tail -f /tmp/timetable-server.log

# Stop Server
pkill -f "node server.js"
```

### 📁 Important Files

**Backend:**
- `/app/server/server.js` - Main server file (Express API)
- `/app/server/package.json` - Backend dependencies

**Frontend:**
- `/app/client/src/App.js` - Main React component
- `/app/client/src/components/Dashboard.js` - Dashboard view
- `/app/client/src/components/TimetableGrid.js` - Grid view
- `/app/client/build/` - Production build (after npm run build)

**Data:**
- `/app/data/teachers.json` - Teachers data
- `/app/data/rooms.json` - Rooms data
- `/app/data/subjects.json` - Subjects data
- `/app/data/timetable.json` - Generated timetable
- `/app/data/conflicts.json` - Detected conflicts

### 🌐 API Endpoints

**Base URL:** `http://localhost:3001/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/data` | Get all data |
| GET | `/timetable` | Get current timetable |
| POST | `/teachers` | Add new teacher |
| POST | `/rooms` | Add new room |
| POST | `/subjects` | Add new subject |
| POST | `/generate` | Generate timetable |
| POST | `/conflict` | Detect conflicts |
| POST | `/optimize` | Partial re-optimization |
| GET | `/export` | Export timetable as JSON |

### 🚢 Linux Server Deployment

#### Option 1: Direct Deployment
```bash
# Build frontend
cd /app/client
npm run build

# Start server
cd /app/server
node server.js
```

#### Option 2: PM2 Process Manager
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
cd /app/server
pm2 start server.js --name timetable

# Auto-start on system boot
pm2 save
pm2 startup

# Monitor
pm2 status
pm2 logs timetable
```

#### Option 3: Systemd Service
Create file: `/etc/systemd/system/timetable.service`
```ini
[Unit]
Description=Timetable Generator
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/app/server
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable timetable
sudo systemctl start timetable
sudo systemctl status timetable
```

### 🔒 Firewall Configuration
```bash
# Allow port 3001
sudo ufw allow 3001/tcp

# Or for production (port 80 with reverse proxy)
sudo ufw allow 80/tcp
```

### 🌐 Nginx Reverse Proxy (Optional)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 📊 Sample Data Included

**5 Teachers:**
- Dr. Sharma (Mathematics, Statistics)
- Prof. Kumar (Physics, Electronics)
- Ms. Patel (Chemistry, Biology)
- Dr. Verma (Computer Science, Programming)
- Prof. Singh (English, Literature)

**6 Rooms:**
- 3 Classrooms (Room 101, 102, 103)
- 3 Labs (Computer Lab, Physics Lab, Chemistry Lab)

**7 Subjects:**
- Mathematics, Physics, Chemistry, Computer Science, English, Programming, Electronics

### ⚙️ Configuration

**Change Server Port:**
Edit `/app/server/server.js`:
```javascript
const PORT = process.env.PORT || 3001;
```

Or use environment variable:
```bash
PORT=8080 node server.js
```

**Modify Time Slots:**
Edit in `/app/server/server.js`:
```javascript
const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00'];
```

**Add Days:**
```javascript
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
```

### 🐛 Troubleshooting

**Port already in use:**
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in server.js
```

**Cannot access from external IP:**
- Check firewall settings
- Ensure server binds to 0.0.0.0 (already configured)
- Open port in cloud provider security groups

**Build errors:**
```bash
# Clear cache and reinstall
cd /app/client
rm -rf node_modules build
npm install
npm run build
```

**API not responding:**
```bash
# Check server status
ps aux | grep node

# Check logs
cat /tmp/timetable-server.log

# Restart server
pkill -f "node server.js"
cd /app/server && node server.js
```

### 📈 Usage Flow

1. **Start Application** → Access dashboard
2. **View Data** → See teachers, rooms, subjects
3. **Generate Timetable** → Click "Generate Timetable" button
4. **View Schedule** → Switch to "Timetable View" tab
5. **Check Conflicts** → Click "Detect Conflicts"
6. **Export** → Download timetable as JSON

### 🎯 Features Implemented

✅ **Phase 1 (Core Features):**
- Timetable generation with greedy algorithm
- Constraint-based scheduling
- Teacher availability checking
- Room allocation (Labs for Practical, Classrooms for Theory)
- Conflict detection (Teacher & Room)
- Professional dashboard UI
- Interactive grid view
- Real-time statistics
- JSON export

⏳ **Phase 2 (Future):**
- Partial re-optimization
- Impact minimization
- Adaptive learning

### 🔗 Useful Links

- Full Documentation: `/app/README.md`
- Deployment Script: `/app/deploy.sh`
- Setup Script: `/app/setup.sh`

### 📞 Support

Check server health: `curl http://localhost:3001/api/health`

Server logs: `tail -f /tmp/timetable-server.log`

Process status: `ps aux | grep node`

---

**System Status:** ✅ Ready for Deployment
**Tech Stack:** Node.js + Express + React + JSON Storage
**Deployment:** Simple, Lightweight, Linux-Compatible
