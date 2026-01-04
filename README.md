# Monitool

A comprehensive toolbox monitoring system with web dashboard, backend API, and IoT hardware integration for tracking tool inventory and technician access in real-time. The system combines cloud-based monitoring with edge computing (Raspberry Pi) and sensor arrays (Arduino) to provide automated toolbox tracking.

## Overview

Monitool is designed for organizations that need to track tool inventory, monitor toolbox access, and maintain accountability for equipment. The system uses NFC cards for technician identification and computer vision/sensors to detect missing items automatically.

### How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Technician     │────▶│  NFC Reader      │────▶│  Raspberry Pi   │
│  (NFC Card)     │     │  (RC522/PN532)   │     │  (Edge Device)  │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                            │
                                                            │ HTTPS/API
                                                            ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Web Dashboard  │◀────│  Backend API     │◀────│  Toolbox        │
│  (React)        │     │  (FastAPI)       │     │  Sensors        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                   (Arduino/ESP32)
                               ▼
                        ┌──────────────────┐
                        │  SQLite Database │
                        │  (Access Logs)   │
                        └──────────────────┘
```

1. **Technician scans NFC card** at the toolbox-mounted Raspberry Pi
2. **Raspberry Pi identifies technician** via API call to backend
3. **Toolbox opens** (if authorized) and sensors begin monitoring
4. **Arduino sensors detect** which tools are present/missing
5. **Before/after photos** captured by Pi camera
6. **Access event logged** with timestamp, technician, and inventory status
7. **Dashboard displays** real-time updates and missing item alerts

## Features

- **Web Dashboard**: Modern React-based interface for monitoring and management
- **Backend API**: FastAPI server with SQLite database and comprehensive RESTful endpoints
- **Authentication**: JWT-based user authentication + API key security
- **Toolbox Management**: Track toolboxes, inventory, locations, and status
- **Access Logging**: Complete audit trail of all toolbox access events
- **Technician Management**: NFC card-based technician identification (RC522, PN532 compatible)
- **Real-time Stats**: Dashboard with statistics and missing item alerts
- **IoT Integration**: Raspberry Pi client library for edge computing and sensor integration
- **Image Capture**: Before/after photos of toolbox contents
- **Hardware Agnostic**: Works with various NFC readers, cameras, and sensor arrays
- **Docker Support**: Full Docker Compose setup for easy deployment

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy 2.0** - ORM for database operations
- **SQLite** - Simple, file-based database
- **JWT** - Secure authentication
- **Pydantic** - Data validation

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **React Query** - Data fetching and caching
- **Zustand** - State management
- **Nginx** - Production web server

### Hardware / IoT
- **Raspberry Pi** - Edge computing device (recommended: Pi 4 or Pi 5)
- **NFC Readers** - RC522, PN532, or compatible NFC/RFID modules
- **Arduino/ESP32** - Sensor controllers for toolbox monitoring
- **Cameras** - Pi Camera Module or USB cameras for image capture
- **Sensors** - Weight sensors, proximity sensors, or custom sensor arrays

## Hardware Integration Architecture

### System Components

The Monitool system uses a distributed architecture combining cloud services with edge computing:

#### 1. Cloud Layer (Backend + Dashboard)
- **Central API Server**: Manages all data, authentication, and business logic
- **Web Dashboard**: Provides real-time visibility to supervisors and managers
- **Database**: Stores all access logs, technician data, and inventory records

#### 2. Edge Layer (Raspberry Pi)
The Raspberry Pi acts as the "brain" at each toolbox location:

**Responsibilities:**
- Read NFC cards and identify technicians
- Control toolbox access (electromagnetic locks, servo motors)
- Capture before/after photos of toolbox contents
- Communicate with Arduino sensor arrays
- Send access logs to cloud API
- Handle offline scenarios (cache and sync when connection restored)

**Typical Setup:**
```
Raspberry Pi 4/5
├── NFC Reader (RC522 via SPI or PN532 via I2C)
├── Pi Camera Module (CSI interface)
├── Arduino/ESP32 (USB or Serial communication)
├── Network Connection (WiFi or Ethernet)
└── Optional: Touchscreen display for technician feedback
```

**Example Workflow:**
```python
from monitool_client import MonitoolClient
from mfrc522 import SimpleMFRC522
import serial

