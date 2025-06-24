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
/* import CloseIcon from '@mui/icons-material/Close'; */

function SettingsModal({ settings, onSave, onClose, open }) {
  const [hawkCount, setHawkCount] = useState(settings.hawkCount);
  const [doveCount, setDoveCount] = useState(settings.doveCount);
  const [speed, setSpeed] = useState(settings.speed);
  const [healHawk, setHealhawk] = useState(settings.heal_hawk);
  const [healDove, setHealdove] = useState(settings.heal_dove);
  const [rage, setRage] = useState(settings.rage);

  const validateInputs = () => {
    const hawkNum = parseInt(hawkCount, 10);
    const doveNum = parseInt(doveCount, 10);
    const speedNum = parseFloat(speed);

    if (isNaN(hawkNum) || hawkNum < 0 || hawkNum > 50) {
      return false;
    }
    if (isNaN(doveNum) || doveNum < 0 || doveNum > 50) {
      return false;
    }
    if (isNaN(speedNum) || speedNum <= 0 || speedNum > 5) {
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    console.log("SettingsModal: Applying settings", {
      hawkCount,
      doveCount,
      speed,
    }); // Debug
    if (typeof onSave !== "function") {
      console.error("onSave is not a function:", onSave);
      return;
    }
    if (!validateInputs()) {
      console.warn("Invalid settings, aborting save");
      alert(
        "Пожалуйста, выберите корректные значения: количество птиц 0–20, скорость 0.1–5."
      );
      return;
    }
    const newSettings = {
      hawkCount: parseInt(hawkCount, 10),
      doveCount: parseInt(doveCount, 10),
      doveHeal: parseInt(healDove, 40),
      hawkHeal: parseInt(healHawk, 40),
      rage: parseFloat(rage),
      speed: parseFloat(speed),
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
            aria-label="Hawk count"
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
            aria-label="Dove count"
          />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>
            Скорость (пикс/кадр): {speed.toFixed(1)}
          </Typography>
          <Slider
            value={parseFloat(speed)}
            onChange={(e, newValue) => setSpeed(newValue)}
            min={0.1}
            max={5}
            step={0.1}
            valueLabelDisplay="auto"
            aria-label="Speed"
          />
        </Box>
        {/*В разработке*/}
        <Box>
          <Typography>Кол-Во жизни голубя: {healDove}</Typography>
          <Slider
            value={parseFloat(healDove)}
            onChange={(e, newValue) => setHealdove(newValue)}
            min={1}
            max={40}
            step={1}
            valueLabelDisplay="auto"
            aria-label="heal"
          />
        </Box>
        <Box>
          <Typography>Кол-Во жизни ястреба: {healHawk}</Typography>
          <Slider
            value={parseFloat(healHawk)}
            onChange={(e, newValue) => setHealhawk(newValue)}
            min={1}
            max={40}
            step={1}
            valueLabelDisplay="auto"
            aria-label="heal"
          />
        </Box>
        <Box>
          <Typography>Уровень ярости ястреба: {rage}</Typography>
          <Slider
            value={parseFloat(rage)}
            onChange={(e, newValue) => setRage(newValue)}
            min={0.1}
            max={1}
            step={0.1}
            valueLabelDisplay="auto"
            aria-label="heal"
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
