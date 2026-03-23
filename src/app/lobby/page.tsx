"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSocket } from "../../lib/socket";
import { Room } from "../../lib/types";
import RoomCard from "../../components/lobby/RoomCard";
import CreateRoomForm from "../../components/lobby/CreateRoomForm";

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerName = searchParams.get("name") || "Player";
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const currentRoomRef = useRef<Room | null>(null);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    s.emit("room:list", (roomList: Room[]) => {
      setRooms(roomList);
    });

    s.on("room:updated", (roomList: Room[]) => {
      setRooms(roomList);
    });

    s.on("room:playerJoined", (room: Room) => {
      setCurrentRoom(room);
    });

    s.on("game:started", () => {
      const roomId = currentRoomRef.current?.id || "";
      router.push(`/game?name=${encodeURIComponent(playerName)}&roomId=${encodeURIComponent(roomId)}`);
    });

    return () => {
      s.off("room:updated");
      s.off("room:playerJoined");
      s.off("game:started");
    };
  }, [playerName, router]);

  const handleCreateRoom = useCallback(
    (name: string, entryFee: number, maxPlayers: number) => {
      if (!socket) return;
      socket.emit(
        "room:create",
        { name, entryFee, maxPlayers },
        (room: Room) => {
          setShowCreateForm(false);
          // Auto-join created room
          socket.emit(
            "room:join",
            { roomId: room.id, playerName },
            (res: any) => {
              if (res.success) {
                setCurrentRoom(res.room);
              }
            }
          );
        }
      );
    },
    [socket, playerName]
  );

  const handleJoinRoom = useCallback(
    (roomId: string) => {
      if (!socket) return;
      socket.emit("room:join", { roomId, playerName }, (res: any) => {
        if (res.success) {
          setCurrentRoom(res.room);
        }
      });
    },
    [socket, playerName]
  );

  const handleLeaveRoom = useCallback(() => {
    if (!socket || !currentRoom) return;
    socket.emit("room:leave", { roomId: currentRoom.id });
    setCurrentRoom(null);
  }, [socket, currentRoom]);

  const handleStartGame = useCallback(() => {
    if (!socket || !currentRoom) return;
    socket.emit("room:start", { roomId: currentRoom.id });
  }, [socket, currentRoom]);

  // Waiting room view
  if (currentRoom) {
    const isCreator = socket && currentRoom.creatorId === socket.id;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 w-full max-w-lg">
          <h2 className="text-2xl font-bold text-white mb-2">{currentRoom.name}</h2>
          <div className="flex gap-4 text-sm text-gray-400 mb-6">
            <span>
              Entry: {currentRoom.entryFee > 0 ? `$${currentRoom.entryFee}` : "Free"}
            </span>
            <span>Prize Pool: ${currentRoom.prizePool}</span>
          </div>

          <div className="mb-6">
            <h3 className="text-sm text-gray-400 mb-3">
              Players ({currentRoom.players.length}/{currentRoom.maxPlayers})
            </h3>
            <div className="space-y-2">
              {currentRoom.players.map((p) => (
                <div
                  key={p.id}
                  className="bg-gray-900 rounded-lg px-4 py-2 text-white flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  {p.name}
                  {p.id === currentRoom.creatorId && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded ml-auto">
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleLeaveRoom}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
            >
              Leave
            </button>
            {isCreator && currentRoom.players.length >= 2 && (
              <button
                onClick={handleStartGame}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Start Game
              </button>
            )}
            {isCreator && currentRoom.players.length < 2 && (
              <div className="flex-1 bg-gray-700 text-gray-400 py-2 rounded-lg text-center">
                Need 2+ players
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Room list view
  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Game Lobby</h1>
          <p className="text-gray-400 mt-1">
            Playing as <span className="text-blue-400">{playerName}</span>
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          + Create Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-xl mb-2">No rooms available</p>
          <p>Create a room to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onJoin={handleJoinRoom} />
          ))}
        </div>
      )}

      {showCreateForm && (
        <CreateRoomForm
          onSubmit={handleCreateRoom}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}

export default function LobbyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <LobbyContent />
    </Suspense>
  );
}
