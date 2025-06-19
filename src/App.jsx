import React, { useState } from 'react';
import SimulationCanvas from './components/SimulationCanvas';
import Button from '@mui/material/Button';
import SettingsModal from './components/SettingsModal';
import './styles/App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settings, setSettings] = useState({
    hawkCount: 5,
    doveCount: 10,
    speed: 2,
  });

  return (
    <div className="app">
      <div className="controls">
        <Button onClick={() => setIsModalOpen(true)} variant="contained" className='setting'>Настройки</Button>
      </div>
      <SimulationCanvas settings={settings} />
      {isModalOpen && (
        <SettingsModal
          settings={settings}
          onApply={(newSettings) => {
            setSettings(newSettings);
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;