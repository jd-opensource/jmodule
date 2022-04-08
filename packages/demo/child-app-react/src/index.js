import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

if (window.__JMODULE_HOST__) {
    /* eslint-disable */
    JModule.define('childAppReact', {
        mount(module, el, stats) {
            if (stats.mountTimes) {
                location.hash = '/SnapScout/mountain';
            } else {
                ReactDOM.render(<App />, el);
            }
        },
    });
} else {
    ReactDOM.render(<App />, document.getElementById('root'));

    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://bit.ly/CRA-PWA
    serviceWorker.unregister();
}
