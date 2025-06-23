import React, { useRef, useEffect, useState, useMemo } from 'react';
import '../styles/SimulationCanvas.css';

function SimulationCanvas({ settings, isRunning, setIsImagesLoaded }) {
  // Состояние и референсы
  const [hawkCount, setHawkCount] = useState(settings.hawkCount);
  const [doveCount, setDoveCount] = useState(settings.doveCount);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const hawksRef = useRef([]);
  const dovesRef = useRef([]);
  const frameCounterRef = useRef(0);

  // Константы
  const birdWidth = 45; // Ширина птицы
  const birdHeight = 45; // Высота птицы
  const framesPerSprite = 10; // Кадров на спрайт
  const collisionRadius = birdWidth / 2; // Радиус столкновений
  const gravity = 0.08 // Гравитация для падения
  const fadeDelay = 60; // Задержка затухания (~1 секунда)
  const lerpFactor = 0.1; // Фактор плавности движения
  const canvasWidth = 1422; // Ширина канваса
  const canvasHeight = 519; // Высота канваса

  // Проценты для счетчика
  const { dovePercentage, hawkPercentage } = useMemo(() => {
    const totalBirds = hawkCount + doveCount;
    const dovePercentage = totalBirds > 0 ? ((doveCount / totalBirds) * 100).toFixed(0) : 0;
    const hawkPercentage = totalBirds > 0 ? ((hawkCount / totalBirds) * 100).toFixed(0) : 0;
    return { dovePercentage, hawkPercentage };
  }, [hawkCount, doveCount]);

  // Спрайты
  const hawkImgs = Array(4).fill().map((_, i) => {
    const img = new Image();
    img.src = `/image/hawk-sprait${i + 1}.png`;
    return img;
  });
  const doveImgs = Array(4).fill().map((_, i) => {
    const img = new Image();
    img.src = `/image/dove-sprait${i + 1}.png`;
    return img;
  });
  const doveFallingImg = new Image();
  doveFallingImg.src = '/image/dove_falling4.png';

  // Линейная интерполяция
  const lerp = (start, end, t) => start + (end - start) * t;

  // Нормализация угла
  const normalizeAngle = (angle) => {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  };

  // Класс птицы
  class Bird {
    constructor(x, y, speed, type) {
      this.x = x; // Начальная позиция X
      this.y = y; // Начальная позиция Y
      this.currentX = x; // Текущая позиция X для отрисовки
      this.currentY = y; // Текущая позиция Y для отрисовки
      this.goalX = x; // Целевая позиция X
      this.goalY = y; // Целевая позиция Y
      this.speed = speed; // Скорость движения
      this.type = type; // Тип: 'hawk' или 'dove'
      this.angle = Math.random() * 2 * Math.PI; // Случайный начальный угол
      this.currentAngle = this.angle; // Текущий угол для отрисовки
      this.goalAngle = this.angle; // Целевой угол направления
      this.changeDirectionTimer = 0; // Таймер для смены направления
      this.isFalling = false; // Падает ли птица
      this.fallVelocity = 0; // Скорость падения
      this.fadeTimer = 0; // Таймер затухания
      this.opacity = 1; // Прозрачность
      this.fallAngle = 0; // Фиксированный угол при падении
      this.remove = false; // Флаг для удаления
    }

    update() {
      if (this.isFalling) {
        // Падающая птица: движется только вниз
        this.fallVelocity += gravity;
        this.goalY += this.fallVelocity;
        if (this.goalY >= canvasHeight - birdHeight) {
          this.goalY = canvasHeight - birdHeight;
          this.fallVelocity = 0;
          this.fadeTimer++;
          if (this.fadeTimer >= fadeDelay) {
            this.remove = true; // Помечаем для удаления
            return;
          }
          if (this.fadeTimer >= 1) {
            this.opacity = 1 - this.fadeTimer / fadeDelay;
          }
        }
      } else {
        // Летающая птица: меняет направление и движется
        this.changeDirectionTimer++;
        if (this.changeDirectionTimer > Math.random() * 30 + 30) {
          this.goalAngle = normalizeAngle(this.goalAngle + (Math.random() - 0.5) * Math.PI);
          this.changeDirectionTimer = 0;
        }

        // Обновляем целевую позицию
        this.goalX += Math.cos(this.goalAngle) * this.speed;
        this.goalY += Math.sin(this.goalAngle) * this.speed;

        // Ограничиваем движение внутри канваса с отражением
        if (this.goalX < 0) {
          this.goalX = -this.goalX;
          this.goalAngle = Math.PI - this.goalAngle + (Math.random() - 0.5) * 0.2;
        } else if (this.goalX > canvasWidth - birdWidth) {
          this.goalX = 2 * (canvasWidth - birdWidth) - this.goalX;
          this.goalAngle = Math.PI - this.goalAngle + (Math.random() - 0.5) * 0.2;
        }
        if (this.goalY < 0) {
          this.goalY = -this.goalY;
          this.goalAngle = -this.goalAngle + (Math.random() - 0.5) * 0.2;
        } else if (this.goalY > canvasHeight - birdHeight) {
          this.goalY = 2 * (canvasHeight - birdHeight) - this.goalY;
          this.goalAngle = -this.goalAngle + (Math.random() - 0.5) * 0.2;
        }
        this.goalAngle = normalizeAngle(this.goalAngle);
      }

      // Плавно перемещаем текущую позицию и угол к целевым
      this.currentX = lerp(this.currentX, this.goalX, lerpFactor);
      this.currentY = lerp(this.currentY, this.goalY, lerpFactor);
      this.currentAngle = lerp(this.currentAngle, this.goalAngle, lerpFactor);
      this.angle = this.currentAngle;
    }
  }

  // Проверка столкновений
  const checkCollisions = () => {
    const doves = [...dovesRef.current];
    hawksRef.current.forEach(hawk => {
      doves.forEach(dove => {
        if (!dove.isFalling) {
          const dx = hawk.currentX + birdWidth / 2 - (dove.currentX + birdWidth / 2);
          const dy = hawk.currentY + birdHeight / 2 - (dove.currentY + birdHeight / 2);
          const distance = Math.hypot(dx, dy);
          if (distance < collisionRadius * 2) {
            dove.isFalling = true;
            dove.fallVelocity = 0;
            dove.fadeTimer = 0;
            dove.opacity = 1;
            dove.fallAngle = dove.currentAngle;
            console.log('Collision detected:', { hawkX: hawk.currentX, doveX: dove.currentX });
          }
        }
      });
    });
  };

  // Инициализация птиц
  const initializeBirds = () => {
    console.log('Инициализация птиц:', settings);
    hawksRef.current = [];
    dovesRef.current = [];
    setHawkCount(settings.hawkCount);
    setDoveCount(settings.doveCount);

    for (let i = 0; i < settings.hawkCount; i++) {
      const x = Math.random() * (canvasWidth - birdWidth);
      const y = Math.random() * (canvasHeight - birdHeight);
      hawksRef.current.push(new Bird(x, y, settings.speed, 'hawk'));
    }
    for (let i = 0; i < settings.doveCount; i++) {
      const x = Math.random() * (canvasWidth - birdWidth);
      const y = Math.random() * (canvasHeight - birdHeight);
      dovesRef.current.push(new Bird(x, y, settings.speed, 'dove'));
    }
  };

  // Цикл анимации
  const animate = () => {
    if (!isRunning || !canvasRef.current) {
      animationRef.current && cancelAnimationFrame(animationRef.current);
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    frameCounterRef.current = (frameCounterRef.current + 1) % (framesPerSprite * 4);
    const currentFrame = Math.floor(frameCounterRef.current / framesPerSprite);

    checkCollisions();

    // Обновляем и рисуем птиц
    const birds = [...hawksRef.current, ...dovesRef.current];
    birds.forEach(bird => {
      bird.update();
      const img = bird.isFalling
        ? doveFallingImg
        : bird.type === 'hawk'
        ? hawkImgs[currentFrame]
        : doveImgs[currentFrame];

      ctx.save();
      ctx.globalAlpha = bird.opacity;
      ctx.translate(bird.currentX + birdWidth / 2, bird.currentY + birdHeight / 2);
      ctx.rotate(bird.isFalling ? bird.fallAngle : bird.currentAngle);
      ctx.drawImage(img, -birdWidth / 2, -birdHeight / 2, birdWidth, birdHeight);
      ctx.restore();
    });

    // Удаляем голубей, помеченные для удаления
    const dovesToRemove = dovesRef.current.filter(dove => dove.remove);
    if (dovesToRemove.length > 0) {
      dovesRef.current = dovesRef.current.filter(dove => !dove.remove);
      setDoveCount(prev => prev - dovesToRemove.length);
      console.log('Removed doves:', dovesToRemove.length, 'New doveCount:', dovesRef.current.length);
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  // Синхронизация с настройками
  useEffect(() => {
    setHawkCount(settings.hawkCount);
    setDoveCount(settings.doveCount);
    frameCounterRef.current = 0;
    animationRef.current && cancelAnimationFrame(animationRef.current);
    initializeBirds();
  }, [settings]);

  // Загрузка изображений
  useEffect(() => {
    const totalImages = hawkImgs.length + doveImgs.length + 1;
    let loadedImages = 0;

    const onImageLoad = () => {
      loadedImages++;
      if (loadedImages === totalImages) {
        setIsImagesLoaded(true);
        initializeBirds();
      }
    };

    [...hawkImgs, ...doveImgs, doveFallingImg].forEach(img => {
      img.onload = onImageLoad;
    });

    return () => {
      animationRef.current && cancelAnimationFrame(animationRef.current);
      hawksRef.current = [];
      dovesRef.current = [];
    };
  }, [setIsImagesLoaded]);

  // Управление анимацией
  useEffect(() => {
    if (isRunning && canvasRef.current) {
      animate();
    } else {
      animationRef.current && cancelAnimationFrame(animationRef.current);
    }
    return () => animationRef.current && cancelAnimationFrame(animationRef.current);
  }, [isRunning]);

  // Рендеринг
  return (
    <div className="canvas-container">
      <div className="bird-counter">
        <div className="hawk"><p> <label htmlFor="">Голуби </label>{dovePercentage}%</p></div>
        <div className="dove"><p><label>Ястребы </label>{hawkPercentage}%</p></div>
      </div>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
      />
    </div>
  );
}

export default SimulationCanvas;