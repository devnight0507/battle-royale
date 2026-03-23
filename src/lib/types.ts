export interface Room {
  id: string;
  name: string;
  entryFee: number;
  maxPlayers: number;
  players: { id: string; name: string }[];
  status: "waiting" | "playing" | "finished";
  prizePool: number;
  creatorId: string;
}

export interface PlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  health: number;
  alive: boolean;
  kills: number;
  direction: { x: number; y: number };
  attackCooldown: number;
}

export interface ZoneState {
  centerX: number;
  centerY: number;
  currentRadius: number;
  targetRadius: number;
}

export interface GameState {
  players: Record<string, PlayerState>;
  zone: ZoneState;
  timeRemaining: number;
  phase: "warmup" | "playing" | "ended";
  playersAlive: number;
}

export interface MatchResult {
  roomId: string;
  rankings: {
    rank: number;
    playerId: string;
    playerName: string;
    kills: number;
    prize: number;
  }[];
  prizePool: number;
}

export interface GameInput {
  direction: { x: number; y: number };
  attack: boolean;
}

export const ARENA_WIDTH = 2000;
export const ARENA_HEIGHT = 2000;
export const TICK_RATE = 20;
export const PLAYER_SPEED = 150;
export const PLAYER_RADIUS = 16;
export const ATTACK_RANGE = 60;
export const ATTACK_DAMAGE = 18;
export const ATTACK_COOLDOWN = 500;
export const ZONE_DAMAGE_PER_SEC = 5;
