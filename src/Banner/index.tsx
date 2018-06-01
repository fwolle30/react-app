import * as React from 'react';
import style from './index.css'

export class Banner extends React.Component {
  public render(): React.ReactNode {
    return (
      <div className = { style.banner }>
        <h1 className = { style.bannerHeadline }>ReactJS</h1>
        <div className = { style.bannerLogo }>
        </div>
        {this.props.children}
      </div>
    )
  }
}