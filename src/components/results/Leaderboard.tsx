"use client";

import { MatchResult } from "../../lib/types";

interface LeaderboardProps {
  result: MatchResult;
}

const trophyColors = ["text-yellow-400", "text-gray-400", "text-amber-600"];
const bgColors = ["bg-yellow-400/10 border-yellow-400/30", "bg-gray-400/10 border-gray-400/30", "bg-amber-600/10 border-amber-600/30"];
const labels = ["1st Place", "2nd Place", "3rd Place"];

export default function Leaderboard({ result }: LeaderboardProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Match Results</h2>
        <p className="text-gray-400 mt-1">
          Prize Pool: <span className="text-green-400 font-semibold">${result.prizePool}</span>
        </p>
      </div>

      {result.rankings.map((entry, i) => (
        <div
          key={entry.playerId}
          className={`border rounded-xl p-4 ${bgColors[i] || "bg-gray-800 border-gray-700"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold ${trophyColors[i] || "text-gray-500"}`}>
                #{entry.rank}
              </span>
              <div>
                <p className="text-white font-semibold text-lg">{entry.playerName}</p>
                <p className="text-gray-400 text-sm">{labels[i]}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-bold text-xl">${entry.prize}</p>
              <p className="text-gray-400 text-sm">{entry.kills} kills</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
