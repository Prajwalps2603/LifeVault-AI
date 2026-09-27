import React from 'react';
import { AppProvider } from './src/store/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LVErrorBoundary } from './src/components/LVErrorBoundary';

const App: React.FC = () => {
  return (
    <LVErrorBoundary>
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </LVErrorBoundary>
  );
};

export default App;

