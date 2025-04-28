"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ws_1 = require("ws");
var http_1 = require("http");
var port = 3001;
var server = (0, http_1.createServer)();
var wss = new ws_1.WebSocketServer({ server: server });
var rooms = {};
function broadcastToRoom(roomId, data) {
    if (!rooms[roomId])
        return;
    rooms[roomId].forEach(function (member) {
        if (member.ws.readyState === ws_1.WebSocket.OPEN) {
            member.ws.send(JSON.stringify(data));
        }
    });
}
wss.on('connection', function (ws, req) {
    var reqUrl = req.url || '';
    var roomId = '';
    try {
        var parsedUrl = new URL(reqUrl, "ws://".concat(req.headers.host));
        roomId = parsedUrl.searchParams.get('roomId') || '';
    }
    catch (e) {
        ws.close();
        return;
    }
    if (!roomId) {
        ws.close();
        return;
    }
    // For demo: generate a random user
    var member = {
        id: Math.random().toString(36).substr(2, 9),
        pseudonym: 'User' + Math.floor(Math.random() * 1000),
        ws: ws,
        roomId: roomId
    };
    if (!rooms[roomId])
        rooms[roomId] = [];
    rooms[roomId].push(member);
    // Send updated member list
    broadcastToRoom(roomId, {
        type: 'memberList',
        members: rooms[roomId].map(function (_a) {
            var id = _a.id, pseudonym = _a.pseudonym;
            return ({ id: id, pseudonym: pseudonym });
        })
    });
    ws.on('message', function (data) {
        try {
            var msg = JSON.parse(data.toString());
            if (msg.type === 'chat') {
                var message = {
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
        }
        catch (e) {
            // Ignore malformed messages
        }
    });
    ws.on('close', function () {
        if (rooms[roomId]) {
            rooms[roomId] = rooms[roomId].filter(function (m) { return m.ws !== ws; });
            broadcastToRoom(roomId, {
                type: 'memberList',
                members: rooms[roomId].map(function (_a) {
                    var id = _a.id, pseudonym = _a.pseudonym;
                    return ({ id: id, pseudonym: pseudonym });
                })
            });
        }
    });
});
server.listen(port, function () {
    console.log("WebSocket server running on ws://localhost:".concat(port));
});
