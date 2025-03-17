import { AppBar, Toolbar, Typography, Box, Container, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { GitHub, LinkedIn } from '@mui/icons-material';
import Navigation from './Navigation';

const Header = ({ profile, children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar position="sticky" color="inherit" elevation={1}>
      <Container>
        <Toolbar 
          disableGutters 
          sx={{
            justifyContent: 'space-between',
            minHeight: { xs: 64, md: 72 },
          }}
        >
          {isMobile && <Navigation />}
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{
              flexGrow: isMobile ? 1 : 0,
              cursor: 'pointer',
              '&:hover': {
                color: 'primary.main',
              },
            }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            {profile.name}
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <Navigation />
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {profile.social.map((item) => (
              <IconButton
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                size={isMobile ? 'small' : 'medium'}
              >
                {item.icon === 'github' && <GitHub />}
                {item.icon === 'linkedin' && <LinkedIn />}
              </IconButton>
            ))}
            {children}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
