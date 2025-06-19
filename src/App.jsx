import React, { useState } from 'react';
import './styles/App.css';
import Header from './components/Header';
import SimulationCanvas from './components/SimulationCanvas';
import SettingsModal from './components/SettingsModal';

function App() {
  const [settings, setSettings] = useState({
    hawkCount: 5,
    doveCount: 10,
    speed: 2,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImagesLoaded, setIsImagesLoaded] = useState(false);

  const handleSaveSettings = (newSettings) => {
    console.log('App: Saving new settings', newSettings); // Debug
    setSettings(newSettings);
    setIsModalOpen(false);
  };

  console.log('App: Current settings', settings); // Debug
  console.log('App: Passing onSave to SettingsModal'); // Debug

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