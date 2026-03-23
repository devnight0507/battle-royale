"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { getSocket } from "../../lib/socket";
import { MatchResult } from "../../lib/types";

const PhaserGame = dynamic(
  () => import("../../components/game/PhaserGame"),
  { ssr: false, loading: () => <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Loading game...</div> }
);

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerName = searchParams.get("name") || "Player";
  const roomId = searchParams.get("roomId") || "";

  useEffect(() => {
    const socket = getSocket();

    socket.on("game:ended", (result: MatchResult) => {
      sessionStorage.setItem("matchResult", JSON.stringify(result));
      setTimeout(() => {
        router.push(`/results?name=${encodeURIComponent(playerName)}`);
      }, 2000);
    });

    return () => {
      socket.off("game:ended");
    };
  }, [router, playerName]);

  if (!roomId) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center text-white">
        <p>No room ID found. Go back to lobby.</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <PhaserGame roomId={roomId} playerName={playerName} />
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-black" />}>
      <GameContent />
    </Suspense>
  );
}
