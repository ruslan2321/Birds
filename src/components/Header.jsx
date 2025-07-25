import React from 'react';
import styles from '../styles/header.module.scss';
import { Button } from '@mui/material';

function Header({ isRunning, setIsRunning, setIsModalOpen }) {
  return (
		<header className='header'>
			<h2>Симуляция «Ястребы и голуби»</h2>
			<Button
				onClick={() => setIsRunning(!isRunning)}
				className='header-button'
				variant='contained'
				sx={{
					'&:hover': {
						backgroundColor: '#64a145',
					},
				}}>
				Старт
			</Button>
			<Button
				onClick={() => setIsModalOpen(true)}
				className='header-button'
				variant='contained'
				sx={{
					backgroundColor: '#cc1414',
				}}>
				Настройки
			</Button>
		</header>
	)
}

export default Header;