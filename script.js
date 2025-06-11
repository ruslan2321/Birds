//переменные

//логика движение птиц 

//модальное окно 

//открытие модального окна
document.querySelector("#modal").onclick = () =>{
  let modalwin = document.querySelector('.moduleWindow')
  modalwin.style.display = 'flex'
}

//закрытие модального окна

document.querySelector('#save').onclick = () => {
	let modalwin = document.querySelector('#moduleWindow')
	modalwin.style.display = 'none'

  let hawk = document.querySelector('#hawk').value
	let pige = document.querySelector('#pige').value
  
  console.log(`Кол голубей: ${hawk}`)
  console.log(`Кол ястребов: ${pige}`)
}

