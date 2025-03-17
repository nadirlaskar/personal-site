import React from 'react';
import { Box, Typography, Card, CardContent, Grid, LinearProgress, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import LanguageIcon from '@mui/icons-material/Language';

const Languages = ({ languages }) => {
  const theme = useTheme();

  const getProgressValue = (level) => {
    switch (level) {
      case 'Native or Bilingual':
        return 100;
      case 'Professional Working':
        return 80;
      case 'Limited Working':
        return 60;
      case 'Elementary':
        return 40;
      default:
        return 50;
    }
  };

  return (
    <Box component="section" id="language" sx={{ py: 8 }}>
      <Typography
        variant="h4"
        component="h2"
        sx={{ mb: 4, textAlign: 'center' }}
        color="primary"
      >
        Languages
      </Typography>

      <Grid container spacing={3}>
        {languages.map((lang, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <motion.div
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LanguageIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      {lang.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {lang.level}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={getProgressValue(lang.level)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                        },
                      }}
                    />
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

export default Languages;
