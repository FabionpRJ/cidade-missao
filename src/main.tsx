import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/theme-light.css';
import './styles/base.css';
import './styles/components.css';
import { App } from './app/App';
import { motorAtual } from './map/MapView';
import { useStore } from './state/store';
import { useTips } from './components/tipStore';
import { mapBus } from './state/mapBus';

// gancho para testes e depuração (Playwright)
(window as unknown as { __cm: unknown }).__cm = { motorAtual, store: useStore, tips: useTips, mapBus };

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
