import * as React from 'react';
import * as reactDOM from 'react-dom';
import {Hello} from './Hello';
import {Banner} from './Banner';

import style from './index.css';

reactDOM.render(
  <div className = { style.appWrapper }>
    <Banner />
    <Hello>Hello from React!</Hello>
  </div>,
  document.getElementById('app-container')
);
