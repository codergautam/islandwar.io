import Phaser from "phaser";
import GameScene from "../GameScene";

export default class GameMap extends Phaser.GameObjects.Container {
  islands: Phaser.GameObjects.Rectangle[];
  graphics: Phaser.GameObjects.Graphics;
  constructor(scene: GameScene) {
    super(scene as Phaser.Scene);

    this.scene.add.existing(this);

    //draw boundary
    var map = 2000

    this.graphics = new Phaser.GameObjects.Graphics(scene);
    scene.uiCam.ignore(this);

    this.add(this.graphics);

  }
  end() {

  }
  updateObject() {

  }
}