# Initialize connections
client = MonitoolClient(api_url="https://api.yourcompany.com", api_key="...")
nfc_reader = SimpleMFRC522()
arduino = serial.Serial('/dev/ttyUSB0', 9600)

# Wait for NFC card scan
print("Scan your card...")
nfc_uid = nfc_reader.read_id()

# Identify technician via API
technician = client.get_technician_by_nfc(nfc_uid)
print(f"Welcome, {technician['first_name']}!")

# Unlock toolbox
unlock_toolbox()

# Get initial tool count from Arduino sensors
arduino.write(b'COUNT\n')
items_before = int(arduino.readline().decode().strip())

# Capture "before" photo
capture_image("before.jpg")

# Wait for technician to close toolbox
wait_for_closure()

# Get final tool count
arduino.write(b'COUNT\n')
items_after = int(arduino.readline().decode().strip())

# Capture "after" photo
capture_image("after.jpg")

# Log the access event
client.log_access(
    toolbox_id="TB-001",
    technician_id=technician["id"],
    action_type="close",
    items_before=items_before,
    items_after=items_after,
    notes=f"Tool count changed: {items_before} → {items_after}"
)

# Upload images
client.upload_image("before.jpg", subfolder="before")
client.upload_image("after.jpg", subfolder="after")
```

#### 3. Sensor Layer (Arduino/ESP32)

Arduino microcontrollers handle the low-level sensor monitoring:

**Common Sensor Types:**

1. **Weight Sensors (Load Cells)**
   - Detect missing tools by weight change
   - Each tool slot has a calibrated weight threshold
   - HX711 load cell amplifier commonly used

2. **Proximity Sensors (Ultrasonic/IR)**
   - Detect presence/absence of tools in slots
   - HC-SR04 ultrasonic or Sharp IR sensors
   - One sensor per tool slot or tool zone

3. **Light Break Sensors**
   - IR LED + photodiode pairs
   - Tool blocks the light beam when present
   - Simple and reliable for organized toolboxes

4. **Hall Effect Sensors**
   - Detect magnetic tools
   - Reed switches or linear Hall sensors
   - Good for metal tools (wrenches, hammers, etc.)

5. **Camera + Computer Vision** (Advanced)
   - Raspberry Pi runs image comparison
   - Detects missing tools visually
   - Uses OpenCV for template matching

**Arduino Example (Weight Sensors):**
```cpp
// Arduino code for tool detection via load cells
#include "HX711.h"

#define NUM_TOOLS 10
HX711 scales[NUM_TOOLS];

// Calibrated weight for each tool (in grams)
float tool_weights[NUM_TOOLS] = {350.0, 420.0, 180.0, ...};
float tolerance = 20.0; // ±20g tolerance

void setup() {
  Serial.begin(9600);

  // Initialize each load cell
  for (int i = 0; i < NUM_TOOLS; i++) {
    scales[i].begin(DATA_PIN[i], CLK_PIN[i]);
    scales[i].set_scale(CALIBRATION[i]);
    scales[i].tare();
  }
}

void loop() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');

    if (command == "COUNT") {
      int present = 0;
      for (int i = 0; i < NUM_TOOLS; i++) {
        float weight = scales[i].get_units(5); // Average of 5 readings
        if (abs(weight - tool_weights[i]) < tolerance) {
          present++;
        }
      }
      Serial.println(present);
    }

    if (command == "STATUS") {
      // Send detailed status of each tool slot
      for (int i = 0; i < NUM_TOOLS; i++) {
        float weight = scales[i].get_units(5);
        bool is_present = abs(weight - tool_weights[i]) < tolerance;
        Serial.print(i);
        Serial.print(":");
        Serial.println(is_present ? "PRESENT" : "MISSING");
      }
    }
  }
}
```

**ESP32 Alternative (WiFi-Enabled):**
ESP32 can communicate directly with the cloud API, bypassing the Raspberry Pi:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

// ESP32 with proximity sensors
const int SENSOR_PINS[10] = {2, 4, 5, 18, 19, 21, 22, 23, 25, 26};
String api_url = "https://api.yourcompany.com";
String api_key = "your-api-key";

void sendToolStatus() {
  HTTPClient http;
  String payload = "{\"toolbox_id\":\"TB-001\",\"tools\":[";

  for (int i = 0; i < 10; i++) {
    bool present = digitalRead(SENSOR_PINS[i]) == LOW; // Assuming active-low sensors
    payload += present ? "1" : "0";
    if (i < 9) payload += ",";
  }
  payload += "]}";

  http.begin(api_url + "/api/v1/toolbox/sensor-update");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", api_key);

  int httpCode = http.POST(payload);
  http.end();
}
```

