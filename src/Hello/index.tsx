import * as React from 'react';
import style from './index.css';

export class Hello extends React.Component {
  public render(): React.ReactNode {
    return (
      <h1 className={style.hello}>
        {this.props.children}
      </h1>
    )
  }
}