"use client";

import { useEffect, useState } from "react";
import { getSocket } from "../../lib/socket";
import { Room } from "../../lib/types";

export default function AdminPage() {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    const socket = getSocket();

    const fetchRooms = () => {
      socket.emit("admin:rooms", (roomList: Room[]) => {
        if (roomList) setRooms(roomList);
      });
    };

    // Fetch once connected
    if (socket.connected) {
      fetchRooms();
    }
    socket.on("connect", fetchRooms);

    const interval = setInterval(fetchRooms, 2000);

    socket.on("room:updated", (roomList: Room[]) => {
      if (roomList) setRooms(roomList);
    });

    return () => {
      clearInterval(interval);
      socket.off("room:updated");
      socket.off("connect", fetchRooms);
    };
  }, []);

  const totalPlayers = rooms.reduce((sum, r) => sum + r.players.length, 0);
  const activePlaying = rooms.filter((r) => r.status === "playing").length;

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
      <p className="text-gray-400 mb-8">Battle Royale Server Management</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{rooms.length}</p>
          <p className="text-sm text-gray-400">Total Rooms</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{totalPlayers}</p>
          <p className="text-sm text-gray-400">Total Players</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400">{activePlaying}</p>
          <p className="text-sm text-gray-400">Active Matches</p>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-sm">
              <th className="text-left px-4 py-3">Room</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Players</th>
              <th className="text-left px-4 py-3">Entry Fee</th>
              <th className="text-left px-4 py-3">Prize Pool</th>
              <th className="text-left px-4 py-3">Player List</th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No active rooms
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{room.name}</p>
                    <p className="text-xs text-gray-500">{room.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        room.status === "waiting"
                          ? "bg-green-500/20 text-green-400"
                          : room.status === "playing"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {room.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white">
                    {room.players.length}/{room.maxPlayers}
                  </td>
                  <td className="px-4 py-3 text-yellow-400">
                    {room.entryFee > 0 ? `$${room.entryFee}` : "Free"}
                  </td>
                  <td className="px-4 py-3 text-green-400">${room.prizePool}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {room.players.map((p) => p.name).join(", ") || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
