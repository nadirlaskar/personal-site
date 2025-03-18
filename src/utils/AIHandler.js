import { pipeline, env } from '@xenova/transformers';
import * as webllm from '@mlc-ai/web-llm';

// Skip local model check for embeddings
env.allowLocalModels = false;

// Model configurations
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const checkIsMobile = () => {
  return 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0;
};

const CHAT_MODEL = checkIsMobile() ? 'SmolLM2-360M-Instruct-q4f32_1-MLC' : 'Llama-3.1-8B-Instruct-q4f32_1-MLC';

const appConfig = {
    model_list: [
      {
        model: "https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f32_1-MLC",
        model_id: "Llama-3.1-8B-Instruct-q4f32_1-MLC",
        model_lib:
          webllm.modelLibURLPrefix +
          webllm.modelVersion +
          "/Llama-3_1-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
        overrides: {
          context_window_size: 2048,
        },
      },
      {
        model: "https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q4f32_1-MLC",
        model_id: "SmolLM2-360M-Instruct-q4f32_1-MLC",
        model_lib:
          webllm.modelLibURLPrefix +
          webllm.modelVersion +
          "/SmolLM2-360M-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
        overrides: {
          context_window_size: 2048,
        },
      },
      {
        model: "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f32_1-MLC",
        model_id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
        model_lib:
          webllm.modelLibURLPrefix +
          webllm.modelVersion +
          "/Llama-3.2-1B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
        overrides: {
          context_window_size: 2048,
        },
      },
    ],
  };

class AIHandler {
  static embeddingModel = null;
  static chatModule = null;
  static embeddingLoading = false;
  static chatLoading = false;
  static embeddingsCache = {};
  static conversationHistory = [];
  static loadingState = { loading: false, progress: 0, status: '' };

  static setLoadingState(state) {
    this.loadingState = { ...this.loadingState, ...state };
    // Emit loading state change event
    const event = new CustomEvent('chatLoadingStateChange', { detail: this.loadingState });
    window.dispatchEvent(event);
  }
  static async getEmbeddingModel() {
    if (this.embeddingModel === null && !this.embeddingLoading) {
      this.embeddingLoading = true;
      try {
        // Initialize the pipeline with embedding model
        this.embeddingModel = await pipeline('feature-extraction', EMBEDDING_MODEL, {
          quantized: true // Use quantized model for better performance
        });
      } finally {
        this.embeddingLoading = false;
      }
    }
    return this.embeddingModel;
  }
  
  /**
   * Get the text generation model
   * @returns {Promise<Object>} - Text generation model
   */
  static async getChatModule() {
    if (this.chatModule === null && !this.chatLoading) {
      this.chatLoading = true;
      this.setLoadingState({ loading: true, status: 'Initializing chat module...' });
      try {
        console.log('Initializing chat module...');
        const engine = await new Promise((resolve) => {
          const engine = new webllm.MLCEngine(
            { 
              appConfig,
              initProgressCallback: (res) => {
                console.log('Chat module initialization progress:', res);
                this.setLoadingState({
                  loading: true,
                  progress: res.progress,
                  status: res.text || 'Loading model...',
                });
                if (res.progress === 1) {
                  if(res.text.includes('Finish loading on')) {
                    resolve(engine);
                  }
                }
              }
            }
          );
          engine.reload(CHAT_MODEL);
        });
        this.chatModule = engine;
        this.setLoadingState({ loading: false, progress: 1, status: 'Model loaded successfully' });
      } catch (error) {
        console.error('Error initializing chat:', error);
        this.chatModule = null;
        this.setLoadingState({ loading: false, progress: 0, status: 'Error loading model' });
        throw error;
      } finally {
        this.chatLoading = false;
      }
    }
    return this.chatModule;
  }

