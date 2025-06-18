import { createContext, useState, useContext, useEffect } from 'react';
import { settingsService } from '../services/api';
import { ThemeProvider, createTheme } from '@mui/material';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    heartbeatInterval: 10, // Default: 10 seconds
    retryAttempts: 3, // Number of retry attempts for failed connections
    retryDelay: 2, // Delay in seconds between retry attempts
    statusUpdateFrequency: 5, // How often to refresh status data (seconds)
    monitoringEnabled: true, // Whether monitoring is enabled
    dataHistorySize: 25, // Number of historical data points to keep
    notificationThreshold: 'warning', // Minimum level for notifications (info, warning, error)
    theme: 'dark', // Dark theme by default
    displayMode: 'standard',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate theme based on current settings
  const theme = createTheme({
    palette: {
      mode: settings.theme,
      primary: {
        main: '#1d9bf0', // Twitter blue color
      },
      secondary: {
        main: '#8b98a5', // Twitter secondary color
      },
      background: {
        default: settings.theme === 'dark' ? '#15202b' : '#f7f9fa', // Twitter backgrounds
        paper: settings.theme === 'dark' ? '#192734' : '#ffffff',
      },
      text: {
        primary: settings.theme === 'dark' ? '#ffffff' : '#0f1419',
        secondary: settings.theme === 'dark' ? '#8b98a5' : '#536471',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '50px', // Rounded buttons like Twitter
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: '16px', // Rounded corners for cards
          },
        },
      },
    },
  });

  // Fetch settings on initial load
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const fetchedSettings = await settingsService.getSettings();
        setSettings(fetchedSettings);
        setError(null);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Failed to fetch settings. Using defaults.');
        // Keep using the default settings if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings) => {
    try {
      setLoading(true);
      // Update settings via API
      const updatedSettings = await settingsService.updateSettings(newSettings);
      setSettings(updatedSettings);
      setError(null);
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    try {
      setLoading(true);
      const defaultSettings = await settingsService.resetSettings();
      setSettings(defaultSettings);
      setError(null);
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      setError('Failed to reset settings. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    settings,
    updateSettings,
    resetSettings,
    loading,
    error,
    theme
  };

  return (
    <SettingsContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
