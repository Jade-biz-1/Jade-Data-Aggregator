"""
Unit Tests for WebSocket Authentication
Data Aggregator Platform - Testing Framework - Week 94 TEST-003

Tests cover:
- WebSocket authentication (token validation, JWT decoding)
- Connection management (connect, disconnect, metadata)
- Message broadcasting (personal, user, pipeline, all)
- Subscription management (pipeline subscribe/unsubscribe)
- Security: Invalid tokens, expired tokens, connection hijacking

Total: 20 tests for critical WebSocket security
"""

import json
import uuid
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
from fastapi import WebSocket, WebSocketDisconnect

from backend.core.websocket import ConnectionManager, connection_manager
from backend.schemas.user import User


class TestWebSocketAuthentication:
    """Test WebSocket authentication and security"""

    @pytest.fixture
    def mock_websocket(self):
        """Create a mock WebSocket"""
        ws = AsyncMock(spec=WebSocket)
        ws.accept = AsyncMock()
        ws.send_json = AsyncMock()
        ws.receive_text = AsyncMock()
        ws.close = AsyncMock()
        return ws

    # Token Authentication Tests

    @pytest.mark.asyncio
    async def test_authenticate_websocket_missing_token(self, mock_websocket):
        """Test WebSocket authentication fails when token is missing"""
        from backend.api.v1.endpoints.websocket import get_current_user_ws

        user = await get_current_user_ws(mock_websocket, token=None)

        assert user is None
        mock_websocket.close.assert_called_once_with(code=1008, reason="Missing authentication token")

    @pytest.mark.asyncio
    async def test_authenticate_websocket_invalid_token(self, mock_websocket):
        """Test WebSocket authentication fails with invalid token"""
        from backend.api.v1.endpoints.websocket import get_current_user_ws

        with patch('backend.api.v1.endpoints.websocket.decode_token', side_effect=Exception("Invalid token")):
            user = await get_current_user_ws(mock_websocket, token="invalid_token")

            assert user is None
            mock_websocket.close.assert_called_once_with(code=1008, reason="Authentication failed")

    @pytest.mark.asyncio
    async def test_authenticate_websocket_valid_token(self, mock_websocket):
        """Test WebSocket authentication succeeds with valid token"""
        from backend.api.v1.endpoints.websocket import get_current_user_ws

        # Mock valid token payload
        mock_payload = {
            "sub": "123",
            "email": "user@example.com",
            "full_name": "Test User",
            "role": "developer"
        }

        with patch('backend.api.v1.endpoints.websocket.decode_token', return_value=mock_payload):
            user = await get_current_user_ws(mock_websocket, token="valid_token")

            assert user is not None
            assert user.id == 123
            assert user.email == "user@example.com"
            assert user.role == "developer"
            mock_websocket.close.assert_not_called()

    @pytest.mark.asyncio
    async def test_authenticate_websocket_token_missing_claims(self, mock_websocket):
        """Test WebSocket authentication fails when token missing required claims"""
        from backend.api.v1.endpoints.websocket import get_current_user_ws

        # Token missing 'sub' claim
        incomplete_payload = {
            "email": "user@example.com"
            # Missing 'sub' (user_id)
        }

        with patch('backend.api.v1.endpoints.websocket.decode_token', return_value=incomplete_payload):
            user = await get_current_user_ws(mock_websocket, token="incomplete_token")

            assert user is None
            mock_websocket.close.assert_called_once_with(code=1008, reason="Invalid token")

    @pytest.mark.asyncio
    async def test_authenticate_websocket_expired_token(self, mock_websocket):
        """Test WebSocket authentication fails with expired token"""
        from backend.api.v1.endpoints.websocket import get_current_user_ws

        with patch('backend.api.v1.endpoints.websocket.decode_token', side_effect=Exception("Token expired")):
            user = await get_current_user_ws(mock_websocket, token="expired_token")

            assert user is None
            mock_websocket.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_authenticate_websocket_malformed_token(self, mock_websocket):
        """Test WebSocket authentication fails with malformed token"""
        from backend.api.v1.endpoints.websocket import get_current_user_ws

        malformed_tokens = [
            "not.a.jwt",
            "invalid",
            ".",
            "...",
            "",
            "Bearer token_value"  # Wrong format
        ]

        for token in malformed_tokens:
            mock_websocket.reset_mock()

            with patch('backend.api.v1.endpoints.websocket.decode_token', side_effect=Exception("Malformed")):
                user = await get_current_user_ws(mock_websocket, token=token)

                assert user is None
                mock_websocket.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_authenticate_websocket_token_with_special_characters(self, mock_websocket):
        """Test WebSocket authentication handles tokens with special characters"""
        from backend.api.v1.endpoints.websocket import get_current_user_ws

        mock_payload = {
            "sub": "456",
            "email": "user+test@example.com",
            "full_name": "Test User's Name with 'quotes'",
            "role": "admin"
        }

        with patch('backend.api.v1.endpoints.websocket.decode_token', return_value=mock_payload):
            user = await get_current_user_ws(mock_websocket, token="token_with_special_chars")

            assert user is not None
            assert user.email == "user+test@example.com"

    @pytest.mark.asyncio
    async def test_authenticate_websocket_rejects_tampered_token(self, mock_websocket):
        """Test WebSocket authentication rejects tampered tokens"""
        from backend.api.v1.endpoints.websocket import get_current_user_ws

        # Simulate tampered token (signature verification fails)
        with patch('backend.api.v1.endpoints.websocket.decode_token', side_effect=Exception("Signature verification failed")):
            user = await get_current_user_ws(mock_websocket, token="tampered.token.signature")

            assert user is None
            mock_websocket.close.assert_called_once_with(code=1008, reason="Authentication failed")