### Communication Protocols

**Raspberry Pi ↔ Backend:**
- Protocol: HTTPS REST API
- Format: JSON
- Authentication: API Key in header
- Frequency: On-demand (when events occur)

**Raspberry Pi ↔ Arduino:**
- Protocol: Serial (UART), I2C, or USB
- Format: Plain text commands or binary protocol
- Baud Rate: Typically 9600 or 115200
- Commands: COUNT, STATUS, RESET, CALIBRATE

**Arduino ↔ Sensors:**
- Digital GPIO (for binary sensors)
- Analog ADC (for load cells via HX711)
- I2C or SPI (for advanced sensors)

### Offline Operation

The Raspberry Pi can operate autonomously when internet is unavailable:

1. **Local Database**: SQLite cache on Pi stores pending access logs
2. **NFC Validation**: Previously synced technician list stored locally
3. **Auto-Sync**: When connection restored, queued logs upload automatically
4. **Conflict Resolution**: Server timestamps used for definitive ordering

### Security Considerations

1. **Physical Security**: Raspberry Pi housed in tamper-evident enclosure
2. **Network Security**: TLS/HTTPS for all API communication
3. **API Key Rotation**: Regular key rotation via environment variables
4. **NFC Cloning Protection**: Server-side validation, rate limiting
5. **Sensor Tampering**: Checksum validation on sensor data

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Python 3.11+ (if running without Docker)

### Option 1: Docker Compose (Recommended)

#### Production Mode (Optimized Build)

1. **Clone the repository**
```bash
cd toolbox_monitor
```

2. **Start the services**
```bash
docker compose up --build
```

3. **Seed the database** (in another terminal)
```bash
docker compose exec backend python seed_data.py
```

4. **Access the application**
- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost/up and http://localhost:8000/up

#### Development Mode (Hot Reload)

For development with hot-reloading and faster iteration:

```bash
docker compose -f docker-compose.dev.yml up
```

Access:
- Frontend (Vite dev server): http://localhost:5173
- Backend API: http://localhost:8000
- Changes to code will automatically reload

### Option 2: Manual Setup

1. **Set up backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Create database and seed data**
```bash
python seed_data.py
```

4. **Run the backend**
```bash
uvicorn app.main:app --reload
```

## Default Credentials

After seeding the database, you can login with:

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Change these credentials in production!**

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token

### Users
- `GET /api/v1/users` - List all users

### Technicians
- `POST /api/v1/technicians` - Create technician
- `GET /api/v1/technicians` - List all technicians
- `GET /api/v1/technicians/by-nfc/{nfc_uid}` - Get technician by NFC card
- `PUT /api/v1/technicians/{id}` - Update technician

### Toolboxes
- `POST /api/v1/toolboxes` - Create toolbox
- `GET /api/v1/toolboxes` - List all toolboxes
- `GET /api/v1/toolboxes/{id}` - Get toolbox details
- `PUT /api/v1/toolboxes/{id}` - Update toolbox

### Access Logs
- `POST /api/v1/access-logs` - Create access log
- `GET /api/v1/access-logs` - List access logs with filters

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics

## Sample API Usage

### Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Get Dashboard Stats
```bash
curl -X GET "http://localhost:8000/api/v1/dashboard/stats"
```

### Create Technician
```bash
curl -X POST "http://localhost:8000/api/v1/technicians" \
  -H "Content-Type: application/json" \
  -d '{
    "nfc_card_uid": "04:A1:B2:C3:D4:E6",
    "employee_id": "12345",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@company.com",
    "department": "Maintenance"
  }'
```

## Project Structure

