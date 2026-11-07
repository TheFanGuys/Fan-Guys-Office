import React from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App';
import './styles.css';
import './office.css';
if (!crypto.randomUUID) { crypto.randomUUID = (() => { const bytes = crypto.getRandomValues(new Uint8Array(16)); bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128; const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')); return [hex.slice(0,4).join(''), hex.slice(4,6).join(''), hex.slice(6,8).join(''), hex.slice(8,10).join(''), hex.slice(10).join('')].join('-'); }) as typeof crypto.randomUUID; }
const applyUpdate=registerSW({onNeedRefresh(){window.dispatchEvent(new Event('pdfpro:update'));},onOfflineReady(){window.dispatchEvent(new Event('pdfpro:offline-ready'));}});
addEventListener('pdfpro:apply-update',()=>applyUpdate(true));
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
