// Получение элементов DOM
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const startBtn = document.getElementById('startBtn')
const settingsBtn = document.getElementById('settingsBtn')
const settingsModal = document.getElementById('settingsModal')
const closeModalBtn = document.querySelector('.close')
const applySettingsBtn = document.getElementById('applySettings')

// Настройка canvas для высокой плотности пикселей
const dpr = window.devicePixelRatio || 1
canvas.width = 800 * dpr // Внутреннее разрешение
canvas.height = 600 * dpr
ctx.scale(dpr, dpr) // Масштабирование контекста
canvas.style.width = '1542px' // Логический размер
canvas.style.height = '705px'

// Инициализация массивов и переменных
let hawks = []
let doves = []
let animationId = null
let isRunning = false

// Размер изображений (в логических пикселях)
const birdWidth = 30
const birdHeight = 35

// Загрузка изображений
const hawkImg = new Image()
hawkImg.src = 'img/hawk.png' // Укажите путь к изображению ястреба (рекомендуется 40x40 или 80x80 для Retina)
const doveImg = new Image()
doveImg.src = 'img/dove.png' // Укажите путь к изображению голубя

// Проверка загрузки изображений
let imagesLoaded = 0
const totalImages = 2
hawkImg.onload = () => {
	imagesLoaded++
	if (imagesLoaded === totalImages) initializeBirds(5, 10, 2)
}
hawkImg.onerror = () => console.error('Ошибка загрузки изображения ястреба')
doveImg.onload = () => {
	imagesLoaded++
	if (imagesLoaded === totalImages) initializeBirds(5, 10, 2)
}
doveImg.onerror = () => console.error('Ошибка загрузки изображения голубя')

// Класс для птиц
class Bird {
	constructor(x, y, speed, type) {
		this.x = x
		this.y = y
		this.speed = speed
		this.type = type
		this.angle = Math.random() * 2 * Math.PI
		this.changeDirectionTimer = 0
	}

	update() {
		// Случайное изменение направления каждые 30-60 кадров
		this.changeDirectionTimer++
		if (this.changeDirectionTimer > Math.random() * 30 + 30) {
			this.angle += ((Math.random() - 0.5) * Math.PI) / 2
			this.changeDirectionTimer = 0
		}

		// Обновление позиции
		this.x += Math.cos(this.angle) * this.speed
		this.y += Math.sin(this.angle) * this.speed

		// Отражение от границ
		if (this.x < 0 || this.x > 800 - birdWidth) {
			// Логический размер canvas
			this.angle = Math.PI - this.angle
			this.x = Math.max(0, Math.min(800 - birdWidth, this.x))
		}
		if (this.y < 0 || this.y > 600 - birdHeight) {
			this.angle = -this.angle
			this.y = Math.max(0, Math.min(600 - birdHeight, this.y))
		}
	}

	draw() {
		ctx.save()
		ctx.translate(this.x + birdWidth / 2, this.y + birdHeight / 2)
		ctx.rotate(this.angle)
		ctx.imageSmoothingEnabled = true // Включено для плавного масштабирования
		ctx.drawImage(
			this.type === 'hawk' ? hawkImg : doveImg,
			-birdWidth / 2,
			-birdHeight / 2,
			birdWidth,
			birdHeight
		)
		ctx.restore()
	}
}

// Инициализация птиц
function initializeBirds(hawkCount, doveCount, speed) {
	hawks = []
	doves = []
	for (let i = 0; i < hawkCount; i++) {
		hawks.push(
			new Bird(
				Math.random() * (800 - birdWidth),
				Math.random() * (600 - birdHeight),
				speed,
				'hawk'
			)
		)
	}
	for (let i = 0; i < doveCount; i++) {
		doves.push(
			new Bird(
				Math.random() * (800 - birdWidth),
				Math.random() * (600 - birdHeight),
				speed,
				'dove'
			)
		)
	}
}

// Функция анимации
function animate() {
	ctx.clearRect(0, 0, 800 * dpr, 600 * dpr) // Очистка с учётом dpr
	;[...hawks, ...doves].forEach(bird => {
		bird.update()
		bird.draw()
	})
	animationId = requestAnimationFrame(animate)
}

// Обработчики событий
startBtn.addEventListener('click', () => {
	if (!isRunning) {
		startBtn.textContent = 'Стоп'
		isRunning = true
		animate()
	} else {
		startBtn.textContent = 'Старт'
		isRunning = false
		cancelAnimationFrame(animationId)
	}
})

settingsBtn.addEventListener('click', () => {
	settingsModal.style.display = 'flex'
})

closeModalBtn.addEventListener('click', () => {
	settingsModal.style.display = 'none'
})

applySettingsBtn.addEventListener('click', () => {
	const hawkCount = parseInt(document.getElementById('hawkCount').value) || 5
	const doveCount = parseInt(document.getElementById('doveCount').value) || 10
	const speed = parseFloat(document.getElementById('speed').value) || 2
	initializeBirds(hawkCount, doveCount, speed)
	settingsModal.style.display = 'none'
})
