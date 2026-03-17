# Trillisent — Nmap Network Discovery

A full-stack web application for running **Nmap** network discovery scans, visualising discovered hosts and open ports, and persisting scan history in a **PostgreSQL** database.

## Tech Stack

| Layer    | Technology                                        |
|----------|---------------------------------------------------|
| Frontend | React + Vite + Tailwind CSS                       |
| Backend  | Node.js + Express                                 |
| ORM      | Prisma                                            |
| Database | PostgreSQL (Neon)                                 |
| Scanner  | Nmap (via `child_process` + XML output parsing)   |

## Project Structure

```
trillisent/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express entry point (port 4000)
│   │   ├── scanner.js        # Nmap wrapper — builds command, parses XML
│   │   └── routes/
│   │       └── scans.js      # CRUD endpoints for scan jobs
│   ├── prisma/
│   │   └── schema.prisma     # DB schema: ScanJob, Host, OpenPort
│   ├── .env                  # DATABASE_URL
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Tab navigation (Scanner / Results / History)
│   │   ├── api/client.js     # fetch wrappers for all endpoints
│   │   └── components/
│   │       ├── ScanForm.jsx      # Target input + scan type selector
│   │       ├── ScanResults.jsx   # Live-polling job status + host list
│   │       ├── HostCard.jsx      # Per-host: IP, ports table, OS guess
│   │       └── ScanHistory.jsx   # All past scans, click to view
│   └── vite.config.js        # Proxies /api → http://localhost:4000
└── README.md
```

## Database Schema

```prisma
model ScanJob {
  id           String    @id @default(uuid())
  target       String                          // e.g. 192.168.1.0/24
  scanType     String    @default("quick")     // ping | quick | full
  status       String    @default("pending")   // pending|running|completed|failed
  startedAt    DateTime  @default(now())
  completedAt  DateTime?
  errorMessage String?
  hosts        Host[]
}

model Host {
  id         String   @id @default(uuid())
  scanJobId  String
  ipAddress  String
  hostname   String?
  status     String   @default("up")
  osGuess    String?
  openPorts  OpenPort[]
}

model OpenPort {
  id       String  @id @default(uuid())
  hostId   String
  port     Int
  protocol String  @default("tcp")
  state    String  @default("open")
  service  String?
  version  String?
}
```

## API Endpoints

| Method | Endpoint         | Description                    |
|--------|-----------------|--------------------------------|
| POST   | `/api/scans`     | Start a new scan (async)       |
| GET    | `/api/scans`     | List all scan jobs             |
| GET    | `/api/scans/:id` | Get full scan + hosts + ports  |
| DELETE | `/api/scans/:id` | Delete a scan job              |
| GET    | `/api/health`    | Health check                   |

### POST `/api/scans` body

```json
{
  "target": "192.168.1.0/24",
  "scanType": "quick"
}
```

`scanType` options: `ping` | `quick` | `full`

Responds with `202 Accepted` immediately and a `jobId`. The frontend polls `GET /api/scans/:id` every 2.5 s until status is `completed` or `failed`.

## Prerequisites

- **Node.js** ≥ 18
- **Nmap** installed and on your system PATH
  - Windows: [https://nmap.org/download.html](https://nmap.org/download.html)
  - macOS: `brew install nmap`
  - Linux: `sudo apt install nmap`

## Setup & Running

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd trillisent
```

### 2. Backend

```bash
cd backend
npm install

# Push Prisma schema to your Postgres DB
npx prisma db push

# Start the API server
npm run dev   # runs on http://localhost:4000
```

The `.env` file contains the Neon database URL. Replace it with your own if needed:

```
DATABASE_URL="postgresql://..."
PORT=4000
```

### 3. Frontend

```bash
cd ../frontend
npm install
npm run dev   # runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

> The Vite dev server proxies `/api/*` requests to `http://localhost:4000`, so no CORS config is needed in development.

## Usage

1. Enter a scan **target** (IP, CIDR range, or hostname)
2. Choose a **scan type**: Ping · Quick · Full
3. Click **Launch Scan** — results update live via polling
4. Switch to **History** to browse all past scans
5. Click any past scan to reload its full results

## Scan Types

| Type  | Nmap Command         | Description                     |
|-------|---------------------|---------------------------------|
| Ping  | `nmap -sn`          | Host discovery only (fastest)   |
| Quick | `nmap -T4 -F`       | Top 100 ports                   |
| Full  | `nmap -T4 -p- -sV`  | All 65535 ports + version info  |

> **Note**: Full scans on subnets can take several minutes. Nmap must be installed and may require administrator/root privileges for certain scan types (e.g., OS detection, SYN scans).
