import { Player } from "./Player";
import { Zone } from "./Zone";
import {
  GameState,
  GameInput,
  MatchResult,
  Room,
  TICK_RATE,
  ATTACK_RANGE,
  ATTACK_DAMAGE,
} from "../lib/types";

export class GameRoom {
  id: string;
  name: string;
  entryFee: number;
  maxPlayers: number;
  players: Map<string, Player>;
  zone: Zone;
  status: "waiting" | "playing" | "finished";
  creatorId: string;
  gameLoop: ReturnType<typeof setInterval> | null;
  lastTick: number;
  gameTime: number;
  inputs: Map<string, GameInput>;
  onStateUpdate: ((state: GameState) => void) | null;
  onGameEnd: ((result: MatchResult) => void) | null;
  onPlayerDied: ((playerId: string, killerId: string) => void) | null;

  constructor(
    id: string,
    name: string,
    entryFee: number,
    maxPlayers: number,
    creatorId: string
  ) {
    this.id = id;
    this.name = name;
    this.entryFee = entryFee;
    this.maxPlayers = maxPlayers;
    this.creatorId = creatorId;
    this.players = new Map();
    this.zone = new Zone();
    this.status = "waiting";
    this.gameLoop = null;
    this.lastTick = 0;
    this.gameTime = 0;
    this.inputs = new Map();
    this.onStateUpdate = null;
    this.onGameEnd = null;
    this.onPlayerDied = null;
  }

  addPlayer(socketId: string, playerName: string): boolean {
    if (this.status !== "waiting") return false;
    if (this.players.size >= this.maxPlayers) return false;
    if (this.players.has(socketId)) return false;

    this.players.set(socketId, new Player(socketId, playerName));
    return true;
  }

  removePlayer(socketId: string) {
    this.players.delete(socketId);
    this.inputs.delete(socketId);

    if (this.status === "playing") {
      const alive = [...this.players.values()].filter((p) => p.alive);
      if (alive.length <= 1) {
        this.endGame();
      }
    }

    if (this.players.size === 0 && this.status === "waiting") {
      return true; // room should be deleted
    }
    return false;
  }

  startGame() {
    if (this.status !== "waiting") return;
    if (this.players.size < 2) return;

    this.status = "playing";
    this.lastTick = Date.now();
    this.gameTime = 0;

    const tickInterval = 1000 / TICK_RATE;
    this.gameLoop = setInterval(() => this.tick(), tickInterval);
  }

  setInput(socketId: string, input: GameInput) {
    if (this.status !== "playing") return;
    this.inputs.set(socketId, input);
  }

  private tick() {
    const now = Date.now();
    const deltaMs = now - this.lastTick;
    this.lastTick = now;
    this.gameTime += deltaMs;

    // Process inputs
    for (const [socketId, input] of this.inputs) {
      const player = this.players.get(socketId);
      if (!player || !player.alive) continue;

      player.move(input.direction, deltaMs);

      if (input.attack && player.canAttack(now)) {
        this.processAttack(player, now);
      }
    }

    // Update zone
    this.zone.update(deltaMs);

    // Apply zone damage
    for (const player of this.players.values()) {
      if (!player.alive) continue;
      const dmg = this.zone.getDamage(player.x, player.y, deltaMs);
      if (dmg > 0) {
        const died = player.takeDamage(dmg);
        if (died && this.onPlayerDied) {
          this.onPlayerDied(player.id, "zone");
        }
      }
    }

    // Check win condition
    const alive = [...this.players.values()].filter((p) => p.alive);
    if (alive.length <= 1) {
      this.endGame();
      return;
    }

    // Broadcast state
    if (this.onStateUpdate) {
      this.onStateUpdate(this.getState());
    }
  }

  private processAttack(attacker: Player, now: number) {
    attacker.lastAttackTime = now;

    const dir = attacker.direction;
    if (dir.x === 0 && dir.y === 0) return;

    for (const target of this.players.values()) {
      if (target.id === attacker.id || !target.alive) continue;

      const dx = target.x - attacker.x;
      const dy = target.y - attacker.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > ATTACK_RANGE) continue;

      // Check if target is in front of attacker (within 90 degree cone)
      if (dist > 0) {
        const dot = (dx / dist) * dir.x + (dy / dist) * dir.y;
        if (dot < 0.3) continue;
      }

      const died = target.takeDamage(ATTACK_DAMAGE);
      if (died) {
        attacker.kills++;
        if (this.onPlayerDied) {
          this.onPlayerDied(target.id, attacker.id);
        }
      }
    }
  }

  private endGame() {
    this.status = "finished";
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }

    const rankings = [...this.players.values()]
      .sort((a, b) => {
        if (a.alive !== b.alive) return a.alive ? -1 : 1;
        if (a.kills !== b.kills) return b.kills - a.kills;
        return (b.deathTime || Infinity) - (a.deathTime || Infinity);
      })
      .slice(0, 3);

    const prizePool = this.entryFee * this.players.size;
    const splits = [0.6, 0.25, 0.15];

    const result: MatchResult = {
      roomId: this.id,
      prizePool,
      rankings: rankings.map((p, i) => ({
        rank: i + 1,
        playerId: p.id,
        playerName: p.name,
        kills: p.kills,
        prize: Math.floor(prizePool * (splits[i] || 0)),
      })),
    };

    if (this.onGameEnd) {
      this.onGameEnd(result);
    }
  }

  getState(): GameState {
    const playersObj: Record<string, any> = {};
    for (const [id, player] of this.players) {
      playersObj[id] = player.toState();
    }

    return {
      players: playersObj,
      zone: this.zone.toState(),
      timeRemaining: Math.max(0, 180 - this.gameTime / 1000),
      phase: this.status === "playing" ? "playing" : this.status === "finished" ? "ended" : "warmup",
      playersAlive: [...this.players.values()].filter((p) => p.alive).length,
    };
  }

  toRoom(): Room {
    return {
      id: this.id,
      name: this.name,
      entryFee: this.entryFee,
      maxPlayers: this.maxPlayers,
      players: [...this.players.values()].map((p) => ({
        id: p.id,
        name: p.name,
      })),
      status: this.status,
      prizePool: this.entryFee * this.players.size,
      creatorId: this.creatorId,
    };
  }
}
