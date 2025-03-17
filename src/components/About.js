import { Box, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const About = ({ profile }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <Box
      ref={ref}
      component={motion.div}
      id="about"
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      sx={{ py: 8 }}
    >
      <Typography variant="h3" component="h2" gutterBottom align="center">
        About Me
      </Typography>
      <Paper 
        elevation={2}
        sx={{
          p: 4,
          mt: 4,
          borderRadius: 2,
          backgroundColor: 'background.paper'
        }}
      >
        <Typography variant="body1" paragraph>
          {profile.bio}
        </Typography>
        <Typography variant="body1">
          Based in {profile.location}
        </Typography>
      </Paper>
    </Box>
  );
};

export default About;
