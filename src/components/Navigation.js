import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const sections = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'languages', label: 'Languages' },
  { id: 'honors', label: 'Honors' },
  { id: 'contact', label: 'Contact' },
];

const Navigation = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id),
      }));

      const currentSection = sectionElements.find(section => {
        if (!section.element) return false;
        const rect = section.element.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
      });

      setActiveSection(currentSection ? currentSection.id : '');
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Adjust based on your header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      if (isMobile) {
        setMobileOpen(false);
      }
    }
  };

  const navigationItems = (
    <List>
      {sections.map((section) => (
        <ListItem key={section.id} disablePadding>
          {isMobile ? (
            <Button
              fullWidth
              onClick={() => handleNavClick(section.id)}
              sx={{
                py: 1,
                color: activeSection === section.id ? 'primary.main' : 'text.primary',
                borderLeft: activeSection === section.id ? 4 : 0,
                borderColor: 'primary.main',
                borderRadius: 0,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                },
              }}
            >
              <ListItemText primary={section.label} />
            </Button>
          ) : (
            <Button
              onClick={() => handleNavClick(section.id)}
              sx={{
                px: 2,
                color: activeSection === section.id ? 'primary.main' : 'text.primary',
                borderBottom: activeSection === section.id ? 2 : 0,
                borderColor: 'primary.main',
                borderRadius: 0,
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: 'primary.main',
                },
              }}
            >
              {section.label}
            </Button>
          )}
        </ListItem>
      ))}
    </List>
  );

  return (
    <>
      {isMobile ? (
        <>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Drawer
            anchor="left"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            sx={{
              '& .MuiDrawer-paper': {
                width: 240,
                boxSizing: 'border-box',
                mt: '64px', // Adjust based on your header height
              },
            }}
          >
            {navigationItems}
          </Drawer>
        </>
      ) : (
        <Box sx={{ display: 'flex' }}>
          {navigationItems}
        </Box>
      )}
    </>
  );
};

export default Navigation;
