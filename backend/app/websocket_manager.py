from fastapi import WebSocket
from typing import Set
import asyncio
import json
import logging

logger = logging.getLogger("flowos.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        payload = json.dumps(message)
        dead_connections = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception:
                dead_connections.add(connection)
        for dead in dead_connections:
            self.active_connections.discard(dead)

ws_manager = ConnectionManager()

def broadcast_sync(message: dict):
    """
    Safely trigger a WebSocket broadcast from synchronous routes or background tasks.
    """
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(ws_manager.broadcast(message))
    except RuntimeError:
        # If no running loop in current thread
        try:
            asyncio.run(ws_manager.broadcast(message))
        except Exception as e:
            logger.warning(f"Could not broadcast message synchronously: {e}")
