import React, { useRef, useEffect, useState, useMemo } from "react";
import "../styles/SimulationCanvas.scss";

function SimulationCanvas({ settings, isRunning, setIsImagesLoaded }) {
  const [hawkCount, setHawkCount] = useState(0);
  const [doveCount, setDoveCount] = useState(0);
  const [deadHawksOldAge, setDeadHawksOldAge] = useState(0);
  const [deadDovesOldAge, setDeadDovesOldAge] = useState(0);
  const [initialHawkCount, setInitialHawkCount] = useState(0);
  const [initialDoveCount, setInitialDoveCount] = useState(0);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const hawksRef = useRef([]);
  const dovesRef = useRef([]);
  const frameCounterRef = useRef(0);

  console.log("[Settings Debug]", settings);

  const CONFIG = {
    BIRD_WIDTH: 45,
    BIRD_HEIGHT: 45,
    FRAMES_PER_SPRITE: 10,
    TIME_LIFE: Number(settings.lifeSpan) || 5000, // Замедленный цикл
    COLLISION_RADIUS: 45 / 2,
    GRAVITY: 0.08,
    FADE_DELAY: 60,
    LERP_FACTOR: 0.1,
    CANVAS_WIDTH: 1280,
    CANVAS_HEIGHT: 450,
    RAGE_THRESHOLD: Math.min(Math.max(Number(settings.rageThreshold) || 0.5, 0), 1),
    RAGE_DURATION: Number(settings.rageDuration) || 300,
    RAGE_DAMAGE_MULTIPLIER: 1.5,
    RAGE_SPEED_MULTIPLIER: 1.3,
    DOVE_DAMAGE: Number(settings.doveDamage) || 2,
    HAWK_DOVE_DAMAGE: 5,
    HAWK_HAWK_DAMAGE: 5,
    BIRTH_HEALTH_MAX: Number(settings.birthHealthMax) || 35,
    BIRTH_PROBABILITY: Number(settings.birthProbability) || 0.5,
    BIRTH_AGE_MIN: Number(settings.birthAgeMin) || 100,
    BIRTH_AGE_MAX: Number(settings.birthAgeMax) || 5000,
    BIRTH_COOLDOWN: Number(settings.birthCooldown) || 30,
    BIRTH_RADIUS: Number(settings.birthRadius) || 20,
    MAX_BIRDS: Number(settings.maxBirds) || 100,
  };

  const { dovePercentage, hawkPercentage, deadHawksOldAgePercentage, deadDovesOldAgePercentage } = useMemo(() => {
    const total = hawkCount + doveCount;
    return {
      dovePercentage: total > 0 ? ((doveCount / total) * 100).toFixed(0) : 0,
      hawkPercentage: total > 0 ? ((hawkCount / total) * 100).toFixed(0) : 0,
      deadHawksOldAgePercentage: initialHawkCount > 0 ? ((deadHawksOldAge / initialHawkCount) * 100).toFixed(1) : 0,
      deadDovesOldAgePercentage: initialDoveCount > 0 ? ((deadDovesOldAge / initialDoveCount) * 100).toFixed(1) : 0,
    };
  }, [hawkCount, doveCount, deadHawksOldAge, deadDovesOldAge, initialHawkCount, initialDoveCount]);

  const images = useMemo(() => ({
    hawkImgs: Array(4).fill().map((_, i) => Object.assign(new Image(), { src: `/image/hawk-sprait${i + 1}.png` })),
    doveImgs: Array(4).fill().map((_, i) => Object.assign(new Image(), { src: `/image/dove-sprait${i + 1}.png` })),
    doveFallingImg: Object.assign(new Image(), { src: "/image/dove_falling4.png" }),
    hawkFallingImg: Object.assign(new Image(), { src: "/image/hawk_falling.png" }),
    fallbackImg: Object.assign(new Image(), { src: "/image/fallback.png" }),
  }), []);

  const lerp = (start, end, t) => start + (end - start) * t;

  class Bird {
    constructor(x, y, speed, type) {
      this.x = this.currentX = this.goalX = x;
      this.y = this.currentY = this.goalY = y;
      this.baseSpeed = this.speed = speed;
      this.health = type === "hawk" ? Number(settings.healthHawk) || 100 : Number(settings.healthDove) || 100;
      this.type = type;
      this.angle = Math.random() * 2 * Math.PI;
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
      this.healthBarFade = 1;
      this.lastBirthFrame = -CONFIG.BIRTH_COOLDOWN;
    }

    update() {
      if (this.isFalling) {
        this.fallVelocity += CONFIG.GRAVITY;
        this.goalY += this.fallVelocity;
        if (this.goalY >= CONFIG.CANVAS_HEIGHT - CONFIG.BIRD_HEIGHT) {
          this.goalY = CONFIG.CANVAS_HEIGHT - CONFIG.BIRD_HEIGHT;
          this.fallVelocity = 0;
          this.fadeTimer++;
          if (this.fadeTimer >= CONFIG.FADE_DELAY) {
            this.remove = true;
            return;
          }
          this.opacity = 1 - this.fadeTimer / CONFIG.FADE_DELAY;
        }
      } else {
        this.age++;

        // Искусственное снижение здоровья для тестов
/*         this.health = Math.max(0, this.health - 0.5); */

        // Отладка условий рождения
        if (this.age % 100 === 0) {
          console.log(
            `[Debug] ${this.type}: здоровье=${this.health.toFixed(1)}, возраст=${this.age}, ` +
            `cooldown=${frameCounterRef.current - this.lastBirthFrame}, ` +
            `pop=${this.type === "hawk" ? hawksRef.current.length : dovesRef.current.length}`
          );
        }

        // Механика рождения
        if (
          this.health <= CONFIG.BIRTH_HEALTH_MAX &&
          this.age >= CONFIG.BIRTH_AGE_MIN &&
          this.age <= CONFIG.BIRTH_AGE_MAX &&
          frameCounterRef.current - this.lastBirthFrame >= CONFIG.BIRTH_COOLDOWN &&
          (this.type === "hawk" ? hawksRef.current.length : dovesRef.current.length) < CONFIG.MAX_BIRDS &&
          Math.random() < CONFIG.BIRTH_PROBABILITY
        ) {
          console.log(
            `[Рождение] ${this.type}: здоровье=${this.health.toFixed(1)}, возраст=${this.age}, кадр=${frameCounterRef.current}`
          );
          const angle = Math.random() * 2 * Math.PI;
          const birthX = Math.max(
            0,
            Math.min(this.currentX + Math.cos(angle) * CONFIG.BIRTH_RADIUS, CONFIG.CANVAS_WIDTH - CONFIG.BIRD_WIDTH)
          );
          const birthY = Math.max(
            0,
            Math.min(this.currentY + Math.sin(angle) * CONFIG.BIRTH_RADIUS, CONFIG.CANVAS_HEIGHT - CONFIG.BIRD_HEIGHT)
          );

          if (this.type === "hawk") {
            hawksRef.current.push(new Bird(birthX, birthY, this.speed, "hawk"));
            setHawkCount((prev) => {
              console.log(`Новый ястреб, hawkCount=${prev + 1}`);
              return prev + 1;
            });
            setInitialHawkCount((prev) => prev + 1);
          } else {
            dovesRef.current.push(new Bird(birthX, birthY, this.speed, "dove"));
            setDoveCount((prev) => {
              console.log(`Новый голубь, doveCount=${prev + 1}`);
              return prev + 1;
            });
            setInitialDoveCount((prev) => prev + 1);
          }
          this.lastBirthFrame = frameCounterRef.current;
        }

        if (this.age >= CONFIG.TIME_LIFE) {
          console.log(`[Смерть от старости] ${this.type}: возраст=${this.age}`);
          this.isFalling = true;
          this.fallVelocity = 0;
          this.fadeTimer = 0;
          this.opacity = 1;
          this.fallAngle = this.angle;
          return;
        }

        if (this.type === "hawk" && this.isEnraged) {
          this.rageTimer++;
          if (this.rageTimer >= CONFIG.RAGE_DURATION) {
            this.isEnraged = false;
            this.rage = 0;
            this.rageTimer = 0;
            this.speed = this.baseSpeed;
          }
        }

        this.goalX += Math.cos(this.angle) * this.speed;
        this.goalY += Math.sin(this.angle) * this.speed;

        if (this.goalX < 0) {
          this.goalX = -this.goalX;
          this.angle = Math.PI - this.angle;
        } else if (this.goalX > CONFIG.CANVAS_WIDTH - CONFIG.BIRD_WIDTH) {
          this.goalX = 2 * (CONFIG.CANVAS_WIDTH - CONFIG.BIRD_WIDTH) - this.goalX;
          this.angle = Math.PI - this.angle;
        }
        if (this.goalY < 0) {
          this.goalY = -this.goalY;
          this.angle = -this.angle;
        } else if (this.goalY > CONFIG.CANVAS_HEIGHT - CONFIG.BIRD_HEIGHT) {
          this.goalY = 2 * (CONFIG.CANVAS_HEIGHT - CONFIG.BIRD_HEIGHT) - this.goalY;
          this.angle = -this.angle;
        }
      }

      this.currentX = lerp(this.currentX, this.goalX, CONFIG.LERP_FACTOR);
      this.currentY = lerp(this.currentY, this.goalY, CONFIG.LERP_FACTOR);
      this.healthBarFade = lerp(this.healthBarFade, this.health / 100, 0.2);
    }
  }

  const checkCollisions = () => {
    const hawks = hawksRef.current;
    const doves = dovesRef.current;

    const checkPairCollision = (bird1, bird2, damage, isHawkHawk = false, isDoveDove = false) => {
      if (!bird1.isFalling && !bird2.isFalling) {
        const dx = bird1.currentX + CONFIG.BIRD_WIDTH / 2 - (bird2.currentX + CONFIG.BIRD_WIDTH / 2);
        const dy = bird1.currentY + CONFIG.BIRD_HEIGHT / 2 - (bird2.currentY + CONFIG.BIRD_HEIGHT / 2);
        const distance = Math.hypot(dx, dy);
        if (distance < CONFIG.COLLISION_RADIUS * 2) {
          const appliedDamage = (bird1.isEnraged || bird2.isEnraged) && !isDoveDove ? damage * CONFIG.RAGE_DAMAGE_MULTIPLIER : damage;

          if (!(bird1.type === "hawk" && bird2.type === "dove")) {
            bird1.health -= appliedDamage;
          }
          if (!(bird2.type === "hawk" && bird1.type === "dove")) {
            bird2.health -= appliedDamage;
          }

          if (bird1.type === "hawk") bird1.rage = Math.min(bird1.rage + 0.1, 1);
          if (bird2.type === "hawk") bird2.rage = Math.min(bird2.rage + 0.1, 1);

          if (bird1.type === "hawk" && bird1.rage >= CONFIG.RAGE_THRESHOLD && !bird1.isEnraged) {
            bird1.isEnraged = true;
            bird1.rageTimer = 0;
            bird1.speed = bird1.baseSpeed * CONFIG.RAGE_SPEED_MULTIPLIER;
          }
          if (bird2.type === "hawk" && bird2.rage >= CONFIG.RAGE_THRESHOLD && !bird2.isEnraged) {
            bird2.isEnraged = true;
            bird2.rageTimer = 0;
            bird2.speed = bird2.baseSpeed * CONFIG.RAGE_SPEED_MULTIPLIER;
          }

          if (bird1.health <= 0) {
            bird1.isFalling = true;
            bird1.fallVelocity = 0;
            bird1.fadeTimer = 0;
            bird1.opacity = 1;
            bird1.fallAngle = bird1.angle;
          }
          if (bird2.health <= 0 && !isDoveDove) {
            bird2.isFalling = true;
            bird2.fallVelocity = 0;
            bird2.fadeTimer = 0;
            bird2.opacity = 1;
            bird2.fallAngle = bird2.angle;
          }
        }
      }
    };

    for (let i = 0; i < hawks.length; i++) {
      for (let j = 0; j < doves.length; j++) {
        checkPairCollision(hawks[i], doves[j], CONFIG.HAWK_DOVE_DAMAGE);
      }
    }
    for (let i = 0; i < hawks.length; i++) {
      for (let j = i + 1; j < hawks.length; j++) {
        checkPairCollision(hawks[i], hawks[j], CONFIG.HAWK_HAWK_DAMAGE, true);
      }
    }
    for (let i = 0; i < doves.length; i++) {
      for (let j = i + 1; j < doves.length; j++) {
        checkPairCollision(doves[i], doves[j], CONFIG.DOVE_DAMAGE, false, true);
      }
    }
  };

  const initializeBirds = () => {
    hawksRef.current = [];
    dovesRef.current = [];
    const hawkCount = Math.max(0, Math.floor(Number(settings.hawkCount) || 30));
    const doveCount = Math.max(0, Math.floor(Number(settings.doveCount) || 30));
    setHawkCount(hawkCount);
    setDoveCount(doveCount);
    setInitialHawkCount(hawkCount);
    setInitialDoveCount(doveCount);
    setDeadHawksOldAge(0);
    setDeadDovesOldAge(0);

    for (let i = 0; i < hawkCount; i++) {
      const x = Math.random() * (CONFIG.CANVAS_WIDTH - CONFIG.BIRD_WIDTH);
      const y = Math.random() * (CONFIG.CANVAS_HEIGHT - CONFIG.BIRD_HEIGHT);
      hawksRef.current.push(new Bird(x, y, Number(settings.speed) || 2, "hawk"));
    }
    for (let i = 0; i < doveCount; i++) {
      const x = Math.random() * (CONFIG.CANVAS_WIDTH - CONFIG.BIRD_WIDTH);
      const y = Math.random() * (CONFIG.CANVAS_HEIGHT - CONFIG.BIRD_HEIGHT);
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
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    frameCounterRef.current = (frameCounterRef.current + 1) % (CONFIG.FRAMES_PER_SPRITE * 4);
    const currentFrame = Math.floor(frameCounterRef.current / CONFIG.FRAMES_PER_SPRITE);

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
        const healthBarWidth = CONFIG.BIRD_WIDTH * 0.8;
        const healthBarHeight = 4;
        const healthBarX = bird.currentX + (CONFIG.BIRD_WIDTH - healthBarWidth) / 2;
        const healthBarY = bird.currentY - 10;

        ctx.fillStyle = bird.health > 60 ? "#00ff00" : bird.health > 20 ? "#ffff00" : "#ff0000";
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * bird.healthBarFade, healthBarHeight);
      }

      ctx.translate(bird.currentX + CONFIG.BIRD_WIDTH / 2, bird.currentY + CONFIG.BIRD_HEIGHT / 2);
      ctx.rotate(bird.isFalling ? bird.fallAngle : bird.angle);
      ctx.drawImage(
        isImageLoaded(img) ? img : isImageLoaded(images.fallbackImg) ? images.fallbackImg : images.doveImgs[0],
        -CONFIG.BIRD_WIDTH / 2,
        -CONFIG.BIRD_HEIGHT / 2,
        CONFIG.BIRD_WIDTH,
        CONFIG.BIRD_HEIGHT
      );

      if (bird.type === "hawk" && bird.isEnraged) {
        const pulse = 1 + 0.1 * Math.sin(frameCounterRef.current * 0.1);
        ctx.globalAlpha = bird.opacity * 0.6;
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, (CONFIG.BIRD_WIDTH / 1.5) * pulse, 0, 2 * Math.PI);
        ctx.stroke();
      }

      ctx.restore();
    });

    const dovesToRemove = dovesRef.current.filter((dove) => dove.remove);
    const hawksToRemove = hawksRef.current.filter((hawk) => hawk.remove);
    if (dovesToRemove.length > 0) {
      dovesRef.current = dovesRef.current.filter((dove) => !dove.remove);
      setDoveCount((prev) => prev - dovesToRemove.length);
      setDeadDovesOldAge((prev) => prev + dovesToRemove.filter((dove) => dove.age >= CONFIG.TIME_LIFE).length);
    }
    if (hawksToRemove.length > 0) {
      hawksRef.current = hawksRef.current.filter((hawk) => !hawk.remove);
      setHawkCount((prev) => prev - hawksToRemove.length);
      setDeadHawksOldAge((prev) => prev + hawksToRemove.filter((hawk) => hawk.age >= CONFIG.TIME_LIFE).length);
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
            {deadHawksOldAge}
          </p>
        </div>
        <div className="dead-doves">
          <p>
            <label>Погибло голубей от старости: </label>
            {deadDovesOldAge}
          </p>
        </div>
      </div>
      <canvas ref={canvasRef} width={CONFIG.CANVAS_WIDTH} height={CONFIG.CANVAS_HEIGHT} />
    </div>
  );
}

export default SimulationCanvas;