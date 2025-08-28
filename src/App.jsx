import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import React from 'react';
import EnglishLearningApp from './components/EnglishLearningApp';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <EnglishLearningApp />
      </div>
    </ErrorBoundary>

  );
}

export default App;

