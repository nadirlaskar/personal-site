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
  Chip,
  Link,
  Accordion,
  AccordionDetails,
  AccordionActions,
  AccordionSummary,
  Collapse,
} from '@mui/material';
import { Send, Chat as ChatIcon, Close, RefreshOutlined, Expand, ArrowDownward, KeyboardArrowDown } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AIHandler from '../utils/AIHandler';
import { trackChatMessage, trackEvent } from '../utils/analytics';

const Chat = ({ profile, open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelLoading, setModelLoading] = useState({ loading: false, progress: 0, status: '' });
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for chat loading state changes
  useEffect(() => {
    const handleLoadingStateChange = (event) => {
      setModelLoading(event.detail);
    };
    window.addEventListener('chatLoadingStateChange', handleLoadingStateChange);
    return () => {
      window.removeEventListener('chatLoadingStateChange', handleLoadingStateChange);
    };
  }, []);

  // Handle streaming responses
  useEffect(() => {
    const handleStreamingResponse = (event) => {
      const { content, done, sections } = event.detail;
      
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        
        if (lastMessage && lastMessage.sender === 'bot') {
          newMessages[newMessages.length - 1] = {
            ...lastMessage,
            text: content,
            sections,
            streaming: !done
          };
        }
        
        return newMessages;
      });
      
      if (done) {
        setIsGenerating(false);
      }
    };
    
    window.addEventListener('chatStreamingResponse', handleStreamingResponse);
    return () => window.removeEventListener('chatStreamingResponse', handleStreamingResponse);
  }, []);

  const generateResponse = useCallback(async (query) => {
    setIsGenerating(true);
    try {
      // Add placeholder message for streaming response
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: '',
        streaming: true,
        timestamp: new Date().toISOString()
      }]);

      await AIHandler.generateResponse(query, profile);
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.sender === 'bot') {
          lastMessage.text = `I apologize, but I'm having trouble generating a response. Please try asking a different question about ${profile.basics.name}'s background, skills, or experience.`;
          lastMessage.streaming = false;
        }
        return newMessages;
      });
      setIsGenerating(false);
    }
  }, [profile]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating || modelLoading.loading) return;

    const currentInput = input.trim();
    const userMessage = {
      text: currentInput,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    // Clear input immediately for better UX
    setInput('');

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);

    // Track user message in GA
    trackChatMessage('user_message', currentInput);

    try {
      // Generate response (streaming will handle bot message)
      await generateResponse(currentInput);
      // Track completion in GA
      trackEvent('Chat', 'ResponseComplete', 'Success');
    } catch (error) {
      console.error('Error in chat response:', error);
      // Error handling is now done in generateResponse
      trackEvent('Chat', 'Error', error.message || 'Unknown error');
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
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: modelLoading.loading ? 1 : 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChatIcon sx={{ color: modelLoading.loading ? 'text.disabled' : 'primary.main' }} />
                    <Typography variant="h7">{profile.basics.name}'s AI Assistant</Typography>
                  </Box>
                  <IconButton onClick={onClose} edge="end" aria-label="close">
                    <Close />
                  </IconButton>
                </Box>
                {modelLoading.loading && (
                  <Box 
                    component={motion.div}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    sx={{ width: '100%', mt: 1 }}
                  >
                    <Box 
                      sx={{ 
                        width: '100%', 
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
                        borderRadius: 1, 
                        p: 1.5,
                        border: 1,
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box 
                          component={motion.div} 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          sx={{ display: 'inline-flex' }}
                        >
                          <RefreshOutlined fontSize="small" />
                        </Box>
                        {modelLoading.status}
                      </Typography>
                      <Box
                        sx={{
                          width: '100%',
                          height: 4,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          borderRadius: 2,
                          mt: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          component={motion.div}
                          initial={{ width: 0 }}
                          animate={{ width: `${modelLoading.progress * 100}%` }}
                          transition={{ duration: 0.3 }}
                          sx={{
                            height: '100%',
                            bgcolor: 'primary.main',
                            borderRadius: 2,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                )}
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
                      component={message.streaming ? motion.div : Paper}
                      initial={message.streaming ? { opacity: 0, y: 10 } : undefined}
                      animate={message.streaming ? { opacity: 1, y: 0 } : undefined}
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
                        {message.text || (modelLoading.loading ? 'loading...' : 'typing...')}
                        {message.streaming && (
                          <Box
                            component={motion.span}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            sx={{ display: 'inline-block', ml: 0.5 }}
                          >
                            ▋
                          </Box>
                        )}
                        {message.sections && (
                          <Accordion
                            component={Box} 
                            elevation={0} 
                            sx={{
                              mt: 1, bgcolor: 'transparent', 
                              p: 0, 
                              '&:hover': {
                                cursor: 'pointer',
                              },
                            }} 
                            size="small"
                          >
                            <AccordionSummary sx={{ p: 0, m: 0 }} expandIcon={<KeyboardArrowDown fontSize={"small"} />}>Reference</AccordionSummary>
                            <AccordionDetails sx={{ p: 0, m: 0 }}>
                              {message?.sections?.map((section, index) => (
                                <Chip
                                  key={index}
                                  label={section.type}
                                  size='small'
                                  component={Link}
                                  href={`#${section.type}`}
                                  target="_self"
                                  rel="noopener noreferrer"
                                  sx={{
                                    mr: 1,
                                    mb: 0.5,
                                    '&:hover': {
                                      cursor: 'pointer',
                                    },
                                  }}
                                />
                              ))}
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </Typography>
                    </Paper>
                  </ListItem>
                ))}
                <div ref={messagesEndRef} />
              </List>

              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={modelLoading.loading ? 'Loading AI model...' : 'Ask me anything about Nadir...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isGenerating || modelLoading.loading}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={handleSend}
                        color="primary"
                        disabled={!input.trim() || isGenerating || modelLoading.loading}
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
