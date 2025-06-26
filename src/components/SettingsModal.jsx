import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Button,
  IconButton,
  Typography,
  Box,
} from "@mui/material";


// Модальное окно для настройки параметров симуляции
function SettingsModal({ settings, onSave, onClose, open }) {
  // Состояния для параметров симуляции
  const [hawkCount, setHawkCount] = useState(settings.hawkCount); // Количество ястребов
  const [doveCount, setDoveCount] = useState(settings.doveCount); // Количество голубей
  const [speed, setSpeed] = useState(settings.speed); // Скорость птиц
  const [healthDove, setHealthDove] = useState(settings.healthDove || 100); // Начальное здоровье голубей
  const [healthHawk, setHealthHawk] = useState(settings.healthHawk || 100); // Начальное здоровье ястребов
  const [lifeSpan, setLifeSpan] = useState(settings.lifeSpan || 6000); // Жизненный цикл птиц
  const [doveDamage, setDoveDamage] = useState(settings.doveDamage || 2); // Урон от столкновений голубь-голубь
  const [rageThreshold, setRageThreshold] = useState(settings.rageThreshold || 50); // Порог ярости ястребов
  const [rageDuration, setRageDuration] = useState(settings.rageDuration || 300); // Длительность ярости ястребов

  // Валидация введенных значений
  

  // Обработка сохранения настроек
  const handleSubmit = () => {
    const newSettings = {
      hawkCount: parseInt(hawkCount, 10),
      doveCount: parseInt(doveCount, 10),
      speed: parseFloat(speed),
      healthDove: parseInt(healthDove, 10),
      healthHawk: parseInt(healthHawk, 10),
      lifeSpan: parseInt(lifeSpan, 10),
      doveDamage: parseFloat(doveDamage),
      rageThreshold: parseInt(rageThreshold, 1),
      rageDuration: parseInt(rageDuration, 1),
    };
    onSave(newSettings);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Настройки симуляции
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Количество ястребов: {hawkCount}</Typography>
          <Slider
            value={parseInt(hawkCount, 10)}
            onChange={(e, newValue) => setHawkCount(newValue)}
            min={0}
            max={50}
            step={1}
            valueLabelDisplay="auto"
            aria-label="Количество ястребов"
          />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Количество голубей: {doveCount}</Typography>
          <Slider
            value={parseInt(doveCount, 10)}
            onChange={(e, newValue) => setDoveCount(newValue)}
            min={0}
            max={50}
            step={1}
            valueLabelDisplay="auto"
            aria-label="Количество голубей"
          />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Скорость (пикс/кадр): {speed.toFixed(1)}</Typography>
          <Slider
            value={parseFloat(speed)}
            onChange={(e, newValue) => setSpeed(newValue)}
            min={0.1}
            max={5}
            step={0.1}
            valueLabelDisplay="auto"
            aria-label="Скорость"
          />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Здоровье голубей: {healthDove}</Typography>
          <Slider
            value={parseInt(healthDove, 1)}
            onChange={(e, newValue) => setHealthDove(newValue)}
            min={1}
            max={100}
            step={1}
            valueLabelDisplay="auto"
            aria-label="Здоровье голубей"
          />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Здоровье ястребов: {healthHawk}</Typography>
          <Slider
            value={parseInt(healthHawk, 10)}
            onChange={(e, newValue) => setHealthHawk(newValue)}
            min={1}
            max={100}
            step={1}
            valueLabelDisplay="auto"
            aria-label="Здоровье ястребов"
          />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Жизненный цикл птиц: {lifeSpan}</Typography>
          <Slider
            value={parseInt(lifeSpan, 1)}
            onChange={(e, newValue) => setLifeSpan(newValue)}
            min={1000}
            max={10000}
            step={100}
            valueLabelDisplay="auto"
            aria-label="Жизненный цикл"
          />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Порог ярости ястребов: {rageThreshold}</Typography>
          <Slider
            value={parseInt(rageThreshold, 1)}
            onChange={(e, newValue) => setRageThreshold(newValue)}
            min={0}
            max={1}
            step={0.1}
            valueLabelDisplay="auto"
            aria-label="Порог ярости"
          />
        </Box>
        
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error">
          Отмена
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Применить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SettingsModal;