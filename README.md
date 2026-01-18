# PermitFlow IT Management Console v2.0

PermitFlow is a robust IT infrastructure management suite designed to simplify folder provisioning, Active Directory group management, and access auditing across file servers.

## Features

-   **Dynamic Folder Provisioning:** Create complex folder structures on remote servers with one click.
-   **AD Group Integration:** Automatically generate and manage Active Directory groups (Read/Write) based on folder names.
-   **Inventory Search & Access Auditor:** Scan and index existing SMB shares and search for users, groups, or paths.
-   **Smart Agent Architecture:** Lightweight agents running on file servers execute commands and report heartbeat status.
-   **Operations History:** Review all past actions with the ability to **Undo (Rollback)** changes.
-   **Modern UI/UX:** Sleek Dashboard built with React, Tailwind CSS, and Lucide Icons.

## Technology Stack

-   **Backend:** FastAPI (Python), SQLAlchemy (SQLite), Uvicorn.
-   **Frontend:** React, Vite, Tailwind CSS, Lucide React.
-   **Agent:** Python, Websockets, PyInstaller.
-   **Installer:** Inno Setup.

## Installation

1.  Download `PermitFlowSetup.exe` from the latest release.
2.  Follow the installation wizard (includes license agreement).
3.  Launch PermitFlow from the desktop shortcut.

## Agent Deployment

1.  Navigate to the **Agent Status** tab in the Dashboard.
2.  Download the `.ps1` installer.
3.  Run the script on your target file server. The agent will install to `C:\PermitFlowAgent` and start automatically.

## License

This software is provided by **Murat Birinci Tech Labs**. See `LICENSE` for details.

---
Developed by [Murat Birinci](https://muratbirinci.com.tr)
