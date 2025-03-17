import { AppBar, Toolbar, Typography, Button, Container, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { GitHub, LinkedIn } from '@mui/icons-material';

const Header = ({ profile, children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar position="sticky" color="inherit" elevation={1}>
      <Container>
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {profile.name}
          </Typography>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {profile.social.map((item) => (
                <IconButton
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="inherit"
                  sx={{ mx: 0.5 }}
                >
                  {item.icon === 'github' && <GitHub />}
                  {item.icon === 'linkedin' && <LinkedIn />}
                </IconButton>
              ))}
              {children}
            </div>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
