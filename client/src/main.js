import Phaser from 'phaser';
import { GAME_WIDTH, SCREEN_HEIGHT } from './constants.js';
import { BootScene }        from './scenes/BootScene.js';
import { MainMenuScene }    from './scenes/MainMenuScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GameScene }        from './scenes/GameScene.js';
import { UIScene }          from './scenes/UIScene.js';
import { MultiLobbyScene }  from './scenes/MultiLobbyScene.js';

const config = {
  type:   Phaser.AUTO,
  width:  GAME_WIDTH,
  height: SCREEN_HEIGHT,
  backgroundColor: '#1A1A2E',
  scale: {
    mode:            Phaser.Scale.FIT,
    autoCenter:      Phaser.Scale.CENTER_BOTH,
    parent:          'game',
    width:           GAME_WIDTH,
    height:          SCREEN_HEIGHT,
  },
  scene: [
    BootScene,
    MainMenuScene,
    LevelSelectScene,
    GameScene,
    UIScene,
    MultiLobbyScene,
  ],
};

new Phaser.Game(config);
