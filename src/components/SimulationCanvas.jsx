import React, { useRef, useEffect, useState, useMemo } from "react";
import "../styles/SimulationCanvas.scss";

// Компонент для отображения симуляции птиц (ястребов и голубей) на холсте
function SimulationCanvas({ settings, isRunning, setIsImagesLoaded }) {
  // Состояния для отслеживания количества птиц и смертей от старости
  const [hawkCount, setHawkCount] = useState(0); // Количество ястребов
  const [doveCount, setDoveCount] = useState(0); // Количество голубей
  const [deadHawksOldAge, setDeadHawksOldAge] = useState(0); // Счетчик ястребов, умерших от старости
  const [deadDovesOldAge, setDeadDovesOldAge] = useState(0); // Счетчик голубей, умерших от старости
  const [initialHawkCount, setInitialHawkCount] = useState(0); // Начальное количество ястребов
  const [initialDoveCount, setInitialDoveCount] = useState(0); // Начальное количество голубей

  // Ссылки для управления холстом, анимацией, списками птиц и частиц
  const canvasRef = useRef(null); // Ссылка на элемент canvas
  const animationRef = useRef(null); // Ссылка для requestAnimationFrame
  const hawksRef = useRef([]); // Массив ястребов
  const dovesRef = useRef([]); // Массив голубей
  const feathersRef = useRef([]); // Массив частиц перьев
  const frameCounterRef = useRef(0); // Счетчик кадров для анимации

  // Конфигурация симуляции с параметрами из настроек
  const CONFIG = {
    BIRD_WIDTH: 45, // Ширина спрайта птицы
    BIRD_HEIGHT: 45, // Высота спрайта птицы
    FRAMES_PER_SPRITE: 10, // Кадры для смены спрайтов анимации
    TIME_LIFE: Number(settings.lifeSpan) || 6000, // Жизненный цикл (кадры)
    COLLISION_RADIUS: 15, // Радиус столкновений (уменьшен для меньшего числа столкновений)
    GRAVITY: 0.08, // Гравитация для падения
    FADE_DELAY: 60, // Задержка затухания при смерти
    LERP_FACTOR: 0.1, // Коэффициент интерполяции движения
    CANVAS_WIDTH: 1280, // Ширина холста
    CANVAS_HEIGHT: 450, // Высота холста
    RAGE_THRESHOLD: Math.min(Math.max(Number(settings.rageThreshold) || 0.7, 0), 1), // Порог ярости ястребов
    RAGE_DURATION: Number(settings.rageDuration) || 300, // Длительность ярости
    RAGE_DAMAGE_MULTIPLIER: 1.5, // Множитель урона в ярости
    RAGE_SPEED_MULTIPLIER: 1.2, // Множитель скорости в ярости
    DOVE_DAMAGE: Number(settings.doveDamage) || 2, // Урон голубя
    HAWK_DOVE_DAMAGE: 3, // Урон ястреба голубю
    HAWK_HAWK_DAMAGE: 4, // Урон ястреба ястребу
    BIRTH_HEALTH_MAX: Number(settings.birthHealthMax) || 35, // Макс. здоровье для рождения
    BIRTH_PROBABILITY: Number(settings.birthProbability) || 0.5, // Вероятность рождения
    BIRTH_AGE_MIN: Number(settings.birthAgeMin) || 100, // Мин. возраст для рождения
    BIRTH_AGE_MAX: Number(settings.birthAgeMax) || 5000, // Макс. возраст для рождения
    BIRTH_COOLDOWN: Number(settings.birthCooldown) || 30, // Перезарядка рождения
    BIRTH_RADIUS: Number(settings.birthRadius) || 20, // Радиус появления потомства
    MAX_BIRDS: Number(settings.maxBirds) || 100, // Макс. количество птиц
    INVINCIBILITY_DURATION: 180, // Длительность неуязвимости новых птиц (кадры, ~3 сек при 60 FPS)
    MAX_FEATHERS: 200, // Максимальное количество частиц перьев
  };

  // Вычисление процентов для UI
  const { dovePercentage, hawkPercentage, deadHawksOldAgePercentage, deadDovesOldAgePercentage } = useMemo(() => {
    const total = hawkCount + doveCount;
    return {
      dovePercentage: total > 0 ? ((doveCount / total) * 100).toFixed(0) : 0, // Процент голубей
      hawkPercentage: total > 0 ? ((hawkCount / total) * 100).toFixed(0) : 0, // Процент ястребов
      deadHawksOldAgePercentage: initialHawkCount > 0 ? ((deadHawksOldAge / initialHawkCount) * 100).toFixed(1) : 0, // Процент погибших ястребов от старости
      deadDovesOldAgePercentage: initialDoveCount > 0 ? ((deadDovesOldAge / initialDoveCount) * 100).toFixed(1) : 0, // Процент погибших голубей от старости
    };
  }, [hawkCount, doveCount, deadHawksOldAge, deadDovesOldAge, initialHawkCount, initialDoveCount]);

  // Загрузка изображений для анимации
  const images = useMemo(() => ({
    hawkImgs: Array(4).fill().map((_, i) => Object.assign(new Image(), { src: `/image/hawk-sprait${i + 1}.png` })), // Спрайты ястреба
    doveImgs: Array(4).fill().map((_, i) => Object.assign(new Image(), { src: `/image/dove-sprait${i + 1}.png` })), // Спрайты голубя
    doveFallingImg: Object.assign(new Image(), { src: "/image/dove_falling4.png" }), // Спрайт падающего голубя
    hawkFallingImg: Object.assign(new Image(), { src: "/image/hawk_falling.png" }), // Спрайт падающего ястреба
    featherImg: Object.assign(new Image(), { src: "/image/feather.png" }), // Изображение пера
    fallbackImg: Object.assign(new Image(), { src: "/image/fallback.png" }), // Запасное изображение
  }), []);

  // Линейная интерполяция для плавного движения
  const lerp = (start, end, t) => start + (end - start) * t;

  // Класс частицы пера
  class FeatherParticle {
    constructor(x, y, type) {
      this.x = x; // Начальная позиция X
      this.y = y; // Начальная позиция Y
      this.vx = (Math.random() - 0.5) * 8; // Случайная скорость по X (-4 до 4)
      this.vy = (Math.random() - 0.5) * 8; // Случайная скорость по Y (-4 до 4)
      this.angle = Math.random() * 2 * Math.PI; // Случайный угол вращения
      this.angularVelocity = (Math.random() - 0.5) * 0.1; // Скорость вращения
      this.opacity = 1; // Начальная прозрачность
      this.lifetime = 60; // Время жизни в кадрах (~1 сек при 60 FPS)
      this.size = Math.random() * 10 + 5; // Размер пера (5-15 пикселей)
      this.type = type; // Тип птицы ("hawk" или "dove") для выбора цвета
    }

    update() {
      this.x += this.vx; // Обновление позиции X
      this.y += this.vy; // Обновление позиции Y
      this.vy += CONFIG.GRAVITY * 0.5; // Легкая гравитация для перьев
      this.angle += this.angularVelocity; // Обновление угла вращения
      this.opacity -= 1 / this.lifetime; // Затухание прозрачности
      this.lifetime--; // Уменьшение времени жизни
    }

    draw(ctx, img) {
      if (this.lifetime <= 0 || this.opacity <= 0) return; // Пропуск, если частица исчезла

      ctx.save();
      ctx.globalAlpha = this.opacity; // Установка прозрачности
      ctx.translate(this.x, this.y); // Перемещение в позицию частицы
      ctx.rotate(this.angle); // Поворот частицы

      if (isImageLoaded(img)) {
        // Отрисовка изображения пера
        ctx.drawImage(img, -this.size / 2, -this.size / 2, this.size, this.size);
      } else {
        // Запасной вариант: отрисовка овала
        ctx.fillStyle = this.type === "hawk" ? "#8B4513" : "#FFFFFF"; // Коричневый для ястребов, белый для голубей
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size / 2, this.size / 4, 0, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // Класс птицы
  class Bird {
    constructor(x, y, speed, type) {
      this.x = this.currentX = this.goalX = x; // Начальная и целевая позиция X
      this.y = this.currentY = this.goalY = y; // Начальная и целевая позиция Y
      this.baseSpeed = this.speed = speed; // Базовая и текущая скорость
      this.health = type === "hawk" ? Number(settings.healthHawk) || 40 : Number(settings.healthDove) || 40; // Здоровье
      this.type = type; // Тип птицы (hawk/dove)
      this.angle = Math.random() * 2 * Math.PI; // Случайный угол движения
      this.isFalling = false; // Флаг падения
      this.fallVelocity = 0; // Скорость падения
      this.fadeTimer = 0; // Таймер затухания
      this.opacity = 1; // Прозрачность
      this.fallAngle = 0; // Угол падения
      this.remove = false; // Флаг удаления
      this.age = 0; // Возраст в кадрах
      this.rage = 0; // Уровень ярости (для ястребов)
      this.rageTimer = 0; // Таймер ярости
      this.isEnraged = false; // Флаг ярости
      this.healthBarFade = 1; // Прозрачность полоски здоровья
      this.lastBirthFrame = -CONFIG.BIRTH_COOLDOWN; // Последний кадр рождения
      this.invincibilityTimer = CONFIG.INVINCIBILITY_DURATION; // Таймер неуязвимости
    }

    update() {
      if (this.isFalling) {
        // Обработка падения птицы
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
        this.age++; // Увеличение возраста
        this.invincibilityTimer = Math.max(0, this.invincibilityTimer - 1); // Уменьшение таймера неуязвимости

        // Механика рождения (обычная)
        if (
          this.health <= CONFIG.BIRTH_HEALTH_MAX &&
          this.age >= CONFIG.BIRTH_AGE_MIN &&
          this.age <= CONFIG.BIRTH_AGE_MAX &&
          frameCounterRef.current - this.lastBirthFrame >= CONFIG.BIRTH_COOLDOWN &&
          (this.type === "hawk" ? hawksRef.current.length : dovesRef.current.length) < CONFIG.MAX_BIRDS &&
          Math.random() < CONFIG.BIRTH_PROBABILITY
        ) {
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
            setHawkCount((prev) => prev + 1);
            setInitialHawkCount((prev) => prev + 1);
          } else {
            dovesRef.current.push(new Bird(birthX, birthY, this.speed, "dove"));
            setDoveCount((prev) => prev + 1);
            setInitialDoveCount((prev) => prev + 1);
          }
          this.lastBirthFrame = frameCounterRef.current;
        }

        // Проверка смерти от старости
        if (this.age >= CONFIG.TIME_LIFE) {
          // Создание новой птицы при смерти от старости, если не превышен лимит
          if ((this.type === "hawk" ? hawksRef.current.length : dovesRef.current.length) < CONFIG.MAX_BIRDS) {
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
              setHawkCount((prev) => prev + 1);
              setInitialHawkCount((prev) => prev + 1);
            } else {
              dovesRef.current.push(new Bird(birthX, birthY, this.speed, "dove"));
              setDoveCount((prev) => prev + 1);
              setInitialDoveCount((prev) => prev + 1);
            }
          }

          this.isFalling = true;
          this.fallVelocity = 0;
          this.fadeTimer = 0;
          this.opacity = 1;
          this.fallAngle = this.angle;
          return;
        }

        // Обработка ярости ястребов
        if (this.type === "hawk" && this.isEnraged) {
          this.rageTimer++;
          if (this.rageTimer >= CONFIG.RAGE_DURATION) {
            this.isEnraged = false;
            this.rage = 0;
            this.rageTimer = 0;
            this.speed = this.baseSpeed;
          }
        }

        // Обновление позиции
        this.goalX += Math.cos(this.angle) * this.speed;
        this.goalY += Math.sin(this.angle) * this.speed;

        // Отражение от границ холста
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

      // Плавное обновление текущей позиции
      this.currentX = lerp(this.currentX, this.goalX, CONFIG.LERP_FACTOR);
      this.currentY = lerp(this.currentY, this.goalY, CONFIG.LERP_FACTOR);
      this.healthBarFade = lerp(this.healthBarFade, this.health / 100, 0.2);
    }
  }

  // Проверка столкновений между птицами
  const checkCollisions = () => {
    const hawks = hawksRef.current;
    const doves = dovesRef.current;

    const checkPairCollision = (bird1, bird2, damage, isHawkHawk = false, isDoveDove = false) => {
      // Пропуск, если хотя бы одна птица неуязвима или падает
      if (!bird1.isFalling && !bird2.isFalling && bird1.invincibilityTimer === 0 && bird2.invincibilityTimer === 0) {
        const dx = bird1.currentX + CONFIG.BIRD_WIDTH / 2 - (bird2.currentX + CONFIG.BIRD_WIDTH / 2);
        const dy = bird1.currentY + CONFIG.BIRD_HEIGHT / 2 - (bird2.currentY + CONFIG.BIRD_HEIGHT / 2);
        const distance = Math.hypot(dx, dy);
        if (distance < CONFIG.COLLISION_RADIUS * 2) {
          // Генерация 2-3 перьев в точке столкновения, если не превышен лимит
          if (feathersRef.current.length < CONFIG.MAX_FEATHERS) {
            const featherCount = Math.floor(Math.random() * 2) + 2; // Уменьшено до 2-3 перьев
            const collisionX = (bird1.currentX + bird2.currentX) / 2 + CONFIG.BIRD_WIDTH / 2;
            const collisionY = (bird1.currentY + bird2.currentY) / 2 + CONFIG.BIRD_HEIGHT / 2;
            for (let i = 0; i < featherCount; i++) {
              const featherType = isHawkHawk ? "hawk" : isDoveDove ? "dove" : Math.random() < 0.5 ? "hawk" : "dove";
              feathersRef.current.push(new FeatherParticle(collisionX, collisionY, featherType));
            }
          }

          const appliedDamage = (bird1.isEnraged || bird2.isEnraged) && !isDoveDove ? damage * CONFIG.RAGE_DAMAGE_MULTIPLIER : damage;

          // Нанесение урона
          if (!(bird1.type === "hawk" && bird2.type === "dove")) {
            bird1.health -= appliedDamage;
          }
          if (!(bird2.type === "hawk" && bird1.type === "dove")) {
            bird2.health -= appliedDamage;
          }

          // Увеличение ярости ястребов (уменьшен прирост)
          if (bird1.type === "hawk") bird1.rage = Math.min(bird1.rage + 0.05, 1);
          if (bird2.type === "hawk") bird2.rage = Math.min(bird2.rage + 0.05, 1);

          // Активация ярости
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

          // Проверка смерти от урона
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

          // Добавление отталкивания после столкновения
          const pushStrength = 2; // Сила отталкивания
          const angle = Math.atan2(dy, dx);
          bird1.goalX += Math.cos(angle) * pushStrength;
          bird1.goalY += Math.sin(angle) * pushStrength;
          bird2.goalX -= Math.cos(angle) * pushStrength;
          bird2.goalY -= Math.sin(angle) * pushStrength;
        }
      }
    };

    // Столкновения ястребов с голубями
    for (let i = 0; i < hawks.length; i++) {
      for (let j = 0; j < doves.length; j++) {
        checkPairCollision(hawks[i], doves[j], CONFIG.HAWK_DOVE_DAMAGE);
      }
    }
    // Столкновения ястребов между собой
    for (let i = 0; i < hawks.length; i++) {
      for (let j = i + 1; j < hawks.length; j++) {
        checkPairCollision(hawks[i], hawks[j], CONFIG.HAWK_HAWK_DAMAGE, true);
      }
    }
    // Столкновения голубей между собой
    for (let i = 0; i < doves.length; i++) {
      for (let j = i + 1; j < doves.length; j++) {
        checkPairCollision(doves[i], doves[j], CONFIG.DOVE_DAMAGE, false, true);
      }
    }
  };

  // Инициализация птиц
  const initializeBirds = () => {
    hawksRef.current = [];
    dovesRef.current = [];
    feathersRef.current = []; // Очистка частиц при инициализации
    const hawkCount = Math.max(0, Math.floor(Number(settings.hawkCount) || 30));
    const doveCount = Math.max(0, Math.floor(Number(settings.doveCount) || 30));
    setHawkCount(hawkCount);
    setDoveCount(doveCount);
    setInitialHawkCount(hawkCount);
    setInitialDoveCount(doveCount);
    setDeadHawksOldAge(0);
    setDeadDovesOldAge(0);

    // Создание ястребов
    for (let i = 0; i < hawkCount; i++) {
      const x = Math.random() * (CONFIG.CANVAS_WIDTH - CONFIG.BIRD_WIDTH);
      const y = Math.random() * (CONFIG.CANVAS_HEIGHT - CONFIG.BIRD_HEIGHT);
      hawksRef.current.push(new Bird(x, y, Number(settings.speed) || 2, "hawk"));
    }
    // Создание голубей
    for (let i = 0; i < doveCount; i++) {
      const x = Math.random() * (CONFIG.CANVAS_WIDTH - CONFIG.BIRD_WIDTH);
      const y = Math.random() * (CONFIG.CANVAS_HEIGHT - CONFIG.BIRD_HEIGHT);
      dovesRef.current.push(new Bird(x, y, Number(settings.speed) || 2, "dove"));
    }
  };

  // Проверка загрузки изображения
  const isImageLoaded = (img) => img.complete && img.naturalWidth !== 0;

  // Основной цикл анимации
  const animate = () => {
    if (!isRunning || !canvasRef.current) {
      animationRef.current && cancelAnimationFrame(animationRef.current);
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT); // Очистка холста

    // Обновление кадра анимации
    frameCounterRef.current = (frameCounterRef.current + 1) % (CONFIG.FRAMES_PER_SPRITE * 4);
    const currentFrame = Math.floor(frameCounterRef.current / CONFIG.FRAMES_PER_SPRITE);

    checkCollisions(); // Проверка столкновений

    // Обновление и отрисовка перьев
    feathersRef.current.forEach((feather) => {
      feather.update();
      feather.draw(ctx, images.featherImg);
    });
    feathersRef.current = feathersRef.current.filter((feather) => feather.lifetime > 0 && feather.opacity > 0); // Удаление исчезнувших частиц

    // Обработка всех птиц
    const birds = [...hawksRef.current, ...dovesRef.current];
    birds.forEach((bird) => {
      bird.update();

      // Выбор спрайта в зависимости от состояния
      const img = bird.isFalling
        ? bird.type === "hawk"
          ? images.hawkFallingImg
          : images.doveFallingImg
        : bird.type === "hawk"
        ? images.hawkImgs[currentFrame]
        : images.doveImgs[currentFrame];

      ctx.save();
      ctx.globalAlpha = bird.opacity; // Установка прозрачности птицы

      // Отрисовка полоски здоровья
      if (!bird.isFalling) {
        const healthBarWidth = CONFIG.BIRD_WIDTH * 1.5;
        const healthBarHeight = 4;
        const healthBarX = bird.currentX + (CONFIG.BIRD_WIDTH - healthBarWidth) / 5;
        const healthBarY = bird.currentY - 10;

        ctx.fillStyle = bird.health > 30 ? "#00ff00" : bird.health > 15 ? "#ffff00" : "#ff0000";
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * bird.healthBarFade, healthBarHeight);
      }

      // Отрисовка птицы
      ctx.translate(bird.currentX + CONFIG.BIRD_WIDTH / 2, bird.currentY + CONFIG.BIRD_HEIGHT / 2);
      ctx.rotate(bird.isFalling ? bird.fallAngle : bird.angle);
      ctx.drawImage(
        isImageLoaded(img) ? img : isImageLoaded(images.fallbackImg) ? images.fallbackImg : images.doveImgs[0],
        -CONFIG.BIRD_WIDTH / 2,
        -CONFIG.BIRD_HEIGHT / 2,
        CONFIG.BIRD_WIDTH,
        CONFIG.BIRD_HEIGHT
      );

      // Эффект ярости для ястребов
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

    // Удаление погибших птиц и обновление счетчиков старости
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

    // Запуск следующего кадра анимации
    animationRef.current = requestAnimationFrame(animate);
  };

  // Инициализация птиц при изменении настроек
  useEffect(() => {
    initializeBirds();
  }, [settings]);

  // Загрузка изображений
  useEffect(() => {
    const totalImages = images.hawkImgs.length + images.doveImgs.length + 3; // +3 для doveFallingImg, hawkFallingImg, featherImg
    let loadedImages = 0;

    const onImageLoadOrError = () => {
      loadedImages++;
      if (loadedImages === totalImages) {
        setIsImagesLoaded(true);
        initializeBirds();
      }
    };

    [...images.hawkImgs, ...images.doveImgs, images.doveFallingImg, images.hawkFallingImg, images.featherImg].forEach((img) => {
      img.onload = onImageLoadOrError;
      img.onerror = onImageLoadOrError;
    });

    return () => {
      animationRef.current && cancelAnimationFrame(animationRef.current);
      hawksRef.current = [];
      dovesRef.current = [];
      feathersRef.current = []; // Очистка частиц при размонтировании
    };
  }, [images, setIsImagesLoaded]);

  // Управление анимацией (старт/стоп)
  useEffect(() => {
    if (isRunning && canvasRef.current) {
      animate();
    } else {
      animationRef.current && cancelAnimationFrame(animationRef.current);
    }
    return () => animationRef.current && cancelAnimationFrame(animationRef.current);
  }, [isRunning]);

  // Рендеринг UI и холста
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