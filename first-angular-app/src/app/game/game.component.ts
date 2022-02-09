import { Component, OnInit } from '@angular/core';
import Phaser, {AUTO} from 'phaser';
import Group = Phaser.GameObjects.Group;
import LINE = Phaser.Geom.LINE;
import Line = Phaser.Geom.Line;
import GameObject = Phaser.GameObjects.GameObject;

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  phaserGame: Phaser.Game;
  config: Phaser.Types.Core.GameConfig;

  constructor() {
    this.config = {
      type: Phaser.AUTO,
      height: 800 ,
      width: 1000,
      scene: [ MainScene ],
      parent: 'gameContainer',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 300 },
          debug: false
        }
      },
    };
  }
  ngOnInit() {
    this.phaserGame = new Phaser.Game(this.config);
  }

}


class MainScene extends Phaser.Scene {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private platforms: Phaser.Physics.Arcade.StaticGroup;
  private stars: Phaser.Physics.Arcade.Group;
  private bombs: Phaser.Physics.Arcade.Group;

  private score = 0;
  private scoreText: any;
  private informationText: any;
  private gameOver: boolean;

  constructor() {
    super({ key: 'main' });
  }


  create() {
    this.createEnvironment();
    this.createPlayerOne();
    this.createCollision();
    this.createObjects();
    this.createScoreText();
  }

  private createEnvironment() {
    this.add.image(400, 500, 'sky').setScale(2);

    this.platforms = this.physics.add.staticGroup();

    this.addPlatformsRandomly()
    this.score = 0

    this.cursors = this.input.keyboard.createCursorKeys()
  }

  preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('pineapple', 'assets/Pineapple.png');
    //this.load.image('shrimp', 'assets/Shrimp.png');
    this.load.image('shrimp', 'assets/corona.png');
    this.load.spritesheet('dude',
      'assets/dude.png',
      { frameWidth: 213, frameHeight: 320 }
    );
  }

  override update() {
    // console.log('update method');
    this.playerControl();
    if ( this.cursors.shift.isDown){
      this.summonBomb(this.player);
    }

    if (this.cursors.space.isDown){
      this.registry.destroy();

      this.scene.restart()
    }
  }

  private createPlayerOne() {
    this.player = this.physics.add.sprite(100, 0, 'dude');
    this.player.setScale(0.2)
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'turn',
      frames: [ { key: 'dude', frame: 4 } ],
      frameRate: 20
    });

    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });
  }

  private createCollision() {
    this.physics.add.collider(this.player, this.platforms);
  }

  private playerControl() {
    if (this.cursors.left.isDown || this.cursors.right.isDown)
    {
      this.player.setVelocityX(this.cursors.left.isDown ? -160 : 160);

      this.player.anims.play(this.cursors.left.isDown ? 'left' : 'right', true);
    }
    else
    {
      this.player.setVelocityX(0);

      this.player.anims.play('turn');
    }

    if (this.cursors.up.isDown || this.cursors.down.isDown)
    {
      this.player.setVelocityY(this.cursors.up.isDown ? -200 : 200);
    }
  }

  private createObjects() {
    this.stars = this.physics.add.group({
      key: 'pineapple',
      repeat: 11,
      setXY: { x: Phaser.Math.Between(5,15), y: 0, stepX: 70 }
    })
    this.addNewStars();


    this.physics.add.collider(this.stars, this.platforms)
    this.physics.add.overlap(this.player, this.stars, this.collectStar, () => {}, this);

    this.bombs = this.physics.add.group();

    this.physics.add.collider(this.bombs, this.platforms);

    this.physics.add.collider(this.player, this.bombs, this.hitBomb, () => {}, this);

  }

  hitBomb (player: any, bomb: any)
  {
    this.GameEnded(player);
  }

  private GameEnded(player: any) {
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    this.gameOver = true
    this.informationText = this.add.text(200, 200, "You got Covid-19\nso now you need rest!\n\nYour score: "+this.score+"\n\nPress SPACE to restart game!", { font: "50px Arial"});
  }

  private collectStar(player: any, star: any) {
    star.disableBody(true, true);
    this.score += 10*(1+this.bombs.children.size);
    this.updateScoreText();

    if (this.stars.countActive(true) === 0)
    {
      this.addNewStars();

      this.summonBomb(player);

    }

  }

  private summonBomb(player: any) {
    var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
    // var y = (player.y < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
    var bomb = this.bombs.create(x, 10, 'shrimp');
    bomb.setBounce(1);
    bomb.setScale(0.05);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  }

  private addNewStars() {
    this.stars.children.iterate(function (child: any) {
      var y = Phaser.Math.Between(0, 650)
      child.enableBody(true, child.x, y, true, true);
    });
    this.stars.children.iterate(function (child: any) {
      child.setBounce(Phaser.Math.FloatBetween(0.5, 0.9));
      child.setScale(2);
    });
  }

  private createScoreText() {
    this.scoreText = this.add.text(16, 16, this.getScoreText());
  }

  private updateScoreText() {
    this.scoreText.setText(this.getScoreText());
  }

  private getScoreText() {
    return 'Score: ' + this.score;
  }

  private addPlatformsRandomly() {
    this.platforms.create(20, 780, 'ground').setScale(2).refreshBody();
    this.platforms.create(700, 780, 'ground').setScale(2).refreshBody();
    let line = new Line(0,0,window.innerWidth,0);
    // new GameObject()
    this.platforms.create(670, 220, 'ground');
    this.platforms.create(270, 350, 'ground');
    this.platforms.create(670, 500, 'ground');
    this.platforms.create(400, 620, 'ground');
  }
}
