import React from 'react';
import { Box, Typography, Card, CardContent, Grid, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const Honors = ({ honors }) => {
  const theme = useTheme();

  return (
    <Box component="section" id="honors" sx={{ py: 8 }}>
      <Typography
        variant="h4"
        component="h2"
        sx={{ mb: 4, textAlign: 'center' }}
        color="primary"
      >
        Honors & Awards
      </Typography>

      <Grid container spacing={3}>
        {honors.map((honor, index) => (
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
                    <EmojiEventsIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      {honor}
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

export default Honors;