```
toolbox-monitoring-system/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── core/              # Config & security
│   │   ├── db/                # Database config
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── main.py            # FastAPI app
│   ├── Dockerfile
│   ├── requirements.txt
│   └── seed_data.py
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API client
│   │   ├── store/             # State management
│   │   ├── types/             # TypeScript types
│   │   └── App.tsx            # Main app component
│   ├── Dockerfile             # Production build
│   ├── Dockerfile.dev         # Development build
│   ├── nginx.conf             # Nginx configuration
│   └── package.json
├── data/                       # SQLite database & uploads
│   ├── sqlite/
│   └── uploads/
├── monitools_client.py         # Python API client for Raspberry Pi
├── example_pi_usage.py         # Example Pi integration script
├── pi_requirements.txt         # Pi dependencies
├── docker-compose.yml          # Production compose
├── docker-compose.dev.yml      # Development compose
└── .env.example                # Environment variables template
```

## Database Schema

The system uses 8 main tables:

1. **users** - Dashboard administrators
2. **technicians** - Field technicians with NFC cards
3. **toolboxes** - Toolbox inventory
4. **inventory_items** - Individual tools in toolboxes
5. **access_logs** - Audit trail of access events
6. **images** - Toolbox images
7. **api_request_logs** - API request logging
8. **alerts** - System alerts

## Raspberry Pi Client

### Python API Client Library

A simple, single-file Python library (`monitool_client.py`) is provided for Raspberry Pi integration. This library allows you to easily interact with the Monitool API from your Pi-based NFC reader system.

#### Installation on Raspberry Pi

```bash
# Copy the library to your Pi
scp monitools_client.py pi@your-pi-ip:~/

# Install dependencies
pip3 install -r pi_requirements.txt
```

#### Quick Start

```python
from monitool_client import MonitoolClient

# Initialize client
client = MonitoolClient(
    api_url="https://your-domain.com",
    api_key="your-api-key-here"
)

# Get technician by NFC card UID
technician = client.get_technician_by_nfc("04:A1:B2:C3:D4:E6")
print(f"Welcome, {technician['first_name']}!")

# Log toolbox access
client.log_access(
    toolbox_id="toolbox-123",
    technician_id=technician["id"],
    action_type="open",
    items_before=10,
    notes="Starting work"
)
```

#### Available Functions

**Technician Operations:**
- `get_technician_by_nfc(nfc_uid)` - Get technician by NFC card UID
- `get_all_technicians()` - Get all technicians

**Toolbox Operations:**
- `get_toolbox(toolbox_id)` - Get toolbox information
- `get_all_toolboxes(zone=None, status=None)` - Get all toolboxes with optional filtering

**Access Log Operations:**
- `log_access(...)` - Log toolbox access event (open/close/access_denied)
- `get_access_logs(...)` - Get access logs with filtering

**Image Operations:**
- `upload_image(image_path, subfolder)` - Upload condition image

**Health Check:**
- `health_check()` - Check if API is reachable

#### Complete Example

See `example_pi_usage.py` for a complete example that demonstrates:
- NFC card reading workflow
- Technician identification
- Access logging with item counting
- Condition image upload
- Error handling

```bash
# Run the example
python3 example_pi_usage.py
```

#### Integration with NFC Readers

The library works with popular NFC reader libraries:

**RC522 Example:**
```python
from mfrc522 import SimpleMFRC522
from monitool_client import MonitoolClient

reader = SimpleMFRC522()
client = MonitoolClient(api_url="...", api_key="...")

# Read NFC card
print("Scan your card...")
uid = reader.read_id()

# Identify technician
technician = client.get_technician_by_nfc(uid)
print(f"Access granted: {technician['first_name']}")
```

**PN532 Example:**
```python
from pn532 import PN532_SPI
from monitool_client import MonitoolClient

pn532 = PN532_SPI()
client = MonitoolClient(api_url="...", api_key="...")

# Read NFC card
uid = pn532.read_passive_target()
nfc_uid = ':'.join(['%02X' % i for i in uid])

# Identify technician
technician = client.get_technician_by_nfc(nfc_uid)
```

## Development

