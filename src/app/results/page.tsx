"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MatchResult } from "../../lib/types";
import Leaderboard from "../../components/results/Leaderboard";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerName = searchParams.get("name") || "Player";
  const [result, setResult] = useState<MatchResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("matchResult");
    if (stored) {
      setResult(JSON.parse(stored));
      sessionStorage.removeItem("matchResult");
    }
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Dados da partida nao encontrados</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Leaderboard result={result} />

        <button
          onClick={() => router.push(`/lobby?name=${encodeURIComponent(playerName)}`)}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-lg transition-colors"
        >
          Voltar ao Lobby
        </button>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <ResultsContent />
    </Suspense>
  );
}
