import { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Container, Box, IconButton, Fab, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ChatIcon from '@mui/icons-material/Chat';
import theme, { createAppTheme } from './theme';
import { initGA, trackPageView, trackEvent } from './utils/analytics';
import profileData from './data/profile.json';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Chat from './components/Chat';

// Google Analytics tracking ID - replace with your actual tracking ID when deploying to production
const GA_TRACKING_ID = 'G-N6T8NNTJTX';

function App() {
  // Check system preference for dark mode
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  // State for theme mode
  const [mode, setMode] = useState(prefersDarkMode ? 'dark' : 'light');
  
  // State for chat drawer
  const [chatOpen, setChatOpen] = useState(false);
  
  // Initialize Google Analytics
  useEffect(() => {
    initGA(GA_TRACKING_ID);
    trackPageView(window.location.pathname);
  }, []);
  
  // Update theme when system preference changes
  useEffect(() => {
    setMode(prefersDarkMode ? 'dark' : 'light');
  }, [prefersDarkMode]);
  
  // Create theme based on current mode
  const currentTheme = useMemo(() => createAppTheme(mode), [mode]);
  
  // Toggle theme mode
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    
    // Track theme toggle events
    trackEvent('Theme', 'Toggle Theme', newMode);
  };
  
  // Toggle chat drawer
  const toggleChat = () => {
    const newState = !chatOpen;
    setChatOpen(newState);
    
    // Track chat open/close events
    trackEvent('Chat', newState ? 'Open Chat' : 'Close Chat');
  };
  
  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', position: 'relative' }}>
        <Header profile={profileData.basics}>
          <IconButton onClick={toggleTheme} color="inherit" aria-label="toggle theme">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Header>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Hero profile={profileData.basics} />
            <About profile={profileData.basics} />
            <Projects projects={profileData.projects} />
            <Skills skills={profileData.skills} />
            <Contact profile={profileData.basics} />
          </motion.div>
        </Container>
        
        {/* Chat Fab Button */}
        <Fab 
          color="primary" 
          aria-label="chat"
          onClick={toggleChat}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
          }}
        >
          <ChatIcon />
        </Fab>
        
        {/* Chat Component as Drawer */}
        <Chat profile={profileData} open={chatOpen} onClose={() => setChatOpen(false)} />
      </Box>
    </ThemeProvider>
  );
}

export default App;