  /**
   * Generate embeddings for a text
   * @param {string} text - Text to embed
   * @returns {Float32Array} - Embedding vector
   */
  static async getEmbedding(text) {
    // Check cache first
    if (this.embeddingsCache[text]) {
      return this.embeddingsCache[text];
    }

    const model = await this.getEmbeddingModel();
    const result = await model(text, { pooling: 'mean', normalize: true });
    
    // Cache the result
    this.embeddingsCache[text] = result.data;
    
    return result.data;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Float32Array} vec1 - First vector
   * @param {Float32Array} vec2 - Second vector
   * @returns {number} - Similarity score between -1 and 1
   */
  static cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    return dotProduct / (mag1 * mag2);
  }

  /**
   * Generate a response to a user query based on profile data using RAG approach
   * @param {string} query - User's query
   * @param {object} profileData - User profile data
   * @returns {string} - AI-generated response
   */
  static async generateResponse(query, profileData) {
    try {
      // Step 1: Create an array of potential answers based on different sections of the profile
      const { basics, skills, projects, experience, education, certifications, honors, languages } = profileData;
      
      const sections = [
        { id: 'basics', type: 'basics', content: `My name is ${basics.name}. I am a ${basics.title} based in ${basics.location}. ${basics.bio}` },
        { id: 'contact', type: 'contact', content: `You can contact me at ${basics.email}. My GitHub is ${basics.github} and LinkedIn is ${basics.linkedin}.` },
        ...skills.map(category => ({ 
          id: `skill-${category.category}`,
          type: 'skills', 
          category: category.category,
          content: `In ${category.category}, I am skilled in: ${category.items.join(', ')}` 
        })),
        ...projects.map(project => ({ 
          id: `project-${project.title}`,
          type: 'project', 
          title: project.title,
          content: `${project.title}: ${project.description} (Technologies used: ${project.technologies.join(', ')})` 
        })),
        ...experience.map(exp => ({ 
          id: `experience-${exp.company}`,
          type: 'experience', 
          company: exp.company,
          position: exp.position,
          duration: exp.duration,
          content: `${exp.position} at ${exp.company} (${exp.duration}): ${exp.description}` 
        })),
        ...education.map(edu => ({ 
          id: `education-${edu.degree}`,
          type: 'education', 
          institution: edu.institution,
          content: `${edu.degree} from ${edu.institution} (${edu.duration})` 
        })),
        ...certifications.map(cert => ({ 
          id: `certification-${cert}`,
          type: 'certification', 
          title: cert,
          content: cert,
        })),
        ...honors.map(honor => ({ 
          id: `honor-${honor}`,
          type: 'honor', 
          title: honor,
          content: honor,
        })),
        ...languages.map(lang => ({ 
          id: `language-${lang.name}`,
          type: 'language', 
          name: lang.name,
          level: lang.level,
          content: `${lang.name} - ${lang.level}`,
        })),
      ];

      // Step 2: Get embeddings for the query
      const queryEmbedding = await this.getEmbedding(query);
      
      // Step 3: Get embeddings for each section and calculate similarity
      const sectionScores = await Promise.all(
        sections.map(async section => {
          const embedding = await this.getEmbedding(`${section.type}: ${section.content}`);
          const similarity = this.cosineSimilarity(queryEmbedding, embedding);
          return { ...section, score: similarity };
        })
      );
      
      // Step 4: Sort by similarity score
      sectionScores.sort((a, b) => b.score - a.score);
      
      // Step 5: Select top relevant sections (retrieval step)
      const topSections = sectionScores.slice(0, 3);
      console.log('Top sections:', topSections);
      const context = topSections.map(s => s.content).join('\n\n');

      // Step 7: Combine context and generate response
      const response = await this.generateSmartResponse(query, context, sectionScores, profileData, topSections);
      
      // Step 8: Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: query },
        { role: 'assistant', content: response, sections }
      );
      
      // Keep conversation history focused (last 4 exchanges = 8 messages)
      if (this.conversationHistory.length > 8) {
        this.conversationHistory = this.conversationHistory.slice(-8);
      }
      
      return response;
    } catch (error) {
      console.error('Error generating response:', error);
      return this.fallbackSearch(query, profileData);
    }
  }
  
  /**
   * Generate a smart response based on the query and retrieved context
   * @param {string} query - User's query
   * @param {string} context - Retrieved context from relevant sections
   * @param {Array} sectionScores - Scored sections from the profile
   * @param {object} profileData - User profile data
   * @returns {string} - Generated response
   */
  static async generateSmartResponse(query, context, sectionScores, profileData, topSections) {
    try {
      console.log('Generating LLM response...');
      const { basics } = profileData;
      
      // Try to use the LLM for generating responses
      try {
        // Prepare a prompt for the LLM
        const prompt = await this.preparePromptForLLM(query, context, profileData);
        
        // Generate response using LLM
        const llmResponse = await this.generateWithLLM(prompt, topSections);
        if (llmResponse && llmResponse.trim()) {
          return llmResponse;
        }
      } catch (llmError) {
        console.warn('LLM generation failed, falling back to template responses:', llmError);
      }
      
      // Fallback to template-based responses if LLM fails
      const lowerQuery = query.toLowerCase();
      let response = '';
      
      // Get conversation starters and natural phrases
      const starters = this.getConversationStarters();
      const transitions = this.getTransitionPhrases();
      
      // Randomly select a starter and transition for variety
      const starter = starters[Math.floor(Math.random() * starters.length)];
      const transition = transitions[Math.floor(Math.random() * transitions.length)];
      
      // Handle different types of questions with more natural language
      if (lowerQuery.includes('who are you') || lowerQuery.includes('tell me about yourself') || lowerQuery.includes('about you')) {
        response = `${starter} I'm ${basics.name}, working as a ${basics.title} in ${basics.location}. ${basics.bio}`;
      } 
      else if (lowerQuery.includes('contact') || lowerQuery.includes('email') || lowerQuery.includes('reach')) {
        response = `${starter} you can reach me at ${basics.email}. Feel free to connect on GitHub (${basics.github}) or LinkedIn (${basics.linkedin}) as well!`;
      } 
      else if (lowerQuery.includes('skill') || lowerQuery.includes('know') || lowerQuery.includes('capable')) {
        const skillSections = sectionScores.filter(s => s.type === 'skills').slice(0, 2);
        if (skillSections.length > 0) {
          const skillContent = skillSections.map(s => s.content).join('\n');
          response = `${starter} ${transition} ${this.makeContentConversational(skillContent)}`;
        } else {
          const skills = profileData.skills.flatMap(category => category.items).slice(0, 5);
          response = `${starter} I'm particularly good with ${skills.slice(0, -1).join(', ')} and ${skills.slice(-1)}. I'm always expanding my skillset though!`;
        }
      } 
      else if (lowerQuery.includes('project') || lowerQuery.includes('portfolio') || lowerQuery.includes('built')) {
        const projectSections = sectionScores.filter(s => s.type === 'project').slice(0, 2);
        if (projectSections.length > 0) {
          const projectContent = projectSections.map(s => s.content).join('\n');
          response = `${starter} ${transition} ${this.makeContentConversational(projectContent)}`;
        } else {
          const projects = profileData.projects.map(p => p.title).slice(0, 3);
          response = `${starter} I've worked on some cool projects like ${projects.slice(0, -1).join(', ')} and ${projects.slice(-1)}. Each one taught me something valuable about software development.`;
        }
      } 
      else if (lowerQuery.includes('experience') || lowerQuery.includes('work') || lowerQuery.includes('job')) {
        const expSections = sectionScores.filter(s => s.type === 'experience').slice(0, 2);
        if (expSections.length > 0) {
          const expContent = expSections.map(s => s.content).join('\n');
          response = `${starter} ${transition} ${this.makeContentConversational(expContent)}`;
        } else {
          const skills = profileData.skills.flatMap(category => category.items).slice(0, 3);
          response = `${starter} I'm currently a ${basics.title} at ${profileData.experience[0]?.company || 'ZAGENO Inc'}, where I get to work with ${skills.join(', ')} and other exciting technologies every day.`;
        }
      } 
      else if (lowerQuery.includes('education') || lowerQuery.includes('degree') || lowerQuery.includes('study')) {
        const eduSections = sectionScores.filter(s => s.type === 'education');
        if (eduSections.length > 0) {
          const eduContent = eduSections.map(s => s.content).join('\n');
          response = `${starter} ${transition} ${this.makeContentConversational(eduContent)}`;
        } else if (profileData.education && profileData.education.length > 0) {
          response = `${starter} I studied ${profileData.education[0].degree} at ${profileData.education[0].institution}. It was a great foundation for my career in tech.`;
        } else {
          response = `${starter} my background includes computer science education, but I've learned the most through hands-on experience and continuous self-learning. The tech field moves so quickly that staying curious is essential!`;
        }
      }
      else if (lowerQuery.includes('location') || lowerQuery.includes('where') || lowerQuery.includes('based')) {
        response = `${starter} I'm based in ${basics.location}. It's a great place to work in tech!`;
      }
      else if (lowerQuery.includes('focus') || lowerQuery.includes('current') || lowerQuery.includes('working on')) {
        const skills = profileData.skills.flatMap(category => category.items).slice(0, 3);
        response = `${starter} I'm currently leading the development of a low code platform with voice interface capabilities. It's exciting work that lets me use ${skills.join(', ')} and explore new technologies as well.`;
      }
      else if (lowerQuery.includes('team') || lowerQuery.includes('lead') || lowerQuery.includes('leadership')) {
        response = `${starter} as a Software Development Team Lead at ZAGENO, I'm responsible for guiding our team in building a low code platform with voice interface. I focus on mentoring developers, implementing micro-frontend architecture using Single SPA, and ensuring we deliver high-quality solutions.`;
      }
      else if (lowerQuery.includes('hobby') || lowerQuery.includes('free time') || lowerQuery.includes('outside work')) {
        response = `${starter} when I'm not coding, I enjoy staying updated with the latest in AI and blockchain technologies. I also like to experiment with new tech stacks and occasionally contribute to open-source projects.`;
      }
      else {
        // Use the top relevant sections for general questions
        const relevantContent = sectionScores.slice(0, 2).map(s => s.content).join('\n');
        response = `${starter} ${transition} ${this.makeContentConversational(relevantContent)}`;
      }
      
      return response;
    } catch (error) {
      console.error('Error generating smart response:', error);
      return context; // Fall back to the retrieved context
    }
  }

  /**
   * Fallback search function when embedding-based search fails
   * @param {string} query - User's query
   * @param {object} profileData - User profile data
   * @returns {string} - Response based on keyword matching
   */
  /**
   * Generate a response using the LLM
   * @param {string} prompt - Prompt for the LLM
   * @param {object} profileData - User profile data
   * @returns {Promise<string>} - Generated response
    */
  static async generateWithLLM(prompt, sections) {
    try {
      const chatModule = await this.getChatModule();
      
      try {
        // Prepare messages array with history and new prompt
        const messages = [
          ...this.conversationHistory.slice(-6), // Keep last 3 exchanges (6 messages)
          { role: "user", content: prompt }
        ];

        let streamingMessage = '';
        const asyncChunkGenerator = await chatModule.chat.completions.create({
          model: CHAT_MODEL,
          stream: true,
          messages,
          temperature: 0.2,
          max_tokens: 256,
          top_p: 0.1,
          presence_penalty: 0.6,
          frequency_penalty: 0.6
        });

        for await (const chunk of asyncChunkGenerator) {
          const content = chunk.choices[0]?.delta?.content || "";
          streamingMessage += content;
          
          // Emit streaming event with current message
          const event = new CustomEvent('chatStreamingResponse', { 
            detail: { 
              content: streamingMessage,
              done: false
            }
          });
          window.dispatchEvent(event);
        }
        
        // Clean and validate final response
        const cleanedResponse = this.cleanGeneratedText(streamingMessage);
        if (!cleanedResponse) {
          console.warn('Empty response received from chat');
          return 'I apologize, but I encountered an issue. Please try asking your question again.';
        }
        
        // Emit final message
        const finalEvent = new CustomEvent('chatStreamingResponse', { 
          detail: { 
            content: cleanedResponse,
            sections,
            done: true
          }
        });
        window.dispatchEvent(finalEvent);
        
        return cleanedResponse;
      } catch (genError) {
        console.error('Chat response error:', genError);
        return 'I apologize, but I encountered an issue. Please try rephrasing your question.';
      }
    } catch (error) {
      console.error('Chat initialization error:', error);
      return 'I apologize, but the chat service is currently unavailable. Please try again later.';
    }
  }
  
  /**
   * Prepare a prompt for the LLM based on the query and context
   * @param {string} query - User's query
   * @param {string} context - Retrieved context
   * @returns {string} - Prompt for the LLM
   */
  static async preparePromptForLLM(query, context, profileData) {
    const systemPrompt = await this.getSystemPromptForLLM(profileData);
    
    // Create a system prompt that instructs the model how to respond
    const prompt = `${systemPrompt} Here is some relevant information about you : ${context} \n\n`;
    
    // Add the query
    const fullPrompt = `${prompt} to help answer: \n\nQuestion: ${query}\nAnswer: `;
    
    return fullPrompt;
  }

  static async getSystemPromptForLLM(profileData) {
    const { basics } = profileData;
    
    // Create a system prompt that instructs the model how to respond
    const systemPrompt = `Act as Nadir Hussain Laskar, a ${basics.title} based in ${basics.location}. 
      - Answer the following question in a friendly, conversational tone as if you were Nadir himself. 
      - Don't assume the user is Nadir Laskar. 
      - Keep the response at max 3-4 sentences. 
      - Be concise, personable, and natural in your response. Use contractions and casual language. 
      - Don't answer outside the context provided. 
      - If you don't know the answer, say so and provide a helpful alternative response. 
    `;
    
    return systemPrompt;
  }
  
  /**
   * Clean up the generated text
   * @param {string} text - Generated text
   * @returns {string} - Cleaned text
   */
  static cleanGeneratedText(text) {
    // If the text is empty, return an empty string
    if (!text || text.trim() === '') {
      return '';
    }
    
    // Remove any text after the last complete sentence
    const sentences = text.match(/[^.!?]*[.!?]/g) || [];
    if (sentences.length > 0) {
      return sentences.join(' ').trim();
    }
    
    return text.trim();
  }
  
  /**
   * Get a list of conversation starters for more natural responses
   * @returns {Array} - List of conversation starters
   */
  static getConversationStarters() {
    return [
      "Hey there!",
      "Thanks for asking!",
      "Great question!",
      "I'd be happy to share that.",
      "Glad you asked!",
      "Oh, that's something I can definitely talk about.",
      "Sure thing!",
      "Let me tell you about that.",
      "I appreciate your interest!",
      "",  // Sometimes no starter for variety
    ];
  }
  
  /**
   * Get a list of transition phrases for more natural responses
   * @returns {Array} - List of transition phrases
   */
  static getTransitionPhrases() {
    return [
      "To answer your question,",
      "In my experience,",
      "If you're interested in knowing,",
      "I can tell you that",
      "Just to give you some context,",
      "To put it simply,",
      "The short answer is",
      "From my perspective,",
      "",  // Sometimes no transition for variety
    ];
  }
  
  /**
   * Make content more conversational by adding personal touches
   * @param {string} content - The content to make conversational
   * @returns {string} - More conversational content
   */
  static makeContentConversational(content) {
    // Replace formal phrases with more conversational ones
    let conversational = content
      .replace(/I am/g, "I'm")
      .replace(/I have/g, "I've")
      .replace(/I will/g, "I'll")
      .replace(/It is/g, "It's")
      .replace(/That is/g, "That's");
      
    // Add some personal touches if the content is too formal
    if (!conversational.includes("!") && !conversational.includes("?")) {
      const personalTouches = [
        " I really enjoy this aspect of my work!",
        " It's been a great journey so far.",
        " I'm passionate about this area.",
        " This has been a key focus for me.",
        "", // Sometimes no personal touch
      ];
      
      const randomTouch = personalTouches[Math.floor(Math.random() * personalTouches.length)];
      conversational += randomTouch;
    }
    
    return conversational;
  }
  
  static fallbackSearch(query, profileData) {
    const searchText = query.toLowerCase();
    const results = [];
    const { basics, skills, projects, experience, education } = profileData;
    
    // Get conversation starters for more natural responses
    const starters = this.getConversationStarters();
    const starter = starters[Math.floor(Math.random() * starters.length)];
    
    // Basic information
    if (searchText.includes('name') || searchText.includes('who')) {
      results.push(`${starter} I'm ${basics.name}, working as a ${basics.title} in ${basics.location}.`);
    }
    
    if (searchText.includes('about') || searchText.includes('bio')) {
      results.push(`${starter} ${this.makeContentConversational(basics.bio)}`);
    }
    
    // Skills
    if (searchText.includes('skill') || searchText.includes('know')) {
      const allSkills = skills.flatMap(category => category.items).slice(0, 5);
      results.push(`${starter} I'm skilled in ${allSkills.join(', ')} and other technologies.`);
    }
    
    // Projects
    if (searchText.includes('project') || searchText.includes('work') || searchText.includes('built')) {
      projects.forEach(project => {
        results.push(`${project.title}: ${project.description} (Technologies: ${project.technologies.join(', ')})`);
      });
    }
    
    // Experience
    if (searchText.includes('experience') || searchText.includes('job')) {
      experience.forEach(exp => {
        results.push(`${exp.position} at ${exp.company} (${exp.duration}): ${exp.description}`);
      });
    }
    
    // Education
    if (searchText.includes('education') || searchText.includes('study') || searchText.includes('degree')) {
      education.forEach(edu => {
        results.push(`${edu.degree} from ${edu.institution} (${edu.duration})`);
      });
    }
    
    // Years of experience in specific technology
    if (searchText.includes('how many years') || searchText.includes('experience in')) {
      // Try to extract technology from the query by matching with skills
      const techSkills = skills.flatMap(category => category.items);
      const technology = techSkills.find(skill => searchText.includes(skill.toLowerCase()));
      
      if (technology) {
        const responses = [
          `I've been working with ${technology} for several years now as part of my role as a ${basics.title}.`,
          `${technology} has been one of my core technologies for quite some time in my career.`,
          `I've built up solid experience with ${technology} through various projects at ZAGENO and previous roles.`,
        ];
        results.push(responses[Math.floor(Math.random() * responses.length)]);
      }
    }
    
    // Default response
    if (results.length === 0) {
      const defaultResponses = [
        `${starter} I'm ${basics.name}, a ${basics.title} based in ${basics.location}. Feel free to ask me about my skills, projects, or experience!`,
        `Hey there! I'm ${basics.name}, and I work as a ${basics.title}. Is there something specific about my background or skills you'd like to know?`,
        `Thanks for reaching out! I'm ${basics.name}, and I specialize in software development. What would you like to know about my work or expertise?`
      ];
      results.push(defaultResponses[Math.floor(Math.random() * defaultResponses.length)]);
    }
    
    return results.join('\n\n');
  }
}

export default AIHandler;
