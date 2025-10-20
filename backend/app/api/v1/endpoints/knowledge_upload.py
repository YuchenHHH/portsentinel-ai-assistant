import os
import sys
import shutil
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

# Add the rag_module to the path
rag_module_path = os.path.join(os.path.dirname(__file__), '../../../../../modules/rag_module')
if rag_module_path not in sys.path:
    sys.path.append(rag_module_path)

# Import the transfer function with error handling
try:
    from transfer import load_and_structure_knowledge_base
except ImportError as e:
    print(f"Warning: Could not import transfer functions: {e}")
    # Create a fallback function
    def load_and_structure_knowledge_base(docx_path: str):
        raise HTTPException(
            status_code=500,
            detail="Knowledge processing module not available. Please check the installation."
        )

router = APIRouter()

@router.post("/upload")
async def upload_knowledge_file(file: UploadFile = File(...)):
    """
    Upload and process a Word document for knowledge base integration.
    """
    if not file.filename.endswith(('.docx', '.doc')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .docx and .doc files are allowed.")

    # Define temporary paths
    upload_dir = Path("./temp_uploads")
    upload_dir.mkdir(exist_ok=True)
    temp_file_path = upload_dir / file.filename

    try:
        # Save the uploaded file temporarily
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Define output paths - use absolute path to avoid confusion
        project_root = Path("/Users/jackwang/Desktop/portsentinel-ai-assistant")
        data_dir = project_root / "data"
        data_dir.mkdir(exist_ok=True)
        
        # Set the DOCX_PATH for the transfer module
        os.environ['DOCX_PATH'] = str(temp_file_path)
        os.environ['OUTPUT_JSON_PATH'] = str(data_dir / "knowledge_base_structured.json")
        
        print(f"Environment variables set:")
        print(f"  DOCX_PATH: {os.environ.get('DOCX_PATH')}")
        print(f"  OUTPUT_JSON_PATH: {os.environ.get('OUTPUT_JSON_PATH')}")

        # Process the document using transfer.py
        start_time = datetime.now()
        structured_sops = load_and_structure_knowledge_base(str(temp_file_path))
        
        if not structured_sops:
            raise HTTPException(status_code=500, detail="Failed to process the document. No SOPs were extracted.")

        processing_time = (datetime.now() - start_time).total_seconds()

        # Extract statistics
        total_sops = len(structured_sops)
        modules = list(set([sop.get('Module', 'Unknown') for sop in structured_sops if sop.get('Module')]))
        
        # Try to vectorize the knowledge base
        vectorized = False
        try:
            print(f"Starting vectorization process...")
            
            json_path = data_dir / "knowledge_base_structured.json"
            output_dir = project_root / "modules" / "rag_module" / "db_chroma_kb"
            
            print(f"Vectorization paths:")
            print(f"  JSON path: {json_path} (exists: {json_path.exists()})")
            print(f"  Output dir: {output_dir}")
            
            if json_path.exists():
                # Import and use the vectorizer directly
                sys.path.append(str(project_root / "modules" / "rag_module"))
                from vectorize_knowledge_base import KnowledgeBaseVectorizer
                
                print(f"Creating vectorizer instance...")
                vectorizer = KnowledgeBaseVectorizer(
                    kb_json_path=str(json_path),
                    output_dir=str(output_dir)
                )
                print(f"Starting vectorization...")
                vectorizer.vectorize()
                vectorized = True
                print(f"Vectorization completed successfully!")
            else:
                print(f"JSON file not found: {json_path}")
        except Exception as e:
            print(f"Vectorization error: {e}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            # Don't fail the entire request if vectorization fails

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Successfully processed {total_sops} SOPs from {file.filename}",
                "data": {
                    "totalSOPs": total_sops,
                    "modules": modules,
                    "processingTime": processing_time,
                    "vectorized": vectorized
                }
            }
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    finally:
        # Clean up the temporary file
        if temp_file_path.exists():
            os.remove(temp_file_path)

@router.get("/status")
async def get_knowledge_status():
    """
    Get the current status of the knowledge base.
    """
    try:
        project_root = Path(__file__).parent.parent.parent.parent.parent
        json_path = project_root / "data" / "knowledge_base_structured.json"
        
        if json_path.exists():
            import json
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            return JSONResponse(content={
                "success": True,
                "message": "Knowledge base is available",
                "data": {
                    "totalSOPs": len(data),
                    "lastUpdated": datetime.fromtimestamp(json_path.stat().st_mtime).isoformat(),
                    "fileSize": json_path.stat().st_size
                }
            })
        else:
            return JSONResponse(content={
                "success": False,
                "message": "No knowledge base found",
                "data": None
            })
    except Exception as e:
        return JSONResponse(content={
            "success": False,
            "message": f"Error checking knowledge base status: {str(e)}",
            "data": None
        })
