# Gartic Phone Clone — Build Instructions

## What to Build
A full-featured Gartic Phone clone: a real-time multiplayer online drawing and guessing game. Players take turns writing prompts, drawing them, and guessing what others drew — creating a chain of hilarious telephone-style miscommunication.

## Tech Stack
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS
- **Backend:** Node.js 20, Express, Socket.io 4, TypeScript
- **Drawing:** HTML5 Canvas API
- **Containerization:** Docker (multi-stage builds)
- **CI/CD:** CircleCI → Harness → CAP (CVS Application Platform)

---

## Project Structure

```
gartic-phone/
├── client/                  # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas/          # Drawing canvas component + tools
│   │   │   ├── Lobby/           # Room creation/join UI
│   │   │   ├── Prompt/          # Write prompt screen
│   │   │   ├── Guess/           # Guess from drawing screen
│   │   │   ├── Reveal/          # End-of-round animated reveal gallery
│   │   │   ├── Timer/           # Countdown timer
│   │   │   ├── Chat/            # In-game chat + emoji reactions
│   │   │   └── Scoreboard/      # Score display
│   │   ├── hooks/
│   │   │   ├── useSocket.ts     # Socket.io client hook
│   │   │   ├── useCanvas.ts     # Canvas drawing logic
│   │   │   └── useGame.ts       # Game state hook
│   │   ├── context/
│   │   │   └── GameContext.tsx  # Global game state
│   │   ├── pages/
│   │   │   ├── Home.tsx         # Landing / create / join room
│   │   │   ├── Lobby.tsx        # Pre-game lobby with settings
│   │   │   └── Game.tsx         # Active game screen router
│   │   ├── types/
│   │   │   └── index.ts         # All shared TypeScript types
│   │   └── App.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── index.ts             # Express + Socket.io server entry
│   │   ├── rooms/
│   │   │   ├── RoomManager.ts   # In-memory Map of roomCode → Room
│   │   │   └── Room.ts          # Room state model + player management
│   │   ├── game/
│   │   │   ├── GameEngine.ts    # Phase state machine, turn rotation
│   │   │   ├── modes/
│   │   │   │   ├── BaseMode.ts      # Abstract base class for all modes
│   │   │   │   ├── Classic.ts       # Classic mode (write→draw→guess→repeat)
│   │   │   │   ├── Animation.ts     # Animation mode
│   │   │   │   ├── ScoreAttack.ts   # Score attack (vote on best drawing)
│   │   │   │   ├── Icebreaker.ts    # Icebreaker (personal Q&A)
│   │   │   │   ├── Knockout.ts      # Elimination rounds
│   │   │   │   └── Sandwich.ts      # Alternating draw/write
│   │   │   └── PromptBank.ts    # 500+ built-in prompts/words
│   │   ├── events/
│   │   │   ├── roomEvents.ts    # Socket handlers: room lifecycle
│   │   │   ├── gameEvents.ts    # Socket handlers: game actions
│   │   │   └── drawEvents.ts    # Socket handlers: canvas strokes relay
│   │   └── utils/
│   │       └── timer.ts         # Server-side countdown, emits ticks
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .circleci/config.yml
└── README.md
```

---

## Game Modes

### 1. Classic (build this first — it's the baseline)
Chain: each player writes a prompt → passes to next who draws it → passes to next who guesses → repeat for N rounds → full chain revealed

### 2. Score Attack
Everyone draws the same prompt simultaneously. After drawing, players vote (star rating) on each other's drawings. Highest score wins.

### 3. Animation
Players draw sequential frames of an animation. Each player adds one frame based on the last frame they see.

### 4. Icebreaker
Instead of drawing prompts, players answer personal/fun questions about themselves. Others guess the author.

### 5. Knockout
Like classic but after each round reveal, players vote for worst drawing. Bottom player(s) eliminated until 1 remains.

### 6. Sandwich
Strict alternating: player A draws a prompt they invent → player B writes what they think it is → player C draws that → etc.

---

## Socket.io Event Contracts

