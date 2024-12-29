// 遊戲狀態變數宣告 - 移到最前面
let gameOver = false;
let GROUND_Y; // 改為變數，在setup中計算

let sprites = {
    player1: {
      idle: {
        img: null,
        width: 301/9,
        height: 35,
        frames: 9,
        y_offset: 15
      },
      walk: {
        img: null,
        width: 425/10,
        height: 37,
        frames: 10,
        y_offset: 13
      },
      jump: {
        img: null,
        width: 339/8,
        height: 38,
        frames: 8,
        y_offset: 12
      },
      attack: {
        img: null,
        width: 499/7,
        height: 35,
        frames: 7,
        y_offset: 15
      }
    },
    player2: {
      idle: {
        img: null,
        width: 205/7,
        height: 48,
        frames: 7,
        y_offset: 0
      },
      walk: {
        img: null,
        width: 385/10,
        height: 51,
        frames: 10,
        y_offset: 0
      },
      jump: {
        img: null,
        width: 567/11,
        height: 51,
        frames: 11,
        y_offset: 0
      },
      attack: {
        img: null,
        width: 229/6,
        height: 51,
        frames: 6,
        y_offset: 0
      }
    },
    bullet: {
      img: null,
      width: 163/8,
      height: 16,
      frames: 8
    }
  };
  

// 遊戲狀態
let currentFrame1 = 0;
let currentFrame2 = 0;
let currentAction1 = 'idle';
let currentAction2 = 'idle';
let bullets = [];

// 角色位置
let player1 = {
  x: 150,
  y: GROUND_Y - 200,
  speed: 7,
  direction: 1,
  health: 100,
  isJumping: false,
  jumpPower: -5,
  velocityY: 0,
  gravity: 0.6
};

let player2 = {
  x: 650,
  y: GROUND_Y - 200,
  speed: 7,
  direction: -1,
  health: 100,
  isJumping: false,
  jumpPower: -5,
  velocityY: 0,
  gravity: 0.6
};

// 添加攻擊冷卻狀態變數
let player1CanAttack = true;
let player2CanAttack = true;
let player1CanJump = true;
let player2CanJump = true;

// 添加新的全局變數
let backgroundImg;
let bgm;

// 添加檢查變數
let assetsLoaded = false;

// Add new game state variable at the top with other state variables
let gameStarted = false;

function preload() {
  try {
    // 載入背景圖片
    backgroundImg = loadImage('./images/background.png');
    
    // 載入背景音樂
    bgm = loadSound('videoplayback.m4a', 
      () => {
        console.log('BGM loaded successfully');
        assetsLoaded = true;
      },
      (err) => {
        console.error('Failed to load BGM:', err);
      }
    );
    
    // 載入角色圖片
    sprites.player1.idle.img = loadImage('./images/player1/idle.png');
    sprites.player1.walk.img = loadImage('./images/player1/walk.png');
    sprites.player1.attack.img = loadImage('./images/player1/attack.png');
    sprites.player1.jump.img = loadImage('./images/player1/jump.png');
    
    sprites.player2.idle.img = loadImage('./images/player2/idle.png');
    sprites.player2.walk.img = loadImage('./images/player2/walk.png');
    sprites.player2.attack.img = loadImage('./images/player2/attack.png');
    sprites.player2.jump.img = loadImage('./images/player2/jump.png');
    
    sprites.bullet.img = loadImage('./images/effects/bullet.png');
  } catch (error) {
    console.error('Error in preload:', error);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(12);
  
  GROUND_Y = windowHeight * 0.75;
  
  player1.x = windowWidth * 0.25;
  player2.x = windowWidth * 0.75;
  player1.y = windowHeight * 0.5;
  player2.y = windowHeight * 0.5;
  
  gameStarted = false;  // Initialize game state
  
  if (assetsLoaded && bgm) {
    bgm.setVolume(0.5);
  }
}

// Add mousePressed function to handle audio start
function mousePressed() {
  // Start audio context on user interaction
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
    if (bgm && !bgm.isPlaying()) {
      bgm.loop();
    }
  }
}

