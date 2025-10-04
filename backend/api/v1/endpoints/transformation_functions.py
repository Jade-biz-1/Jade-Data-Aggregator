"""
Transformation Functions API Endpoints
Provides library of reusable transformation functions
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.rbac import require_any_authenticated, require_role
from backend.services.transformation_function_service import TransformationFunctionService

router = APIRouter()


# Pydantic models
class TransformationFunctionCreate(BaseModel):
    name: str
    display_name: str
    description: str
    function_code: str
    category: str = "custom"
    function_type: str = "python"
    parameters: Optional[List[Dict[str, Any]]] = None
    return_type: Optional[str] = None
    example_usage: Optional[str] = None
    example_input: Optional[Dict[str, Any]] = None
    example_output: Optional[Dict[str, Any]] = None
    is_public: bool = False
    tags: Optional[List[str]] = None


class TransformationFunctionUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    function_code: Optional[str] = None
    category: Optional[str] = None
    parameters: Optional[List[Dict[str, Any]]] = None
    return_type: Optional[str] = None
    example_usage: Optional[str] = None
    example_input: Optional[Dict[str, Any]] = None
    example_output: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class FunctionTestRequest(BaseModel):
    test_input: Dict[str, Any]


# Function endpoints

@router.get("/")
async def list_transformation_functions(
    category: Optional[str] = Query(None),
    function_type: Optional[str] = Query(None),
    is_public: Optional[bool] = Query(None),
    is_builtin: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """List all transformation functions"""
    functions = await TransformationFunctionService.list_functions(
        db=db,
        category=category,
        function_type=function_type,
        is_public=is_public,
        is_builtin=is_builtin,
        search=search,
        skip=skip,
        limit=limit
    )

    return {
        "functions": [
            {
                "id": f.id,
                "name": f.name,
                "display_name": f.display_name,
                "description": f.description,
                "category": f.category,
                "function_type": f.function_type,
                "is_builtin": f.is_builtin,
                "is_public": f.is_public,
                "use_count": f.use_count,
                "tags": f.tags,
                "created_at": f.created_at.isoformat() if f.created_at else None
            }
            for f in functions
        ],
        "total": len(functions)
    }


@router.get("/builtin")
async def get_builtin_functions(
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Get built-in transformation functions"""
    functions = TransformationFunctionService.get_builtin_functions()

    return {
        "functions": functions,
        "total": len(functions)
    }


@router.get("/by-category")
async def get_functions_by_category(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Get functions grouped by category"""
    functions_by_category = await TransformationFunctionService.get_functions_by_category(db)

    return {
        category: [
            {
                "id": f.id,
                "name": f.name,
                "display_name": f.display_name,
                "description": f.description,
                "function_type": f.function_type,
                "use_count": f.use_count,
                "tags": f.tags
            }
            for f in functions
        ]
        for category, functions in functions_by_category.items()
    }


@router.get("/{function_id}")
async def get_transformation_function(
    function_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Get a specific transformation function"""
    function = await TransformationFunctionService.get_function(db, function_id)

    if not function:
        raise HTTPException(status_code=404, detail="Function not found")

    return {
        "id": function.id,
        "name": function.name,
        "display_name": function.display_name,
        "description": function.description,
        "category": function.category,
        "function_code": function.function_code,
        "function_type": function.function_type,
        "parameters": function.parameters,
        "return_type": function.return_type,
        "example_usage": function.example_usage,
        "example_input": function.example_input,
        "example_output": function.example_output,
        "is_builtin": function.is_builtin,
        "is_public": function.is_public,
        "use_count": function.use_count,
        "tags": function.tags,
        "created_at": function.created_at.isoformat() if function.created_at else None,
        "updated_at": function.updated_at.isoformat() if function.updated_at else None
    }


@router.get("/name/{function_name}")
async def get_function_by_name(
    function_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Get a function by name"""
    function = await TransformationFunctionService.get_function_by_name(db, function_name)

    if not function:
        raise HTTPException(status_code=404, detail="Function not found")

    return {
        "id": function.id,
        "name": function.name,
        "display_name": function.display_name,
        "description": function.description,
        "function_code": function.function_code,
        "parameters": function.parameters,
        "example_usage": function.example_usage
    }


@router.post("/")
async def create_transformation_function(
    function: TransformationFunctionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "editor"]))
) -> Dict[str, Any]:
    """Create a new transformation function"""
    # Check if function name already exists
    existing = await TransformationFunctionService.get_function_by_name(db, function.name)
    if existing:
        raise HTTPException(status_code=400, detail="Function name already exists")

    new_function = await TransformationFunctionService.create_function(
        db=db,
        name=function.name,
        display_name=function.display_name,
        description=function.description,
        function_code=function.function_code,
        category=function.category,
        function_type=function.function_type,
        parameters=function.parameters,
        return_type=function.return_type,
        example_usage=function.example_usage,
        example_input=function.example_input,
        example_output=function.example_output,
        is_public=function.is_public,
        created_by=current_user.id,
        tags=function.tags
    )

    return {
        "id": new_function.id,
        "name": new_function.name,
        "message": "Function created successfully"
    }


@router.put("/{function_id}")
async def update_transformation_function(
    function_id: int,
    function: TransformationFunctionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "editor"]))
) -> Dict[str, Any]:
    """Update a transformation function"""
    updated_function = await TransformationFunctionService.update_function(
        db=db,
        function_id=function_id,
        **function.model_dump(exclude_unset=True)
    )

    if not updated_function:
        raise HTTPException(status_code=404, detail="Function not found")

    return {
        "id": updated_function.id,
        "name": updated_function.name,
        "message": "Function updated successfully"
    }


@router.delete("/{function_id}")
async def delete_transformation_function(
    function_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
) -> Dict[str, str]:
    """Delete a transformation function"""
    # Don't allow deleting built-in functions
    function = await TransformationFunctionService.get_function(db, function_id)
    if function and function.is_builtin:
        raise HTTPException(status_code=400, detail="Cannot delete built-in functions")

    success = await TransformationFunctionService.delete_function(db, function_id)

    if not success:
        raise HTTPException(status_code=404, detail="Function not found")

    return {"message": "Function deleted successfully"}


@router.post("/{function_id}/test")
async def test_transformation_function(
    function_id: int,
    request: FunctionTestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Test a transformation function with sample input"""
    result = await TransformationFunctionService.test_function(
        db=db,
        function_id=function_id,
        test_input=request.test_input
    )

    if "error" in result and not result.get("success"):
        return {
            "success": False,
            "error": result["error"],
            "function_name": result.get("function_name")
        }

    return result


@router.post("/{function_id}/use")
async def increment_function_use_count(
    function_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, str]:
    """Increment function use count"""
    await TransformationFunctionService.increment_use_count(db, function_id)
    return {"message": "Use count incremented"}
