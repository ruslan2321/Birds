import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Slider, Button, Typography, Box } from "@mui/material";
import "../styles/SettingsModal.css";

function SettingsModal({ settings, onSave, onClose, open }) {
  const defaultSettings = {
    hawkCount: 10,
    doveCount: 10,
    speed: 2,
    healthHawk: 40,
    healthDove: 40,
    lifeSpan: 1000,
  };

  const [formSettings, setFormSettings] = useState({
    hawkCount: settings?.hawkCount ?? defaultSettings.hawkCount,
    doveCount: settings?.doveCount ?? defaultSettings.doveCount,
    speed: settings?.speed ?? defaultSettings.speed,
    healthHawk: settings?.healthHawk ?? defaultSettings.healthHawk,
    healthDove: settings?.healthDove ?? defaultSettings.healthDove,
    lifeSpan: settings?.lifeSpan ?? defaultSettings.lifeSpan,
    rageThreshold: settings?.rageThreshold ?? defaultSettings.rageThreshold,
  });

  const handleChange = (name) => (event, value) => {
    setFormSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(formSettings);
    onClose();
  };

  const handleReset = () => {
    setFormSettings(defaultSettings);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={{ "& .MuiDialog-paper": { borderRadius: "12px" } }}>
      <DialogTitle sx={{ textAlign: "center", fontWeight: "bold", color: "#333" }}>
        Настройки симуляции
      </DialogTitle>
      <DialogContent sx={{ padding: "20px" }}>
        <Box className="form-group">
          <Typography gutterBottom>Количество ястребов: {formSettings.hawkCount}</Typography>
          <Slider
            value={formSettings.hawkCount}
            onChange={handleChange("hawkCount")}
            min={0}
            max={50}
            step={1}
            valueLabelDisplay="auto"
            aria-label="Количество ястребов"
          />
        </Box>
        <Box className="form-group">
          <Typography gutterBottom>Количество голубей: {formSettings.doveCount}</Typography>
          <Slider
            value={formSettings.doveCount}
            onChange={handleChange("doveCount")}
            min={0}
            max={50}
            step={1}
            valueLabelDisplay="auto"
            aria-label="Количество голубей"
          />
        </Box>
        <Box className="form-group">
          <Typography gutterBottom>Скорость (пикс/кадр): {formSettings.speed}</Typography>
          <Slider
            value={formSettings.speed}
            onChange={handleChange("speed")}
            min={0.1}
            max={5}
            step={0.1}
            valueLabelDisplay="auto"
            aria-label="Скорость"
          />
        </Box>
        <Box className="form-group">
          <Typography gutterBottom>Здоровье ястребов: {formSettings.healthHawk}</Typography>
          <Slider
            value={formSettings.healthHawk}
            onChange={handleChange("healthHawk")}
            min={1}
            max={40}
            step={1}
            valueLabelDisplay="auto"
            aria-label="Здоровье ястребов"
          />
        </Box>
        <Box className="form-group">
          <Typography gutterBottom>Здоровье голубей: {formSettings.healthDove}</Typography>
          <Slider
            value={formSettings.healthDove}
            onChange={handleChange("healthDove")}
            min={1}
            max={40}
            step={1}
            valueLabelDisplay="auto"
            aria-label="Здоровье голубей"
          />
        </Box>
        <Box className="form-group">
          <Typography gutterBottom>Жизненный цикл: {formSettings.lifeSpan}</Typography>
          <Slider
            value={formSettings.lifeSpan}
            onChange={handleChange("lifeSpan")}
            min={1000}
            max={5000}
            step={100}
            valueLabelDisplay="auto"
            aria-label="Жизненный цикл"
          />
        </Box>
        <Box className="form-group">
          <Typography gutterBottom>Порог ярости: {formSettings.rageThreshold}</Typography>
          <Slider
            value={formSettings.rageThreshold}
            onChange={handleChange("rageThreshold")}
            min={0}
            max={1}
            step={0.1}
            valueLabelDisplay="auto"
            aria-label="Порог ярости"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: "16px" }}>
        <Button onClick={handleReset} color="secondary" variant="outlined">
          Сбросить
        </Button>
        <Button onClick={onClose} color="error" variant="outlined">
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