function draw() {
  try {
    // Draw background
    if (backgroundImg) {
      image(backgroundImg, 0, 0, windowWidth, windowHeight);
    } else {
      background(220);
    }
    
    // Check if assets are still loading
    if (!assetsLoaded) {
      fill(0);
      textSize(32);
      textAlign(CENTER, CENTER);
      text('Loading...', width/2, height/2);
      return;
    }

    // Show start screen if game hasn't started
    if (!gameStarted) {
      fill(0);
      textSize(32);
      textAlign(CENTER, CENTER);
      text('按任意鍵開始遊戲', width/2, height/2);
      return;
    }
    
    // Normal game logic only runs if game has started
    applyGravity();
    handleMovement();
    updateBullets();
    
    // Draw characters
    if (player1.direction === 1) {
      drawAnimation(sprites.player1[currentAction1], player1.x, player1.y, currentFrame1);
    } else {
      push();
      scale(-1, 1);
      drawAnimation(sprites.player1[currentAction1], -player1.x - sprites.player1[currentAction1].width, player1.y, currentFrame1);
      pop();
    }

    if (player2.direction === 1) {
      drawAnimation(sprites.player2[currentAction2], player2.x, player2.y, currentFrame2);
    } else {
      push();
      scale(-1, 1);
      drawAnimation(sprites.player2[currentAction2], -player2.x - sprites.player2[currentAction2].width, player2.y, currentFrame2);
      pop();
    }

    // Draw bullets
    for (let bullet of bullets) {
      drawAnimation(sprites.bullet, bullet.x, bullet.y, bullet.frame);
    }
    
    // 繪製血條
    drawHealthBars();
    
    // 遊戲結束畫面
    if (gameOver) {
      textSize(32);
      textAlign(CENTER, CENTER);
      fill(0);
      text('遊戲結束！按R重新開始', width/2, height/2);
    }
    
    updateFrames();
    
    // 在最後繪製操作說明，確保它顯示在最上層
    drawInstructions();
    
    // Add audio start prompt if needed
    if (getAudioContext().state !== 'running') {
      fill(0);
      textSize(24);
      textAlign(CENTER, CENTER);
      text('Click anywhere to start audio', width/2, height/4);
    }
    
  } catch (error) {
    console.error('Error in draw:', error);
  }
}

function handleMovement() {
  if (gameOver) return;

  const margin = windowWidth * 0.05;
  
  // 角色1控制
  if (currentAction1 !== 'attack') {
    // 在空中和地面都可以左右移動
    if (keyIsDown(65)) { // A
      player1.x = Math.max(margin, player1.x - player1.speed);
      player1.direction = -1;
      // 只有在地面時才改變為走路動畫
      if (player1.y >= windowHeight * 0.5) {
        currentAction1 = 'walk';
      }
    } else if (keyIsDown(68)) { // D
      player1.x = Math.min(windowWidth - margin, player1.x + player1.speed);
      player1.direction = 1;
      // 只有在地面時才改變為走路動畫
      if (player1.y >= windowHeight * 0.5) {
        currentAction1 = 'walk';
      }
    } else if (player1.y >= windowHeight * 0.5) {
      currentAction1 = 'idle';
    }
  }
  
  // 角色2控制
  if (currentAction2 !== 'attack') {
    // 在空中和地面都可以左右移動
    if (keyIsDown(LEFT_ARROW)) {
      player2.x = Math.max(margin, player2.x - player2.speed);
      player2.direction = -1;
      // 只有在地面時才改變為走路動畫
      if (player2.y >= windowHeight * 0.5) {
        currentAction2 = 'walk';
      }
    } else if (keyIsDown(RIGHT_ARROW)) {
      player2.x = Math.min(windowWidth - margin, player2.x + player2.speed);
      player2.direction = 1;
      // 只有在地面時才改變為走路動畫
      if (player2.y >= windowHeight * 0.5) {
        currentAction2 = 'walk';
      }
    } else if (player2.y >= windowHeight * 0.5) {
      currentAction2 = 'idle';
    }
  }
}

