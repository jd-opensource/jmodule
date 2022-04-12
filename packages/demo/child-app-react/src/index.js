import { createRoot } from 'react-dom/client';
import App from './App';

if (window.__JMODULE_HOST__) {
  /* eslint-disable */
  JModule.define('childAppReact', {
    mount(module, el, stats) {
      if (stats.mountTimes) {
        location.href = '/childAppReact';
      } else {
        createRoot(el).render(<App />);
      }
    },
  });
} else {
  createRoot(document.getElementById('root')).render(<App />);
}

