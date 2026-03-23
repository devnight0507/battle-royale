"use client";

import { useEffect, useRef } from "react";

interface PhaserGameProps {
  roomId: string;
  playerName: string;
}

export default function PhaserGame({ roomId, playerName }: PhaserGameProps) {
  const gameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current) return;

    const initPhaser = async () => {
      const Phaser = await import("phaser");
      const { BootScene } = await import("./scenes/BootScene");
      const { GameScene } = await import("./scenes/GameScene");
      const { UIScene } = await import("./scenes/UIScene");

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.CANVAS,
        parent: "phaser-container",
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "#0a0a0a",
        scene: [BootScene, GameScene, UIScene],
        physics: {
          default: "arcade",
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        render: {
          pixelArt: true,
          antialias: false,
        },
      };

      const game = new Phaser.Game(config);
      game.registry.set("roomId", roomId);
      game.registry.set("playerName", playerName);
      gameRef.current = game;
    };

    initPhaser();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [roomId, playerName]);

  return <div id="phaser-container" ref={containerRef} className="w-full h-full" />;
}
