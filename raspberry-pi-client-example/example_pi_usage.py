#!/usr/bin/env python3
"""
Example Raspberry Pi Usage Script
Demonstrates how to use the Monitools client for NFC-based toolbox access logging

This script simulates a typical workflow:
1. Read NFC card
2. Identify technician
3. Log toolbox access
4. Optionally capture and upload condition image
"""

from monitools_client import MonitoolsClient
import time

# Configuration
API_URL = "http://192.168.1.100:8000"  # Change to your API URL
API_KEY = "your-api-key-here"           # Change to your API key
TOOLBOX_ID = "your-toolbox-id"          # Your toolbox ID

# Initialize client
client = MonitoolsClient(api_url=API_URL, api_key=API_KEY)


def simulate_nfc_read():
    """Simulate NFC card read (replace with actual NFC reader code)"""
    # In real implementation, use your NFC reader library
    # Example with RC522:
    # from mfrc522 import SimpleMFRC522
    # reader = SimpleMFRC522()
    # uid = reader.read_id()
    # return uid

    return "04:A1:B2:C3:D4:E6"  # Simulated NFC UID


def capture_image():
    """Capture image from camera (optional)"""
    # In real implementation, use picamera or similar
    # from picamera import PiCamera
    # camera = PiCamera()
    # camera.capture('/tmp/toolbox_condition.jpg')
    # return '/tmp/toolbox_condition.jpg'

    return None  # No image for this example


def handle_toolbox_open():
    """Handle toolbox opening event"""
    print("="*50)
    print("TOOLBOX ACCESS - OPENING")
    print("="*50)

    # 1. Check API connection
    print("\n[1/4] Checking API connection...")
    if not client.health_check():
        print("✗ ERROR: Cannot connect to API")
        return False
    print("✓ API connection OK")

    # 2. Read NFC card
    print("\n[2/4] Waiting for NFC card...")
    nfc_uid = simulate_nfc_read()
    print(f"✓ NFC card detected: {nfc_uid}")

    # 3. Identify technician
    print("\n[3/4] Identifying technician...")
    try:
        technician = client.get_technician_by_nfc(nfc_uid)
        print(f"✓ Technician: {technician['first_name']} {technician['last_name']}")
        print(f"  Employee ID: {technician['employee_id']}")
        print(f"  Department: {technician.get('department', 'N/A')}")
    except Exception as e:
        print(f"✗ ERROR: {e}")
        print("  Access DENIED - Unknown technician")

        # Log access denied
        try:
            client.log_access(
                toolbox_id=TOOLBOX_ID,
                technician_id="unknown",
                action_type="access_denied",
                notes=f"Unknown NFC card: {nfc_uid}"
            )
        except:
            pass

        return False

    # 4. Log toolbox opening
    print("\n[4/4] Logging toolbox access...")
    try:
        # Get current item count (from toolbox)
        toolbox = client.get_toolbox(TOOLBOX_ID)
        items_before = toolbox.get('total_items', 0)

        # Capture condition image (optional)
        image_path = capture_image()

        # Log the access
        log = client.log_access(
            toolbox_id=TOOLBOX_ID,
            technician_id=technician['id'],
            action_type="open",
            items_before=items_before,
            condition_image_path=image_path,
            notes="Toolbox opened"
        )

        print(f"✓ Access logged (ID: {log['id']})")
        print(f"  Timestamp: {log['timestamp']}")
        print(f"  Items in toolbox: {items_before}")

        # Store info for closing event
        with open('/tmp/monitools_session.txt', 'w') as f:
            f.write(f"{technician['id']}|{items_before}")

    except Exception as e:
        print(f"✗ ERROR: Failed to log access: {e}")
        return False

    print("\n" + "="*50)
    print("TOOLBOX UNLOCKED - Access granted")
    print("="*50)
    return True


def handle_toolbox_close():
    """Handle toolbox closing event"""
    print("="*50)
    print("TOOLBOX ACCESS - CLOSING")
    print("="*50)

    # 1. Check API connection
    print("\n[1/5] Checking API connection...")
    if not client.health_check():
        print("✗ ERROR: Cannot connect to API")
        return False
    print("✓ API connection OK")

    # 2. Read NFC card
    print("\n[2/5] Waiting for NFC card...")
    nfc_uid = simulate_nfc_read()
    print(f"✓ NFC card detected: {nfc_uid}")

    # 3. Identify technician
    print("\n[3/5] Identifying technician...")
    try:
        technician = client.get_technician_by_nfc(nfc_uid)
        print(f"✓ Technician: {technician['first_name']} {technician['last_name']}")
    except Exception as e:
        print(f"✗ ERROR: {e}")
        return False

    # 4. Read session data
    print("\n[4/5] Reading session data...")
    try:
        with open('/tmp/monitools_session.txt', 'r') as f:
            session_data = f.read().strip().split('|')
            session_tech_id = session_data[0]
            items_before = int(session_data[1])
        print(f"✓ Session data loaded (items before: {items_before})")
    except:
        print("! Warning: No session data found, using defaults")
        items_before = 0

    # 5. Count items and log closure
    print("\n[5/5] Counting items and logging closure...")
    try:
        # In real implementation, count items using sensors/camera
        # For now, simulate user input
        print("\nHow many items are in the toolbox now?")
        print(f"(Was: {items_before} items)")
        items_after = items_before  # Simulate no missing items

        items_missing = max(0, items_before - items_after)

        # Capture condition image
        image_path = capture_image()

        # Prepare notes
        notes = "Toolbox closed"
        missing_items = None

        if items_missing > 0:
            print(f"! WARNING: {items_missing} items missing!")
            missing_items = "Unknown items"  # In real app, identify which items
            notes = f"{items_missing} items missing"

        # Log the closure
        log = client.log_access(
            toolbox_id=TOOLBOX_ID,
            technician_id=technician['id'],
            action_type="close",
            items_before=items_before,
            items_after=items_after,
            items_missing=items_missing,
            missing_items_list=missing_items,
            condition_image_path=image_path,
            notes=notes
        )

        print(f"✓ Closure logged (ID: {log['id']})")
        print(f"  Items before: {items_before}")
        print(f"  Items after: {items_after}")
        print(f"  Missing: {items_missing}")

        # Clean up session
        try:
            import os
            os.remove('/tmp/monitools_session.txt')
        except:
            pass

    except Exception as e:
        print(f"✗ ERROR: Failed to log closure: {e}")
        return False

    print("\n" + "="*50)
    print("TOOLBOX LOCKED - Thank you")
    print("="*50)
    return True


def main():
    """Main entry point"""
    print("\nMonitools Raspberry Pi Client")
    print("="*50)

    # Test API connection
    print("\nTesting API connection...")
    if not client.health_check():
        print("✗ ERROR: Cannot connect to API at", API_URL)
        print("  Please check:")
        print("  1. API URL is correct")
        print("  2. API is running")
        print("  3. Network connection is working")
        return

    print(f"✓ Connected to API at {API_URL}")

    # Simulate toolbox opening
    print("\n\n" + "="*50)
    print("Simulating toolbox OPEN event...")
    print("="*50)
    time.sleep(1)
    handle_toolbox_open()

    # Wait a bit
    print("\n\nWaiting 3 seconds...")
    time.sleep(3)

    # Simulate toolbox closing
    print("\n\n" + "="*50)
    print("Simulating toolbox CLOSE event...")
    print("="*50)
    time.sleep(1)
    handle_toolbox_close()


if __name__ == "__main__":
    main()
