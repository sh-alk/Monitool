"""
Seed database with sample data for testing
"""
import sys
sys.path.append('.')

from app.db.session import SessionLocal, Base, engine
from app.models import User, Technician, Toolbox, AccessLog, InventoryItem
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import random

# Create all tables
Base.metadata.create_all(bind=engine)

def seed_database():
    """Seed the database with sample data"""
    db = SessionLocal()

    try:
        # Create admin user
        admin = User(
            username="admin",
            email="admin@toolbox.com",
            password_hash=get_password_hash("admin123"),
            full_name="Admin User",
            role="admin",
            is_active=True,
        )
        db.add(admin)

        # Create technicians
        technicians_data = [
            {
                "nfc_card_uid": "04:A1:B2:C3:D4:E5",
                "employee_id": "8821",
                "first_name": "Sarah",
                "last_name": "Jenkins",
                "email": "sarah.jenkins@company.com",
                "department": "Maintenance",
            },
            {
                "nfc_card_uid": "04:F1:F2:F3:F4:F5",
                "employee_id": "9942",
                "first_name": "Mike",
                "last_name": "Ross",
                "email": "mike.ross@company.com",
                "department": "Operations",
            },
            {
                "nfc_card_uid": "04:D1:D2:D3:D4:D5",
                "employee_id": "1024",
                "first_name": "David",
                "last_name": "Kim",
                "email": "david.kim@company.com",
                "department": "Maintenance",
            },
            {
                "nfc_card_uid": "04:E1:E2:E3:E4:E5",
                "employee_id": "5521",
                "first_name": "Jenny",
                "last_name": "Lee",
                "email": "jenny.lee@company.com",
                "department": "Operations",
            },
        ]

        technicians = []
        for tech_data in technicians_data:
            tech = Technician(**tech_data)
            db.add(tech)
            technicians.append(tech)

        # Create toolboxes
        toolboxes_data = [
            {
                "name": "TBX-Alpha-01",
                "zone": "Zone A",
                "location_description": "Main warehouse, row 3",
                "total_items": 50,
                "status": "operational",
            },
            {
                "name": "TBX-Beta-04",
                "zone": "Zone B",
                "location_description": "Assembly line 2",
                "total_items": 32,
                "status": "operational",
            },
            {
                "name": "TBX-Delta-12",
                "zone": "Zone C",
                "location_description": "Maintenance room",
                "total_items": 100,
                "status": "operational",
            },
            {
                "name": "TBX-Echo-09",
                "zone": "Zone A",
                "location_description": "Main warehouse, row 7",
                "total_items": 15,
                "status": "operational",
            },
        ]

        toolboxes = []
        for tb_data in toolboxes_data:
            tb = Toolbox(**tb_data)
            db.add(tb)
            toolboxes.append(tb)

        db.commit()

        # Create inventory items for first toolbox
        inventory_items = [
            {"item_name": "Wrench 10mm", "quantity": 1},
            {"item_name": "Screwdriver Set", "quantity": 1},
            {"item_name": "Hammer", "quantity": 2},
            {"item_name": "Pliers", "quantity": 3},
            {"item_name": "Tape Measure", "quantity": 1},
        ]

        for item_data in inventory_items:
            item = InventoryItem(
                toolbox_id=toolboxes[0].id,
                **item_data,
                status="present"
            )
            db.add(item)

        # Create access logs
        access_logs_data = [
            {
                "toolbox": toolboxes[0],
                "technician": technicians[0],
                "action_type": "open",
                "items_before": 50,
                "items_after": 49,
                "items_missing": 1,
                "missing_items_list": "Wrench 10mm",
                "timestamp": datetime.utcnow() - timedelta(hours=2),
            },
            {
                "toolbox": toolboxes[1],
                "technician": technicians[1],
                "action_type": "open",
                "items_before": 32,
                "items_after": 32,
                "items_missing": 0,
                "timestamp": datetime.utcnow() - timedelta(hours=5),
            },
            {
                "toolbox": toolboxes[2],
                "technician": technicians[2],
                "action_type": "open",
                "items_before": 100,
                "items_after": 100,
                "items_missing": 0,
                "timestamp": datetime.utcnow() - timedelta(hours=7),
            },
            {
                "toolbox": toolboxes[3],
                "technician": technicians[3],
                "action_type": "open",
                "items_before": 15,
                "items_after": 12,
                "items_missing": 3,
                "missing_items_list": "Hammer, Screwdriver Set, Pliers",
                "timestamp": datetime.utcnow() - timedelta(hours=8),
            },
        ]

        for log_data in access_logs_data:
            log = AccessLog(
                toolbox_id=log_data["toolbox"].id,
                technician_id=log_data["technician"].id,
                action_type=log_data["action_type"],
                items_before=log_data["items_before"],
                items_after=log_data["items_after"],
                items_missing=log_data["items_missing"],
                missing_items_list=log_data.get("missing_items_list", ""),
                timestamp=log_data["timestamp"],
            )
            db.add(log)

        db.commit()

        print("✅ Database seeded successfully!")
        print("\n📊 Created:")
        print(f"  - 1 Admin user (username: admin, password: admin123)")
        print(f"  - {len(technicians)} Technicians")
        print(f"  - {len(toolboxes)} Toolboxes")
        print(f"  - {len(inventory_items)} Inventory items")
        print(f"  - {len(access_logs_data)} Access logs")
        print("\n🚀 You can now start the backend and login with admin/admin123")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
