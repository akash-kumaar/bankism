import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/layout/Header';
import { Sidebar, type TabId } from './components/layout/Sidebar';
import { OverviewView } from './views/OverviewView';
import { InspectorView } from './views/InspectorView';
import { PlaygroundView } from './views/PlaygroundView';
import { SimulatorView } from './views/SimulatorView';
import { AnalyticsView } from './views/AnalyticsView';
import { ArchitectureView } from './views/ArchitectureView';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabId>('overview');
  const [inspectorPrompt, setInspectorPrompt] = useState<string>('');

  const handleNavigate = (tab: TabId, prompt?: string) => {
    if (prompt !== undefined) {
      setInspectorPrompt(prompt);
    }
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={(t) => setCurrentTab(t)} />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {currentTab === 'overview' && (
                  <OverviewView onNavigate={handleNavigate} />
                )}
                {currentTab === 'inspector' && (
                  <InspectorView initialPrompt={inspectorPrompt} />
                )}
                {currentTab === 'playground' && (
                  <PlaygroundView />
                )}
                {currentTab === 'simulator' && (
                  <SimulatorView />
                )}
                {currentTab === 'analytics' && (
                  <AnalyticsView />
                )}
                {currentTab === 'architecture' && (
                  <ArchitectureView />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
