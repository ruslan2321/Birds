import React, { useRef, useEffect, useState } from 'react';
import { animate } from 'animejs';
import Button from '@mui/material/Button';
import './SettingsModal'
import '../styles/SimulationCanvas.css';

const btn = document.querySelector('.btn')
const start = document.querySelector('.start')

function SimulationCanvas({ settings }) {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const animationIdRef = useRef(null);
  const hawksRef = useRef([]);
  const dovesRef = useRef([]);
  const frameCounterRef = useRef(0);

const birdWidth = 40;
  const birdHeight = 40;
  const framesPerSprite = 10; 

  // Загрузка изображений
 const hawkImgs = [new Image(), new Image()];
  hawkImgs[0].src = '/image/hawk-sprait1.png';
  hawkImgs[1].src = '/image/hawk-sprait2.png';


  const doveImgs = [new Image(), new Image()];
  doveImgs[0].src = '/image/drowe-sprait1.png';
  doveImgs[1].src = '/image/drowe-sprait2.png';


  // Класс для птиц
  class Bird {
    constructor(x, y, speed, type) {
      this.x = x;
      this.y = y;
      this.speed = speed;
      this.type = type;
      this.angle = Math.random() * 2 * Math.PI;
      this.changeDirectionTimer = 0;
    }

    update() {
      this.changeDirectionTimer++;
      if (this.changeDirectionTimer > Math.random() * 30 + 30) {
        this.angle += (Math.random() - 0.5) * Math.PI / 2;
        this.changeDirectionTimer = 0;
      }

      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;

      if (this.x < 0 || this.x > 800 - birdWidth) {
        this.angle = Math.PI - this.angle;
        this.x = Math.max(0, Math.min(800 - birdWidth, this.x));
      }
      if (this.y < 0 || this.y > 600 - birdHeight) {
        this.angle = -this.angle;
        this.y = Math.max(0, Math.min(600 - birdHeight, this.y));
      }
    }

     draw(ctx, frame) {
      ctx.save();
      ctx.translate(this.x + birdWidth / 2, this.y + birdHeight / 2);
      ctx.rotate(this.angle);
      ctx.imageSmoothingEnabled = true;
      const img = this.type === 'hawk' ? hawkImgs[frame] : doveImgs[frame];
      ctx.drawImage(img, -birdWidth / 2, -birdHeight / 2, birdWidth, birdHeight);
      ctx.restore();
    }
  }

  // Инициализация птиц
  const initializeBirds = () => {
    hawksRef.current = [];
    dovesRef.current = [];
    for (let i = 0; i < settings.hawkCount; i++) {
      hawksRef.current.push(new Bird(
        Math.random() * (800 - birdWidth),
        Math.random() * (600 - birdHeight),
        settings.speed,
        'hawk'
      ));
    }
    for (let i = 0; i < settings.doveCount; i++) {
      dovesRef.current.push(new Bird(
        Math.random() * (800 - birdWidth),
        Math.random() * (600 - birdHeight),
        settings.speed,
        'dove'
      ));
    }
  };

  // Анимация
  const anim = (ctx) => {
    ctx.clearRect(0, 0, 800 * window.devicePixelRatio, 600 * window.devicePixelRatio);
    frameCounterRef.current = (frameCounterRef.current + 1) % (framesPerSprite * 2); // 4 спрайта
    const currentFrame = Math.floor(frameCounterRef.current / framesPerSprite);
    [...hawksRef.current, ...dovesRef.current].forEach(bird => {
      bird.update();
      bird.draw(ctx, currentFrame);
    });
    animationIdRef.current = requestAnimationFrame(() => anim(ctx));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 800 * dpr;
    canvas.height = 600 * dpr;
    ctx.scale(dpr, dpr);

    // Проверка загрузки изображений
      let imagesLoaded = 0;
    const totalImages = hawkImgs.length + doveImgs.length;
    const onImageLoad = () => {
      imagesLoaded++;
      if (imagesLoaded === totalImages) {
        initializeBirds();
      }
    };

    hawkImgs.forEach(img => {
      img.onload = onImageLoad;
      img.onerror = () => console.error(`Ошибка загрузки изображения ястреба: ${img.src}`);
    });
    doveImgs.forEach(img => {
      img.onload = onImageLoad;
      img.onerror = () => console.error(`Ошибка загрузки изображения голубя: ${img.src}`);
    });

    return () => cancelAnimationFrame(animationIdRef.current);
  }, [settings]);

  const toggleAnimation = () => {
    animate(btn,{scale: 0})
    animate(start,{scale: 0})

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    setIsRunning(true);
    anim(ctx);
    

  };

  return (
    <div className="canvas-container">
      <Button onClick={toggleAnimation} variant="contained" className='start'>Старт</Button>
      <canvas ref={canvasRef} className="simulation-canvas" />
    </div>
  );
}

export default SimulationCanvas;