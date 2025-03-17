import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Skills = ({ skills }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <Box
      ref={ref}
      component={motion.div}
      id="skills"
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      sx={{ py: 8 }}
    >
      <Typography variant="h3" component="h2" gutterBottom align="center">
        Skills
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {skills.map((category, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                height: '100%',
                backgroundColor: 'background.paper'
              }}
            >
              <Typography variant="h6" gutterBottom>
                {category.category}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {category.items.map((skill, i) => (
                  <Chip
                    key={i}
                    label={skill}
                    component={motion.div}
                    whileHover={{ scale: 1.1 }}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Skills;
