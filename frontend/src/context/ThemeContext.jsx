import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Always default to clean white theme (false)
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Clear any old dark state override
    localStorage.setItem('devmatch_theme', 'light');
    document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
