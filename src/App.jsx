import React, { useState } from 'react';
import './styles/App.css';
import Header from './components/Header';
import SimulationCanvas from './components/SimulationCanvas';
import SettingsModal from './components/SettingsModal';

function App() {
  const [settings, setSettings] = useState({
    hawkCount: 10,
    doveCount: 10,
    speed: 2,
    heal_hawk: 40,
    heal_dove: 40,
    rage: 0.1,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImagesLoaded, setIsImagesLoaded] = useState(false);

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    setIsModalOpen(false);
  };
  return (
    <div className="app">
      <Header
        isRunning={isRunning}
        setIsRunning={setIsRunning}
        setIsModalOpen={setIsModalOpen}
        isImagesLoaded={isImagesLoaded}
      />
      <SimulationCanvas
        settings={settings}
        isRunning={isRunning}
        setIsImagesLoaded={setIsImagesLoaded}
      />
      <SettingsModal
        open={isModalOpen}
        settings={settings}
        onSave={handleSaveSettings}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default App;