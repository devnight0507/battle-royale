"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const router = useRouter();

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    router.push(`/lobby?name=${encodeURIComponent(playerName.trim())}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="text-center mb-10">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          BATTLE ROYALE
        </h1>
        <p className="text-gray-400 mt-3 text-lg">O ultimo em pe leva o premio</p>
      </div>

      <form onSubmit={handleEnter} className="w-full max-w-sm space-y-4">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Digite seu nome..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          maxLength={20}
          required
          autoFocus
        />
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-lg transition-colors"
        >
          Entrar no Lobby
        </button>
      </form>

      <div className="mt-12 text-center text-gray-600 text-sm space-y-1">
        <p>WASD para mover | Clique para atacar</p>
        <p>Fique dentro da zona | Top 3 ganham premios</p>
      </div>
    </div>
  );
}
