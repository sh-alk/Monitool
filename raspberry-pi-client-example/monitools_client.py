"""
Monitools API Client
A simple Python client for interacting with the Monitools API from Raspberry Pi

Usage:
    from monitools_client import MonitoulsClient

    # Initialize client
    client = MonitoolsClient(
        api_url="https://your-domain.com",
        api_key="your-api-key-here"
    )

    # Get technician by NFC card
    technician = client.get_technician_by_nfc("04:A1:B2:C3:D4:E6")

    # Log toolbox access
    client.log_access(
        toolbox_id="toolbox-123",
        technician_id=technician["id"],
        action_type="open",
        items_before=10,
        items_after=9,
        notes="Took hammer for repair"
    )
"""

import requests
from typing import Optional, Dict, Any, List
from datetime import datetime


class MonitoolsClient:
    """Simple client for Monitools API"""

    def __init__(self, api_url: str, api_key: str, timeout: int = 10):
        """
        Initialize the Monitools API client

        Args:
            api_url: Base URL of the API (e.g., "https://your-domain.com" or "http://192.168.1.100:8000")
            api_key: API key for authentication
            timeout: Request timeout in seconds (default: 10)
        """
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        files: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Internal method to make HTTP requests

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint (e.g., "/api/v1/technicians")
            data: JSON data to send (optional)
            files: Files to upload (optional)

        Returns:
            Response data as dictionary

        Raises:
            Exception: If request fails
        """
        url = f"{self.api_url}{endpoint}"

        try:
            headers = self.headers.copy()
            if files:
                # Remove Content-Type for multipart/form-data
                headers.pop('Content-Type', None)

            response = requests.request(
                method=method,
                url=url,
                json=data if not files else None,
                data=data if files and not data else None,
                files=files,
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            error_detail = "Unknown error"
            try:
                error_detail = e.response.json().get('detail', str(e))
            except:
                error_detail = str(e)
            raise Exception(f"API Error ({e.response.status_code}): {error_detail}")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Request failed: {str(e)}")

    # ==================== TECHNICIAN OPERATIONS ====================

    def get_technician_by_nfc(self, nfc_uid: str) -> Dict[str, Any]:
        """
        Get technician information by NFC card UID

        Args:
            nfc_uid: NFC card UID (e.g., "04:A1:B2:C3:D4:E6")

        Returns:
            Technician data dictionary with keys: id, nfc_card_uid, employee_id,
            first_name, last_name, email, phone, department, status, created_at

        Example:
            technician = client.get_technician_by_nfc("04:A1:B2:C3:D4:E6")
            print(f"Technician: {technician['first_name']} {technician['last_name']}")
        """
        return self._make_request('GET', f'/api/v1/technicians/by-nfc/{nfc_uid}')

    def get_all_technicians(self) -> List[Dict[str, Any]]:
        """
        Get all technicians

        Returns:
            List of technician dictionaries
        """
        return self._make_request('GET', '/api/v1/technicians')

    # ==================== TOOLBOX OPERATIONS ====================

    def get_toolbox(self, toolbox_id: str) -> Dict[str, Any]:
        """
        Get toolbox information by ID

        Args:
            toolbox_id: Toolbox ID

        Returns:
            Toolbox data dictionary
        """
        return self._make_request('GET', f'/api/v1/toolboxes/{toolbox_id}')

    def get_all_toolboxes(self, zone: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all toolboxes with optional filtering

        Args:
            zone: Filter by zone (optional)
            status: Filter by status (optional)

        Returns:
            List of toolbox dictionaries
        """
        params = {}
        if zone:
            params['zone'] = zone
        if status:
            params['status'] = status

        endpoint = '/api/v1/toolboxes'
        if params:
            query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
            endpoint = f"{endpoint}?{query_string}"

        return self._make_request('GET', endpoint)

    # ==================== ACCESS LOG OPERATIONS ====================

    def log_access(
        self,
        toolbox_id: str,
        technician_id: str,
        action_type: str,
        items_before: Optional[int] = None,
        items_after: Optional[int] = None,
        items_missing: int = 0,
        missing_items_list: Optional[str] = None,
        notes: Optional[str] = None,
        condition_image_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Log a toolbox access event

        Args:
            toolbox_id: ID of the toolbox being accessed
            technician_id: ID of the technician accessing the toolbox
            action_type: Type of action ("open", "close", "access_denied")
            items_before: Number of items before action (optional)
            items_after: Number of items after action (optional)
            items_missing: Number of missing items (default: 0)
            missing_items_list: Comma-separated list of missing items (optional)
            notes: Additional notes (optional)
            condition_image_path: Path to condition image file on local filesystem (optional)

        Returns:
            Created access log data

        Example:
            # Log toolbox opening
            log = client.log_access(
                toolbox_id="tb-001",
                technician_id=technician["id"],
                action_type="open",
                items_before=10,
                notes="Beginning maintenance work"
            )

            # Log toolbox closing with missing item
            log = client.log_access(
                toolbox_id="tb-001",
                technician_id=technician["id"],
                action_type="close",
                items_before=10,
                items_after=9,
                items_missing=1,
                missing_items_list="Hammer (18oz)",
                notes="Took hammer for repair work"
            )
        """
        # Upload image if provided
        condition_image_url = None
        if condition_image_path:
            try:
                image_result = self.upload_image(condition_image_path, subfolder='access-logs')
                condition_image_url = image_result['file_path']
            except Exception as e:
                print(f"Warning: Failed to upload condition image: {e}")

        # Create access log data
        log_data = {
            'toolbox_id': toolbox_id,
            'technician_id': technician_id,
            'action_type': action_type,
            'items_missing': items_missing
        }

        # Add optional fields
        if items_before is not None:
            log_data['items_before'] = items_before
        if items_after is not None:
            log_data['items_after'] = items_after
        if missing_items_list:
            log_data['missing_items_list'] = missing_items_list
        if notes:
            log_data['notes'] = notes
        if condition_image_url:
            log_data['condition_image_url'] = condition_image_url

        return self._make_request('POST', '/api/v1/access-logs', data=log_data)

    def get_access_logs(
        self,
        toolbox_id: Optional[str] = None,
        technician_id: Optional[str] = None,
        limit: int = 50,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get access logs with optional filtering

        Args:
            toolbox_id: Filter by toolbox ID (optional)
            technician_id: Filter by technician ID (optional)
            limit: Maximum number of logs to return (default: 50)
            skip: Number of logs to skip (default: 0)

        Returns:
            List of access log dictionaries
        """
        params = {'limit': limit, 'skip': skip}
        if toolbox_id:
            params['toolbox_id'] = toolbox_id
        if technician_id:
            params['technician_id'] = technician_id

        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        endpoint = f'/api/v1/access-logs?{query_string}'

        return self._make_request('GET', endpoint)

    # ==================== IMAGE OPERATIONS ====================

    def upload_image(self, image_path: str, subfolder: str = 'toolboxes') -> Dict[str, Any]:
        """
        Upload an image file

        Args:
            image_path: Path to image file on local filesystem
            subfolder: Subfolder to store image in ('toolboxes' or 'access-logs')

        Returns:
            Upload result with keys: filename, file_path, file_size, content_type

        Example:
            result = client.upload_image('/tmp/toolbox_photo.jpg', subfolder='toolboxes')
            print(f"Image uploaded: {result['file_path']}")
        """
        try:
            with open(image_path, 'rb') as f:
                files = {
                    'file': (image_path.split('/')[-1], f, 'image/jpeg')
                }
                data = {'subfolder': subfolder}
                return self._make_request('POST', '/api/v1/images/upload', data=data, files=files)
        except FileNotFoundError:
            raise Exception(f"Image file not found: {image_path}")
        except Exception as e:
            raise Exception(f"Failed to upload image: {str(e)}")

    # ==================== HEALTH CHECK ====================

    def health_check(self) -> bool:
        """
        Check if API is healthy

        Returns:
            True if API is healthy, False otherwise

        Example:
            if client.health_check():
                print("API is healthy")
            else:
                print("API is down")
        """
        try:
            response = requests.get(
                f"{self.api_url}/up",
                timeout=self.timeout
            )
            return response.status_code == 200
        except:
            return False


# ==================== CONVENIENCE FUNCTIONS ====================

def create_client(api_url: str, api_key: str) -> MonitoolsClient:
    """
    Create a new Monitools API client

    Args:
        api_url: Base URL of the API
        api_key: API key for authentication

    Returns:
        MonitoolsClient instance
    """
    return MonitoolsClient(api_url, api_key)


# ==================== EXAMPLE USAGE ====================

if __name__ == "__main__":
    # Example usage

    # Initialize client
    client = MonitoolsClient(
        api_url="http://localhost:8000",
        api_key="your-api-key-change-this-in-production"
    )

    # Check API health
    print("Checking API health...")
    if client.health_check():
        print("✓ API is healthy")
    else:
        print("✗ API is down")
        exit(1)

    # Get technician by NFC card
    print("\nGetting technician by NFC card...")
    try:
        technician = client.get_technician_by_nfc("04:A1:B2:C3:D4:E6")
        print(f"✓ Found technician: {technician['first_name']} {technician['last_name']}")
        print(f"  Employee ID: {technician['employee_id']}")
        print(f"  Department: {technician.get('department', 'N/A')}")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Get all toolboxes
    print("\nGetting all toolboxes...")
    try:
        toolboxes = client.get_all_toolboxes()
        print(f"✓ Found {len(toolboxes)} toolboxes")
        if toolboxes:
            toolbox = toolboxes[0]
            print(f"  First toolbox: {toolbox['name']} (Zone: {toolbox.get('zone', 'N/A')})")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Log access event
    print("\nLogging access event...")
    try:
        if 'technician' in locals() and 'toolbox' in locals():
            log = client.log_access(
                toolbox_id=toolbox['id'],
                technician_id=technician['id'],
                action_type="open",
                items_before=10,
                notes="Test access from Python client"
            )
            print(f"✓ Access logged successfully")
            print(f"  Log ID: {log['id']}")
            print(f"  Timestamp: {log['timestamp']}")
    except Exception as e:
        print(f"✗ Error: {e}")

    print("\n" + "="*50)
    print("Example usage completed!")
