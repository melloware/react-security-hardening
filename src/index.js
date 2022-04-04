import 'react-app-polyfill/ie11';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom'

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <HashRouter>
            <App></App>
    </HashRouter>);


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
//serviceWorker.unregister();
