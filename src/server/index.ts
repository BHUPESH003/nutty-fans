import 'dotenv/config';

import './websocket';
import { startBroadcastWorker } from './workers/broadcastWorker';
import { startWelcomeMessageWorker } from './workers/welcomeMessageWorker';

// WebSocket server boots on import (see `src/server/websocket.ts`).
startBroadcastWorker();
startWelcomeMessageWorker();

console.warn('[Server] realtime + workers started');
