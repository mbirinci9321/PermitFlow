import asyncio
import websockets
import json
import socket
import os
import platform
import logging
from datetime import datetime

# Setup Logging
import os
app_name = "PermitFlow"
if os.name == 'nt':
    app_data = os.getenv('APPDATA')
else:
    app_data = os.path.expanduser("~/.local/share")

data_dir = os.path.join(app_data, app_name)
if not os.path.exists(data_dir):
    try:
        os.makedirs(data_dir, exist_ok=True)
    except:
        data_dir = "." # Fallback

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(data_dir, "agent.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("PermitFlowAgent")

import sys
# If running as a frozen executable, add the exe directory to sys.path
# so it can find 'env.py' if placed next to the exe.
if getattr(sys, 'frozen', False):
    exe_dir = os.path.dirname(sys.executable)
    if exe_dir not in sys.path:
        sys.path.insert(0, exe_dir)

# Load Configuration
try:
    import env
    SERVER_URL = env.SERVER_URL.rstrip('/') # Remove trailing slash
    AGENT_ID = env.AGENT_ID
except ImportError:
    SERVER_URL = "http://localhost:8000"
    AGENT_ID = socket.gethostname()

# Use normalize URL for WebSocket
clean_server_url = SERVER_URL.replace('http://', '').replace('https://', '')
ws_protocol = "ws" if SERVER_URL.startswith("http://") else "wss"
WS_URL = f"{ws_protocol}://{clean_server_url}/api/agents/ws/{AGENT_ID}"

async def send_heartbeat(websocket):
    while True:
        try:
            await websocket.send(json.dumps({
                "type": "heartbeat",
                "hostname": AGENT_ID,
                "timestamp": datetime.utcnow().isoformat()
            }))
            await asyncio.sleep(7200) # 2 hours heartbeat (requested by user to reduce load)
        except Exception as e:
            logger.error(f"Heartbeat failed: {e}")
            break

async def handle_command(command):
    cmd_type = command.get('type')
    
    if cmd_type == 'create_folder':
        path = command.get('path')
        try:
            # Check if path is absolute or needs base
            # For security, you might want to restrict this to specific drives
            if not os.path.exists(path):
                os.makedirs(path)
                logger.info(f"Created directory: {path}")
                return {"status": "success", "message": f"Created {path}"}
            else:
                logger.info(f"Directory exists: {path}")
                return {"status": "ignored", "message": "Already exists"}
        except Exception as e:
            logger.error(f"Failed to create folder {path}: {e}")
            return {"status": "error", "error": str(e)}

    elif cmd_type == 'check_path':
        path = command.get('path')
        try:
            exists = os.path.exists(path)
            return {"status": "success", "exists": exists, "path": path}
        except Exception as e:
             return {"status": "error", "error": str(e)}
            
    elif cmd_type == 'list_shares':
        try:
            # Use powershell to get SMB shares
            import subprocess
            cmd = "Get-SmbShare | Where-Object { $_.Special -eq $false } | Select-Object Name, Path | ConvertTo-Json"
            result = subprocess.run(["powershell", "-Command", cmd], capture_output=True, text=True)
            if result.returncode == 0 and result.stdout.strip():
                shares = json.loads(result.stdout)
                # If there's only one share, ConvertTo-Json might return a single object, not a list
                if isinstance(shares, dict):
                    shares = [shares]
                return {"status": "success", "shares": shares}
            return {"status": "success", "shares": []}
        except Exception as e:
            logger.error(f"Failed to list shares: {e}")
            return {"status": "error", "error": str(e)}
            
    return {"status": "unknown_command"}

async def run_agent():
    logger.info(f"Starting Agent {AGENT_ID} connecting to {WS_URL}")
    
    while True:
        try:
            async with websockets.connect(WS_URL) as websocket:
                logger.info("Connected to Master Server")
                
                # Start Heartbeat Task
                heartbeat_task = asyncio.create_task(send_heartbeat(websocket))
                
                try:
                    async for message in websocket:
                        data = json.loads(message)
                        logger.info(f"Received command: {data}")
                        
                        # Execute Command
                        result = await handle_command(data)
                        
                        # Send Response
                        response = {
                            "type": "response",
                            "original_command": data,
                            "result": result
                        }
                        await websocket.send(json.dumps(response))
                        
                except websockets.exceptions.ConnectionClosed:
                    logger.warning("Connection closed by server")
                finally:
                    heartbeat_task.cancel()
                    
        except Exception as e:
            logger.error(f"Connection error: {e}")
            
        logger.info("Reconnecting in 5 seconds...")
        await asyncio.sleep(5)

if __name__ == "__main__":
    if platform.system() != "Windows":
        logger.warning("This agent is optimized for Windows but running on other OS.")
        
    try:
        asyncio.run(run_agent())
    except KeyboardInterrupt:
        logger.info("Agent stopped by user")
