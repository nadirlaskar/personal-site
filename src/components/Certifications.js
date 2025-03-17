import React from 'react';
import { Box, Typography, Card, CardContent, Grid, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

const Certifications = ({ certifications }) => {
  const theme = useTheme();

  return (
    <Box component="section" id="certifications" sx={{ py: 8 }}>
      <Typography
        variant="h4"
        component="h2"
        sx={{ mb: 4, textAlign: 'center' }}
        color="primary"
      >
        Certifications & Achievements
      </Typography>

      <Grid container spacing={3}>
        {certifications.map((cert, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <motion.div
              id={`certification-${cert}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    transition: 'transform 0.3s ease-in-out',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
                    <WorkspacePremiumIcon color="primary" sx={{ mr: 2 }} />
                    <Typography variant="body1" component="div">
                      {cert}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Certifications;
