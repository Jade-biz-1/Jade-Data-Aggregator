"""
Pipeline Template Service
Manages pipeline templates for quick pipeline creation
"""

from typing import Dict, List, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload

from backend.models.pipeline_template import PipelineTemplate
from backend.models.pipeline import Pipeline


class PipelineTemplateService:
    """Service for managing pipeline templates"""

    @staticmethod
    async def create_template(
        db: AsyncSession,
        name: str,
        description: str,
        template_definition: Dict[str, Any],
        category: str = "general",
        is_public: bool = False,
        created_by: Optional[int] = None,
        tags: Optional[List[str]] = None,
        node_definitions: Optional[Dict[str, Any]] = None,
        edge_definitions: Optional[Dict[str, Any]] = None
    ) -> PipelineTemplate:
        """Create a new pipeline template"""
        template = PipelineTemplate(
            name=name,
            description=description,
            category=category,
            template_definition=template_definition,
            node_definitions=node_definitions or {},
            edge_definitions=edge_definitions or {},
            is_public=is_public,
            created_by=created_by,
            tags=tags or [],
            use_count=0
        )

        db.add(template)
        await db.commit()
        await db.refresh(template)
        return template

    @staticmethod
    async def get_template(db: AsyncSession, template_id: int) -> Optional[PipelineTemplate]:
        """Get a template by ID"""
        result = await db.execute(
            select(PipelineTemplate).where(PipelineTemplate.id == template_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_templates(
        db: AsyncSession,
        category: Optional[str] = None,
        is_public: Optional[bool] = None,
        created_by: Optional[int] = None,
        tags: Optional[List[str]] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[PipelineTemplate]:
        """List templates with optional filters"""
        query = select(PipelineTemplate)

        # Apply filters
        if category:
            query = query.where(PipelineTemplate.category == category)
        if is_public is not None:
            query = query.where(PipelineTemplate.is_public == is_public)
        if created_by is not None:
            query = query.where(PipelineTemplate.created_by == created_by)

        # TODO: Add tag filtering when needed

        query = query.offset(skip).limit(limit).order_by(PipelineTemplate.created_at.desc())

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update_template(
        db: AsyncSession,
        template_id: int,
        **kwargs
    ) -> Optional[PipelineTemplate]:
        """Update a template"""
        template = await PipelineTemplateService.get_template(db, template_id)
        if not template:
            return None

        for key, value in kwargs.items():
            if hasattr(template, key) and value is not None:
                setattr(template, key, value)

        await db.commit()
        await db.refresh(template)
        return template

    @staticmethod
    async def delete_template(db: AsyncSession, template_id: int) -> bool:
        """Delete a template"""
        result = await db.execute(
            delete(PipelineTemplate).where(PipelineTemplate.id == template_id)
        )
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def increment_use_count(db: AsyncSession, template_id: int):
        """Increment template use count"""
        await db.execute(
            update(PipelineTemplate)
            .where(PipelineTemplate.id == template_id)
            .values(use_count=PipelineTemplate.use_count + 1)
        )
        await db.commit()

    @staticmethod
    async def create_pipeline_from_template(
        db: AsyncSession,
        template_id: int,
        name: str,
        description: Optional[str] = None,
        **overrides
    ) -> Optional[Pipeline]:
        """Create a new pipeline from a template"""
        template = await PipelineTemplateService.get_template(db, template_id)
        if not template:
            return None

        # Create pipeline from template
        pipeline = Pipeline(
            name=name,
            description=description or template.description,
            pipeline_type="visual",
            template_id=template_id,
            visual_definition=template.template_definition,
            node_definitions=template.node_definitions,
            edge_definitions=template.edge_definitions,
            source_config={},  # Will be configured by user
            destination_config={},  # Will be configured by user
            transformation_config={},
            is_active=False  # Start as inactive until configured
        )

        # Apply any overrides
        for key, value in overrides.items():
            if hasattr(pipeline, key):
                setattr(pipeline, key, value)

        db.add(pipeline)
        await db.commit()
        await db.refresh(pipeline)

        # Increment template use count
        await PipelineTemplateService.increment_use_count(db, template_id)

        return pipeline

    @staticmethod
    async def get_popular_templates(
        db: AsyncSession,
        limit: int = 10
    ) -> List[PipelineTemplate]:
        """Get most popular templates by use count"""
        result = await db.execute(
            select(PipelineTemplate)
            .where(PipelineTemplate.is_public == True)
            .order_by(PipelineTemplate.use_count.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_templates_by_category(db: AsyncSession) -> Dict[str, List[PipelineTemplate]]:
        """Get templates grouped by category"""
        result = await db.execute(
            select(PipelineTemplate)
            .where(PipelineTemplate.is_public == True)
            .order_by(PipelineTemplate.category, PipelineTemplate.name)
        )
        templates = result.scalars().all()

        # Group by category
        by_category: Dict[str, List[PipelineTemplate]] = {}
        for template in templates:
            category = template.category or "general"
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(template)

        return by_category

    @staticmethod
    def get_builtin_templates() -> List[Dict[str, Any]]:
        """Get built-in pipeline templates"""
        return [
            {
                "name": "Simple ETL Pipeline",
                "description": "Extract data from a source, transform it, and load into a destination",
                "category": "etl",
                "is_public": True,
                "tags": ["etl", "beginner", "basic"],
                "template_definition": {
                    "nodes": [
                        {"id": "source-1", "type": "source", "position": {"x": 100, "y": 100}, "data": {"label": "Data Source"}},
                        {"id": "transform-1", "type": "transformation", "position": {"x": 350, "y": 100}, "data": {"label": "Transform", "transformationType": "map"}},
                        {"id": "dest-1", "type": "destination", "position": {"x": 600, "y": 100}, "data": {"label": "Destination"}}
                    ],
                    "edges": [
                        {"id": "e1-2", "source": "source-1", "target": "transform-1"},
                        {"id": "e2-3", "source": "transform-1", "target": "dest-1"}
                    ]
                }
            },
            {
                "name": "Data Filtering Pipeline",
                "description": "Filter and clean data before loading",
                "category": "etl",
                "is_public": True,
                "tags": ["filter", "clean", "quality"],
                "template_definition": {
                    "nodes": [
                        {"id": "source-1", "type": "source", "position": {"x": 100, "y": 100}, "data": {"label": "Data Source"}},
                        {"id": "filter-1", "type": "transformation", "position": {"x": 350, "y": 100}, "data": {"label": "Filter", "transformationType": "filter"}},
                        {"id": "dest-1", "type": "destination", "position": {"x": 600, "y": 100}, "data": {"label": "Destination"}}
                    ],
                    "edges": [
                        {"id": "e1-2", "source": "source-1", "target": "filter-1"},
                        {"id": "e2-3", "source": "filter-1", "target": "dest-1"}
                    ]
                }
            },
            {
                "name": "Multi-Source Aggregation",
                "description": "Combine data from multiple sources",
                "category": "elt",
                "is_public": True,
                "tags": ["aggregate", "multi-source", "join"],
                "template_definition": {
                    "nodes": [
                        {"id": "source-1", "type": "source", "position": {"x": 100, "y": 50}, "data": {"label": "Source 1"}},
                        {"id": "source-2", "type": "source", "position": {"x": 100, "y": 200}, "data": {"label": "Source 2"}},
                        {"id": "join-1", "type": "transformation", "position": {"x": 350, "y": 125}, "data": {"label": "Join", "transformationType": "join"}},
                        {"id": "dest-1", "type": "destination", "position": {"x": 600, "y": 125}, "data": {"label": "Destination"}}
                    ],
                    "edges": [
                        {"id": "e1-3", "source": "source-1", "target": "join-1"},
                        {"id": "e2-3", "source": "source-2", "target": "join-1"},
                        {"id": "e3-4", "source": "join-1", "target": "dest-1"}
                    ]
                }
            },
            {
                "name": "Data Quality Pipeline",
                "description": "Filter, validate, and clean data",
                "category": "quality",
                "is_public": True,
                "tags": ["quality", "validation", "cleaning"],
                "template_definition": {
                    "nodes": [
                        {"id": "source-1", "type": "source", "position": {"x": 100, "y": 100}, "data": {"label": "Data Source"}},
                        {"id": "filter-1", "type": "transformation", "position": {"x": 300, "y": 100}, "data": {"label": "Filter Nulls", "transformationType": "filter"}},
                        {"id": "map-1", "type": "transformation", "position": {"x": 500, "y": 100}, "data": {"label": "Clean Data", "transformationType": "map"}},
                        {"id": "dest-1", "type": "destination", "position": {"x": 700, "y": 100}, "data": {"label": "Destination"}}
                    ],
                    "edges": [
                        {"id": "e1-2", "source": "source-1", "target": "filter-1"},
                        {"id": "e2-3", "source": "filter-1", "target": "map-1"},
                        {"id": "e3-4", "source": "map-1", "target": "dest-1"}
                    ]
                }
            }
        ]