### Running Tests
```bash
cd backend
pytest
```

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Code Formatting
```bash
black app/
ruff check app/
```

## Deployment

### Production Features

The production Docker setup includes:
- **Multi-stage builds** - Optimized image sizes
- **Nginx web server** - High-performance static file serving
- **Gzip compression** - Reduced bandwidth usage
- **Security headers** - X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Asset caching** - 1-year cache for static assets
- **Health checks** - Built-in `/up` endpoints for monitoring
- **Optimized builds** - TypeScript compilation and Vite production build

### Security

**API Key Authentication**: All endpoints (except `/up` health check) require an API key to be passed in the `X-API-Key` header. This protects your application from unauthorized access.

To set up:
1. Copy `.env.example` to `.env`
2. Generate a strong API key (e.g., `openssl rand -hex 32`)
3. Set `API_KEY=your-generated-key` in `.env`
4. The same key will be automatically used by both frontend and backend

### Production Checklist
- [ ] **CRITICAL:** Change `API_KEY` in .env to a strong random value
- [ ] Change `SECRET_KEY` in .env
- [ ] Change default admin password
- [ ] Set up HTTPS/TLS (reverse proxy like Caddy/Traefik)
- [ ] Update `VITE_API_URL` build arg to production API URL
- [ ] Configure CORS origins for production domain
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Review and update rate limits
- [ ] Change frontend port from 80 if needed

### Environment Variables

**Root .env file:**
```env
# API Key (required for all requests)
API_KEY=your-generated-api-key-here

# JWT Secret (for user authentication)
SECRET_KEY=your-secret-key-here

# CORS Origins (comma-separated)
BACKEND_CORS_ORIGINS=https://yourdomain.com
```

**Frontend (docker-compose.yml build args):**
```yaml
args:
  - VITE_API_URL=https://api.yourdomain.com
  - VITE_API_KEY=${API_KEY}
```

## Hardware Setup Guide

### Bill of Materials (Per Toolbox)

**Option 1: Basic Setup (Manual Count)**
- 1x Raspberry Pi 4 (4GB or 8GB) - $55-75
- 1x RC522 NFC Reader Module - $5-10
- 1x MicroSD Card (32GB+) - $8-15
- 1x 5V Power Supply (3A) - $10
- 1x Enclosure for Raspberry Pi - $10-20
- Optional: Pi Camera Module - $25-30
- **Total: ~$113-160**

**Option 2: Arduino Sensor Integration**
Add to Option 1:
- 1x Arduino Uno or Nano - $10-25
- 10x Load Cell Sensors (50kg) + HX711 Amplifiers - $30-50
- OR 10x Ultrasonic Sensors (HC-SR04) - $15-25
- OR 10x IR Proximity Sensors - $10-20
- Wiring and connectors - $10-20
- **Total Additional: ~$40-115**

**Option 3: Advanced ESP32 Setup**
- 1x ESP32 DevKit - $8-15
- 1x PN532 NFC Reader - $10-15
- 10x Sensors (your choice) - $20-50
- WiFi network access - existing
- **Total: ~$38-80** (no Raspberry Pi needed)

**Optional Accessories:**
- Electromagnetic lock or servo for automated access - $15-30
- 3.5" Touchscreen display for Pi - $25-35
- Weatherproof enclosure (outdoor use) - $30-50
- Backup battery (UPS for Pi) - $25-40

### Physical Installation

**Typical Toolbox Setup:**

```
┌─────────────────────────────────────────────┐
│  TOOLBOX (Lid Open View)                    │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │  [Tool Slots with Sensors]         │     │
│  │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐         │     │
│  │  │ 1│ │ 2│ │ 3│ │ 4│ │ 5│         │     │
│  │  └──┘ └──┘ └──┘ └──┘ └──┘         │     │
│  │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐         │     │
│  │  │ 6│ │ 7│ │ 8│ │ 9│ │10│         │     │
│  │  └──┘ └──┘ └──┘ └──┘ └──┘         │     │
│  └────────────────────────────────────┘     │
│                                              │
│  Mounted on Lid:                             │
│  ┌─────────────┐  ┌──────────┐              │
│  │ Pi Camera   │  │ Arduino  │              │
│  │   Module    │  │   Board  │              │
│  └─────────────┘  └──────────┘              │
│                                              │
└─────────────────────────────────────────────┘

Mounted on Exterior:
┌──────────────┐  ┌────────────┐
│ Raspberry Pi │  │ NFC Reader │
│  (Enclosure) │  │  (Mounted  │
└──────────────┘  │  on front) │
                  └────────────┘
```

