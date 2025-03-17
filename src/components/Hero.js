import { Box, Typography, Avatar, Container } from '@mui/material';
import { motion } from 'framer-motion';

const Hero = ({ profile }) => {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      sx={{
        py: 8,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3
      }}
    >
      <Avatar
        src={profile.avatar}
        alt={profile.name}
        sx={{
          width: 150,
          height: 150,
          mb: 2,
          boxShadow: 3
        }}
      />
      <Typography variant="h2" component="h1" gutterBottom>
        {profile.name}
      </Typography>
      <Typography variant="h4" color="textSecondary" gutterBottom>
        {profile.title}
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 600 }}>
        {profile.bio}
      </Typography>
    </Box>
  );
};

export default Hero;
