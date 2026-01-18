from typing import List, Dict
from fastapi import WebSocket

import asyncio

class ConnectionManager:
    def __init__(self):
        # Store active connections: agent_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        # Store pending request futures: request_id -> Future
        self.pending_requests: Dict[str, asyncio.Future] = {}

    async def connect(self, agent_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[agent_id] = websocket
        print(f"Agent connected: {agent_id}")

    def disconnect(self, agent_id: str):
        if agent_id in self.active_connections:
            del self.active_connections[agent_id]
            print(f"Agent disconnected: {agent_id}")

    async def send_personal_message(self, message: dict, agent_id: str):
        if agent_id in self.active_connections:
            await self.active_connections[agent_id].send_json(message)
            return True
        return False

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

    def create_request(self, request_id: str):
        loop = asyncio.get_running_loop()
        future = loop.create_future()
        self.pending_requests[request_id] = future
        return future

    def resolve_request(self, request_id: str, data: dict):
        if request_id in self.pending_requests:
            future = self.pending_requests[request_id]
            if not future.done():
                future.set_result(data)
            del self.pending_requests[request_id]

manager = ConnectionManager()
