import React, { useRef, useEffect, useState, useMemo } from "react";
import "../styles/SimulationCanvas.css";

// Компонент для симуляции движения птиц (ястребов и голубей) на канвасе
function SimulationCanvas({ settings, isRunning, setIsImagesLoaded }) {
  // Состояния для отслеживания количества птиц и смертей от старости
  const [hawkCount, setHawkCount] = useState(settings.hawkCount); // Количество ястребов
  const [doveCount, setDoveCount] = useState(settings.doveCount); // Количество голубей
  const [deadHawksOldAge, setDeadHawksOldAge] = useState(0); // Счетчик ястребов, погибших от старости
  const [deadDovesOldAge, setDeadDovesOldAge] = useState(0); // Счетчик голубей, погибших от старости

  // Референсы для хранения канваса, анимации и массивов птиц
  const canvasRef = useRef(null); // Референс на элемент canvas
  const animationRef = useRef(null); // Референс для requestAnimationFrame
  const hawksRef = useRef([]); // Массив ястребов
  const dovesRef = useRef([]); // Массив голубей
  const frameCounterRef = useRef(0); // Счетчик кадров для анимации спрайтов

  // Константы для настроек симуляции
  const birdWidth = 45; // Ширина спрайта птицы
  const birdHeight = 45; // Высота спрайта птицы
  const framesPerSprite = 10; // Количество кадров на один спрайт
  const timeLife = 100; // Продолжительность жизни птицы в кадрах (~1.67 сек при 60 FPS)
  const collisionRadius = birdWidth / 2; // Радиус для проверки столкновений
  const gravity = 0.08; // Гравитация для падения птиц
  const fadeDelay = 60; // Задержка затухания (в кадрах) перед удалением
  const lerpFactor = 0.1; // Фактор плавности движения (линейная интерполяция)
  const canvasWidth = 1280; // Ширина канваса
  const canvasHeight = 450; // Высота канваса

  // Вычисление процентов голубей и ястребов
  const { dovePercentage, hawkPercentage } = useMemo(() => {
    const totalBirds = hawkCount + doveCount;
    const dovePercentage = totalBirds > 0 ? ((doveCount / totalBirds) * 100).toFixed(0) : 0; // Процент голубей
    const hawkPercentage = totalBirds > 0 ? ((hawkCount / totalBirds) * 100).toFixed(0) : 0; // Процент ястребов
    return { dovePercentage, hawkPercentage };
  }, [hawkCount, doveCount]);

  // Загрузка спрайтов для ястребов и голубей
  const hawkImgs = Array(4)
    .fill()
    .map((_, i) => {
      const img = new Image();
      img.src = `/image/hawk-sprait${i + 1}.png`; // Спрайты ястреба
      return img;
    });
  const doveImgs = Array(4)
    .fill()
    .map((_, i) => {
      const img = new Image();
      img.src = `/image/dove-sprait${i + 1}.png`; // Спрайты голубя
      return img;
    });
  const doveFallingImg = new Image();
  doveFallingImg.src = "/image/dove_falling4.png"; // Спрайт падающего голубя

  // Функция линейной интерполяции для плавного движения
  const lerp = (start, end, t) => start + (end - start) * t;

  // Нормализация угла (приведение к диапазону [-π, π])
  const normalizeAngle = (angle) => {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  };

  // Класс для представления птицы (ястреба или голубя)
  class Bird {
    constructor(x, y, speed, type) {
      this.x = x; // Начальная позиция X
      this.y = y; // Начальная позиция Y
      this.currentX = x; // Текущая позиция X для отрисовки
      this.currentY = y; // Текущая позиция Y для отрисовки
      this.goalX = x; // Целевая позиция X
      this.goalY = y; // Целевая позиция Y
      this.speed = speed; // Скорость движения
      this.health = 100; // Здоровье птицы (100% по умолчанию)
      this.type = type; // Тип птицы: 'hawk' или 'dove'
      this.angle = Math.random() * 2 * Math.PI; // Случайный начальный угол
      this.currentAngle = this.angle; // Текущий угол для отрисовки
      this.goalAngle = this.angle; // Целевой угол направления
      this.changeDirectionTimer = 0; // Таймер смены направления
      this.isFalling = false; // Флаг: падает ли птица
      this.fallVelocity = 0; // Скорость падения
      this.fadeTimer = 0; // Таймер затухания
      this.opacity = 1; // Прозрачность спрайта
      this.fallAngle = 0; // Угол при падении
      this.remove = false; // Флаг для удаления птицы
      this.age = 0; // Возраст птицы (в кадрах)
    }

    // Обновление состояния птицы
    update() {
      if (this.isFalling) {
        // Логика для падающей птицы
        this.fallVelocity += gravity; // Увеличиваем скорость падения
        this.goalY += this.fallVelocity; // Двигаем вниз
        if (this.goalY >= canvasHeight - birdHeight) {
          this.goalY = canvasHeight - birdHeight; // Ограничение по нижней границе
          this.fallVelocity = 0; // Остановка падения
          this.fadeTimer++; // Увеличиваем таймер затухания
          if (this.fadeTimer >= fadeDelay) {
            this.remove = true; // Помечаем для удаления
            return;
          }
          if (this.fadeTimer >= 1) {
            this.opacity = 1 - this.fadeTimer / fadeDelay; // Постепенное затухание
          }
        }
      } else {
        // Логика старения
        this.age++; // Увеличиваем возраст
        if (this.age >= timeLife) {
          // Если птица достигла максимального возраста
          this.isFalling = true;
          this.fallVelocity = 0;
          this.fadeTimer = 0;
          this.opacity = 1;
          this.fallAngle = this.currentAngle;
          this.remove = true; // Помечаем для удаления после затухания
          return;
        }

        // Логика движения летающей птицы
        this.changeDirectionTimer++; // Таймер смены направления
        if (this.changeDirectionTimer > Math.random() * 30 + 30) {
          // Случайная смена направления
          this.goalAngle = normalizeAngle(this.goalAngle + (Math.random() - 0.5) * Math.PI);
          this.changeDirectionTimer = 0;
        }

        // Обновление целевой позиции
        this.goalX += Math.cos(this.goalAngle) * this.speed;
        this.goalY += Math.sin(this.goalAngle) * this.speed;

        // Ограничение движения внутри канваса с отражением
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
        this.goalAngle = normalizeAngle(this.goalAngle); // Нормализация угла
      }

      // Плавное перемещение к целевой позиции и углу
      this.currentX = lerp(this.currentX, this.goalX, lerpFactor);
      this.currentY = lerp(this.currentY, this.goalY, lerpFactor);
      this.currentAngle = lerp(this.currentAngle, this.goalAngle, lerpFactor);
      this.angle = this.currentAngle;
    }
  }

  // Проверка столкновений между птицами
  const checkCollisions = () => {
    const hawks = hawksRef.current;
    const doves = dovesRef.current;

    // Столкновения ястреб-голубь
    hawks.forEach((hawk, hawkIndex) => {
      doves.forEach((dove, doveIndex) => {
        if (!dove.isFalling && !hawk.isFalling) {
          const dx = hawk.currentX + birdWidth / 2 - (dove.currentX + birdWidth / 2);
          const dy = hawk.currentY + birdHeight / 2 - (dove.currentY + birdHeight / 2);
          const distance = Math.hypot(dx, dy); // Расстояние между центрами птиц
          if (distance < collisionRadius * 2) {
            dove.health -= 5; // Голубь теряет 5% здоровья
            console.log(`Голубь ${doveIndex} ХП: ${dove.health}%`);
            console.log(`Ястреб ${hawkIndex} ХП: ${hawk.health}%`);
            if (dove.health <= 20) {
              // Можно добавить изменение поведения при низком здоровье
               dove.speed *= 0.8; 
            }
            if (dove.health <= 0) {
              // Голубь погибает и начинает падать
              dove.isFalling = true;
              dove.fallVelocity = 0;
              dove.fadeTimer = 0;
              dove.opacity = 1;
              dove.fallAngle = dove.currentAngle;
            }
          }
        }
      });
    });

    // Столкновения ястреб-ястреб
    for (let i = 0; i < hawks.length; i++) {
      for (let j = i + 1; j < hawks.length; j++) {
        const hawk1 = hawks[i];
        const hawk2 = hawks[j];
        if (!hawk1.isFalling && !hawk2.isFalling) {
          const dx = hawk1.currentX + birdWidth / 2 - (hawk2.currentX + birdWidth / 2);
          const dy = hawk1.currentY + birdHeight / 2 - (hawk2.currentY + birdHeight / 2);
          const distance = Math.hypot(dx, dy);
          if (distance < collisionRadius * 2) {
            hawk1.health -= 5; // Ястребы теряют 10% здоровья
            hawk2.health -= 5;
            console.log(`Ястреб ${i} ХП: ${hawk1.health}%`);
            console.log(`Ястреб ${j} ХП: ${hawk2.health}%`);
            if (hawk1.health <= 0) {
              hawk1.isFalling = true;
              hawk1.fallVelocity = 0;
              hawk1.fadeTimer = 0;
              hawk1.opacity = 1;
              hawk1.fallAngle = hawk1.currentAngle;
            }
            if (hawk2.health <= 0) {
              hawk2.isFalling = true;
              hawk2.fallVelocity = 0;
              hawk2.fadeTimer = 0;
              hawk2.opacity = 1;
              hawk2.fallAngle = hawk2.currentAngle;
            }
          }
        }
      }
    }
  };

  // Инициализация птиц
  const initializeBirds = () => {
    hawksRef.current = [];
    dovesRef.current = [];
    setHawkCount(settings.hawkCount); // Обновление количества ястребов
    setDoveCount(settings.doveCount); // Обновление количества голубей

    // Создание ястребов
    for (let i = 0; i < settings.hawkCount; i++) {
      const x = Math.random() * (canvasWidth - birdWidth); // Случайная позиция X
      const y = Math.random() * (canvasHeight - birdHeight); // Случайная позиция Y
      hawksRef.current.push(new Bird(x, y, settings.speed, "hawk"));
    }
    // Создание голубей
    for (let i = 0; i < settings.doveCount; i++) {
      const x = Math.random() * (canvasWidth - birdWidth);
      const y = Math.random() * (canvasHeight - birdHeight);
      dovesRef.current.push(new Bird(x, y, settings.speed, "dove"));
    }
  };

  // Цикл анимации
  const animate = () => {
    if (!isRunning || !canvasRef.current) {
      animationRef.current && cancelAnimationFrame(animationRef.current); // Остановка анимации
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return; // Проверка наличия контекста
    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Очистка канваса

    frameCounterRef.current = (frameCounterRef.current + 1) % (framesPerSprite * 4); // Цикл кадров спрайта
    const currentFrame = Math.floor(frameCounterRef.current / framesPerSprite); // Текущий кадр анимации

    checkCollisions(); // Проверка столкновений

    // Обновление и отрисовка всех птиц
    const birds = [...hawksRef.current, ...dovesRef.current];
    birds.forEach((bird) => {
      bird.update(); // Обновление состояния птицы
      const img = bird.isFalling
        ? doveFallingImg // Спрайт для падающей птицы
        : bird.type === "hawk"
        ? hawkImgs[currentFrame] // Спрайт ястреба
        : doveImgs[currentFrame]; // Спрайт голубя

      ctx.save();
      ctx.globalAlpha = bird.opacity; // Установка прозрачности
      ctx.translate(bird.currentX + birdWidth / 2, bird.currentY + birdHeight / 2); // Перемещение в центр птицы
      ctx.rotate(bird.isFalling ? bird.fallAngle : bird.currentAngle); // Поворот спрайта
      ctx.drawImage(img, -birdWidth / 2, -birdHeight / 2, birdWidth, birdHeight); // Отрисовка спрайта
      ctx.restore();
    });

    // Удаление погибших птиц и обновление счетчиков
    const dovesToRemove = dovesRef.current.filter((dove) => dove.remove);
    const hawksToRemove = hawksRef.current.filter((hawk) => hawk.remove);
    if (dovesToRemove.length > 0) {
      dovesRef.current = dovesRef.current.filter((dove) => !dove.remove); // Удаление голубей
      setDoveCount((prev) => prev - dovesToRemove.length); // Обновление счетчика голубей
      setDeadDovesOldAge((prev) =>
        prev + dovesToRemove.filter((dove) => dove.age >= timeLife).length // Счетчик смертей от старости
      );
    }
    if (hawksToRemove.length > 0) {
      hawksRef.current = hawksRef.current.filter((hawk) => !hawk.remove); // Удаление ястребов
      setHawkCount((prev) => prev - hawksToRemove.length); // Обновление счетчика ястребов
      setDeadHawksOldAge((prev) =>
        prev + hawksToRemove.filter((hawk) => hawk.age >= timeLife).length // Счетчик смертей от старости
      );
    }

    animationRef.current = requestAnimationFrame(animate); // Запуск следующего кадра
  };

  // Синхронизация с настройками
  useEffect(() => {
    setHawkCount(settings.hawkCount); // Обновление количества ястребов
    setDoveCount(settings.doveCount); // Обновление количества голубей
    frameCounterRef.current = 0; // Сброс счетчика кадров
    animationRef.current && cancelAnimationFrame(animationRef.current); // Остановка текущей анимации
    initializeBirds(); // Инициализация птиц
  }, [settings]);

  // Загрузка изображений
  useEffect(() => {
    const totalImages = hawkImgs.length + doveImgs.length + 1; // Общее количество изображений
    let loadedImages = 0; // Счетчик загруженных изображений

    const onImageLoad = () => {
      loadedImages++;
      if (loadedImages === totalImages) {
        setIsImagesLoaded(true); // Установка флага загрузки изображений
        initializeBirds(); // Инициализация птиц после загрузки
      }
    };

    [...hawkImgs, ...doveImgs, doveFallingImg].forEach((img) => {
      img.onload = onImageLoad; // Обработчик загрузки изображений
      img.onerror = () => console.error(`Ошибка загрузки изображения: ${img.src}`); // Обработка ошибок
    });

    // Очистка при размонтировании компонента
    return () => {
      animationRef.current && cancelAnimationFrame(animationRef.current);
      hawksRef.current = [];
      dovesRef.current = [];
    };
  }, [setIsImagesLoaded]);

  // Управление анимацией
  useEffect(() => {
    if (isRunning && canvasRef.current) {
      animate(); // Запуск анимации
    } else {
      animationRef.current && cancelAnimationFrame(animationRef.current); // Остановка анимации
    }
    return () => animationRef.current && cancelAnimationFrame(animationRef.current); // Очистка
  }, [isRunning]);

  // Рендеринг компонента
  return (
    <div className="canvas-container">
      <div className="bird-counter">
        <div className="hawk">
          <p>
            <label>Голуби </label>
            {dovePercentage}% {/* Процент голубей */}
          </p>
        </div>
        <div className="dove">
          <p>
            <label>Ястребы </label>
            {hawkPercentage}% {/* Процент ястребов */}
          </p>
        </div>
        <div className="dead-hawks">
          <p>
            <label>Погибло ястребов от старости: </label>
            {deadHawksOldAge} {/* Счетчик ястребов, погибших от старости */}
          </p>
        </div>
        <div className="dead-doves">
          <p>
            <label>Погибло голубей от старости: </label>
            {deadDovesOldAge} {/* Счетчик голубей, погибших от старости */}
          </p>
        </div>
      </div>
      <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} /> {/* Канвас для отрисовки */}
    </div>
  );
}

export default SimulationCanvas;