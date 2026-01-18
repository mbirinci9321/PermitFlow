"""
PermitFlow Server Launcher
This script is the entry point for PyInstaller packaged app.
"""
import sys
import os

# Change to the directory where the exe is located
if getattr(sys, 'frozen', False):
    # Running as compiled exe
    exe_dir = os.path.dirname(sys.executable)
    os.chdir(exe_dir)
    
    # _MEIPASS is where PyInstaller extracts files
    base_path = sys._MEIPASS
    
    # Add paths for imports
    if base_path not in sys.path:
        sys.path.insert(0, base_path)
    
    # Also add the backend directory explicitly
    backend_path = os.path.join(base_path, 'backend')
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)

def main():
    try:
        import uvicorn
        import webbrowser
        import threading
        import time
        
        # Import the app
        from backend.main import app
        
        def open_browser():
            time.sleep(2)
            webbrowser.open("http://localhost:8000")
        
        # Start browser thread
        threading.Thread(target=open_browser, daemon=True).start()
        
        # Run server
        print("=" * 50)
        print("  PermitFlow Server v2.0")
        print("  Publisher: Murat Birinci Tech Labs")
        print("=" * 50)
        print(f"\nWorking Dir: {os.getcwd()}")
        print(f"Executable: {sys.executable if getattr(sys, 'frozen', False) else 'Python'}")
        print("\nStarting server on http://localhost:8000")
        print("Press Ctrl+C to stop\n")
        
        uvicorn.run(app, host="0.0.0.0", port=8000)
        
    except Exception as e:
        print(f"\n{'='*50}")
        print(f"[ERROR] Failed to start server!")
        print(f"{'='*50}")
        print(f"Error: {e}")
        print(f"\nWorking Directory: {os.getcwd()}")
        print(f"sys.path: {sys.path[:5]}...")
        import traceback
        traceback.print_exc()
        print(f"\n{'='*50}")
        print("Press Enter to exit...")
        input()
        sys.exit(1)

if __name__ == "__main__":
    main()