class TestConnectionManager:
    """Test WebSocket connection manager"""

    @pytest.fixture
    def manager(self):
        """Create a fresh connection manager for each test"""
        return ConnectionManager()

    @pytest.fixture
    def mock_websocket(self):
        """Create a mock WebSocket"""
        ws = AsyncMock(spec=WebSocket)
        ws.accept = AsyncMock()
        ws.send_json = AsyncMock()
        return ws

    # Connection Management Tests

    @pytest.mark.asyncio
    async def test_connect_establishes_connection(self, manager, mock_websocket):
        """Test that connect establishes WebSocket connection"""
        connection_id = str(uuid.uuid4())
        user_id = 123

        await manager.connect(mock_websocket, connection_id, user_id)

        assert connection_id in manager.active_connections
        assert user_id in manager.user_connections
        assert connection_id in manager.user_connections[user_id]
        mock_websocket.accept.assert_called_once()
        mock_websocket.send_json.assert_called_once()  # Welcome message

    @pytest.mark.asyncio
    async def test_disconnect_cleanup(self, manager, mock_websocket):
        """Test that disconnect properly cleans up all references"""
        connection_id = str(uuid.uuid4())
        user_id = 456

        # Connect first
        await manager.connect(mock_websocket, connection_id, user_id)

        # Subscribe to pipeline
        pipeline_id = 789
        manager.subscribe_to_pipeline(connection_id, pipeline_id)

        # Verify setup
        assert connection_id in manager.active_connections
        assert connection_id in manager.pipeline_subscriptions[pipeline_id]

        # Disconnect
        manager.disconnect(connection_id)

        # Verify cleanup
        assert connection_id not in manager.active_connections
        assert connection_id not in manager.connection_metadata
        assert user_id not in manager.user_connections  # User has no connections left
        assert pipeline_id not in manager.pipeline_subscriptions  # No subscribers left

    @pytest.mark.asyncio
    async def test_multiple_connections_per_user(self, manager, mock_websocket):
        """Test that multiple connections per user are tracked correctly"""
        user_id = 789
        connection_id1 = str(uuid.uuid4())
        connection_id2 = str(uuid.uuid4())

        mock_ws1 = AsyncMock(spec=WebSocket)
        mock_ws1.accept = AsyncMock()
        mock_ws1.send_json = AsyncMock()

        mock_ws2 = AsyncMock(spec=WebSocket)
        mock_ws2.accept = AsyncMock()
        mock_ws2.send_json = AsyncMock()

        await manager.connect(mock_ws1, connection_id1, user_id)
        await manager.connect(mock_ws2, connection_id2, user_id)

        assert len(manager.user_connections[user_id]) == 2
        assert connection_id1 in manager.user_connections[user_id]
        assert connection_id2 in manager.user_connections[user_id]
        assert manager.get_user_connection_count(user_id) == 2

    @pytest.mark.asyncio
    async def test_connection_metadata_storage(self, manager, mock_websocket):
        """Test that connection metadata is stored correctly"""
        connection_id = str(uuid.uuid4())
        user_id = 101
        metadata = {"client_version": "1.0.0", "device": "mobile"}

        await manager.connect(mock_websocket, connection_id, user_id, metadata)

        assert connection_id in manager.connection_metadata
        stored_metadata = manager.connection_metadata[connection_id]
        assert stored_metadata["user_id"] == user_id
        assert stored_metadata["metadata"] == metadata
        assert "connected_at" in stored_metadata

    def test_get_connection_count(self, manager):
        """Test that connection count is tracked correctly"""
        assert manager.get_connection_count() == 0

        # Manually add connections for testing
        manager.active_connections["conn1"] = Mock()
        manager.active_connections["conn2"] = Mock()
        manager.active_connections["conn3"] = Mock()

        assert manager.get_connection_count() == 3

    def test_get_pipeline_subscriber_count(self, manager):
        """Test that pipeline subscriber count is tracked correctly"""
        pipeline_id = 555
        assert manager.get_pipeline_subscriber_count(pipeline_id) == 0

        # Add subscribers
        manager.subscribe_to_pipeline("conn1", pipeline_id)
        manager.subscribe_to_pipeline("conn2", pipeline_id)
        manager.subscribe_to_pipeline("conn3", pipeline_id)

        assert manager.get_pipeline_subscriber_count(pipeline_id) == 3


