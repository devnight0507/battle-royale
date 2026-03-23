import * as Phaser from "phaser";
import { getSocket } from "../../../lib/socket";
import { GameState } from "../../../lib/types";

export class UIScene extends Phaser.Scene {
  private healthText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private aliveText!: Phaser.GameObjects.Text;
  private zoneText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Graphics;
  private socket: any;

  constructor() {
    super({ key: "UIScene" });
  }

  create() {
    this.socket = getSocket();
    const localId = this.socket.id;

    // HUD Background
    const hudBg = this.add.rectangle(10, 10, 200, 110, 0x000000, 0.6);
    hudBg.setOrigin(0, 0);
    hudBg.setScrollFactor(0);

    this.healthBar = this.add.graphics();
    this.healthBar.setScrollFactor(0);
    this.healthBar.setDepth(20);

    this.healthText = this.add.text(20, 20, "Vida: 100", {
      fontSize: "14px",
      color: "#22c55e",
      stroke: "#000",
      strokeThickness: 2,
    }).setScrollFactor(0);

    this.killsText = this.add.text(20, 50, "Abates: 0", {
      fontSize: "14px",
      color: "#fbbf24",
      stroke: "#000",
      strokeThickness: 2,
    }).setScrollFactor(0);

    this.aliveText = this.add.text(20, 75, "Vivos: -", {
      fontSize: "14px",
      color: "#ffffff",
      stroke: "#000",
      strokeThickness: 2,
    }).setScrollFactor(0);

    this.zoneText = this.add.text(20, 100, "", {
      fontSize: "12px",
      color: "#3b82f6",
      stroke: "#000",
      strokeThickness: 2,
    }).setScrollFactor(0);

    // Controls hint
    this.add.text(
      this.cameras.main.width - 20,
      this.cameras.main.height - 20,
      "WASD: Mover | Clique: Atacar",
      {
        fontSize: "12px",
        color: "#9ca3af",
        stroke: "#000",
        strokeThickness: 2,
      }
    ).setOrigin(1, 1).setScrollFactor(0);

    // Listen for state updates
    this.socket.on("game:state", (state: GameState) => {
      const player = state.players[localId];
      if (player) {
        this.healthText.setText(`Vida: ${Math.ceil(player.health)}`);
        this.killsText.setText(`Abates: ${player.kills}`);

        // Update health bar
        this.healthBar.clear();
        this.healthBar.fillStyle(0x333333);
        this.healthBar.fillRect(130, 22, 70, 12);
        const color = player.health > 50 ? 0x22c55e : player.health > 25 ? 0xeab308 : 0xef4444;
        this.healthBar.fillStyle(color);
        this.healthBar.fillRect(130, 22, (player.health / 100) * 70, 12);
      }

      this.aliveText.setText(`Vivos: ${state.playersAlive}`);
      this.zoneText.setText(`Fase da Zona: ${Math.ceil(state.timeRemaining)}s`);
    });
  }
}
