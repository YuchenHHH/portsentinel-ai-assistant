"""
Data Upload API endpoints
"""

import os
import sys
import json
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

# Add the history_record_rag module to the path
history_rag_path = os.path.join(os.path.dirname(__file__), '../../../../../modules/history_record_rag')
if history_rag_path not in sys.path:
    sys.path.append(history_rag_path)

# Import the function with error handling
try:
    from excel_to_json import excel_to_json_for_rag
except ImportError as e:
    print(f"Warning: Could not import excel_to_json_for_rag: {e}")
    # Create a fallback function
    def excel_to_json_for_rag(excel_file, output_json):
        raise HTTPException(
            status_code=500,
            detail="Excel processing module not available. Please check the installation."
        )

router = APIRouter()

@router.post("/upload")
async def upload_excel_file(file: UploadFile = File(...)):
    """
    Upload and process Excel file containing historical case data
    """
    try:
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(
                status_code=400,
                detail="Invalid file format. Please upload an Excel file (.xlsx or .xls)"
            )

        # Validate file size (10MB limit)
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        if file_size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(
                status_code=400,
                detail="File too large. Please upload a file smaller than 10MB"
            )

        # Save uploaded file temporarily
        temp_file_path = f"/tmp/{file.filename}"
        with open(temp_file_path, "wb") as buffer:
            buffer.write(content)

        # Process the Excel file
        try:
            # Read Excel to get basic info first
            df = pd.read_excel(temp_file_path, sheet_name='Cases')
            
            # Check if required columns exist
            required_columns = ['Module', 'Problem Statements', 'Solution']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required columns: {', '.join(missing_columns)}"
                )

            # Convert Excel to JSON using the existing function
            output_json_path = f"/tmp/case_log_rag_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            cases = excel_to_json_for_rag(temp_file_path, output_json_path)

            # Calculate statistics
            total_cases = len(cases)
            
            # Module distribution
            module_stats = {}
            for case in cases:
                module = case.get('module', 'Unknown')
                module_stats[module] = module_stats.get(module, 0) + 1

            # EDI distribution
            edi_stats = {'Yes': 0, 'No': 0, 'Unknown': 0}
            for case in cases:
                edi = case.get('is_edi', '').strip()
                if edi.lower() in ['yes', 'y', 'true', '1']:
                    edi_stats['Yes'] += 1
                elif edi.lower() in ['no', 'n', 'false', '0']:
                    edi_stats['No'] += 1
                else:
                    edi_stats['Unknown'] += 1

            # Sample cases (first 5)
            sample_cases = []
            for i, case in enumerate(cases[:5]):
                sample_cases.append({
                    'id': case.get('id', f'case_{i+1}'),
                    'module': case.get('module', ''),
                    'problem': case.get('problem_statement', '')[:100] + '...' if len(case.get('problem_statement', '')) > 100 else case.get('problem_statement', ''),
                    'solution': case.get('solution', '')[:100] + '...' if len(case.get('solution', '')) > 100 else case.get('solution', '')
                })

            # Move the processed JSON file to the data directory
            data_dir = os.path.join(os.path.dirname(__file__), '../../../../data')
            os.makedirs(data_dir, exist_ok=True)
            final_json_path = os.path.join(data_dir, 'case_log_rag.json')
            
            # Copy the processed file to the final location
            import shutil
            shutil.copy2(output_json_path, final_json_path)

            # Clean up temporary files
            os.remove(temp_file_path)
            os.remove(output_json_path)

            return JSONResponse(content={
                "success": True,
                "message": f"Successfully processed {total_cases} historical cases",
                "data": {
                    "totalCases": total_cases,
                    "moduleStats": module_stats,
                    "ediStats": edi_stats,
                    "sampleCases": sample_cases,
                    "outputFile": final_json_path
                }
            })

        except Exception as e:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            raise HTTPException(
                status_code=500,
                detail=f"Error processing Excel file: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@router.get("/status")
async def get_upload_status():
    """
    Get the status of uploaded historical data
    """
    try:
        data_dir = os.path.join(os.path.dirname(__file__), '../../../../data')
        json_file_path = os.path.join(data_dir, 'case_log_rag.json')
        
        if not os.path.exists(json_file_path):
            return JSONResponse(content={
                "success": False,
                "message": "No historical data uploaded yet",
                "data": None
            })

        # Load and analyze the existing data
        with open(json_file_path, 'r', encoding='utf-8') as f:
            cases = json.load(f)

        total_cases = len(cases)
        
        # Module distribution
        module_stats = {}
        for case in cases:
            module = case.get('module', 'Unknown')
            module_stats[module] = module_stats.get(module, 0) + 1

        # EDI distribution
        edi_stats = {'Yes': 0, 'No': 0, 'Unknown': 0}
        for case in cases:
            edi = case.get('is_edi', '').strip()
            if edi.lower() in ['yes', 'y', 'true', '1']:
                edi_stats['Yes'] += 1
            elif edi.lower() in ['no', 'n', 'false', '0']:
                edi_stats['No'] += 1
            else:
                edi_stats['Unknown'] += 1

        # Get file info
        file_stats = os.stat(json_file_path)
        file_size = file_stats.st_size
        last_modified = datetime.fromtimestamp(file_stats.st_mtime).isoformat()

        return JSONResponse(content={
            "success": True,
            "message": f"Historical data available: {total_cases} cases",
            "data": {
                "totalCases": total_cases,
                "moduleStats": module_stats,
                "ediStats": edi_stats,
                "fileSize": file_size,
                "lastModified": last_modified,
                "filePath": json_file_path
            }
        })

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking upload status: {str(e)}"
        )
