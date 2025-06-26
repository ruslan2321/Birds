import React, { useRef, useEffect, useState, useMemo } from "react";
import "../styles/SimulationCanvas.scss";

function SimulationCanvas({ settings, isRunning, setIsImagesLoaded }) {
  // Состояния
  const [hawkCount, setHawkCount] = useState(0);
  const [doveCount, setDoveCount] = useState(0);
  const [deadHawksOldAge, setDeadHawksOldAge] = useState(0);
  const [deadDovesOldAge, setDeadDovesOldAge] = useState(0);
  const [initialHawkCount, setInitialHawkCount] = useState(0);
  const [initialDoveCount, setInitialDoveCount] = useState(0);

  // Референсы
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const hawksRef = useRef([]);
  const dovesRef = useRef([]);
  const frameCounterRef = useRef(0);

  // Константы
  const BIRD_WIDTH = 45;
  const BIRD_HEIGHT = 45;
  const FRAMES_PER_SPRITE = 10;
  const TIME_LIFE = Number(settings.lifeSpan) || 6000;
  const COLLISION_RADIUS = BIRD_WIDTH / 2;
  const GRAVITY = 0.08;
  const FADE_DELAY = 60;
  const LERP_FACTOR = 0.1;
  const CANVAS_WIDTH = 1280;
  const CANVAS_HEIGHT = 450;
  const RAGE_THRESHOLD = Number(settings.rageThreshold) || 0.5;
  const RAGE_DURATION = Number(settings.rageDuration) || 300;
  const RAGE_DAMAGE_MULTIPLIER = 1.5;
  const RAGE_SPEED_MULTIPLIER = 1.3;
  const DOVE_DAMAGE = Number(settings.doveDamage) || 2;
  const HAWK_DOVE_DAMAGE = 5;
  const HAWK_HAWK_DAMAGE = 5;

  // Проценты голубей, ястребов и смертей от старости
  const { dovePercentage, hawkPercentage, deadHawksOldAgePercentage, deadDovesOldAgePercentage } = useMemo(() => {
    const total = hawkCount + doveCount;
    return {
      dovePercentage: total > 0 ? ((doveCount / total) * 100).toFixed(0) : 0,
      hawkPercentage: total > 0 ? ((hawkCount / total) * 100).toFixed(0) : 0,
      deadHawksOldAgePercentage: initialHawkCount > 0 ? ((deadHawksOldAge / initialHawkCount) * 100).toFixed(0) : 0,
      deadDovesOldAgePercentage: initialDoveCount > 0 ? ((deadDovesOldAge / initialDoveCount) * 100).toFixed(0) : 0,
    };
  }, [hawkCount, doveCount, deadHawksOldAge, deadDovesOldAge, initialHawkCount, initialDoveCount]);

  // Изображения
  const images = useMemo(() => ({
    hawkImgs: Array(4).fill().map((_, i) => Object.assign(new Image(), { src: `/image/hawk-sprait${i + 1}.png` })),
    doveImgs: Array(4).fill().map((_, i) => Object.assign(new Image(), { src: `/image/dove-sprait${i + 1}.png` })),
    doveFallingImg: Object.assign(new Image(), { src: "/image/dove_falling4.png" }),
    hawkFallingImg: Object.assign(new Image(), { src: "/image/hawk_falling.png" }),
    fallbackImg: Object.assign(new Image(), { src: "/image/fallback.png" }),
  }), []);

  const lerp = (start, end, t) => start + (end - start) * t;

  const normalizeAngle = (angle) => {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  };

  class Bird {
    constructor(x, y, speed, type) {
      this.x = x;
      this.y = y;
      this.currentX = x;
      this.currentY = y;
      this.goalX = x;
      this.goalY = y;
      this.baseSpeed = speed;
      this.speed = speed;
      this.health = type === "hawk" ? Number(settings.healthHawk) || 100 : Number(settings.healthDove) || 100;
      this.type = type;
      this.angle = Math.random() * 2 * Math.PI;
      this.currentAngle = this.angle;
      this.goalAngle = this.angle;
      this.changeDirectionTimer = 0;
      this.isFalling = false;
      this.fallVelocity = 0;
      this.fadeTimer = 0;
      this.opacity = 1;
      this.fallAngle = 0;
      this.remove = false;
      this.age = 0;
      this.rage = 0;
      this.rageTimer = 0;
      this.isEnraged = false;
      this.healthBarFade = 1; // Для анимации полоски здоровья
    }

    update() {
      if (this.isFalling) {
        this.fallVelocity += GRAVITY;
        this.goalY += this.fallVelocity;
        if (this.goalY >= CANVAS_HEIGHT - BIRD_HEIGHT) {
          this.goalY = CANVAS_HEIGHT - BIRD_HEIGHT;
          this.fallVelocity = 0;
          this.fadeTimer++;
          if (this.fadeTimer >= FADE_DELAY) {
            this.remove = true;
            return;
          }
          this.opacity = 1 - this.fadeTimer / FADE_DELAY;
        }
      } else {
        this.age++;
        if (this.age >= TIME_LIFE) {
          this.isFalling = true;
          this.fallVelocity = 0;
          this.fadeTimer = 0;
          this.opacity = 1;
          this.fallAngle = this.currentAngle;
          return;
        }

        if (this.type === "hawk" && this.isEnraged) {
          this.rageTimer++;
          if (this.rageTimer >= RAGE_DURATION) {
            this.isEnraged = false;
            this.rage = 0;
            this.rageTimer = 0;
            this.speed = this.baseSpeed;
          }
        }

        this.changeDirectionTimer++;
        if (this.changeDirectionTimer > Math.random() * 30 + 30) {
          this.goalAngle = normalizeAngle(this.goalAngle + (Math.random() - 0.5) * Math.PI);
          this.changeDirectionTimer = 0;
        }

        this.goalX += Math.cos(this.goalAngle) * this.speed;
        this.goalY += Math.sin(this.goalAngle) * this.speed;

        if (this.goalX < 0) {
          this.goalX = -this.goalX;
          this.goalAngle = Math.PI - this.goalAngle + (Math.random() - 0.5) * 0.2;
        } else if (this.goalX > CANVAS_WIDTH - BIRD_WIDTH) {
          this.goalX = 2 * (CANVAS_WIDTH - BIRD_WIDTH) - this.goalX;
          this.goalAngle = Math.PI - this.goalAngle + (Math.random() - 0.5) * 0.2;
        }
        if (this.goalY < 0) {
          this.goalY = -this.goalY;
          this.goalAngle = -this.goalAngle + (Math.random() - 0.5) * 0.2;
        } else if (this.goalY > CANVAS_HEIGHT - BIRD_HEIGHT) {
          this.goalY = 2 * (CANVAS_HEIGHT - BIRD_HEIGHT) - this.goalY;
          this.goalAngle = -this.goalAngle + (Math.random() - 0.5) * 0.2;
        }
        this.goalAngle = normalizeAngle(this.goalAngle);
      }

      this.currentX = lerp(this.currentX, this.goalX, LERP_FACTOR);
      this.currentY = lerp(this.currentY, this.goalY, LERP_FACTOR);
      this.currentAngle = lerp(this.currentAngle, this.goalAngle, LERP_FACTOR);
      this.angle = this.currentAngle;
      this.healthBarFade = lerp(this.healthBarFade, this.health / 100, 0.2); // Плавная анимация полоски здоровья
    }
  }

  const checkCollisions = () => {
    const hawks = hawksRef.current;
    const doves = dovesRef.current;

    const checkPairCollision = (bird1, bird2, damage, isHawkHawk = false, isDoveDove = false) => {
      if (!bird1.isFalling && !bird2.isFalling) {
        const dx = bird1.currentX + BIRD_WIDTH / 2 - (bird2.currentX + BIRD_WIDTH / 2);
        const dy = bird1.currentY + BIRD_HEIGHT / 2 - (bird2.currentY + BIRD_HEIGHT / 2);
        const distance = Math.hypot(dx, dy);
        if (distance < COLLISION_RADIUS * 2) {
          const appliedDamage = (bird1.isEnraged || bird2.isEnraged) && !isDoveDove ? damage * RAGE_DAMAGE_MULTIPLIER : damage;
          bird1.health -= appliedDamage;
          if (!isDoveDove) bird2.health -= appliedDamage;

          if (bird1.type === "hawk") bird1.rage = Math.min(bird1.rage + 0.1, 1);
          if (bird2.type === "hawk") bird2.rage = Math.min(bird2.rage + 0.1, 1);

          if (bird1.type === "hawk" && bird1.rage >= RAGE_THRESHOLD && !bird1.isEnraged) {
            bird1.isEnraged = true;
            bird1.rageTimer = 0;
            bird1.speed = bird1.baseSpeed * RAGE_SPEED_MULTIPLIER;
          }
          if (bird2.type === "hawk" && bird2.rage >= RAGE_THRESHOLD && !bird2.isEnraged) {
            bird2.isEnraged = true;
            bird2.rageTimer = 0;
            bird2.speed = bird2.baseSpeed * RAGE_SPEED_MULTIPLIER;
          }

          if (bird1.health <= 0) {
            bird1.isFalling = true;
            bird1.fallVelocity = 0;
            bird1.fadeTimer = 0;
            bird1.opacity = 1;
            bird1.fallAngle = bird1.currentAngle;
          }
          if (bird2.health <= 0 && !isDoveDove) {
            bird2.isFalling = true;
            bird2.fallVelocity = 0;
            bird2.fadeTimer = 0;
            bird2.opacity = 1;
            bird2.fallAngle = bird2.currentAngle;
          }
        }
      }
    };

    for (let i = 0; i < hawks.length; i++) {
      for (let j = 0; j < doves.length; j++) {
        checkPairCollision(hawks[i], doves[j], HAWK_DOVE_DAMAGE);
      }
    }

    for (let i = 0; i < hawks.length; i++) {
      for (let j = i + 1; j < hawks.length; j++) {
        checkPairCollision(hawks[i], hawks[j], HAWK_HAWK_DAMAGE, true);
      }
    }

    for (let i = 0; i < doves.length; i++) {
      for (let j = i + 1; j < doves.length; j++) {
        checkPairCollision(doves[i], doves[j], DOVE_DAMAGE, false, true);
      }
    }
  };

  const initializeBirds = () => {
    hawksRef.current = [];
    dovesRef.current = [];
    const hawkCount = Math.max(0, Math.floor(Number(settings.hawkCount) || 0));
    const doveCount = Math.max(0, Math.floor(Number(settings.doveCount) || 0));
    setHawkCount(hawkCount);
    setDoveCount(doveCount);
    setInitialHawkCount(hawkCount);
    setInitialDoveCount(doveCount);
    setDeadHawksOldAge(0);
    setDeadDovesOldAge(0);

    for (let i = 0; i < hawkCount; i++) {
      const x = Math.random() * (CANVAS_WIDTH - BIRD_WIDTH);
      const y = Math.random() * (CANVAS_HEIGHT - BIRD_HEIGHT);
      hawksRef.current.push(new Bird(x, y, Number(settings.speed) || 2, "hawk"));
    }
    for (let i = 0; i < doveCount; i++) {
      const x = Math.random() * (CANVAS_WIDTH - BIRD_WIDTH);
      const y = Math.random() * (CANVAS_HEIGHT - BIRD_HEIGHT);
      dovesRef.current.push(new Bird(x, y, Number(settings.speed) || 2, "dove"));
    }
  };

  const isImageLoaded = (img) => img.complete && img.naturalWidth !== 0;

  const animate = () => {
    if (!isRunning || !canvasRef.current) {
      animationRef.current && cancelAnimationFrame(animationRef.current);
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    frameCounterRef.current = (frameCounterRef.current + 1) % (FRAMES_PER_SPRITE * 4);
    const currentFrame = Math.floor(frameCounterRef.current / FRAMES_PER_SPRITE);

    checkCollisions();

    const birds = [...hawksRef.current, ...dovesRef.current];
    birds.forEach((bird) => {
      bird.update();

      const img = bird.isFalling
        ? bird.type === "hawk"
          ? images.hawkFallingImg
          : images.doveFallingImg
        : bird.type === "hawk"
        ? images.hawkImgs[currentFrame]
        : images.doveImgs[currentFrame];

      ctx.save();
      ctx.globalAlpha = bird.opacity;

      if (!bird.isFalling) {
        const healthBarWidth = BIRD_WIDTH * 0.9;
        const healthBarHeight = 8;
        const healthBarX = bird.currentX + (BIRD_WIDTH - healthBarWidth) / 2;
        const healthBarY = bird.currentY - 15;

        // Градиент для полоски здоровья
        const gradient = ctx.createLinearGradient(healthBarX, healthBarY, healthBarX + healthBarWidth, healthBarY);
        gradient.addColorStop(0, bird.health > 60 ? "#00ff00" : bird.health > 20 ? "#ffff00" : "#ff0000");
        gradient.addColorStop(1, bird.health > 60 ? "#00cc00" : bird.health > 20 ? "#cccc00" : "#cc0000");

        // Тень для полоски
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Фон полоски
        ctx.fillStyle = "#333";
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

        // Полоска здоровья с анимацией
        ctx.fillStyle = gradient;
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * bird.healthBarFade, healthBarHeight);

        // Рамка
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
      }

      ctx.translate(bird.currentX + BIRD_WIDTH / 2, bird.currentY + BIRD_HEIGHT / 2);
      ctx.rotate(bird.isFalling ? bird.fallAngle : bird.currentAngle);
      ctx.drawImage(
        isImageLoaded(img) ? img : isImageLoaded(images.fallbackImg) ? images.fallbackImg : images.doveImgs[0],
        -BIRD_WIDTH / 2,
        -BIRD_HEIGHT / 2,
        BIRD_WIDTH,
        BIRD_HEIGHT
      );

      if (bird.type === "hawk" && bird.isEnraged) {
        // Пульсирующий эффект ярости
        const pulse = 1 + 0.1 * Math.sin(frameCounterRef.current * 0.1);
        ctx.globalAlpha = bird.opacity * 0.6;
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, (BIRD_WIDTH / 1.5) * pulse, 0, 2 * Math.PI);
        ctx.stroke();

        // Свечение
        ctx.globalAlpha = bird.opacity * 0.3;
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.beginPath();
        ctx.arc(0, 0, (BIRD_WIDTH / 1.2) * pulse, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.restore();
      ctx.shadowBlur = 0; // Сброс тени
    });

    const dovesToRemove = dovesRef.current.filter((dove) => dove.remove);
    const hawksToRemove = hawksRef.current.filter((hawk) => hawk.remove);
    if (dovesToRemove.length > 0) {
      dovesRef.current = dovesRef.current.filter((dove) => !dove.remove);
      setDoveCount((prev) => prev - dovesToRemove.length);
      setDeadDovesOldAge((prev) => prev + dovesToRemove.filter((dove) => dove.age >= TIME_LIFE).length);
    }
    if (hawksToRemove.length > 0) {
      hawksRef.current = hawksRef.current.filter((hawk) => !hawk.remove);
      setHawkCount((prev) => prev - hawksToRemove.length);
      setDeadHawksOldAge((prev) => prev + hawksToRemove.filter((hawk) => hawk.age >= TIME_LIFE).length);
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    initializeBirds();
  }, [settings]);

  useEffect(() => {
    const totalImages = images.hawkImgs.length + images.doveImgs.length + 2;
    let loadedImages = 0;

    const onImageLoadOrError = () => {
      loadedImages++;
      if (loadedImages === totalImages) {
        setIsImagesLoaded(true);
        initializeBirds();
      }
    };

    [...images.hawkImgs, ...images.doveImgs, images.doveFallingImg, images.hawkFallingImg].forEach((img) => {
      img.onload = onImageLoadOrError;
      img.onerror = () => {
        console.error(`Ошибка загрузки изображения: ${img.src}`);
        onImageLoadOrError();
      };
    });

    return () => {
      animationRef.current && cancelAnimationFrame(animationRef.current);
      hawksRef.current = [];
      dovesRef.current = [];
    };
  }, [images, setIsImagesLoaded]);

  useEffect(() => {
    if (isRunning && canvasRef.current) {
      animate();
    } else {
      animationRef.current && cancelAnimationFrame(animationRef.current);
    }
    return () => animationRef.current && cancelAnimationFrame(animationRef.current);
  }, [isRunning]);

  return (
    <div className="canvas-container">
      <div className="bird-counter">
        <div className="hawk">
          <p>
            <label>Голуби: </label>
            {dovePercentage}% 
          </p>
        </div>
        <div className="dove">
          <p>
            <label>Ястребы: </label>
            {hawkPercentage}%
          </p>
        </div>
        <div className="dead-hawks">
          <p>
            <label>Погибло ястребов от старости: </label>
            {deadHawksOldAgePercentage}%
          </p>
        </div>
        <div className="dead-doves">
          <p>
            <label>Погибло голубей от старости: </label>
            {deadDovesOldAgePercentage}%
          </p>
        </div>
      </div>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
    </div>
  );
}

export default SimulationCanvas;