### Client → Server
```typescript
'room:create'    { playerName: string, settings: RoomSettings }
'room:join'      { roomCode: string, playerName: string }
'room:leave'     { roomCode: string }
'game:start'     { roomCode: string }
'game:submit'    { roomCode: string, content: string, type: 'prompt' | 'drawing' | 'guess' }
'draw:stroke'    { roomCode: string, stroke: StrokeData }
'draw:clear'     { roomCode: string }
'draw:undo'      { roomCode: string }
'chat:message'   { roomCode: string, message: string }
'reaction:send'  { roomCode: string, emoji: string }
'vote:cast'      { roomCode: string, targetPlayerId: string }
```

### Server → Client
```typescript
'room:created'      { roomCode: string, players: Player[], settings: RoomSettings }
'room:updated'      { players: Player[] }
'game:phase'        { phase: GamePhase, assignment: Assignment, timeLimit: number }
'game:tick'         { secondsLeft: number }
'game:reveal'       { chains: Chain[] }
'draw:stroke'       { stroke: StrokeData }   // broadcast to room
'draw:clear'        {}
'score:update'      { scores: Record<string, number> }
'chat:message'      { playerName: string, message: string, timestamp: number }
'reaction:broadcast' { playerName: string, emoji: string }
'error'             { message: string }
```

---

## Key TypeScript Types (server/src/types/index.ts and client/src/types/index.ts)

```typescript
type GamePhase = 'lobby' | 'write' | 'draw' | 'guess' | 'vote' | 'reveal' | 'score'

type GameMode = 'classic' | 'animation' | 'score-attack' | 'icebreaker' | 'knockout' | 'sandwich'

interface Player {
  id: string           // socket id
  name: string
  color: string        // assigned avatar color
  isHost: boolean
  isConnected: boolean
  score: number
}

interface RoomSettings {
  mode: GameMode
  maxPlayers: number   // 2–16, default 8
  rounds: number       // 1–10, default 3
  drawTime: number     // seconds, default 90
  writeTime: number    // seconds, default 45
}

interface StrokeData {
  tool: 'pencil' | 'eraser' | 'fill' | 'rect' | 'circle' | 'line'
  color: string
  size: number
  points: Array<{ x: number; y: number }>
  opacity: number
}

interface Assignment {
  type: 'write' | 'draw' | 'guess' | 'vote' | 'watch'
  content?: string     // prompt text or drawing base64
  chainId: string
  roundNumber: number
}

interface ChainEntry {
  type: 'prompt' | 'drawing' | 'guess'
  content: string
  authorId: string
  authorName: string
}

interface Chain {
  id: string
  entries: ChainEntry[]
}
```

---

## Canvas Implementation Details

The canvas component must support:
- **Tools:** pencil (freehand), eraser, paint bucket (flood fill), rectangle, circle, line
- **Color palette:** 20 preset colors + custom hex color picker input
- **Brush size:** slider 1px–40px
- **Undo:** maintain array of ImageData snapshots (max 50), Ctrl+Z support
- **Clear:** confirm dialog then clear canvas
- **Touch support:** pointer events work for both mouse and touch/stylus
- **Live broadcast:** send stroke vectors via `draw:stroke` on pointerup, NOT continuous updates (to avoid flooding)
- **Spectator/guess mode:** canvas is readonly, replays incoming strokes smoothly

For flood fill, implement a BFS/scanline fill algorithm on the ImageData pixel array.

---

## Server Game Engine Design

`GameEngine.ts` is a phase state machine:

```
States: LOBBY → WRITE → DRAW ↔ GUESS (repeat) → VOTE (optional) → REVEAL → SCORE → LOBBY

On phase transition:
1. Stop current timer
2. Collect all submitted content
3. Rotate assignments (each player's submission goes to the next player)
4. Emit 'game:phase' to all players with their individual assignment
5. Start new timer, emit 'game:tick' every second
6. Auto-advance on timer expiry (submit blank if player hasn't submitted)
```

Assignment rotation:
- Players sorted by join order
- In round R, player at index I receives the chain that started with player at index `(I - R + playerCount) % playerCount`

---

## Reveal Gallery

The reveal screen animates each chain sequentially:
1. Show player 1's original prompt (card slides in)
2. Pause 2s, then flip to reveal the drawing made from it
3. Pause 2s, then flip to reveal the guess
4. Continue flipping through entire chain
5. After all cards shown, move to next player's chain
6. Flying emoji reactions overlay the screen when players react

