import React, { useState, useEffect } from 'react';

const SplashScreen = ({ children }) => {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('workzarr_splash_shown');
  });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (!showSplash) return;

    // Subtle fade-in after mount
    const fadeInTimer = setTimeout(() => {
      setOpacity(1);
    }, 50);

    // Subtle fade-out starting at 1.7 seconds (300ms before transition ends)
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
    }, 1700);

    // Unmount splash and render normal app after 2 seconds
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('workzarr_splash_shown', 'true');
    }, 2000);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, [showSplash]);

  if (!showSplash) {
    return children;
  }

  return (
    <div
      id="workzarr-splash-screen"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: opacity,
        transition: 'opacity 300ms ease-in-out',
      }}
    >
      {/* TODO: replace with splash image */}
      <div
        style={{
          fontSize: '48px',
          fontWeight: '800',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '-1.5px',
          textAlign: 'center',
          userSelect: 'none',
          transform: `scale(${opacity === 1 ? 1.02 : 0.98})`,
          transition: 'transform 1700ms cubic-bezier(0.1, 0.8, 0.25, 1)',
        }}
      >
        <span style={{ color: '#FF4500' }}>W</span>
        <span style={{ color: '#FFFFFF' }}>orkzarr</span>
      </div>
    </div>
  );
};

export default SplashScreen;
