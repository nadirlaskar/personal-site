import ReactGA from 'react-ga4';

// Initialize Google Analytics
export const initGA = (trackingId) => {
  if (process.env.NODE_ENV === 'production') {
    ReactGA.initialize(trackingId);
  } else {
    console.log('GA initialized in development mode with tracking ID:', trackingId);
  }
};

// Track page views
export const trackPageView = (path) => {
  if (process.env.NODE_ENV === 'production') {
    ReactGA.send({ hitType: 'pageview', page: path });
  } else {
    console.log('Page view tracked:', path);
  }
};

// Track events
export const trackEvent = (category, action, label = null, value = null) => {
  if (process.env.NODE_ENV === 'production') {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  } else {
    console.log('Event tracked:', { category, action, label, value });
  }
};

// Track chat messages
export const trackChatMessage = (messageType, messageContent) => {
  // Truncate message content if too long
  const truncatedContent = messageContent.length > 50 
    ? `${messageContent.substring(0, 50)}...` 
    : messageContent;
  
  trackEvent(
    'Chat',
    messageType === 'user' ? 'User Message' : 'AI Response',
    truncatedContent
  );
};
