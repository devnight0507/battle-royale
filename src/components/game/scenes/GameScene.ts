import * as Phaser from "phaser";
import { getSocket } from "../../../lib/socket";
import { GameState, PlayerState, ARENA_WIDTH, ARENA_HEIGHT } from "../../../lib/types";

interface PlayerVisual {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  nameText: Phaser.GameObjects.Text;
  healthBg: Phaser.GameObjects.Rectangle;
  healthBar: Phaser.GameObjects.Rectangle;
}

export class GameScene extends Phaser.Scene {
  private socket: any;
  private roomId: string = "";
  private localPlayerId: string = "";
  private playerVisuals: Map<string, PlayerVisual> = new Map();
  private zoneGraphics!: Phaser.GameObjects.Graphics;
  private arenaGraphics!: Phaser.GameObjects.Graphics;
  private keys: any;
  private lastState: GameState | null = null;
  private attacking: boolean = false;

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    this.socket = getSocket();
    this.roomId = this.registry.get("roomId") || "";
    this.localPlayerId = this.socket.id || "";

    // Draw arena background
    this.arenaGraphics = this.add.graphics();
    this.arenaGraphics.fillStyle(0x1a1a2e);
    this.arenaGraphics.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Draw arena grid
    this.arenaGraphics.lineStyle(1, 0x2a2a4e, 0.3);
    for (let x = 0; x <= ARENA_WIDTH; x += 100) {
      this.arenaGraphics.lineBetween(x, 0, x, ARENA_HEIGHT);
    }
    for (let y = 0; y <= ARENA_HEIGHT; y += 100) {
      this.arenaGraphics.lineBetween(0, y, ARENA_WIDTH, y);
    }

    // Draw arena border
    this.arenaGraphics.lineStyle(3, 0x4a4a8e);
    this.arenaGraphics.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Zone overlay
    this.zoneGraphics = this.add.graphics();
    this.zoneGraphics.setDepth(5);

    // Camera
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    this.cameras.main.setZoom(1);

    // Input
    this.keys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.input.on("pointerdown", () => {
      this.attacking = true;
    });

    // Listen for game state updates
    this.socket.on("game:state", (state: GameState) => {
      this.lastState = state;
      this.updatePlayers(state);
      this.updateZone(state);
    });

    this.socket.on("game:started", (state: GameState) => {
      this.lastState = state;
      this.localPlayerId = this.socket.id;
      this.updatePlayers(state);
      this.updateZone(state);
    });

    this.socket.on("game:playerDied", (data: { playerId: string; killerId: string }) => {
      if (data.playerId === this.localPlayerId) {
        this.showDeathMessage(data.killerId);
      }
    });

