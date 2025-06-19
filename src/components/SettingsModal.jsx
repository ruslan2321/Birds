import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import '../styles/SettingsModal.css';

function SettingsModal({ settings, onApply, onClose }) {
  const [hawkCount, setHawkCount] = useState(settings.hawkCount);
  const [doveCount, setDoveCount] = useState(settings.doveCount);
  const [speed, setSpeed] = useState(settings.speed);

  const handleApply = () => {
    onApply({
      hawkCount: parseInt(hawkCount) || 5,
      doveCount: parseInt(doveCount) || 5,
      speed: parseFloat(speed) || 4,
    });
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>×</span>
        <h2>Настройки</h2>
        <Slider
         label="Кол-во Ястребов"
         sx={{
            width: '10rem',
         }}
         variant="outlined"
          value={hawkCount}
          max={40}
           valueLabelDisplay="auto"
          onChange={(e) => setHawkCount(e.target.value)}
        /><br />
       <Slider
         label="Кол-во Голубей"
         sx={{
            width: '10rem',
         }}
         variant="outlined"
          valueLabelDisplay="auto"
          max={40}
          value={doveCount}
          onChange={(e) => setDoveCount(e.target.value)}
        /><br />
       <Slider
         label="Скорость"
         sx={{
            width: '10rem',
         }}
         variant="outlined"
          valueLabelDisplay="auto"
          max={5}
          value={speed}
          onChange={(e) => setSpeed(e.target.value)}
        /><br/>
        <Button onClick={handleApply} variant="contained">Применить</Button>
      </div>
    </div>
  );
}

export default SettingsModal;