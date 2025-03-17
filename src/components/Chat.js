import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Send, Chat as ChatIcon, Close } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AIHandler from '../utils/AIHandler';
import { trackChatMessage, trackEvent } from '../utils/analytics';

const Chat = ({ profile, open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = useCallback(async (query) => {
    setIsGenerating(true);
    try {
      const response = await AIHandler.generateResponse(query, profile);
      return response;
    } catch (error) {
      console.error('Error generating response:', error);
      return `I apologize, but I'm having trouble generating a response. Please try asking a different question about ${profile.basics.name}'s background, skills, or experience.`;
    } finally {
      setIsGenerating(false);
    }
  }, [profile]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    // Track user message in GA
    trackChatMessage('user', input);

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await generateResponse(input);
      const botMessage = {
        text: response,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      // Track AI response in GA
      trackChatMessage('ai', response);

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error in chat response:', error);
      const errorMessage = {
        text: 'I apologize, but I encountered an error. Please try asking your question again.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      
      // Track error in GA
      trackEvent('Chat', 'Error', error.message || 'Unknown error');
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 400,
          maxWidth: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
        },
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h7">Chat with {profile.basics.name}'s AI Assistant</Typography>
                <IconButton onClick={onClose} edge="end" aria-label="close">
                  <Close />
                </IconButton>
              </Box>

              <List
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {messages.map((message, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={message.sender === 'bot' ? profile.basics.avatar : null}
                        sx={{
                          bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
                        }}
                      >
                        {message.sender === 'user' ? 'U' : 'A'}
                      </Avatar>
                    </ListItemAvatar>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1,
                        maxWidth: '70%',
                        bgcolor: message.sender === 'user' ? 'primary.light' : theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
                        border: theme.palette.mode === 'dark' && message.sender !== 'user' ? 1 : 0,
                        borderColor: 'divider',
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          color: message.sender === 'user' ? 'common.white' : 'text.primary',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {message.text}
                      </Typography>
                    </Paper>
                  </ListItem>
                ))}
                <div ref={messagesEndRef} />
              </List>

              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', position: 'relative' }}>
                {isGenerating && (
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: -20,
                      left: 16,
                      color: 'text.secondary',
                    }}
                  >
                    AI is thinking...
                  </Typography>
                )}
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Ask me anything about Nadir..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isGenerating}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={handleSend}
                        color="primary"
                        disabled={isGenerating}
                        sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }}
                      >
                        <Send />
                      </IconButton>
                    ),
                  }}
                />
              </Box>
      </motion.div>
    </Drawer>
  );
};

export default Chat;