    // Start UI scene in parallel
    if (!this.scene.isActive("UIScene")) {
      this.scene.launch("UIScene");
    }
  }

  update() {
    const direction = { x: 0, y: 0 };
    if (this.keys.W.isDown) direction.y = -1;
    if (this.keys.S.isDown) direction.y = 1;
    if (this.keys.A.isDown) direction.x = -1;
    if (this.keys.D.isDown) direction.x = 1;

    this.socket.emit("game:input", {
      direction,
      attack: this.attacking,
    });
    this.attacking = false;

    // Follow local player
    if (this.lastState && this.lastState.players[this.localPlayerId]) {
      const p = this.lastState.players[this.localPlayerId];
      this.cameras.main.centerOn(p.x, p.y);
    }
  }

  private updatePlayers(state: GameState) {
    const currentIds = new Set(Object.keys(state.players));

    // Remove sprites for disconnected players
    for (const [id, visual] of this.playerVisuals) {
      if (!currentIds.has(id)) {
        visual.container.destroy();
        this.playerVisuals.delete(id);
      }
    }

    // Update or create sprites
    for (const [id, player] of Object.entries(state.players)) {
      let visual = this.playerVisuals.get(id);

      if (!visual) {
        visual = this.createPlayerVisual(id, player);
        this.playerVisuals.set(id, visual);
      }

      // Smooth movement
      this.tweens.add({
        targets: visual.container,
        x: player.x,
        y: player.y,
        duration: 50,
        ease: "Linear",
      });

      // Update sprite texture based on state
      if (!player.alive) {
        visual.sprite.setTexture("player_dead");
        visual.sprite.setAlpha(0.4);
      } else if (id === this.localPlayerId) {
        visual.sprite.setTexture("player_local");
        visual.sprite.setAlpha(1);
      } else {
        visual.sprite.setTexture("player_enemy");
        visual.sprite.setAlpha(1);
      }

      // Update health bar
      const healthWidth = (player.health / 100) * 30;
      visual.healthBar.setSize(healthWidth, 4);
      visual.healthBar.setX(-15 + healthWidth / 2);
      const color = player.health > 50 ? 0x22c55e : player.health > 25 ? 0xeab308 : 0xef4444;
      visual.healthBar.setFillStyle(color);

      // Show attack visual
      if (player.attackCooldown > 400 && player.alive) {
        this.showAttackSlash(player);
      }
    }
  }

  private createPlayerVisual(id: string, player: PlayerState): PlayerVisual {
    const isLocal = id === this.localPlayerId;
    const texture = !player.alive ? "player_dead" : isLocal ? "player_local" : "player_enemy";

    const sprite = this.add.sprite(0, 0, texture);
    const nameText = this.add.text(0, -24, player.name, {
      fontSize: "11px",
      color: isLocal ? "#22c55e" : "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5);

    const healthBg = this.add.rectangle(0, 20, 32, 4, 0x333333);
    const healthBar = this.add.rectangle(0, 20, 30, 4, 0x22c55e);

    const container = this.add.container(player.x, player.y, [sprite, nameText, healthBg, healthBar]);
    container.setDepth(10);

    return { container, sprite, nameText, healthBg, healthBar };
  }

  private updateZone(state: GameState) {
    this.zoneGraphics.clear();

    const { centerX, centerY, currentRadius } = state.zone;

    // Draw danger zone (outside safe area) as red overlay
    this.zoneGraphics.fillStyle(0xff0000, 0.15);
    this.zoneGraphics.fillRect(0, 0, ARENA_WIDTH, Math.max(0, centerY - currentRadius));
    this.zoneGraphics.fillRect(0, centerY + currentRadius, ARENA_WIDTH, ARENA_HEIGHT - (centerY + currentRadius));
    this.zoneGraphics.fillRect(0, centerY - currentRadius, Math.max(0, centerX - currentRadius), currentRadius * 2);
    this.zoneGraphics.fillRect(centerX + currentRadius, centerY - currentRadius, ARENA_WIDTH - (centerX + currentRadius), currentRadius * 2);

    // Draw safe zone border circle
    this.zoneGraphics.lineStyle(3, 0x3b82f6, 0.8);
    this.zoneGraphics.strokeCircle(centerX, centerY, currentRadius);

    // Draw target zone
    this.zoneGraphics.lineStyle(1, 0xfbbf24, 0.4);
    this.zoneGraphics.strokeCircle(centerX, centerY, state.zone.targetRadius);
  }

  private showAttackSlash(player: PlayerState) {
    const angle = Math.atan2(player.direction.y, player.direction.x);
    const slash = this.add.sprite(
      player.x + Math.cos(angle) * 30,
      player.y + Math.sin(angle) * 30,
      "slash"
    );
    slash.setRotation(angle);
    slash.setDepth(15);
    slash.setAlpha(0.8);

    this.tweens.add({
      targets: slash,
      alpha: 0,
      scale: 1.5,
      duration: 200,
      onComplete: () => slash.destroy(),
    });
  }

  private showDeathMessage(killerId: string) {
    const msg = killerId === "zone" ? "Eliminated by the zone!" : "You were eliminated!";
    const text = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      msg,
      {
        fontSize: "32px",
        color: "#ef4444",
        stroke: "#000000",
        strokeThickness: 4,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 50,
      duration: 3000,
      onComplete: () => text.destroy(),
    });
  }
}
