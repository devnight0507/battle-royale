const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();

// We need to register ts-node to import TS modules
require("ts-node").register({
  compilerOptions: {
    module: "commonjs",
    target: "es2017",
    esModuleInterop: true,
    moduleResolution: "node",
    strict: false,
    baseUrl: ".",
    paths: { "@/*": ["./src/*"] },
  },
  transpileOnly: true,
});

const gameManager = require("./src/server/gameManager");

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  // Track which room each socket is in
  const socketRoomMap = new Map();

  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // List rooms
    socket.on("room:list", (callback) => {
      if (typeof callback === "function") {
        callback(gameManager.getRooms());
      }
    });

    // Create room
    socket.on("room:create", (data, callback) => {
      const { name, entryFee, maxPlayers } = data;
      const room = gameManager.createRoom(
        name,
        entryFee || 0,
        maxPlayers || 10,
        socket.id
      );
      if (typeof callback === "function") {
        callback(room.toRoom());
      }
      io.emit("room:updated", gameManager.getRooms());
    });

    // Join room
    socket.on("room:join", (data, callback) => {
      const { roomId, playerName } = data;
      const room = gameManager.getRoom(roomId);

      if (!room) {
        if (typeof callback === "function") callback({ error: "Room not found" });
        return;
      }

      const joined = room.addPlayer(socket.id, playerName);
      if (!joined) {
        if (typeof callback === "function") callback({ error: "Cannot join room" });
        return;
      }

      socket.join(roomId);
      socketRoomMap.set(socket.id, roomId);

      if (typeof callback === "function") {
        callback({ success: true, room: room.toRoom() });
      }
      io.emit("room:updated", gameManager.getRooms());
      io.to(roomId).emit("room:playerJoined", room.toRoom());
    });

    // Leave room
    socket.on("room:leave", (data) => {
      const roomId = data?.roomId || socketRoomMap.get(socket.id);
      if (!roomId) return;

      const room = gameManager.getRoom(roomId);
      if (!room) return;

      const shouldDelete = room.removePlayer(socket.id);
      socket.leave(roomId);
      socketRoomMap.delete(socket.id);

      if (shouldDelete) {
        gameManager.deleteRoom(roomId);
      }

      io.emit("room:updated", gameManager.getRooms());
    });

    // Start game
    socket.on("room:start", (data) => {
      const roomId = data?.roomId || socketRoomMap.get(socket.id);
      const room = gameManager.getRoom(roomId);
      if (!room) return;
      if (room.creatorId !== socket.id) return;

      room.onStateUpdate = (state) => {
        io.to(roomId).emit("game:state", state);
      };

      room.onPlayerDied = (playerId, killerId) => {
        io.to(roomId).emit("game:playerDied", { playerId, killerId });
      };

      room.onGameEnd = (result) => {
        io.to(roomId).emit("game:ended", result);
        io.emit("room:updated", gameManager.getRooms());
        // Clean up room after 10 seconds
        setTimeout(() => {
          gameManager.deleteRoom(roomId);
          io.emit("room:updated", gameManager.getRooms());
        }, 10000);
      };

      room.startGame();
      io.to(roomId).emit("game:started", room.getState());
      io.emit("room:updated", gameManager.getRooms());
    });

    // Game input
    socket.on("game:input", (data) => {
      const roomId = socketRoomMap.get(socket.id);
      if (!roomId) return;

      const room = gameManager.getRoom(roomId);
      if (!room) return;

      room.setInput(socket.id, {
        direction: data.direction || { x: 0, y: 0 },
        attack: data.attack || false,
      });
    });

    // Admin: get all rooms
    socket.on("admin:rooms", (callback) => {
      if (typeof callback === "function") {
        callback(gameManager.getRooms());
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${socket.id}`);
      const roomId = socketRoomMap.get(socket.id);
      if (roomId) {
        const room = gameManager.getRoom(roomId);
        if (room) {
          const shouldDelete = room.removePlayer(socket.id);
          if (shouldDelete) {
            gameManager.deleteRoom(roomId);
          }
        }
        socketRoomMap.delete(socket.id);
        io.emit("room:updated", gameManager.getRooms());
      }
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Battle Royale server ready on http://localhost:${PORT}`);
  });
});
