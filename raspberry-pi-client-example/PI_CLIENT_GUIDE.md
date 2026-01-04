# Monitools Raspberry Pi Client - Quick Reference

## Installation

```bash
# Copy files to your Raspberry Pi
scp monitools_client.py pi@your-pi-ip:~/
scp example_pi_usage.py pi@your-pi-ip:~/
scp pi_requirements.txt pi@your-pi-ip:~/

# SSH into your Pi
ssh pi@your-pi-ip

# Install dependencies
pip3 install -r pi_requirements.txt
```

## Basic Usage

### 1. Import and Initialize

```python
from monitools_client import MonitoolsClient

client = MonitoolsClient(
    api_url="https://your-domain.com",  # or http://192.168.1.100:8000
    api_key="your-api-key-here"
)
```

### 2. Check API Connection

```python
if client.health_check():
    print("API is reachable")
else:
    print("Cannot connect to API")
```

### 3. Get Technician by NFC Card

```python
try:
    technician = client.get_technician_by_nfc("04:A1:B2:C3:D4:E6")
    print(f"Welcome, {technician['first_name']} {technician['last_name']}!")
    print(f"Employee ID: {technician['employee_id']}")
except Exception as e:
    print(f"Error: {e}")
    # Unknown technician - deny access
```

### 4. Log Toolbox Opening

```python
log = client.log_access(
    toolbox_id="your-toolbox-id",
    technician_id=technician["id"],
    action_type="open",
    items_before=10,
    notes="Toolbox opened"
)
print(f"Access logged: {log['id']}")
```

### 5. Log Toolbox Closing

```python
log = client.log_access(
    toolbox_id="your-toolbox-id",
    technician_id=technician["id"],
    action_type="close",
    items_before=10,
    items_after=9,
    items_missing=1,
    missing_items_list="Hammer (18oz)",
    notes="Returned toolbox with 1 missing item"
)
```

### 6. Upload Condition Image

```python
# Capture image with camera first
# Then upload it
result = client.upload_image(
    image_path="/tmp/toolbox_photo.jpg",
    subfolder="access-logs"
)
print(f"Image uploaded: {result['file_path']}")

# Or upload with access log in one call
log = client.log_access(
    toolbox_id="your-toolbox-id",
    technician_id=technician["id"],
    action_type="close",
    condition_image_path="/tmp/toolbox_photo.jpg"  # Automatically uploads
)
```

## Complete Workflow Example

```python
from monitools_client import MonitoolsClient

# Configuration
API_URL = "http://192.168.1.100:8000"
API_KEY = "your-api-key-here"
TOOLBOX_ID = "your-toolbox-id"

# Initialize
client = MonitoolsClient(api_url=API_URL, api_key=API_KEY)

# Check connection
if not client.health_check():
    print("ERROR: Cannot connect to API")
    exit(1)

# Read NFC card (using your NFC library)
nfc_uid = read_nfc_card()  # Your NFC reading function

# Identify technician
try:
    technician = client.get_technician_by_nfc(nfc_uid)
    print(f"✓ Access granted: {technician['first_name']}")
except:
    print("✗ Access denied: Unknown technician")
    # Log denied access
    client.log_access(
        toolbox_id=TOOLBOX_ID,
        technician_id="unknown",
        action_type="access_denied",
        notes=f"Unknown NFC card: {nfc_uid}"
    )
    exit(1)

# Unlock toolbox and log access
log = client.log_access(
    toolbox_id=TOOLBOX_ID,
    technician_id=technician["id"],
    action_type="open",
    notes="Toolbox opened"
)

print(f"Toolbox unlocked! Log ID: {log['id']}")
```

## Integration with NFC Readers

### RC522 (SPI)

```python
from mfrc522 import SimpleMFRC522
from monitools_client import MonitoolsClient

reader = SimpleMFRC522()
client = MonitoolsClient(api_url="...", api_key="...")

while True:
    print("Scan your NFC card...")
    uid = reader.read_id()

    try:
        technician = client.get_technician_by_nfc(uid)
        print(f"Welcome, {technician['first_name']}!")
        # Unlock toolbox...
    except Exception as e:
        print(f"Access denied: {e}")
```

### PN532 (I2C/SPI)

```python
from pn532 import PN532_I2C
from monitools_client import MonitoolsClient

pn532 = PN532_I2C()
client = MonitoolsClient(api_url="...", api_key="...")

while True:
    print("Scan your NFC card...")
    uid = pn532.read_passive_target()

    if uid:
        nfc_uid = ':'.join(['%02X' % i for i in uid])

        try:
            technician = client.get_technician_by_nfc(nfc_uid)
            print(f"Welcome, {technician['first_name']}!")
            # Unlock toolbox...
        except Exception as e:
            print(f"Access denied: {e}")
```

## API Client Reference

### MonitoolsClient Methods

#### Initialization
```python
client = MonitoolsClient(api_url: str, api_key: str, timeout: int = 10)
```

