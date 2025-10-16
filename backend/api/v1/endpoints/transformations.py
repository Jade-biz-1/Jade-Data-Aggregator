from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import traceback

from backend.schemas.transformation import Transformation, TransformationCreate, TransformationUpdate
from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.rbac import require_viewer, require_designer
from backend.crud.transformation import transformation


router = APIRouter()


@router.get("/", response_model=list[Transformation])
async def read_transformations(
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve transformations (all authenticated users can view)
    """
    try:
        print("Starting to retrieve transformations")
        transformations = await transformation.get_multi(db)
        print(f"Retrieved {len(transformations)} transformations")
        return transformations
    except Exception as e:
        print(f"Error retrieving transformations: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=Transformation)
async def create_transformation(
    transformation_in: TransformationCreate,
    current_user: User = Depends(require_designer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new transformation (Designer, Developer, Admin only)
    """
    db_transformation = await transformation.create(db, obj_in=transformation_in)
    return db_transformation


@router.get("/{transformation_id}", response_model=Transformation)
async def read_transformation(
    transformation_id: int,
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific transformation by ID (all authenticated users can view)
    """
    transformation_obj = await transformation.get(db, id=transformation_id)
    if not transformation_obj:
        raise HTTPException(status_code=404, detail="Transformation not found")
    return transformation_obj


@router.put("/{transformation_id}", response_model=Transformation)
async def update_transformation(
    transformation_id: int,
    transformation_in: TransformationUpdate,
    current_user: User = Depends(require_designer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a transformation (Designer, Developer, Admin only)
    """
    transformation_obj = await transformation.get(db, id=transformation_id)
    if not transformation_obj:
        raise HTTPException(status_code=404, detail="Transformation not found")
    updated_transformation = await transformation.update(db, db_obj=transformation_obj, obj_in=transformation_in)
    return updated_transformation


@router.delete("/{transformation_id}", response_model=Transformation)
async def delete_transformation(
    transformation_id: int,
    current_user: User = Depends(require_designer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a transformation (Designer, Developer, Admin only)
    """
    transformation_obj = await transformation.get(db, id=transformation_id)
    if not transformation_obj:
        raise HTTPException(status_code=404, detail="Transformation not found")
    deleted_transformation = await transformation.remove(db, id=transformation_id)
    return deleted_transformation