"""
WebSocket Endpoints
Real-time communication endpoints for pipeline status, metrics, and notifications
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import json
import uuid
import logging

from backend.core.database import get_db
from backend.core.websocket import connection_manager
from backend.core.security import decode_token
from backend.schemas.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


async def get_current_user_ws(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
) -> Optional[User]:
    """
    Authenticate WebSocket connection using token from query parameter
    """
    if not token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return None

    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        email = payload.get("email")
 
        if not user_id or not email:
            await websocket.close(code=1008, reason="Invalid token")
            return None

        # Create user object from token payload
        user = User(
            id=int(user_id),
            email=email,
            full_name=payload.get("full_name", ""),
            role=payload.get("role", "viewer")
        )

        return user

    except Exception as e:
        logger.error(f"WebSocket authentication error: {e}")
        await websocket.close(code=1008, reason="Authentication failed")
        return None


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Query(None)
):
    """
    Main WebSocket endpoint for real-time updates
    Supports pipeline status, metrics, and notifications
    """
    # Authenticate user
    user = await get_current_user_ws(websocket, token)
    if not user:
        return

    # Generate unique connection ID
    connection_id = str(uuid.uuid4())

    # Connect to manager
    await connection_manager.connect(
        websocket=websocket,
        connection_id=connection_id,
        user_id=user.id,
        metadata={"email": user.email, "role": user.role}
    )

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)

            message_type = message.get("type")

            # Handle different message types
            if message_type == "subscribe_pipeline":
                pipeline_id = message.get("pipeline_id")
                if pipeline_id:
                    connection_manager.subscribe_to_pipeline(connection_id, pipeline_id)
                    await connection_manager.send_personal_message(
                        {
                            "type": "subscription_confirmed",
                            "pipeline_id": pipeline_id,
                            "status": "subscribed"
                        },
                        connection_id
                    )

            elif message_type == "unsubscribe_pipeline":
                pipeline_id = message.get("pipeline_id")
                if pipeline_id:
                    connection_manager.unsubscribe_from_pipeline(connection_id, pipeline_id)
                    await connection_manager.send_personal_message(
                        {
                            "type": "subscription_confirmed",
                            "pipeline_id": pipeline_id,
                            "status": "unsubscribed"
                        },
                        connection_id
                    )

            elif message_type == "ping":
                await connection_manager.send_personal_message(
                    {"type": "pong"},
                    connection_id
                )

            elif message_type == "get_stats":
                # Send connection statistics
                stats = {
                    "type": "connection_stats",
                    "total_connections": connection_manager.get_connection_count(),
                    "user_connections": connection_manager.get_user_connection_count(user.id)
                }
                await connection_manager.send_personal_message(stats, connection_id)

            else:
                # Echo unknown messages for debugging
                await connection_manager.send_personal_message(
                    {
                        "type": "echo",
                        "original_message": message
                    },
                    connection_id
                )

    except WebSocketDisconnect:
        connection_manager.disconnect(connection_id)
        logger.info(f"Client {connection_id} disconnected normally")

    except Exception as e:
        logger.error(f"WebSocket error for {connection_id}: {e}")
        connection_manager.disconnect(connection_id)


@router.websocket("/ws/pipeline/{pipeline_id}")
async def pipeline_websocket(
    websocket: WebSocket,
    pipeline_id: int,
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Query(None)
):
    """
    Dedicated WebSocket endpoint for a specific pipeline
    Automatically subscribes to pipeline updates
    """
    # Authenticate user
    user = await get_current_user_ws(websocket, token)
    if not user:
        return

    # Generate unique connection ID
    connection_id = str(uuid.uuid4())

    # Connect to manager
    await connection_manager.connect(
        websocket=websocket,
        connection_id=connection_id,
        user_id=user.id,
        metadata={
            "email": user.email,
            "role": user.role,
            "pipeline_id": pipeline_id
        }
    )

    # Auto-subscribe to pipeline
    connection_manager.subscribe_to_pipeline(connection_id, pipeline_id)

    try:
        # Send initial subscription confirmation
        await connection_manager.send_personal_message(
            {
                "type": "pipeline_subscription",
                "pipeline_id": pipeline_id,
                "status": "connected"
            },
            connection_id
        )

        while True:
            # Receive and echo messages
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle ping/pong
            if message.get("type") == "ping":
                await connection_manager.send_personal_message(
                    {"type": "pong"},
                    connection_id
                )

    except WebSocketDisconnect:
        connection_manager.unsubscribe_from_pipeline(connection_id, pipeline_id)
        connection_manager.disconnect(connection_id)
        logger.info(f"Pipeline {pipeline_id} WebSocket {connection_id} disconnected")

    except Exception as e:
        logger.error(f"Pipeline WebSocket error for {connection_id}: {e}")
        connection_manager.unsubscribe_from_pipeline(connection_id, pipeline_id)
        connection_manager.disconnect(connection_id)