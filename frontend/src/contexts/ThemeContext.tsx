import { createContext, useContext, useEffect, ReactNode } from 'react';
import { ConfigProvider, theme } from 'antd';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { toggleDarkMode } from '../store/settingsSlice';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector(state => state.settings.darkMode);

  const toggleTheme = () => {
    dispatch(toggleDarkMode());
  };

  // Apply dark mode class to body
  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
  }, [isDarkMode]);

  // Theme configurations
  const darkTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
      colorBgBase: '#141414',
      colorTextBase: '#fff',
      borderRadius: 4,
    },
  };

  const lightTheme = {
    algorithm: theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1677ff',
      borderRadius: 4,
    },
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <ConfigProvider theme={isDarkMode ? darkTheme : lightTheme}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}; 