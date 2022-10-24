import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './assets/scss/index.scss';

const root = ReactDOM.createRoot(document.querySelector('#root') as HTMLDivElement);


root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
