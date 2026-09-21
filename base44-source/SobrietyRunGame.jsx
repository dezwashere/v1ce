import React, { useState, useEffect, useRef, useCallback } from "react";

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 240;
const GROUND_Y = CANVAS_HEIGHT - 40;
const PLAYER_SIZE = 12;
const OBSTACLE_WIDTH = 16;
const OBSTACLE_HEIGHT = 16;
const COIN_SIZE = 8;
const INITIAL_SPEED = 2.8; // 30% reduction from 4
const MAX_SPEED = 6;

const OBSTACLE_TYPES = ["methpipe", "bong", "weedleaf", "bottle", "syringe", "phone"];

export default function SobrietyRunGame({ onScore, onHighScore, onVictory, friends = [] }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState("start"); // start, playing, gameOver, victory
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);

  const gameDataRef = useRef({
    playerX: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
    playerY: GROUND_Y - PLAYER_SIZE,
    playerVelY: 0,
    isJumping: false,
    obstacles: [],
    coins: [],
    speed: INITIAL_SPEED,
    spawnTimer: 0,
    gameTime: 0,
    score: 0,
    level: 1,
    lastFrameTime: Date.now(),
    boss: null,
    bossHealth: 3,
    projectiles: [],
    throwingCoin: null,
    scrollOffset: 0,
  });

  const gravity = 0.8;
  const jumpPower = -12;

  // Generate lo-fi city buildings (cached per session)
  const cityBuildingsRef = useRef(null);
  const generateCityBuildings = () => {
    if (cityBuildingsRef.current) return cityBuildingsRef.current;
    const buildings = [];
    for (let i = 0; i < 8; i++) {
      const width = 30 + Math.random() * 40;
      const height = 60 + Math.random() * 100;
      const x = i * (CANVAS_WIDTH / 2);
      const windows = [];
      const windowRows = Math.floor(height / 12);
      const windowCols = Math.floor(width / 10);
      for (let r = 0; r < windowRows; r++) {
        for (let c = 0; c < windowCols; c++) {
          if (Math.random() > 0.3) {
            windows.push({
              x: c * 10 + 3,
              y: r * 12 + 3,
              color: Math.random() > 0.5 ? "#FFD700" : "#00E676",
            });
          }
        }
      }
      buildings.push({ x, width, height, windows });
    }
    cityBuildingsRef.current = buildings;
    return buildings;
  };

  const drawCityBackground = (ctx, scrollOffset) => {
   ctx.fillStyle = "#000000";
   ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  };

  // Draw obstacle based on type (pure white silhouettes)
  const drawObstacle = (ctx, x, y, type) => {
    ctx.fillStyle = "#FFFFFF";
    const w = OBSTACLE_WIDTH;
    const h = OBSTACLE_HEIGHT;

    switch (type) {
      case "methpipe":
        ctx.fillRect(x + 2, y + 6, 8, 4);
        ctx.fillRect(x + 10, y + 2, 4, 8);
        break;
      case "bong":
        ctx.fillRect(x + 3, y, 10, 3);
        ctx.fillRect(x + 4, y + 3, 8, 10);
        ctx.fillRect(x + 2, y + 13, 12, 3);
        break;
      case "weedleaf":
        ctx.fillRect(x + 7, y, 2, 16);
        ctx.fillRect(x + 3, y + 4, 10, 2);
        ctx.fillRect(x + 3, y + 10, 10, 2);
        break;
      case "bottle":
        ctx.fillRect(x + 5, y, 6, 3);
        ctx.fillRect(x + 4, y + 3, 8, 10);
        ctx.fillRect(x + 3, y + 13, 10, 3);
        break;
      case "syringe":
        ctx.fillRect(x + 2, y + 6, 6, 3);
        ctx.fillRect(x + 8, y + 2, 3, 12);
        ctx.fillRect(x + 11, y + 8, 3, 2);
        break;
      case "phone":
        ctx.fillRect(x + 3, y + 2, 10, 12);
        ctx.fillRect(x + 5, y + 4, 6, 8);
        break;
      default:
        ctx.fillRect(x, y, w, h);
    }
  };

  // Draw the ADDICTION boss monster (white silhouette)
  const drawBoss = (ctx, boss) => {
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;

    // Body (large blocky shape)
    ctx.fillRect(boss.x - 20, boss.y + 10, 40, 40);

    // Head
    ctx.fillRect(boss.x - 15, boss.y - 10, 30, 20);

    // Eyes
    ctx.fillRect(boss.x - 10, boss.y, 6, 6);
    ctx.fillRect(boss.x + 4, boss.y, 6, 6);

    // Mouth
    ctx.beginPath();
    ctx.moveTo(boss.x - 8, boss.y + 15);
    ctx.lineTo(boss.x + 8, boss.y + 15);
    ctx.stroke();

    // Arms
    ctx.fillRect(boss.x - 22, boss.y + 15, 8, 25);
    ctx.fillRect(boss.x + 14, boss.y + 15, 8, 25);
  };

  // Throw coin at boss
  const throwCoin = useCallback(() => {
    if (gameState !== "playing" || gameDataRef.current.level !== 12 || gameDataRef.current.boss === null) return;
    if (gameDataRef.current.throwingCoin) return; // Only one coin at a time

    const data = gameDataRef.current;
    data.throwingCoin = {
      x: data.playerX + PLAYER_SIZE / 2,
      y: data.playerY,
      vx: 6,
      vy: -4,
    };
  }, [gameState]);

  // Handle jump
  const handleJump = useCallback(() => {
    if (gameDataRef.current.isJumping || gameState !== "playing") return;
    gameDataRef.current.playerVelY = jumpPower;
    gameDataRef.current.isJumping = true;
  }, [gameState]);

  // Keyboard & touch controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (gameDataRef.current.level === 12 && gameDataRef.current.boss && gameState === "playing") {
          throwCoin();
        } else {
          handleJump();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleJump, throwCoin, gameState]);

  const handleCanvasClick = () => {
    if (gameState === "start") {
      setGameState("playing");
      gameDataRef.current.score = 0;
      setScore(0);
    } else if (gameState === "gameOver") {
      setGameState("playing");
      gameDataRef.current.score = 0;
      gameDataRef.current.level = 1;
      gameDataRef.current.obstacles = [];
      gameDataRef.current.coins = [];
      gameDataRef.current.speed = INITIAL_SPEED;
      gameDataRef.current.gameTime = 0;
      gameDataRef.current.boss = null;
      gameDataRef.current.bossHealth = 3;
      gameDataRef.current.projectiles = [];
      gameDataRef.current.throwingCoin = null;
      setScore(0);
      setLevel(1);
    } else if (gameState === "victory") {
      setGameState("start");
      gameDataRef.current.score = 0;
      gameDataRef.current.level = 1;
      gameDataRef.current.obstacles = [];
      gameDataRef.current.coins = [];
      gameDataRef.current.speed = INITIAL_SPEED;
      gameDataRef.current.gameTime = 0;
      gameDataRef.current.boss = null;
      gameDataRef.current.bossHealth = 3;
      gameDataRef.current.projectiles = [];
      gameDataRef.current.throwingCoin = null;
      setScore(0);
      setLevel(1);
    } else if (gameState === "playing") {
      // At boss stage, click throws coin; otherwise jump
      if (gameDataRef.current.level === 12 && gameDataRef.current.boss) {
        throwCoin();
      } else {
        handleJump();
      }
    }
  };

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const gameLoop = () => {
      const data = gameDataRef.current;
      const now = Date.now();
      const deltaTime = (now - data.lastFrameTime) / 16.67; // Normalize to 60fps
      data.lastFrameTime = now;

      if (gameState === "playing") {
        // Update player with deltaTime
        data.playerVelY += gravity * deltaTime;
        data.playerY += data.playerVelY * deltaTime;

        if (data.playerY >= GROUND_Y - PLAYER_SIZE) {
          data.playerY = GROUND_Y - PLAYER_SIZE;
          data.playerVelY = 0;
          data.isJumping = false;
        }



        // Spawn coins every 500 points
        if (data.score > 0 && data.score % 500 === 0 && data.coins.length === 0) {
          data.coins.push({
            x: CANVAS_WIDTH - 60,
            y: GROUND_Y - 60,
            shape: ["circle", "hexagon", "diamond"][Math.floor(Math.random() * 3)],
          });
        }

        // Update obstacles
        data.obstacles = data.obstacles.filter((obs) => {
          obs.x -= data.speed * deltaTime;
          
          // Collision with player
          if (
            data.playerX < obs.x + OBSTACLE_WIDTH &&
            data.playerX + PLAYER_SIZE > obs.x &&
            data.playerY < obs.y + OBSTACLE_HEIGHT &&
            data.playerY + PLAYER_SIZE > obs.y
          ) {
            setGameState("gameOver");
            if (data.score > highScore) {
              setHighScore(data.score);
              onHighScore(data.score);
            }
            return false;
          }
          
          return obs.x > -OBSTACLE_WIDTH;
        });

        // Update coins
        data.coins = data.coins.filter((coin) => {
          coin.x -= data.speed * deltaTime;
          
          // Collision with player
          if (
            data.playerX < coin.x + COIN_SIZE &&
            data.playerX + PLAYER_SIZE > coin.x &&
            data.playerY < coin.y + COIN_SIZE &&
            data.playerY + PLAYER_SIZE > coin.y
          ) {
            data.score += 50;
            setScore(data.score);
            onScore(data.score);
            return false;
          }
          
          return coin.x > -COIN_SIZE;
        });

        // Increase score over time
        data.gameTime++;
        if (data.gameTime % 10 === 0) {
          data.score++;
          setScore(data.score);
          onScore(data.score);
        }

        // Calculate level (1,000 points per level, max 12)
        const newLevel = Math.min(Math.floor(data.score / 1000) + 1, 12);
        if (newLevel !== data.level) {
          data.level = newLevel;
          setLevel(newLevel);
          if (newLevel === 12) {
            // Spawn boss at level 12
            data.boss = {
              x: CANVAS_WIDTH - 50,
              y: GROUND_Y - 80,
              width: 60,
              height: 60,
              attackTimer: 0,
              health: 3,
            };
          } else {
            data.boss = null;
            data.projectiles = [];
          }
        }

        // Increase speed gradually with MAX_SPEED cap
        data.speed = Math.min(INITIAL_SPEED + data.gameTime * 0.001, MAX_SPEED);

        // Boss stage
        if (data.level === 12 && data.boss) {
          // Boss attack pattern (lunges forward)
          data.boss.attackTimer++;
          if (data.boss.attackTimer > 60) {
            // Spawn projectile
            data.projectiles.push({
              x: data.boss.x,
              y: data.boss.y + 20,
              vx: -5,
              vy: (Math.random() - 0.5) * 3,
            });
            data.boss.attackTimer = 0;
          }

          // Update projectiles
          data.projectiles = data.projectiles.filter((proj) => {
            proj.x += proj.vx;
            proj.y += proj.vy;

            // Check collision with player
            if (
              data.playerX < proj.x + 6 &&
              data.playerX + PLAYER_SIZE > proj.x &&
              data.playerY < proj.y + 6 &&
              data.playerY + PLAYER_SIZE > proj.y
            ) {
              setGameState("gameOver");
              if (data.score > highScore) {
                setHighScore(data.score);
                onHighScore(data.score);
              }
              return false;
            }

            return proj.x > -10;
          });

          // Throwing coin mechanic
          if (data.throwingCoin) {
            data.throwingCoin.x += data.throwingCoin.vx;
            data.throwingCoin.y += data.throwingCoin.vy;
            data.throwingCoin.vy += 0.3; // gravity

            // Check collision with boss
            if (
              data.throwingCoin.x > data.boss.x &&
              data.throwingCoin.x < data.boss.x + data.boss.width &&
              data.throwingCoin.y > data.boss.y &&
              data.throwingCoin.y < data.boss.y + data.boss.height
            ) {
              data.boss.health--;
              data.throwingCoin = null;

              if (data.boss.health <= 0) {
                setGameState("victory");
                if (data.score > highScore) {
                  setHighScore(data.score);
                  onHighScore(data.score);
                }
                if (onVictory) onVictory(data.score, data.level);
              }
            } else if (data.throwingCoin.x > CANVAS_WIDTH || data.throwingCoin.y > CANVAS_HEIGHT) {
              data.throwingCoin = null;
            }
          }

          // No random obstacles at boss stage, can throw coins to attack
          data.obstacles = [];
        } else {
          // Normal obstacle spawning (increase difficulty per level)
          data.spawnTimer++;
          const spawnRate = Math.max(20, 120 - (data.gameTime * 0.5 + data.level * 5));
          if (data.spawnTimer > spawnRate) {
            data.obstacles.push({
              x: CANVAS_WIDTH,
              y: GROUND_Y - OBSTACLE_HEIGHT,
              type: OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)],
            });
            data.spawnTimer = 0;
          }
        }
      } else if (gameState === "playing") {
        // Allow throwing coins at boss
        if (data.level === 12 && data.boss && !data.throwingCoin) {
          // Player can throw by jumping near boss
          if (data.playerY < GROUND_Y - 20) {
            // Coin is available during jump
          }
        }
      }

      // Render
      drawCityBackground(ctx, data.scrollOffset);
      data.scrollOffset += data.speed * 0.5;

      // Ground line (thin white line)
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
      ctx.stroke();

      // Render player (neon green stick figure)
      ctx.strokeStyle = "#00E676";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Head
      ctx.beginPath();
      ctx.arc(data.playerX + PLAYER_SIZE / 2, data.playerY + 3, 3, 0, Math.PI * 2);
      ctx.stroke();

      // Body
      ctx.beginPath();
      ctx.moveTo(data.playerX + PLAYER_SIZE / 2, data.playerY + 6);
      ctx.lineTo(data.playerX + PLAYER_SIZE / 2, data.playerY + 9);
      ctx.stroke();

      // Arms
      ctx.beginPath();
      ctx.moveTo(data.playerX + 2, data.playerY + 7);
      ctx.lineTo(data.playerX + PLAYER_SIZE - 2, data.playerY + 7);
      ctx.stroke();

      // Legs
      ctx.beginPath();
      ctx.moveTo(data.playerX + PLAYER_SIZE / 2, data.playerY + 9);
      ctx.lineTo(data.playerX + 4, data.playerY + PLAYER_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(data.playerX + PLAYER_SIZE / 2, data.playerY + 9);
      ctx.lineTo(data.playerX + PLAYER_SIZE - 4, data.playerY + PLAYER_SIZE);
      ctx.stroke();

      // Render obstacles (pure white silhouettes)
      data.obstacles.forEach((obs) => {
        drawObstacle(ctx, obs.x, obs.y, obs.type);
      });

      // Render coins (white)
      data.coins.forEach((coin) => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(coin.x, coin.y, COIN_SIZE, COIN_SIZE);
      });

      // Render boss (ADDICTION monster)
      if (data.boss) {
        drawBoss(ctx, data.boss);
      }

      // Render projectiles (white)
      data.projectiles.forEach((proj) => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(proj.x - 3, proj.y - 3, 6, 6);
      });

      // Render throwing coin (white)
      if (data.throwingCoin) {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(data.throwingCoin.x, data.throwingCoin.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // UI overlays
      if (gameState === "start") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#00E676";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText("SOBRIETY RUN", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.font = "12px monospace";
        ctx.fillText("12 LEVELS TO FREEDOM", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 5);
        ctx.fillText("TAP TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
      } else if (gameState === "gameOver") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.fillStyle = "#00E676";
        ctx.font = "12px monospace";
        ctx.fillText(`LEVEL: ${data.level}/12`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.fillText(`SCORE: ${data.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
        ctx.font = "9px monospace";
        ctx.fillText("TAP TO RETRY", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
      } else if (gameState === "victory") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#00E676";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText("YOU SURVIVED.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        ctx.font = "10px monospace";
        ctx.fillText("PASS THE STRENGTH ON.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px monospace";
        ctx.fillText(`FINAL SCORE: ${data.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
        ctx.fillStyle = "#00E676";
        ctx.font = "9px monospace";
        ctx.fillText("TAP TO RETRY", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
      }

      requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }, [gameState, highScore, onScore, onHighScore]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        className="bg-black cursor-pointer"
        style={{ width: CANVAS_WIDTH * 2, height: CANVAS_HEIGHT * 2, imageRendering: "pixelated", border: "2px solid #FFFFFF" }}
      />
      <p className="font-body text-xs text-muted-foreground tracking-widest uppercase text-center">
        TAP OR PRESS SPACE TO JUMP
      </p>
    </div>
  );
}