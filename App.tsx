import React from 'react';
import LeafSystem from './components/LeafSystem';

const App: React.FC = () => {
  return (
    <div className="w-full h-screen overflow-hidden bg-[#050505] text-white">
      <LeafSystem />
    </div>
  );
};

export default App;