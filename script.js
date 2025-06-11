//переменные
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;


//логика движение птиц 
document.querySelector('#start').onclick = (isHawk = false) =>{
//создание птиц
const bird = document.createElement('div') 
bird.classList.add(isHawk ? 'hawk' : 'bird')

document.body.appendChild(bird)



document.querySelector('.container').style.opacity = 0;
document.querySelector('.container').style.transition = '0.5s '

}



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

