"use client";

import { Room } from "../../lib/types";

interface RoomCardProps {
  room: Room;
  onJoin: (roomId: string) => void;
}

export default function RoomCard({ room, onJoin }: RoomCardProps) {
  const statusColors = {
    waiting: "bg-green-500",
    playing: "bg-yellow-500",
    finished: "bg-gray-500",
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-white font-semibold text-lg">{room.name}</h3>
        <span
          className={`${statusColors[room.status]} text-xs px-2 py-1 rounded-full text-white uppercase`}
        >
          {room.status}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-400">
        <div className="flex justify-between">
          <span>Players</span>
          <span className="text-white">
            {room.players.length} / {room.maxPlayers}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Entry Fee</span>
          <span className="text-yellow-400">
            {room.entryFee > 0 ? `$${room.entryFee}` : "Free"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Prize Pool</span>
          <span className="text-green-400">${room.prizePool}</span>
        </div>
      </div>

      {room.status === "waiting" && (
        <button
          onClick={() => onJoin(room.id)}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
        >
          Join Room {room.entryFee > 0 ? `($${room.entryFee})` : ""}
        </button>
      )}

      {room.status === "playing" && (
        <div className="w-full mt-4 bg-gray-700 text-gray-400 py-2 rounded-lg font-medium text-center">
          In Progress
        </div>
      )}
    </div>
  );
}
