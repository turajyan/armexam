# ArmExam Terminal — Setup Guide

## Architecture: one server, many kiosks

```
[Server machine]          [Kiosk 1]  [Kiosk 2]  ... [Kiosk N]
 Windows/Linux PC    ←──  ArmExam    ArmExam        ArmExam
 IP: 192.168.1.100        Terminal   Terminal       Terminal
 Port: 4000
```

## Step 1 — Start the server (one machine per classroom)

```bash
cd terminal/backend
node server.js
```

The server binds to `0.0.0.0:4000` — reachable from all machines on the LAN.  
Find the server IP: `ipconfig` (Windows) or `ip addr` (Linux).

## Step 2 — Configure each kiosk

Create `terminal-config.json` next to `ArmExam Terminal.exe`:

```json
{ "serverUrl": "http://192.168.1.100:4000" }
```

Replace `192.168.1.100` with the actual IP of the server machine.

**Alternative — environment variable (no file needed):**
```
set ARMEXAM_SERVER=http://192.168.1.100:4000
```

**Priority:** config file → ENV → fallback (localhost)

## Step 3 — Launch kiosks

Double-click `ArmExam Terminal.exe`.  
The terminal shows a connecting screen, pings the server, then shows the PIN screen.

If the server is unreachable, the terminal shows an error screen with a retry button
and instructions for the administrator.

## Firewall

Allow inbound TCP port **4000** on the server machine:

```
# Windows PowerShell (run as Administrator)
New-NetFirewallRule -DisplayName "ArmExam Server" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow
```

## Server CORS

The server already accepts requests from any origin (`cors({ origin: '*' })`).
No additional configuration needed for LAN access.
