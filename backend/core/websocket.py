"""
WebSocket Connection Manager
Handles WebSocket connections, authentication, and message broadcasting
"""

from typing import Dict, Set, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import json
import asyncio
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections with authentication and subscription support
    """

    def __init__(self):
        # Active connections by connection ID
        self.active_connections: Dict[str, WebSocket] = {}

        # User ID to connection IDs mapping
        self.user_connections: Dict[int, Set[str]] = {}

        # Pipeline subscriptions: pipeline_id -> set of connection IDs
        self.pipeline_subscriptions: Dict[int, Set[str]] = {}

        # Connection metadata
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}

        # Cleanup task
        self._cleanup_task: Optional[asyncio.Task] = None

    async def connect(
        self,
        websocket: WebSocket,
        connection_id: str,
        user_id: int,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Accept and register a new WebSocket connection
        """
        await websocket.accept()

        # Store connection
        self.active_connections[connection_id] = websocket

        # Map user to connection
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(connection_id)

        # Store metadata
        self.connection_metadata[connection_id] = {
            "user_id": user_id,
            "connected_at": datetime.now().isoformat(),
            "metadata": metadata or {}
        }

        logger.info(f"WebSocket connected: {connection_id} for user {user_id}")

        # Send welcome message
        await self.send_personal_message(
            {
                "type": "connection_established",
                "connection_id": connection_id,
                "timestamp": datetime.now().isoformat()
            },
            connection_id
        )

    def disconnect(self, connection_id: str):
        """
        Disconnect and cleanup a WebSocket connection
        """
        if connection_id not in self.active_connections:
            return

        # Get user_id before cleanup
        metadata = self.connection_metadata.get(connection_id, {})
        user_id = metadata.get("user_id")

        # Remove from active connections
        del self.active_connections[connection_id]

        # Remove from user connections
        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        # Remove from pipeline subscriptions
        for pipeline_id in list(self.pipeline_subscriptions.keys()):
            if connection_id in self.pipeline_subscriptions[pipeline_id]:
                self.pipeline_subscriptions[pipeline_id].discard(connection_id)
                if not self.pipeline_subscriptions[pipeline_id]:
                    del self.pipeline_subscriptions[pipeline_id]

        # Remove metadata
        if connection_id in self.connection_metadata:
            del self.connection_metadata[connection_id]

        logger.info(f"WebSocket disconnected: {connection_id}")

    async def send_personal_message(self, message: Dict[str, Any], connection_id: str):
        """
        Send message to a specific connection
        """
        if connection_id in self.active_connections:
            try:
                websocket = self.active_connections[connection_id]
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to {connection_id}: {e}")
                self.disconnect(connection_id)

    async def send_to_user(self, message: Dict[str, Any], user_id: int):
        """
        Send message to all connections of a specific user
        """
        if user_id in self.user_connections:
            connection_ids = list(self.user_connections[user_id])
            for connection_id in connection_ids:
                await self.send_personal_message(message, connection_id)

    async def broadcast(self, message: Dict[str, Any], exclude: Optional[Set[str]] = None):
        """
        Broadcast message to all active connections
        """
        exclude = exclude or set()
        connection_ids = [
            conn_id for conn_id in self.active_connections.keys()
            if conn_id not in exclude
        ]

        for connection_id in connection_ids:
            await self.send_personal_message(message, connection_id)

    async def broadcast_to_pipeline_subscribers(
        self,
        message: Dict[str, Any],
        pipeline_id: int
    ):
        """
        Broadcast message to all subscribers of a specific pipeline
        """
        if pipeline_id in self.pipeline_subscriptions:
            connection_ids = list(self.pipeline_subscriptions[pipeline_id])
            for connection_id in connection_ids:
                await self.send_personal_message(message, connection_id)

    def subscribe_to_pipeline(self, connection_id: str, pipeline_id: int):
        """
        Subscribe a connection to pipeline updates
        """
        if pipeline_id not in self.pipeline_subscriptions:
            self.pipeline_subscriptions[pipeline_id] = set()

        self.pipeline_subscriptions[pipeline_id].add(connection_id)
        logger.info(f"Connection {connection_id} subscribed to pipeline {pipeline_id}")

    def unsubscribe_from_pipeline(self, connection_id: str, pipeline_id: int):
        """
        Unsubscribe a connection from pipeline updates
        """
        if pipeline_id in self.pipeline_subscriptions:
            self.pipeline_subscriptions[pipeline_id].discard(connection_id)

            if not self.pipeline_subscriptions[pipeline_id]:
                del self.pipeline_subscriptions[pipeline_id]

            logger.info(f"Connection {connection_id} unsubscribed from pipeline {pipeline_id}")

    def get_connection_count(self) -> int:
        """Get total number of active connections"""
        return len(self.active_connections)

    def get_user_connection_count(self, user_id: int) -> int:
        """Get number of connections for a specific user"""
        return len(self.user_connections.get(user_id, set()))

    def get_pipeline_subscriber_count(self, pipeline_id: int) -> int:
        """Get number of subscribers for a specific pipeline"""
        return len(self.pipeline_subscriptions.get(pipeline_id, set()))

    async def start_cleanup_task(self):
        """Start periodic cleanup of stale connections"""
        self._cleanup_task = asyncio.create_task(self._periodic_cleanup())

    async def _periodic_cleanup(self):
        """Periodically check and cleanup stale connections"""
        while True:
            await asyncio.sleep(60)  # Run every minute

            stale_connections = []
            for connection_id, websocket in self.active_connections.items():
                try:
                    # Send ping to check connection health
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    stale_connections.append(connection_id)

            # Cleanup stale connections
            for connection_id in stale_connections:
                self.disconnect(connection_id)

            if stale_connections:
                logger.info(f"Cleaned up {len(stale_connections)} stale connections")


# Global connection manager instance
connection_manager = ConnectionManager()
