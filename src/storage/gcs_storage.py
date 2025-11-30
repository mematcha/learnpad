# src/storage/gcs_storage.py
from datetime import timedelta
from google.cloud import storage
from typing import List, Dict, Optional, Any
from pathlib import Path
import os

class GCSStorageService:
    def __init__(self, bucket_name: str, credentials_path: Optional[str] = None):
        """Initialize GCS storage service."""
        if credentials_path:
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
        
        self.client = storage.Client()
        self.bucket = self.client.bucket(bucket_name)
        self.bucket_name = bucket_name
    
    def upload_file(
        self, 
        user_id: str, 
        notebook_id: str, 
        file_path: str, 
        content: str,
        content_type: str = "text/markdown"
    ) -> str:
        """
        Upload a file to GCS.
        
        Args:
            user_id: User identifier
            notebook_id: Notebook identifier
            file_path: Relative path within notebook (e.g., "python_basics/functions.md")
            content: File content
            content_type: MIME type
        
        Returns:
            GCS blob path
        """
        # Construct GCS path
        gcs_path = f"users/{user_id}/notebooks/{notebook_id}/{file_path}"
        
        blob = self.bucket.blob(gcs_path)
        blob.upload_from_string(content, content_type=content_type)
        
        return gcs_path
    
    def download_file(
        self, 
        user_id: str, 
        notebook_id: str, 
        file_path: str
    ) -> str:
        """Download file content from GCS."""
        gcs_path = f"users/{user_id}/notebooks/{notebook_id}/{file_path}"
        blob = self.bucket.blob(gcs_path)
        
        if not blob.exists():
            raise FileNotFoundError(f"File not found: {gcs_path}")
        
        return blob.download_as_text()
    
    def list_files(
        self, 
        user_id: str, 
        notebook_id: str, 
        prefix: str = ""
    ) -> List[Dict[str, Any]]:
        """
        List files in a notebook directory.
        
        Returns tree structure with files and folders.
        """
        base_prefix = f"users/{user_id}/notebooks/{notebook_id}/"
        if prefix:
            base_prefix += prefix.rstrip('/') + '/'
        
        blobs = self.client.list_blobs(
            self.bucket_name,
            prefix=base_prefix,
            delimiter='/'
        )
        
        files = []
        folders = set()
        
        for blob in blobs:
            # Remove base prefix to get relative path
            relative_path = blob.name[len(base_prefix):]
            
            if '/' in relative_path:
                # It's in a subfolder
                folder_name = relative_path.split('/')[0]
                folders.add(folder_name)
            else:
                # It's a file in current directory
                files.append({
                    "name": relative_path,
                    "path": relative_path,
                    "size": blob.size,
                    "updated": blob.updated.isoformat(),
                    "type": "file"
                })
        
        # Add folders
        result = [{"name": f, "path": f, "type": "folder"} for f in folders]
        result.extend(files)
        
        return sorted(result, key=lambda x: (x['type'] == 'file', x['name']))
    
    def get_file_tree(
        self, 
        user_id: str, 
        notebook_id: str
    ) -> Dict[str, Any]:
        """
        Get complete file tree structure for a notebook.
        
        Returns nested tree structure that frontend can render.
        """
        base_prefix = f"users/{user_id}/notebooks/{notebook_id}/"
        
        blobs = self.client.list_blobs(
            self.bucket_name,
            prefix=base_prefix
        )
        
        tree = {}
        
        for blob in blobs:
            # Get relative path
            relative_path = blob.name[len(base_prefix):]
            parts = relative_path.split('/')
            
            # Build nested structure
            current = tree
            for i, part in enumerate(parts):
                if i == len(parts) - 1:
                    # It's a file
                    current[part] = {
                        "type": "file",
                        "path": relative_path,
                        "size": blob.size,
                        "updated": blob.updated.isoformat()
                    }
                else:
                    # It's a folder
                    if part not in current:
                        current[part] = {
                            "type": "folder",
                            "path": '/'.join(parts[:i+1]),
                            "children": {}
                        }
                    current = current[part]["children"]
        
        return tree
    
    def delete_file(
        self, 
        user_id: str, 
        notebook_id: str, 
        file_path: str
    ) -> bool:
        """Delete a file from GCS."""
        gcs_path = f"users/{user_id}/notebooks/{notebook_id}/{file_path}"
        blob = self.bucket.blob(gcs_path)
        
        if blob.exists():
            blob.delete()
            return True
        return False
    
    def generate_signed_url(
        self, 
        user_id: str, 
        notebook_id: str, 
        file_path: str,
        expiration_minutes: int = 60
    ) -> str:
        """
        Generate a signed URL for temporary frontend access.
        
        Useful for direct file access from frontend without backend proxy.
        """
        gcs_path = f"users/{user_id}/notebooks/{notebook_id}/{file_path}"
        blob = self.bucket.blob(gcs_path)
        
        url = blob.generate_signed_url(
            expiration=timedelta(minutes=expiration_minutes),
            method='GET'
        )
        
        return url