#### Technician Operations
```python
# Get by NFC card UID
technician = client.get_technician_by_nfc(nfc_uid: str)

# Get all technicians
technicians = client.get_all_technicians()
```

#### Toolbox Operations
```python
# Get specific toolbox
toolbox = client.get_toolbox(toolbox_id: str)

# Get all toolboxes
toolboxes = client.get_all_toolboxes(zone: str = None, status: str = None)
```

#### Access Log Operations
```python
# Log access
log = client.log_access(
    toolbox_id: str,
    technician_id: str,
    action_type: str,  # "open", "close", or "access_denied"
    items_before: int = None,
    items_after: int = None,
    items_missing: int = 0,
    missing_items_list: str = None,
    notes: str = None,
    condition_image_path: str = None
)

# Get access logs
logs = client.get_access_logs(
    toolbox_id: str = None,
    technician_id: str = None,
    limit: int = 50,
    skip: int = 0
)
```

#### Image Operations
```python
# Upload image
result = client.upload_image(
    image_path: str,
    subfolder: str = "toolboxes"  # or "access-logs"
)
```

#### Health Check
```python
# Check API health
is_healthy = client.health_check()
```

## Error Handling

All methods raise exceptions on error. Always wrap in try-except:

```python
try:
    technician = client.get_technician_by_nfc(nfc_uid)
    # Success
except Exception as e:
    print(f"Error: {e}")
    # Handle error (deny access, log error, etc.)
```

## Common Patterns

### Pattern 1: Simple Open/Close

```python
# On toolbox open
client.log_access(
    toolbox_id=TOOLBOX_ID,
    technician_id=tech_id,
    action_type="open"
)

# On toolbox close
client.log_access(
    toolbox_id=TOOLBOX_ID,
    technician_id=tech_id,
    action_type="close"
)
```

### Pattern 2: Item Counting

```python
# Store item count when opening
toolbox = client.get_toolbox(TOOLBOX_ID)
items_before = toolbox['total_items']

# Log opening
client.log_access(
    toolbox_id=TOOLBOX_ID,
    technician_id=tech_id,
    action_type="open",
    items_before=items_before
)

# Count items when closing
items_after = count_items()  # Your counting logic

# Log closing
client.log_access(
    toolbox_id=TOOLBOX_ID,
    technician_id=tech_id,
    action_type="close",
    items_before=items_before,
    items_after=items_after,
    items_missing=items_before - items_after
)
```

### Pattern 3: With Camera

```python
from picamera import PiCamera

camera = PiCamera()

# Capture condition image
camera.capture('/tmp/condition.jpg')

# Upload with access log
client.log_access(
    toolbox_id=TOOLBOX_ID,
    technician_id=tech_id,
    action_type="close",
    condition_image_path='/tmp/condition.jpg'  # Auto-uploads
)
```

## Troubleshooting

### Cannot connect to API
```python
if not client.health_check():
    print("Cannot connect to API")
    # Check:
    # 1. API URL is correct
    # 2. API is running
    # 3. Network connection
    # 4. Firewall settings
```

### Invalid API key
```
Error: API Error (401): Invalid or missing API key
```
- Check that your API_KEY matches the one in the backend `.env` file

### Technician not found
```
Error: API Error (404): Technician not found
```
- The NFC card UID is not registered in the system
- Add the technician through the web dashboard first

### Image upload fails
```
Error: Failed to upload image: ...
```
- Check that the image file exists
- Verify file permissions
- Ensure API has write access to uploads directory

## Running the Example

```bash
# Edit the example script with your settings
nano example_pi_usage.py

# Update these variables:
# API_URL = "http://your-api-url:8000"
# API_KEY = "your-api-key"
# TOOLBOX_ID = "your-toolbox-id"

# Run the example
python3 example_pi_usage.py
```

## Tips

1. **Store config in a file**: Don't hardcode API keys
   ```python
   import json
   with open('config.json') as f:
       config = json.load(f)
   client = MonitoolsClient(api_url=config['api_url'], api_key=config['api_key'])
   ```

2. **Handle network issues**: Retry logic
   ```python
   import time

   for attempt in range(3):
       try:
           technician = client.get_technician_by_nfc(uid)
           break
       except Exception as e:
           if attempt < 2:
               time.sleep(1)
           else:
               print("Failed after 3 attempts")
   ```

3. **Cache responses**: Reduce API calls
   ```python
   # Cache technicians for 5 minutes
   cached_technicians = {}

   if uid in cached_technicians:
       technician = cached_technicians[uid]
   else:
       technician = client.get_technician_by_nfc(uid)
       cached_technicians[uid] = technician
   ```

4. **Log locally if offline**: Queue for later sync
   ```python
   import queue

   log_queue = queue.Queue()

   try:
       client.log_access(...)
   except:
       # Save to queue for later
       log_queue.put({...})
   ```

## Support

For issues with the Python client library, refer to the main README or open an issue on GitHub.
