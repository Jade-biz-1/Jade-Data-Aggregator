"""
Global Search Service

Provides global search functionality across all entities.
Part of Phase 6: Advanced Search (F025)
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func

from backend.models.pipeline import Pipeline
from backend.models.connector import Connector
from backend.models.transformation import Transformation
from backend.models.user import User
from backend.models.file_upload import FileUpload
from backend.models.pipeline_template import PipelineTemplate, TransformationFunction
from backend.models.monitoring import SystemLog, Alert, AlertRule


class GlobalSearchService:
    """Service for global search across all entities"""

    async def search_all(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 50,
        offset: int = 0,
        entity_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Search across all entities

        Args:
            db: Database session
            query: Search query
            limit: Max results per entity type
            offset: Result offset
            entity_types: List of entity types to search (None for all)

        Returns:
            Search results dict
        """
        search_query = f"%{query}%"
        results = {}

        # Default to all entity types if none specified
        if not entity_types:
            entity_types = [
                "pipelines", "connectors", "transformations",
                "users", "files", "templates", "functions",
                "logs", "alerts", "alert_rules"
            ]

        # Search pipelines
        if "pipelines" in entity_types:
            results["pipelines"] = await self.search_pipelines(
                db, search_query, limit, offset
            )

        # Search connectors
        if "connectors" in entity_types:
            results["connectors"] = await self.search_connectors(
                db, search_query, limit, offset
            )

        # Search transformations
        if "transformations" in entity_types:
            results["transformations"] = await self.search_transformations(
                db, search_query, limit, offset
            )

        # Search users
        if "users" in entity_types:
            results["users"] = await self.search_users(
                db, search_query, limit, offset
            )

        # Search files
        if "files" in entity_types:
            results["files"] = await self.search_files(
                db, search_query, limit, offset
            )

        # Search templates
        if "templates" in entity_types:
            results["templates"] = await self.search_templates(
                db, search_query, limit, offset
            )

        # Search transformation functions
        if "functions" in entity_types:
            results["functions"] = await self.search_functions(
                db, search_query, limit, offset
            )

        # Search logs
        if "logs" in entity_types:
            results["logs"] = await self.search_logs(
                db, search_query, limit, offset
            )

        # Search alerts
        if "alerts" in entity_types:
            results["alerts"] = await self.search_alerts(
                db, search_query, limit, offset
            )

        # Search alert rules
        if "alert_rules" in entity_types:
            results["alert_rules"] = await self.search_alert_rules(
                db, search_query, limit, offset
            )

        # Calculate total results
        total_results = sum(len(v) for v in results.values())

        return {
            "query": query,
            "total_results": total_results,
            "results": results
        }

    async def search_pipelines(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Search pipelines"""
        stmt = select(Pipeline).where(
            or_(
                Pipeline.name.ilike(query),
                Pipeline.description.ilike(query)
            )
        ).offset(offset).limit(limit)

        result = await db.execute(stmt)
        pipelines = result.scalars().all()

        return [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "type": "pipeline",
                "is_active": p.is_active,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in pipelines
        ]

    async def search_connectors(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Search connectors"""
        stmt = select(Connector).where(
            or_(
                Connector.name.ilike(query),
                Connector.connector_type.ilike(query)
            )
        ).offset(offset).limit(limit)

        result = await db.execute(stmt)
        connectors = result.scalars().all()

        return [
            {
                "id": c.id,
                "name": c.name,
                "type": "connector",
                "connector_type": c.connector_type,
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
            for c in connectors
        ]

    async def search_transformations(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Search transformations"""
        stmt = select(Transformation).where(
            or_(
                Transformation.name.ilike(query),
                Transformation.transformation_type.ilike(query)
            )
        ).offset(offset).limit(limit)

        result = await db.execute(stmt)
        transformations = result.scalars().all()

        return [
            {
                "id": t.id,
                "name": t.name,
                "type": "transformation",
                "transformation_type": t.transformation_type,
                "created_at": t.created_at.isoformat() if t.created_at else None
            }
            for t in transformations
        ]

    async def search_users(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Search users"""
        stmt = select(User).where(
            or_(
                User.username.ilike(query),
                User.email.ilike(query),
                User.first_name.ilike(query),
                User.last_name.ilike(query)
            )
        ).offset(offset).limit(limit)

        result = await db.execute(stmt)
        users = result.scalars().all()

        return [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "full_name": f"{u.first_name} {u.last_name}".strip(),
                "type": "user",
                "role": u.role,
                "is_active": u.is_active
            }
            for u in users
        ]

    async def search_files(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Search files"""
        stmt = select(FileUpload).where(
            or_(
                FileUpload.filename.ilike(query),
                FileUpload.original_filename.ilike(query)
            )
        ).offset(offset).limit(limit)

        result = await db.execute(stmt)
        files = result.scalars().all()

        return [
            {
                "id": f.id,
                "filename": f.original_filename,
                "type": "file",
                "file_type": f.file_type.value if f.file_type else None,
                "file_size": f.file_size,
                "status": f.status.value if f.status else None,
                "created_at": f.created_at.isoformat() if f.created_at else None
            }
            for f in files
        ]

    async def search_templates(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Search pipeline templates"""
        stmt = select(PipelineTemplate).where(
            or_(
                PipelineTemplate.name.ilike(query),
                PipelineTemplate.description.ilike(query),
                PipelineTemplate.category.ilike(query)
            )
        ).offset(offset).limit(limit)

        result = await db.execute(stmt)
        templates = result.scalars().all()

        return [
            {
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "type": "template",
                "category": t.category,
                "use_count": t.use_count,
                "is_builtin": t.is_builtin
            }
            for t in templates
        ]

    async def search_functions(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Search transformation functions"""
        stmt = select(TransformationFunction).where(
            or_(
                TransformationFunction.name.ilike(query),
                TransformationFunction.display_name.ilike(query),
                TransformationFunction.description.ilike(query)
            )
        ).offset(offset).limit(limit)

        result = await db.execute(stmt)
        functions = result.scalars().all()

        return [
            {
                "id": f.id,
                "name": f.name,
                "display_name": f.display_name,
                "description": f.description,
                "type": "function",
                "category": f.category,
                "is_builtin": f.is_builtin
            }
            for f in functions
        ]

    async def search_logs(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Search system logs"""
        stmt = select(SystemLog).where(
            or_(
                SystemLog.message.ilike(query),
                SystemLog.component.ilike(query),
                SystemLog.logger_name.ilike(query)
            )
        ).order_by(SystemLog.timestamp.desc()).offset(offset).limit(limit)

        result = await db.execute(stmt)
        logs = result.scalars().all()

        return [
            {
                "id": l.id,
                "message": l.message,
                "type": "log",
                "level": l.level.value if l.level else None,
                "component": l.component,
                "timestamp": l.timestamp.isoformat() if l.timestamp else None
            }
            for l in logs
        ]

    async def search_alerts(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Search alerts"""
        stmt = select(Alert).where(
            or_(
                Alert.title.ilike(query),
                Alert.description.ilike(query)
            )
        ).order_by(Alert.triggered_at.desc()).offset(offset).limit(limit)

        result = await db.execute(stmt)
        alerts = result.scalars().all()

        return [
            {
                "id": a.id,
                "title": a.title,
                "description": a.description,
                "type": "alert",
                "severity": a.severity.value if a.severity else None,
                "status": a.status.value if a.status else None,
                "triggered_at": a.triggered_at.isoformat() if a.triggered_at else None
            }
            for a in alerts
        ]

    async def search_alert_rules(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Search alert rules"""
        stmt = select(AlertRule).where(
            or_(
                AlertRule.name.ilike(query),
                AlertRule.description.ilike(query),
                AlertRule.metric_name.ilike(query)
            )
        ).offset(offset).limit(limit)

        result = await db.execute(stmt)
        rules = result.scalars().all()

        return [
            {
                "id": r.id,
                "name": r.name,
                "description": r.description,
                "type": "alert_rule",
                "metric_name": r.metric_name,
                "severity": r.severity.value if r.severity else None,
                "is_active": r.is_active
            }
            for r in rules
        ]

    async def get_search_suggestions(
        self,
        db: AsyncSession,
        partial_query: str,
        limit: int = 10
    ) -> List[str]:
        """
        Get search suggestions based on partial query

        Args:
            db: Database session
            partial_query: Partial search query
            limit: Max suggestions

        Returns:
            List of search suggestions
        """
        suggestions = set()
        query_pattern = f"{partial_query}%"

        # Get pipeline names
        stmt = select(Pipeline.name).where(
            Pipeline.name.ilike(query_pattern)
        ).limit(limit)
        result = await db.execute(stmt)
        suggestions.update(result.scalars().all())

        # Get connector names
        stmt = select(Connector.name).where(
            Connector.name.ilike(query_pattern)
        ).limit(limit)
        result = await db.execute(stmt)
        suggestions.update(result.scalars().all())

        # Get template names
        stmt = select(PipelineTemplate.name).where(
            PipelineTemplate.name.ilike(query_pattern)
        ).limit(limit)
        result = await db.execute(stmt)
        suggestions.update(result.scalars().all())

        return sorted(list(suggestions))[:limit]
