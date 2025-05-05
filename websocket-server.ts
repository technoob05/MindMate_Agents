import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

interface Member {
  id: string;
  pseudonym: string;
  ws: WebSocket;
  roomId: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  roomId: string;
  isModerated?: boolean;
  moderationAction?: string;
}

const port = 3001;
const server = createServer();
const wss = new WebSocketServer({ server });

const rooms: Record<string, Member[]> = {};

function broadcastToRoom(roomId: string, data: any) {
  if (!rooms[roomId]) return;
  rooms[roomId].forEach(member => {
    if (member.ws.readyState === WebSocket.OPEN) {
      member.ws.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', (ws: WebSocket, req) => {
  const reqUrl = req.url || '';
  let roomId = '';
  try {
    const parsedUrl = new URL(reqUrl, `ws://${req.headers.host}`);
    roomId = parsedUrl.searchParams.get('roomId') || '';
  } catch (e) {
    ws.close();
    return;
  }
  if (!roomId) {
    ws.close();
    return;
  }

  // For demo: generate a random user
  const member: Member = {
    id: Math.random().toString(36).substr(2, 9),
    pseudonym: 'User' + Math.floor(Math.random() * 1000),
    ws,
    roomId
  };

  if (!rooms[roomId]) rooms[roomId] = [];
  rooms[roomId].push(member);

  // Send updated member list
  broadcastToRoom(roomId, {
    type: 'memberList',
    members: rooms[roomId].map(({ id, pseudonym }) => ({ id, pseudonym }))
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'chat') {
        const message: Message = {
          id: Math.random().toString(36).substr(2, 9),
          text: msg.text,
          senderId: member.id,
          senderName: member.pseudonym,
          timestamp: Date.now(),
          roomId: roomId
        };
        // TODO: Integrate moderation here if needed
        broadcastToRoom(roomId, message);
      }
    } catch (e) {
      // Ignore malformed messages
    }
  });

  ws.on('close', () => {
    if (rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter(m => m.ws !== ws);
      broadcastToRoom(roomId, {
        type: 'memberList',
        members: rooms[roomId].map(({ id, pseudonym }) => ({ id, pseudonym }))
      });
    }
  });
});

server.listen(port, () => {
  console.log(`WebSocket server running on ws://localhost:${port}`);
});