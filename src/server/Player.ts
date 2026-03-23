import {
  PlayerState,
  ARENA_WIDTH,
  ARENA_HEIGHT,
  PLAYER_SPEED,
  ATTACK_COOLDOWN,
} from "../lib/types";

export class Player {
  id: string;
  name: string;
  x: number;
  y: number;
  health: number;
  alive: boolean;
  kills: number;
  direction: { x: number; y: number };
  lastAttackTime: number;
  deathTime: number;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.health = 100;
    this.alive = true;
    this.kills = 0;
    this.direction = { x: 0, y: 0 };
    this.lastAttackTime = 0;
    this.deathTime = 0;

    const angle = Math.random() * Math.PI * 2;
    const dist = 600 + Math.random() * 200;
    this.x = ARENA_WIDTH / 2 + Math.cos(angle) * dist;
    this.y = ARENA_HEIGHT / 2 + Math.sin(angle) * dist;
  }

  move(direction: { x: number; y: number }, deltaMs: number) {
    if (!this.alive) return;

    const mag = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (mag === 0) return;

    const nx = direction.x / mag;
    const ny = direction.y / mag;
    const deltaSec = deltaMs / 1000;

    this.x += nx * PLAYER_SPEED * deltaSec;
    this.y += ny * PLAYER_SPEED * deltaSec;
    this.direction = { x: nx, y: ny };

    this.x = Math.max(0, Math.min(ARENA_WIDTH, this.x));
    this.y = Math.max(0, Math.min(ARENA_HEIGHT, this.y));
  }

  takeDamage(amount: number): boolean {
    if (!this.alive) return false;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.alive = false;
      this.deathTime = Date.now();
      return true;
    }
    return false;
  }

  canAttack(now: number): boolean {
    return this.alive && now - this.lastAttackTime >= ATTACK_COOLDOWN;
  }

  toState(): PlayerState {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      health: this.health,
      alive: this.alive,
      kills: this.kills,
      direction: this.direction,
      attackCooldown: Math.max(
        0,
        ATTACK_COOLDOWN - (Date.now() - this.lastAttackTime)
      ),
    };
  }
}
