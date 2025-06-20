import React, { useRef, useEffect, useState } from 'react';
import '../App'
import '../styles/SimulationCanvas.css';




function SimulationCanvas({ settings, isRunning, setIsImagesLoaded  }) {
  const canvasRef = useRef(null);
const [isImagesLoaded, setIsImagesLoadedLocal] = useState(true);
  const animationIdRef = useRef(null);
  const hawksRef = useRef([]);
  const dovesRef = useRef([]);
  const frameCounterRef = useRef(0);

  const birdWidth = 40;
  const birdHeight = 40;
  const framesPerSprite = 9;
  const collisionRadius = birdWidth / 2;
  const gravity = 0.2;
  const rotationSpeed = 0.05;
  const fadeDelay = 60;

  // Initialize sprite arrays
  const hawkImgs = Array(4).fill().map(() => new Image());
  hawkImgs[0].src = '/image/hawk-sprait1.png';
  hawkImgs[1].src = '/image/hawk-sprait2.png';
  hawkImgs[2].src = '/image/hawk-sprait3.png';
  hawkImgs[3].src = '/image/hawk-sprait4.png';


  const doveImgs = Array(4).fill().map(() => new Image());
  doveImgs[0].src = '/image/dove-sprait1.png';
  doveImgs[1].src = '/image/dove-sprait2.png';
  doveImgs[2].src = '/image/dove-sprait3.png';
  doveImgs[3].src = '/image/dove-sprait4.png';


  const doveFallingImgs = Array(4).fill().map(() => new Image());
  doveFallingImgs[0].src = '/image/dove_falling1.png';
  doveFallingImgs[1].src = '/image/dove_falling2.png';
  doveFallingImgs[2].src = '/image/dove_falling3.png';
  doveFallingImgs[3].src = '/image/dove_falling4.png';


  const fallbackHawk = 'https://via.placeholder.com/80/8B0000/FFFFFF?text=H';
  const fallbackDove = 'https://via.placeholder.com/80/ADD8E6/000000?text=D';
  const fallbackDoveFalling = 'https://via.placeholder.com/80/ADD8E6/000000?text=DF';


 class Bird {
    constructor(x, y, speed, type) {
      this.x = x;
      this.y = y;
      this.speed = speed;
      this.type = type;
      this.angle = Math.random() * 2 * Math.PI;
      this.changeDirectionTimer = 0;
      this.isFalling = false;
      this.fallVelocity = 0;
      this.fallRotation = 0;
      this.fadeTimer = 0;
    }

    update() {
      if (this.isFalling) {
        this.fallVelocity += gravity;
        this.y += this.fallVelocity;
        this.fallRotation += rotationSpeed;
        if (this.y >= 600 - birdHeight) {
          this.y = 600 - birdHeight;
          this.fallVelocity = 0;
          this.fallRotation = 0;
          this.fadeTimer++;
          if (this.fadeTimer >= fadeDelay) {
            dovesRef.current = dovesRef.current.filter(d => d !== this);
          }
        }
      } else {
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
    }

    draw(ctx, frame) {
      ctx.save();
      ctx.translate(this.x + birdWidth / 2, this.y + birdHeight / 2);
      ctx.rotate(this.isFalling ? this.fallRotation : this.angle);
      ctx.imageSmoothingEnabled = true;
      let img = this.isFalling
        ? doveFallingImgs[frame]
        : this.type === 'hawk' ? hawkImgs[frame] : doveImgs[frame];
      if (!(img instanceof HTMLImageElement) || !img.complete || img.naturalWidth === 0) {
        console.warn(`Invalid image for ${this.type} at frame ${frame}, src: ${img.src}, using placeholder`);
        img = new Image();
        img.src = defaultPlaceholder;
      }
      ctx.drawImage(img, -birdWidth / 2, -birdHeight / 2, birdWidth, birdHeight);
      ctx.restore();
    }
  }

  // Check collisions
  const checkCollisions = () => {
    hawksRef.current.forEach(hawk => {
      dovesRef.current.forEach(dove => {
        if (!dove.isFalling) {
          const dx = hawk.x + birdWidth / 2 - (dove.x + birdWidth / 2);
          const dy = hawk.y + birdHeight / 2 - (dove.y + birdHeight / 2);
          const distance = Math.hypot(dx, dy);
          if (distance < collisionRadius * 2) {
            dove.isFalling = true;
            dove.fallVelocity = 0;
            dove.fallRotation = 0;
            dove.fadeTimer = 0;
          }
        }
      });
    });
  };

  // Initialize birds
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

  // Animation loop
  const animate = (ctx) => {
    if (!isImagesLoaded || !isRunning) {
      cancelAnimationFrame(animationIdRef.current);
      return;
    }
    ctx.clearRect(0, 0, 800 * window.devicePixelRatio, 600 * window.devicePixelRatio);
    frameCounterRef.current = (frameCounterRef.current + 1) % (framesPerSprite * 2);
    const currentFrame = Math.floor(frameCounterRef.current / framesPerSprite);
    if (currentFrame < 0 || currentFrame >= 2) {
      console.warn(`Invalid frame index: ${currentFrame}`);
      return;
    }
    checkCollisions();
    [...hawksRef.current, ...dovesRef.current].forEach(bird => {
      bird.update();
      bird.draw(ctx, currentFrame);
    });
    animationIdRef.current = requestAnimationFrame(() => animate(ctx));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 800 * dpr;
    canvas.height = 600 * dpr;
    ctx.scale(dpr, dpr);

    let imagesLoaded = 0;
    const totalImages = hawkImgs.length + doveImgs.length + doveFallingImgs.length;
    const loadedImages = new Set();

    const onImageLoad = (src) => {
      if (!loadedImages.has(src)) {
        loadedImages.add(src);
        imagesLoaded++;
        console.log(`Loaded image: ${src} (${imagesLoaded}/${totalImages})`);
        if (imagesLoaded === totalImages) {
          setIsImagesLoadedLocal(true);
         /*  setIsImagesLoaded(); // Update parent state */
          initializeBirds();
        }
      }
    };

    const onImageError = (src) => {
      if (!loadedImages.has(src)) {
        console.error(`Failed to load image: ${src}`);
        loadedImages.add(src);
        imagesLoaded++;
        hawkImgs.forEach(img => {
          if (img.src.includes('hawk') && img.naturalWidth === 0) img.src = fallbackHawk;
        });
        doveImgs.forEach(img => {
          if (img.src.includes('dove') && !img.src.includes('falling') && img.naturalWidth === 0) img.src = fallbackDove;
        });
        doveFallingImgs.forEach(img => {
          if (img.src.includes('falling') && img.naturalWidth === 0) img.src = fallbackDoveFalling;
        });
        if (imagesLoaded === totalImages) {
          setIsImagesLoadedLocal(true);
          setIsImagesLoaded(true);
          initializeBirds();
        }
      }
    };

    [...hawkImgs, ...doveImgs, ...doveFallingImgs].forEach(img => {
      if (!img.src.startsWith('data:')) {
        img.onload = () => onImageLoad(img.src);
        img.onerror = () => onImageError(img.src);
      } else {
        onImageLoad(img.src);
      }
    });

    return () => cancelAnimationFrame(animationIdRef.current);
  }, [settings, setIsImagesLoaded]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    console.log(`Animation state: isRunning=${isRunning}, isImagesLoaded=${isImagesLoaded}`);
    if (isImagesLoaded && isRunning) {
      console.log('Starting animation');
      animate(ctx);
    } else {
      console.log('Stopping animation');
      cancelAnimationFrame(animationIdRef.current);
    }
    return () => cancelAnimationFrame(animationIdRef.current);
  }, [isRunning, isImagesLoaded]);



  return (
    <div className="canvas-container">
      {!isImagesLoaded && <p>Загрузка изображений...</p>}
      <canvas ref={canvasRef} className="simulation-canvas" />
    </div>
  );
}

export default SimulationCanvas;