import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ConfirmDialogProvider } from './contexts/ConfirmDialogContext';
import { ToastProvider } from './contexts/ToastContext';
import { TransitionProvider } from './contexts/TransitionContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles.css';
import './header.css';

registerSW({ immediate: true });
createRoot(document.getElementById('root')!).render(<StrictMode><ThemeProvider><TransitionProvider><AuthProvider><ConfirmDialogProvider><ToastProvider><App /></ToastProvider></ConfirmDialogProvider></AuthProvider></TransitionProvider></ThemeProvider></StrictMode>);
