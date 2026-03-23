import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  create() {
    // Generate player texture (green circle)
    const playerGfx = this.make.graphics({ x: 0, y: 0 });
    playerGfx.fillStyle(0x22c55e);
    playerGfx.fillCircle(16, 16, 14);
    playerGfx.lineStyle(2, 0x16a34a);
    playerGfx.strokeCircle(16, 16, 14);
    playerGfx.generateTexture("player_local", 32, 32);
    playerGfx.destroy();

    // Generate enemy texture (red circle)
    const enemyGfx = this.make.graphics({ x: 0, y: 0 });
    enemyGfx.fillStyle(0xef4444);
    enemyGfx.fillCircle(16, 16, 14);
    enemyGfx.lineStyle(2, 0xdc2626);
    enemyGfx.strokeCircle(16, 16, 14);
    enemyGfx.generateTexture("player_enemy", 32, 32);
    enemyGfx.destroy();

    // Generate dead player texture (gray circle)
    const deadGfx = this.make.graphics({ x: 0, y: 0 });
    deadGfx.fillStyle(0x6b7280);
    deadGfx.fillCircle(16, 16, 14);
    deadGfx.generateTexture("player_dead", 32, 32);
    deadGfx.destroy();

    // Generate attack slash texture
    const slashGfx = this.make.graphics({ x: 0, y: 0 });
    slashGfx.fillStyle(0xfbbf24, 0.8);
    slashGfx.slice(24, 24, 20, Phaser.Math.DegToRad(330), Phaser.Math.DegToRad(30), false);
    slashGfx.fillPath();
    slashGfx.generateTexture("slash", 48, 48);
    slashGfx.destroy();

    this.scene.start("GameScene");
  }
}
