import React from 'react';
import ReactDOM from 'react-dom';
import App from './app/App';
import './assets/scss/index.scss';

const root = document.querySelector('#root') as HTMLDivElement;

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    root
);