class TestMessageBroadcasting:
    """Test WebSocket message broadcasting"""

    @pytest.fixture
    def manager(self):
        """Create a fresh connection manager"""
        return ConnectionManager()

    @pytest.fixture
    def mock_websocket(self):
        """Create a mock WebSocket"""
        ws = AsyncMock(spec=WebSocket)
        ws.accept = AsyncMock()
        ws.send_json = AsyncMock()
        return ws

    # Message Sending Tests

    @pytest.mark.asyncio
    async def test_send_personal_message(self, manager, mock_websocket):
        """Test sending message to specific connection"""
        connection_id = str(uuid.uuid4())
        user_id = 202

        await manager.connect(mock_websocket, connection_id, user_id)
        mock_websocket.send_json.reset_mock()  # Clear welcome message

        message = {"type": "test", "data": "personal_message"}
        await manager.send_personal_message(message, connection_id)

        mock_websocket.send_json.assert_called_once_with(message)

    @pytest.mark.asyncio
    async def test_send_to_user_all_connections(self, manager):
        """Test sending message to all connections of a user"""
        user_id = 303
        conn_id1 = str(uuid.uuid4())
        conn_id2 = str(uuid.uuid4())

        ws1 = AsyncMock(spec=WebSocket)
        ws1.accept = AsyncMock()
        ws1.send_json = AsyncMock()

        ws2 = AsyncMock(spec=WebSocket)
        ws2.accept = AsyncMock()
        ws2.send_json = AsyncMock()

        await manager.connect(ws1, conn_id1, user_id)
        await manager.connect(ws2, conn_id2, user_id)

        ws1.send_json.reset_mock()
        ws2.send_json.reset_mock()

        message = {"type": "user_notification", "data": "for_all_user_connections"}
        await manager.send_to_user(message, user_id)

        # Both connections should receive the message
        ws1.send_json.assert_called_once_with(message)
        ws2.send_json.assert_called_once_with(message)

    @pytest.mark.asyncio
    async def test_broadcast_to_all_connections(self, manager):
        """Test broadcasting message to all connections"""
        ws1 = AsyncMock(spec=WebSocket)
        ws1.accept = AsyncMock()
        ws1.send_json = AsyncMock()

        ws2 = AsyncMock(spec=WebSocket)
        ws2.accept = AsyncMock()
        ws2.send_json = AsyncMock()

        ws3 = AsyncMock(spec=WebSocket)
        ws3.accept = AsyncMock()
        ws3.send_json = AsyncMock()

        await manager.connect(ws1, "conn1", 1)
        await manager.connect(ws2, "conn2", 2)
        await manager.connect(ws3, "conn3", 3)

        ws1.send_json.reset_mock()
        ws2.send_json.reset_mock()
        ws3.send_json.reset_mock()

        message = {"type": "broadcast", "data": "for_everyone"}
        await manager.broadcast(message)

        # All connections should receive the message
        ws1.send_json.assert_called_once_with(message)
        ws2.send_json.assert_called_once_with(message)
        ws3.send_json.assert_called_once_with(message)

    @pytest.mark.asyncio
    async def test_broadcast_with_exclusion(self, manager):
        """Test broadcasting with excluded connections"""
        ws1 = AsyncMock(spec=WebSocket)
        ws1.accept = AsyncMock()
        ws1.send_json = AsyncMock()

        ws2 = AsyncMock(spec=WebSocket)
        ws2.accept = AsyncMock()
        ws2.send_json = AsyncMock()

        await manager.connect(ws1, "conn1", 1)
        await manager.connect(ws2, "conn2", 2)

        ws1.send_json.reset_mock()
        ws2.send_json.reset_mock()

        message = {"type": "broadcast", "data": "selective"}
        await manager.broadcast(message, exclude={"conn1"})

        # Only conn2 should receive the message
        ws1.send_json.assert_not_called()
        ws2.send_json.assert_called_once_with(message)

    @pytest.mark.asyncio
    async def test_broadcast_to_pipeline_subscribers(self, manager):
        """Test broadcasting to pipeline subscribers only"""
        pipeline_id = 999

        ws1 = AsyncMock(spec=WebSocket)
        ws1.accept = AsyncMock()
        ws1.send_json = AsyncMock()

        ws2 = AsyncMock(spec=WebSocket)
        ws2.accept = AsyncMock()
        ws2.send_json = AsyncMock()

        ws3 = AsyncMock(spec=WebSocket)
        ws3.accept = AsyncMock()
        ws3.send_json = AsyncMock()

        await manager.connect(ws1, "conn1", 1)
        await manager.connect(ws2, "conn2", 2)
        await manager.connect(ws3, "conn3", 3)

        # Only conn1 and conn2 subscribe to pipeline
        manager.subscribe_to_pipeline("conn1", pipeline_id)
        manager.subscribe_to_pipeline("conn2", pipeline_id)

        ws1.send_json.reset_mock()
        ws2.send_json.reset_mock()
        ws3.send_json.reset_mock()

        message = {"type": "pipeline_update", "pipeline_id": pipeline_id, "status": "running"}
        await manager.broadcast_to_pipeline_subscribers(message, pipeline_id)

        # Only subscribers should receive the message
        ws1.send_json.assert_called_once_with(message)
        ws2.send_json.assert_called_once_with(message)
        ws3.send_json.assert_not_called()

    @pytest.mark.asyncio
    async def test_send_message_handles_disconnected_socket(self, manager):
        """Test that sending to disconnected socket handles error gracefully"""
        ws = AsyncMock(spec=WebSocket)
        ws.accept = AsyncMock()
        ws.send_json = AsyncMock(side_effect=Exception("Connection closed"))

        connection_id = str(uuid.uuid4())
        await manager.connect(ws, connection_id, 1)

        # Send message to disconnected socket
        message = {"type": "test"}
        await manager.send_personal_message(message, connection_id)

        # Connection should be automatically cleaned up
        assert connection_id not in manager.active_connections


# Run with: pytest testing/backend-tests/unit/services/test_websocket_authentication.py -v
# Run with coverage: pytest testing/backend-tests/unit/services/test_websocket_authentication.py -v --cov=backend.core.websocket --cov=backend.api.v1.endpoints.websocket --cov-report=term-missing
