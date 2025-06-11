//переменные
    const birdImages = [
      "./img/hawk.png", // Голубь
      "./img/pegion.png" // Ястреб
    ];

    const birds = [];
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;


//логика движение птиц 
document.querySelector('#start').onclick = (isHawk = false) =>{
//создание птиц

for (let i = 0; i < 10; i++) {
        const img = document.createElement("img");
        img.src = birdImages[Math.floor(Math.random() * birdImages.length)];
        img.classList.add("bird");

        // случайное начальное положение
        img.style.left = Math.random() * window.innerWidth + "px";
        img.style.top = Math.random() * window.innerHeight + "px";

        document.body.appendChild(img);
        birds.push({
          element: img,
          x: parseFloat(img.style.left),
          y: parseFloat(img.style.top),
          speed: 2 + Math.random() * 2
        });
}




document.querySelector('.container').style.opacity = 0;
document.querySelector('.container').style.transition = '0.5s '

}

 document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
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

          // Поворот птицы в сторону движения
          const angle = Math.atan2(dy, dx);
          bird.element.style.transform = `rotate(${angle}rad)`;
        }
      });
      requestAnimationFrame(animateBirds);
    }

    animateBirds();


//модальное окно 
//открытие модального окна
document.querySelector("#modal").onclick = () =>{
  let modalwin = document.querySelector('.moduleWindow')
  modalwin.style.display = 'flex'
}

//закрытие модального окна



document.querySelector('#save').onclick = () => {
	let modalwin = document.querySelector('.moduleWindow')
	modalwin.style.display = 'none'

  let hawk = document.querySelector('#hawk').value
  let pige = document.querySelector('#pige').value
  let speed = document.querySelector('#speed').value

  document.querySelector('#hawki').innerHTML = "Количество голубей: " + hawk
  document.querySelector('#pigei').innerHTML = "Количество Ястребов: " + pige
  document.querySelector('#speedi').innerHTML = "скорость: " + speed

}

