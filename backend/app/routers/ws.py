from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket_manager import ws_manager
import logging

logger = logging.getLogger("flowos.ws_router")
router = APIRouter(tags=["websocket"])

@router.websocket("/api/ws/updates")
@router.websocket("/ws/updates")
@router.websocket("/api/ws/beds")
async def websocket_hospital_updates(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial confirmation
        await websocket.send_json({"type": "CONNECTED", "message": "FlowOS Real-Time Live Stream connected"})
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        ws_manager.disconnect(websocket)
