 const birds = [];
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    const doveImage = "./img/hawk.png";
    const hawkImage = "./img/pegion.png";

    // Значения по умолчанию
    let settings = {
      doveCount: 5,
      hawkCount: 5,
      minSpeed: 2,
      maxSpeed: 4
    };

    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function launchBirds(count, imageSrc,minSpeed, maxSpeed) {
      for (let i = 0; i < count; i++) {
        const img = document.createElement("img");
        img.src = imageSrc;
        img.classList.add("bird");

        img.style.left = Math.random() * window.innerWidth + "px";
        img.style.top = Math.random() * window.innerHeight + "px";

        document.body.appendChild(img);
        birds.push({
          element: img,
          x: parseFloat(img.style.left),
          y: parseFloat(img.style.top),
          speed: minSpeed + Math.random() * (maxSpeed - minSpeed)
        });
      }
    }

    // Сохранение настроек из формы
    document.getElementById("settingsForm").addEventListener("submit", function (e) {
      e.preventDefault();
      settings.doveCount = parseInt(document.getElementById("doveCount").value);
      settings.hawkCount = parseInt(document.getElementById("hawkCount").value);
      settings.minSpeed = parseInt(document.getElementById('minSpeed').value);
      settings.maxSpeed = parseFloat(document.getElementById("maxSpeed").value);

      if (settings.minSpeed > settings.maxSpeed) {
        alert("Минимальная скорость не может быть больше максимальной!");
        return;
      }

      const modal = bootstrap.Modal.getInstance(document.getElementById("settingsModal"));
      modal.hide();
    });

    // Кнопка запуска
    document.getElementById("launchBtn").addEventListener("click", () => {
      launchBirds(settings.doveCount, doveImage, settings.minSpeed, settings.maxSpeed);
      launchBirds(settings.hawkCount, hawkImage, settings.minSpeed, settings.maxSpeed);

      document.getElementById('launchBtn').style.opacity = 0; 
      document.getElementById('launchBtn').style.transition = '0.5s'; 
      document.getElementById('setting').style.opacity = 0;
      document.getElementById('setting').style.transition = '0.5s ';

    });

    function animateBirds() {
      birds.forEach(bird => {
        let dx = mouseX - bird.x;
        let dy = mouseY - bird.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 1) {
          bird.x += (dx / distance) * bird.speed;
          bird.y += (dy / distance) * bird.speed;

          bird.element.style.left = bird.x + "px";
          bird.element.style.top = bird.y + "px";

          const angle = Math.atan2(dy, dx);
          bird.element.style.transform = `rotate(${angle}rad)`;
        }
      });
      requestAnimationFrame(animateBirds);
    }

    animateBirds();