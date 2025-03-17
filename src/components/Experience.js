import React from 'react';
import { Box, Typography, Card, CardContent, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import WorkIcon from '@mui/icons-material/Work';

const Experience = ({ experience }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box component="section" id="experiences" sx={{ py: 8 }}>
      <Typography
        variant="h4"
        component="h2"
        sx={{ mb: 4, textAlign: 'center' }}
        color="primary"
      >
        Experience
      </Typography>

      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Timeline 
          position="right"
          sx={{
            p: 0,
            [`& .MuiTimelineItem-root`]: {
              '&::before': {
                display: 'none',
              },
              minHeight: 'auto',
              mb: 3,
            },
            [`& .MuiTimelineContent-root`]: {
              py: 0,
              px: { xs: 2, sm: 3 },
              flex: 1,
            },
            [`& .MuiTimelineSeparator-root`]: {
              minWidth: 'auto',
              mr: { xs: 2, sm: 3 },
            },
            [`& .MuiTimelineConnector-root`]: {
              width: 2,
              backgroundColor: theme.palette.primary.main,
              opacity: 0.2,
              minHeight: 24,
            },
          }}
        >
        {experience.map((exp, index) => (
          <TimelineItem key={index}>
            <TimelineSeparator>
              <TimelineDot 
                sx={{ 
                  bgcolor: 'background.paper',
                  borderWidth: 2,
                  borderStyle: 'solid',
                  borderColor: 'primary.main',
                  p: { xs: 0.6, sm: 0.75 },
                  m: 0,
                  boxShadow: 'none',
                }}
              >
                <WorkIcon color="primary" fontSize="small" />
              </TimelineDot>
              {index !== experience.length - 1 && (
                <TimelineConnector />
              )}
            </TimelineSeparator>
            <TimelineContent>
              <motion.div
                id={`experience-${exp.company}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  elevation={1}
                  sx={{
                    bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.3s ease-in-out',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {exp.position}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      {exp.company}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {exp.duration}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {exp.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
      </Box>
    </Box>
  );
};

export default Experience;
