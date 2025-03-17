import { Box, Typography, Button, Stack } from '@mui/material';
import { Email, GitHub, LinkedIn } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Contact = ({ profile }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <Box
      ref={ref}
      component={motion.div}
      id="contact"
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      sx={{ py: 8, textAlign: 'center' }}
    >
      <Typography variant="h3" component="h2" gutterBottom>
        Get in Touch
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Feel free to reach out for collaborations or just a friendly hello
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="center"
        alignItems="center"
      >
        <Button
          variant="contained"
          startIcon={<Email />}
          href={`mailto:${profile.email}`}
        >
          Email Me
        </Button>
        {profile.social.map((item) => (
          <Button
            key={item.name}
            variant="outlined"
            startIcon={item.icon === 'github' ? <GitHub /> : <LinkedIn />}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.name}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

export default Contact;
