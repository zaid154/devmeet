import React from 'react';
import SplashLoader from './SplashLoader';

const PageLoader = ({ text = 'Loading DevMeet...', fullScreen = false }) => {
  return <SplashLoader text={text} fullScreen={fullScreen} />;
};

export default PageLoader;
