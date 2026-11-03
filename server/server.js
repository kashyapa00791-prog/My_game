const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const rooms = new Map();
app.use(express.static(path.join(__dirname, "..", "public")));
app.get("/health", (_, res) => res.json({ ok: true, rooms: rooms.size }));

function roomFor(code) {
  if (!rooms.has(code)) rooms.set(code, new Map());
  return rooms.get(code);
}
function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}
function broadcast(room, data, except) {
  for (const client of room.values()) if (client !== except) send(client, data);
}
wss.on("connection", ws => {
  ws.id = Math.random().toString(36).slice(2, 9);
  ws.on("message", raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === "join") {
      const code = String(msg.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
      if (!code) return send(ws, { type: "error", message: "Room code required" });
      const room = roomFor(code);
      if (room.size >= 2) return send(ws, { type: "error", message: "Room is full" });
      ws.roomCode = code;
      room.set(ws.id, ws);
      send(ws, { type: "joined", code, player: room.size === 1 ? 1 : 2, count: room.size });
      broadcast(room, { type: "peer", count: room.size }, ws);
      if (room.size === 2) broadcast(room, { type: "ready" });
      return;
    }
    if (!ws.roomCode) return;
    const room = rooms.get(ws.roomCode);
    if (!room) return;
    if (msg.type === "state") broadcast(room, { type: "state", state: msg.state }, ws);
    if (msg.type === "action") broadcast(room, { type: "action", action: msg.action }, ws);
  });
  ws.on("close", () => {
    if (!ws.roomCode) return;
    const room = rooms.get(ws.roomCode);
    if (!room) return;
    room.delete(ws.id);
    broadcast(room, { type: "peer", count: room.size });
    if (!room.size) rooms.delete(ws.roomCode);
  });
});
const PORT = Number(process.env.PORT || 8080);
server.listen(PORT, "0.0.0.0", () => console.log(`Sansad Arena 3D running on http://0.0.0.0:${PORT}`));
