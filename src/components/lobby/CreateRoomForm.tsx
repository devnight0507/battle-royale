"use client";

import { useState } from "react";

interface CreateRoomFormProps {
  onSubmit: (name: string, entryFee: number, maxPlayers: number) => void;
  onCancel: () => void;
}

export default function CreateRoomForm({ onSubmit, onCancel }: CreateRoomFormProps) {
  const [name, setName] = useState("");
  const [entryFee, setEntryFee] = useState(0);
  const [maxPlayers, setMaxPlayers] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), entryFee, maxPlayers);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md"
      >
        <h2 className="text-xl font-bold text-white mb-4">Create Room</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Room Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              placeholder="My Battle Room"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Entry Fee ($)</label>
            <select
              value={entryFee}
              onChange={(e) => setEntryFee(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value={0}>Free</option>
              <option value={1}>$1</option>
              <option value={5}>$5</option>
              <option value={10}>$10</option>
              <option value={25}>$25</option>
              <option value={50}>$50</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Max Players</label>
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value={2}>2 Players</option>
              <option value={4}>4 Players</option>
              <option value={6}>6 Players</option>
              <option value={10}>10 Players</option>
              <option value={20}>20 Players</option>
            </select>
          </div>

          {entryFee > 0 && (
            <div className="bg-gray-900 rounded-lg p-3 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Prize Pool (with {maxPlayers} players)</span>
                <span className="text-green-400 font-medium">
                  ${entryFee * maxPlayers}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>1st Place (60%)</span>
                  <span>${Math.floor(entryFee * maxPlayers * 0.6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>2nd Place (25%)</span>
                  <span>${Math.floor(entryFee * maxPlayers * 0.25)}</span>
                </div>
                <div className="flex justify-between">
                  <span>3rd Place (15%)</span>
                  <span>${Math.floor(entryFee * maxPlayers * 0.15)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
          >
            Create Room
          </button>
        </div>
      </form>
    </div>
  );
}
