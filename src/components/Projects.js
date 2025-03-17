import { Box, Typography, Grid, Card, CardContent, CardMedia, CardActions, Button, Chip } from '@mui/material';
import { GitHub, Launch } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Projects = ({ projects }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <Box
      ref={ref}
      component={motion.div}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      sx={{ py: 8 }}
    >
      <Typography variant="h3" component="h2" gutterBottom align="center">
        Projects
      </Typography>
      <Grid container spacing={4} sx={{ mt: 2 }}>
        {projects.map((project, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              component={motion.div}
              whileHover={{
                scale: 1.03,
                transition: { duration: 0.2 }
              }}
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardMedia
                component="img"
                height="200"
                image={project.image}
                alt={project.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h3">
                  {project.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {project.description}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {project.technologies.map((tech, i) => (
                    <Chip key={i} label={tech} size="small" />
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<GitHub />}
                  href={project.github}
                  target="_blank"
                >
                  Code
                </Button>
                {project.demo && (
                  <Button
                    size="small"
                    startIcon={<Launch />}
                    href={project.demo}
                    target="_blank"
                  >
                    Demo
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Projects;
