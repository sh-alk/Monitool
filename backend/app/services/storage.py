"""
Local file storage service for images
"""
import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
from app.core.config import settings


class StorageService:
    """Service for handling file uploads and storage"""

    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save_image(self, file: UploadFile, subfolder: str = "toolboxes") -> tuple[str, int]:
        """
        Save an uploaded image file

        Returns:
            tuple: (file_path, file_size)
        """
        # Generate unique filename
        file_extension = Path(file.filename).suffix if file.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_extension}"

        # Create subfolder if needed
        subfolder_path = self.upload_dir / subfolder
        subfolder_path.mkdir(parents=True, exist_ok=True)

        # Full file path
        file_path = subfolder_path / unique_filename

        # Save file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        # Return relative path and size
        relative_path = f"/uploads/{subfolder}/{unique_filename}"
        file_size = len(contents)

        return relative_path, file_size

    def delete_image(self, file_path: str) -> bool:
        """
        Delete an image file

        Args:
            file_path: Relative path like "/uploads/toolboxes/xxx.jpg"

        Returns:
            bool: True if deleted, False if not found
        """
        try:
            # Convert relative path to absolute
            if file_path.startswith("/uploads/"):
                file_path = file_path[len("/uploads/"):]

            full_path = self.upload_dir / file_path

            if full_path.exists():
                full_path.unlink()
                return True
            return False
        except Exception:
            return False

    def get_file_path(self, relative_path: str) -> Optional[Path]:
        """
        Get absolute file path from relative path

        Args:
            relative_path: Like "/uploads/toolboxes/xxx.jpg"

        Returns:
            Path object or None if not found
        """
        if relative_path.startswith("/uploads/"):
            relative_path = relative_path[len("/uploads/"):]

        full_path = self.upload_dir / relative_path

        if full_path.exists():
            return full_path
        return None


# Singleton instance
storage_service = StorageService()
