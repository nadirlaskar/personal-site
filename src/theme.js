import { createTheme, responsiveFontSizes } from '@mui/material';

// Function to create theme based on mode (light/dark)
const createAppTheme = (mode) => {
  let theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#2196f3',
        ...(mode === 'dark' && {
          main: '#90caf9',
        }),
      },
      secondary: {
        main: '#f50057',
        ...(mode === 'dark' && {
          main: '#f48fb1',
        }),
      },
      background: {
        default: mode === 'light' ? '#fafafa' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
        secondary: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            ...(mode === 'dark' && {
              backgroundImage: 'none',
            }),
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRadius: 0,
          },
        },
      },
    },
  });

  // Make fonts responsive
  theme = responsiveFontSizes(theme);

  return theme;
};

// Detect system preference for dark mode
const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

// Create theme based on system preference
const theme = createAppTheme(prefersDarkMode ? 'dark' : 'light');

export { createAppTheme };
export default theme;
