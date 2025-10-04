"""
Event Service
Event-driven architecture for pipeline events, notifications, and audit trails
"""

from typing import Dict, Any, Optional, List, Callable
from datetime import datetime
from enum import Enum
import asyncio
import json
import logging

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    """Event type enumeration"""
    PIPELINE_CREATED = "pipeline.created"
    PIPELINE_UPDATED = "pipeline.updated"
    PIPELINE_DELETED = "pipeline.deleted"
    PIPELINE_STARTED = "pipeline.started"
    PIPELINE_COMPLETED = "pipeline.completed"
    PIPELINE_FAILED = "pipeline.failed"
    PIPELINE_PAUSED = "pipeline.paused"
    PIPELINE_RESUMED = "pipeline.resumed"

    CONNECTOR_CREATED = "connector.created"
    CONNECTOR_UPDATED = "connector.updated"
    CONNECTOR_DELETED = "connector.deleted"

    USER_CREATED = "user.created"
    USER_UPDATED = "user.updated"
    USER_LOGIN = "user.login"
    USER_LOGOUT = "user.logout"

    ALERT_CREATED = "alert.created"
    ALERT_RESOLVED = "alert.resolved"

    SYSTEM_ERROR = "system.error"
    SYSTEM_WARNING = "system.warning"


class Event:
    """Event data structure"""

    def __init__(
        self,
        event_type: EventType,
        entity_id: Optional[int] = None,
        entity_type: Optional[str] = None,
        user_id: Optional[int] = None,
        data: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.event_id = None  # Will be set when persisted
        self.event_type = event_type
        self.entity_id = entity_id
        self.entity_type = entity_type
        self.user_id = user_id
        self.data = data or {}
        self.metadata = metadata or {}
        self.timestamp = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary"""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type.value,
            "entity_id": self.entity_id,
            "entity_type": self.entity_type,
            "user_id": self.user_id,
            "data": self.data,
            "metadata": self.metadata,
            "timestamp": self.timestamp.isoformat()
        }

    def to_json(self) -> str:
        """Convert event to JSON string"""
        return json.dumps(self.to_dict())


class EventService:
    """
    Event service for managing event publishing, subscription, and persistence
    """

    def __init__(self):
        # Event subscribers: event_type -> list of callback functions
        self.subscribers: Dict[EventType, List[Callable]] = {}

        # Event history (in-memory, should be replaced with database)
        self.event_history: List[Event] = []
        self.max_history_size = 1000

        # Event processing queue
        self.event_queue: asyncio.Queue = asyncio.Queue()
        self.processing_task: Optional[asyncio.Task] = None

    async def publish(self, event: Event):
        """
        Publish an event to all subscribers
        """
        # Add to queue for async processing
        await self.event_queue.put(event)

        # Log event
        logger.info(
            f"Event published: {event.event_type.value} "
            f"(entity: {event.entity_type}:{event.entity_id})"
        )

    def subscribe(self, event_type: EventType, callback: Callable):
        """
        Subscribe to a specific event type
        """
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []

        self.subscribers[event_type].append(callback)
        logger.info(f"Subscriber added for event type: {event_type.value}")

    def unsubscribe(self, event_type: EventType, callback: Callable):
        """
        Unsubscribe from an event type
        """
        if event_type in self.subscribers:
            if callback in self.subscribers[event_type]:
                self.subscribers[event_type].remove(callback)
                logger.info(f"Subscriber removed for event type: {event_type.value}")

    async def start_processing(self):
        """
        Start processing events from the queue
        """
        if self.processing_task:
            logger.warning("Event processing already started")
            return

        self.processing_task = asyncio.create_task(self._process_events())
        logger.info("Event processing started")

    async def stop_processing(self):
        """
        Stop processing events
        """
        if self.processing_task:
            self.processing_task.cancel()
            self.processing_task = None
            logger.info("Event processing stopped")

    async def _process_events(self):
        """
        Internal method to process events from queue
        """
        try:
            while True:
                event = await self.event_queue.get()

                # Persist event
                await self._persist_event(event)

                # Notify subscribers
                await self._notify_subscribers(event)

                # Mark as done
                self.event_queue.task_done()

        except asyncio.CancelledError:
            logger.info("Event processing cancelled")
        except Exception as e:
            logger.error(f"Error processing events: {e}")

    async def _persist_event(self, event: Event):
        """
        Persist event to storage (in-memory for now)
        In production, this should write to database
        """
        try:
            # Add to history
            self.event_history.append(event)

            # Maintain max history size
            if len(self.event_history) > self.max_history_size:
                self.event_history.pop(0)

            # Assign event ID
            event.event_id = len(self.event_history)

        except Exception as e:
            logger.error(f"Error persisting event: {e}")

    async def _notify_subscribers(self, event: Event):
        """
        Notify all subscribers of an event
        """
        if event.event_type in self.subscribers:
            for callback in self.subscribers[event.event_type]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(event)
                    else:
                        callback(event)
                except Exception as e:
                    logger.error(
                        f"Error in event subscriber callback for "
                        f"{event.event_type.value}: {e}"
                    )

    async def get_events(
        self,
        event_type: Optional[EventType] = None,
        entity_id: Optional[int] = None,
        entity_type: Optional[str] = None,
        user_id: Optional[int] = None,
        limit: int = 100
    ) -> List[Event]:
        """
        Query events from history
        """
        filtered_events = self.event_history

        if event_type:
            filtered_events = [
                e for e in filtered_events
                if e.event_type == event_type
            ]

        if entity_id:
            filtered_events = [
                e for e in filtered_events
                if e.entity_id == entity_id
            ]

        if entity_type:
            filtered_events = [
                e for e in filtered_events
                if e.entity_type == entity_type
            ]

        if user_id:
            filtered_events = [
                e for e in filtered_events
                if e.user_id == user_id
            ]

        # Return most recent events first
        return filtered_events[-limit:][::-1]

    async def get_audit_trail(
        self,
        entity_type: str,
        entity_id: int
    ) -> List[Dict[str, Any]]:
        """
        Get audit trail for a specific entity
        """
        events = await self.get_events(
            entity_type=entity_type,
            entity_id=entity_id
        )

        return [event.to_dict() for event in events]


# Global event service instance
event_service = EventService()


# Helper functions for common event publishing

async def publish_pipeline_event(
    event_type: EventType,
    pipeline_id: int,
    user_id: Optional[int] = None,
    data: Optional[Dict[str, Any]] = None
):
    """Helper to publish pipeline events"""
    event = Event(
        event_type=event_type,
        entity_id=pipeline_id,
        entity_type="pipeline",
        user_id=user_id,
        data=data
    )
    await event_service.publish(event)


async def publish_user_event(
    event_type: EventType,
    user_id: int,
    data: Optional[Dict[str, Any]] = None
):
    """Helper to publish user events"""
    event = Event(
        event_type=event_type,
        entity_id=user_id,
        entity_type="user",
        user_id=user_id,
        data=data
    )
    await event_service.publish(event)


async def publish_system_event(
    event_type: EventType,
    message: str,
    severity: str = "info",
    metadata: Optional[Dict[str, Any]] = None
):
    """Helper to publish system events"""
    event = Event(
        event_type=event_type,
        data={"message": message, "severity": severity},
        metadata=metadata
    )
    await event_service.publish(event)
