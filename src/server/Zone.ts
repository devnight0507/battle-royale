import { ZoneState, ARENA_WIDTH, ARENA_HEIGHT, ZONE_DAMAGE_PER_SEC } from "../lib/types";

export class Zone {
  centerX: number;
  centerY: number;
  currentRadius: number;
  targetRadius: number;
  shrinkSpeed: number;
  phase: number;
  phaseTimer: number;
  phaseDuration: number;

  constructor() {
    this.centerX = ARENA_WIDTH / 2;
    this.centerY = ARENA_HEIGHT / 2;
    this.currentRadius = 1200;
    this.targetRadius = 1200;
    this.shrinkSpeed = 30;
    this.phase = 0;
    this.phaseTimer = 0;
    this.phaseDuration = 15000;
  }

  update(deltaMs: number) {
    this.phaseTimer += deltaMs;

    if (this.phaseTimer >= this.phaseDuration && this.currentRadius <= this.targetRadius + 1) {
      this.phaseTimer = 0;
      this.phase++;
      this.targetRadius = Math.max(50, this.currentRadius - 250);

      const offsetRange = 80;
      this.centerX += (Math.random() - 0.5) * offsetRange;
      this.centerY += (Math.random() - 0.5) * offsetRange;
      this.centerX = Math.max(200, Math.min(ARENA_WIDTH - 200, this.centerX));
      this.centerY = Math.max(200, Math.min(ARENA_HEIGHT - 200, this.centerY));
    }

    if (this.currentRadius > this.targetRadius) {
      this.currentRadius -= this.shrinkSpeed * (deltaMs / 1000);
      this.currentRadius = Math.max(this.targetRadius, this.currentRadius);
    }
  }

  isInside(x: number, y: number): boolean {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    return Math.sqrt(dx * dx + dy * dy) <= this.currentRadius;
  }

  getDamage(x: number, y: number, deltaMs: number): number {
    if (this.isInside(x, y)) return 0;
    return ZONE_DAMAGE_PER_SEC * (deltaMs / 1000);
  }

  toState(): ZoneState {
    return {
      centerX: this.centerX,
      centerY: this.centerY,
      currentRadius: this.currentRadius,
      targetRadius: this.targetRadius,
    };
  }
}