**Wiring:**
1. NFC Reader → Raspberry Pi (SPI or I2C)
2. Pi Camera → Raspberry Pi (CSI port)
3. Arduino → Raspberry Pi (USB cable)
4. Sensors → Arduino (GPIO/Analog pins)
5. Optional Lock → Arduino Relay Module → 12V Power

### Setup Steps

1. **Prepare Raspberry Pi:**
   ```bash
   # On Raspberry Pi
   sudo apt-get update
   sudo apt-get install python3-pip git

   # Clone client code
   git clone https://github.com/yourorg/monitool.git
   cd monitool

   # Install dependencies
   pip3 install -r pi_requirements.txt

   # Configure API credentials
   nano config.json
   # Add: {"api_url": "https://your-server.com", "api_key": "your-key"}
   ```

2. **Flash Arduino:**
   - Open Arduino IDE on development machine
   - Copy sensor sketch from `arduino_examples/weight_sensors.ino`
   - Adjust pin numbers and calibration values
   - Upload to Arduino via USB

3. **Test Integration:**
   ```bash
   # Test NFC reader
   python3 test_nfc.py

   # Test Arduino communication
   python3 test_arduino.py

   # Test API connection
   python3 test_api.py

   # Run full integration test
   python3 test_full_workflow.py
   ```

4. **Deploy Main Script:**
   ```bash
   # Set up as systemd service for auto-start
   sudo cp monitool.service /etc/systemd/system/
   sudo systemctl enable monitool
   sudo systemctl start monitool

   # Check logs
   sudo journalctl -u monitool -f
   ```

## Use Cases

### 1. Construction Company
- **Problem**: Tools worth $50,000+ distributed across 20 job sites
- **Solution**: One toolbox per site with Pi + NFC + camera
- **Result**: 90% reduction in tool loss, complete accountability

### 2. Manufacturing Facility
- **Problem**: Shared tool cribs, unclear who has what tools
- **Solution**: Central toolbox with weight sensors per slot
- **Result**: Real-time inventory, faster tool retrieval

### 3. Maintenance Department
- **Problem**: Mobile technicians, tools left at various locations
- **Solution**: Portable toolboxes with ESP32 + GPS + NFC
- **Result**: Track both technician and toolbox location

### 4. School Workshop
- **Problem**: Students borrow tools, forget to return them
- **Solution**: Student ID cards (NFC) track borrowing
- **Result**: Automatic return reminders, usage statistics

## Roadmap

### Completed
- [x] Backend API with API key authentication
- [x] Database models and migrations
- [x] Core CRUD operations
- [x] Docker Compose setup
- [x] Frontend dashboard with React 19
- [x] Toolbox management CRUD
- [x] Technician logs with access history
- [x] Access log filtering and pagination
- [x] Image upload and display
- [x] Production-ready Docker setup
- [x] Health check endpoints
- [x] Python client library for Raspberry Pi
- [x] Comprehensive hardware integration documentation
- [x] Arduino sensor examples
- [x] ESP32 WiFi integration example
- [x] Multi-sensor support (weight, proximity, IR, Hall effect)

### In Progress
- [ ] Complete Raspberry Pi example scripts
- [ ] Image comparison algorithm for visual tool detection
- [ ] Offline mode with local caching and sync

### Future
- [ ] Pre-built Raspberry Pi image (flash-and-go)
- [ ] Mobile app (React Native) for technicians
- [ ] Real-time WebSocket notifications
- [ ] Advanced analytics and reporting
- [ ] Machine learning for anomaly detection
- [ ] Multi-tenant support for enterprise deployments
- [ ] Cloud deployment templates (AWS/Azure/GCP)
- [ ] Integration with existing ERP/asset management systems
- [ ] GPS tracking for mobile toolboxes
- [ ] Bluetooth beacon support for tool-level tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for efficient toolbox management**