function keyPressed() {
  // Start game on any key press if not started
  if (!gameStarted) {
    gameStarted = true;
    if (bgm && !bgm.isPlaying()) {
      bgm.loop();
    }
    return;
  }

  if (gameOver && keyCode === 82) {
    resetGame();
    return;
  }

  // 角色1跳躍 (W鍵) - 減少跳躍初速度
  if (keyCode === 87 && player1CanJump) {
    player1.velocityY = -16;  // 從-18改為-15
    player1CanJump = false;
    if (currentAction1 !== 'attack') {
      currentAction1 = 'jump';
      currentFrame1 = 0;
    }
  }

  // 角色2跳躍 (上箭頭) - 減少跳躍初速度
  if (keyCode === UP_ARROW && player2CanJump) {
    player2.velocityY = -16;  // 從-18改為-15
    player2CanJump = false;
    if (currentAction2 !== 'attack') {
      currentAction2 = 'jump';
      currentFrame2 = 0;
    }
  }

  // 攻擊控制 - 移除音效播放
  if (keyCode === 70 && player1CanAttack) {
    currentAction1 = 'attack';
    currentFrame1 = 0;
    player1CanAttack = false;
    
    let bulletX = player1.direction === 1 ? 
      player1.x + sprites.player1.attack.width : 
      player1.x;
    let bulletY = player1.y + sprites.player1.attack.height/2;
    
    bullets.push({
      x: bulletX,
      y: bulletY,
      frame: 0,
      speed: player1.direction * 5,
      fromPlayer: 1
    });
    
    setTimeout(() => {
      currentAction1 = 'idle';
      currentFrame1 = 0;
      
      // 0.3秒後重置攻擊冷卻
      setTimeout(() => {
        player1CanAttack = true;
      }, 300);
    }, 500);
  }
  
  if (keyCode === 32 && player2CanAttack) {
    currentAction2 = 'attack';
    currentFrame2 = 0;
    player2CanAttack = false;
    
    let bulletX = player2.direction === 1 ? 
      player2.x + sprites.player2.attack.width : 
      player2.x;
    let bulletY = player2.y + sprites.player2.attack.height/2;
    
    bullets.push({
      x: bulletX,
      y: bulletY,
      frame: 0,
      speed: player2.direction * 5,
      fromPlayer: 2
    });
    
    setTimeout(() => {
      currentAction2 = 'idle';
      currentFrame2 = 0;
      
      // 0.3秒後重置攻擊冷卻
      setTimeout(() => {
        player2CanAttack = true;
      }, 300);
    }, 500);
  }
}

function drawAnimation(spriteInfo, x, y, currentFrame) {
  if (!spriteInfo || !spriteInfo.img) {
    console.warn('Missing sprite information or image');
    return;
  }

  try {
    let frameWidth = spriteInfo.width;
    let frameHeight = spriteInfo.height;
    let sx = (currentFrame % spriteInfo.frames) * frameWidth;
    let y_offset = spriteInfo.y_offset || 0;
    
    // 放大1.5倍
    let scale = 3;
    image(spriteInfo.img, 
          x, 
          y + y_offset, 
          frameWidth * scale, 
          frameHeight * scale, 
          sx, 
          0, 
          frameWidth, 
          frameHeight);
  } catch (error) {
    console.error('Error in drawAnimation:', error);
  }
}

function triggerAttack(playerNum) {
  if (playerNum !== 2) return; // 只處理角色2的攻擊

  try {
    let bulletX = player2.direction === 1 ? 
      player2.x + sprites.player2.attack.width : 
      player2.x;
    let bulletY = player2.y + sprites.player2.attack.height/2;
    
    // 確保不會產生太多子彈
    if (bullets.length < 10) {
      bullets.push({
        x: bulletX,
        y: bulletY,
        frame: 0,
        speed: player2.direction * 8
      });
    }
  } catch (error) {
    console.error('Error in triggerAttack:', error);
  }
}

function updateBullets() {
  for(let i = bullets.length - 1; i >= 0; i--) {
    if (!bullets[i]) continue;

    bullets[i].x += bullets[i].speed;
    bullets[i].frame = (bullets[i].frame + 1) % sprites.bullet.frames;
    
    // 根據子彈來檢查碰撞
    if (bullets[i].fromPlayer === 1) {
      // 角色1的子彈檢查是否擊中角色2
      if (Math.abs(bullets[i].x - player2.x) < sprites.player2.idle.width * 2 &&
          Math.abs(bullets[i].y - player2.y) < sprites.player2.idle.height * 2) {
        player2.health = Math.max(0, player2.health - 5);
        bullets.splice(i, 1);
        checkGameOver();
        continue;
      }
    } else {
      // 角色2的子彈檢查是否擊中角色1
      if (Math.abs(bullets[i].x - player1.x) < sprites.player1.idle.width * 2 &&
          Math.abs(bullets[i].y - player1.y) < sprites.player1.idle.height * 2) {
        player1.health = Math.max(0, player1.health - 5);
        bullets.splice(i, 1);
        checkGameOver();
        continue;
      }
    }
    
    // 移除超出畫面的子彈
    if(bullets[i].x < -100 || bullets[i].x > width + 100) {
      bullets.splice(i, 1);
    }
  }
}