Use CSS transitions for card flip (rotateY transform). Each card is 300×200px.

---

## Scoring

**Score Attack mode:**
- After all drawings submitted, each player rates all OTHER players' drawings 1–3 stars
- Server averages votes, assigns points proportional to average rating × 100
- Leaderboard shown after each round

**Knockout mode:**
- After reveal, players vote to eliminate 1 player (cannot vote for themselves)
- Player with most votes is eliminated (ties: random selection)
- Game ends when 2 players remain; winner is last standing

---

## CAP Deployment

### Client Dockerfile (multi-stage)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### nginx.conf (important: proxy /socket.io to server)
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /socket.io/ {
    proxy_pass http://gartic-server:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600;
    proxy_send_timeout 3600;
  }
}
```

### Server Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER appuser
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### docker-compose.yml (local dev)
```yaml
version: '3.8'
services:
  client:
    build: ./client
    ports: ['3000:80']
    depends_on: [server]
  server:
    build: ./server
    ports: ['3001:3001']
    environment:
      PORT: 3001
      CORS_ORIGIN: http://localhost:3000
```

### .circleci/config.yml
Use the CVS standard Node.js Docker app template:
```yaml
APP_TYPE: nodejs
APP_NAME: gartic-phone-server
NODE_BUILD_VERSION: cimg/node:20.0
```
Build both client and server images, push to JFrog Artifactory, deploy via Harness.

### CAP Ingress Annotations (required for WebSocket)
```yaml
nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
nginx.ingress.kubernetes.io/proxy-connect-timeout: "3600"
nginx.ingress.kubernetes.io/websocket-services: "gartic-phone-server"
```

---

## Build Order

1. **Server foundation** — `index.ts`, `Room.ts`, `RoomManager.ts`, `roomEvents.ts`
2. **Game engine Classic mode** — `GameEngine.ts`, `Classic.ts`, `timer.ts`, `gameEvents.ts`
3. **Canvas relay** — `drawEvents.ts`
4. **Client scaffold** — Vite setup, TailwindCSS, React Router, `useSocket.ts`, `GameContext.tsx`
5. **Client Lobby UI** — Home page, Lobby page, player list, settings
6. **Client game phases** — `Prompt.tsx`, `Draw.tsx` with canvas, `Guess.tsx`, `Timer.tsx`
7. **Reveal gallery** — animated chain flip cards, emoji reactions
8. **Remaining game modes** — Score Attack, Animation, Icebreaker, Knockout, Sandwich
9. **Polish** — sound effects (Web Audio API), mobile touch, responsive design
10. **Docker + CircleCI** — Dockerfiles, nginx.conf, docker-compose, CI config

---

## Environment Variables

### Server
```
PORT=3001
CORS_ORIGIN=http://localhost:3000   # set to CAP ingress URL in production
NODE_ENV=development|production
```

### Client (Vite)
```
VITE_SERVER_URL=http://localhost:3001   # set to CAP ingress URL in production
```

---

## Testing Checklist

- [ ] Two browsers: create room in one, join with code in other
- [ ] Full Classic mode round: write → draw → guess → draw → reveal
- [ ] Canvas: all tools work (pencil, eraser, fill, shapes), undo, clear
- [ ] Live drawing: strokes appear in real-time in the other browser
- [ ] Timer auto-advances phase when it hits 0
- [ ] Host disconnect: next player becomes host
- [ ] Reconnect: player rejoins same room within grace period
- [ ] Score Attack: vote UI appears, scores calculated correctly
- [ ] Knockout: elimination vote works, player removed from game
- [ ] Mobile: touch drawing works on phone/tablet
- [ ] Docker: `docker-compose up` starts both services, game works end-to-end

---

## Notes
- Keep all game state on the server — never trust client for game logic
- Canvas drawings are base64 PNG strings stored in chain entries (server-side)
- The `draw:stroke` events are ephemeral (not stored) — only the final canvas snapshot on submit is persisted in the chain
- Use `socket.to(roomCode).emit()` for room broadcasts, `socket.emit()` for individual responses
- Room codes: 6 uppercase alphanumeric characters, generated with `Math.random().toString(36).slice(2,8).toUpperCase()`
