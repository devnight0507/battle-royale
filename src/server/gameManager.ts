import { GameRoom } from "./GameRoom";
import { Room } from "../lib/types";

const rooms = new Map<string, GameRoom>();
let roomCounter = 0;

export function createRoom(
  name: string,
  entryFee: number,
  maxPlayers: number,
  creatorId: string
): GameRoom {
  roomCounter++;
  const id = `room_${roomCounter}`;
  const room = new GameRoom(id, name, entryFee, maxPlayers, creatorId);
  rooms.set(id, room);
  return room;
}

export function getRoom(roomId: string): GameRoom | undefined {
  return rooms.get(roomId);
}

export function getRooms(): Room[] {
  return [...rooms.values()]
    .filter((r) => r.status !== "finished")
    .map((r) => r.toRoom());
}

export function deleteRoom(roomId: string) {
  const room = rooms.get(roomId);
  if (room && room.gameLoop) {
    clearInterval(room.gameLoop);
  }
  rooms.delete(roomId);
}

export function findQuickMatch(): GameRoom | null {
  for (const room of rooms.values()) {
    if (room.status === "waiting" && room.players.size < room.maxPlayers) {
      return room;
    }
  }
  return null;
}