// 新增血條繪製
function drawHealthBars() {
  // 角色1血條
  fill(0);
  rect(windowWidth * 0.1, 20, 200, 20);
  fill(255, 0, 0);
  rect(windowWidth * 0.1, 20, player1.health * 2, 20);
  
  // 角色2血條
  fill(0);
  rect(windowWidth * 0.9 - 200, 20, 200, 20);
  fill(255, 0, 0);
  rect(windowWidth * 0.9 - 200, 20, player2.health * 2, 20);
}

// 修改重力效果
function applyGravity() {
  // 角色1重力 - 增加重力加速度
  player1.velocityY += 1.2;  // 從0.8改為1.2
  player1.y += player1.velocityY;
  if (player1.y >= windowHeight * 0.5) {
    player1.y = windowHeight * 0.5;
    player1.velocityY = 0;
    player1CanJump = true;
    if (currentAction1 === 'jump') {
      currentAction1 = 'idle';
    }
  }

  // 角色2重力 - 增加重力加速度
  player2.velocityY += 1.2;  // 從0.8改為1.2
  player2.y += player2.velocityY;
  if (player2.y >= windowHeight * 0.5) {
    player2.y = windowHeight * 0.5;
    player2.velocityY = 0;
    player2CanJump = true;
    if (currentAction2 === 'jump') {
      currentAction2 = 'idle';
    }
  }
}

// 修改近戰攻擊檢測
function checkMeleeAttack() {
  if (currentAction1 === 'attack' && !gameOver) {
    let attackRange = sprites.player1.attack.attackRange;
    let hitX = player1.direction === 1 ? 
      player1.x + sprites.player1.width : 
      player1.x - attackRange;
    
    // 檢查是否擊中角色2
    if (Math.abs(hitX - player2.x) < attackRange &&
        Math.abs(player1.y - player2.y) < sprites.player1.attack.height) {
      player2.health = Math.max(0, player2.health - 10);
      checkGameOver();
    }
  }
}

// 新增遊戲結束檢測
function checkGameOver() {
  if (player1.health <= 0 || player2.health <= 0) {
    gameOver = true;
  }
}

// 修改重置遊戲函數
function resetGame() {
  gameStarted = false;  // Add this line
  player1.health = 100;
  player2.health = 100;
  player1.x = windowWidth * 0.25;
  player2.x = windowWidth * 0.75;
  player1.y = windowHeight * 0.5;
  player2.y = windowHeight * 0.5;
  player1.velocityY = 0;
  player2.velocityY = 0;
  bullets = [];
  gameOver = false;
  player1CanAttack = true;
  player2CanAttack = true;
  player1CanJump = true;
  player2CanJump = true;
}

function updateFrames() {
  try {
    if (sprites.player1[currentAction1]) {
      currentFrame1 = (currentFrame1 + 1) % sprites.player1[currentAction1].frames;
    }
    if (sprites.player2[currentAction2]) {
      currentFrame2 = (currentFrame2 + 1) % sprites.player2[currentAction2].frames;
    }
  } catch (error) {
    console.error('Error in updateFrames:', error);
  }
}

// 添加視窗調整大小的處理函數
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  GROUND_Y = windowHeight * 0.75;
  
  player1.x = windowWidth * 0.25;
  player2.x = windowWidth * 0.75;
  player1.y = windowHeight * 0.5;
  player2.y = windowHeight * 0.5;
}

function drawInstructions() {
  // 設置文字樣式
  fill(255);  // 白色文字
  stroke(0);  // 黑色邊框
  strokeWeight(2);
  textSize(16);
  textAlign(LEFT, BOTTOM);
  
  // 計算位置（左下角，留有邊距）
  let x = 20;
  let y = height - 20;
  let lineHeight = 20;
  let columnWidth = 300;  // 兩列之間的距離
  
  // 繪製操作說明
  // 第一列 - 角色1
  text('角色1：', x, y - lineHeight);
  text('A/D - 左右移動', x, y);
  text('W - 跳躍', x + 120, y);
  text('F - 攻擊', x + 200, y);
  
  // 第二列 - 角色2
  text('角色2：', x + columnWidth, y - lineHeight);
  text('←/→ - 左右移動', x + columnWidth, y);
  text('↑ - 跳躍', x + columnWidth + 120, y);
  text('空白鍵 - 攻擊', x + columnWidth + 200, y);
}