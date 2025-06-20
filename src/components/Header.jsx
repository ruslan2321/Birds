import React from 'react';
import styles from './header.module.scss';
import { Button } from '@mui/material';

function Header({ isRunning, setIsRunning, setIsModalOpen }) {
  return (
   <header className="header">
    <h2>Симуляция Ятсрибы и Голуби</h2>
      <Button
        onClick={() => setIsRunning(!isRunning)}
        className="header-button"
        variant="contained"
      >
       Старт
      </Button>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="header-button"
        variant="contained"
      >
        Настройки
      </Button>
    </header>
  );
}

export default Header;