import { pipeline, env } from '@xenova/transformers';

// Skip local model check
env.allowLocalModels = false;

// Use a model better suited for semantic search in browser
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';

class AIHandler {
  static embeddingModel = null;
  static isLoading = false;
  static embeddingsCache = {};

  static async getEmbeddingModel() {
    if (this.embeddingModel === null && !this.isLoading) {
      this.isLoading = true;
      try {
        // Initialize the pipeline with embedding model
        this.embeddingModel = await pipeline('feature-extraction', EMBEDDING_MODEL, {
          quantized: true // Use quantized model for better performance
        });
      } finally {
        this.isLoading = false;
      }
    }
    return this.embeddingModel;
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
      const { basics, skills, projects, experience, education } = profileData;
      
      const sections = [
        { type: 'basics', content: `My name is ${basics.name}. I am a ${basics.title} based in ${basics.location}. ${basics.bio}` },
        { type: 'contact', content: `You can contact me at ${basics.email}. My GitHub is ${basics.github} and LinkedIn is ${basics.linkedin}.` },
        ...skills.map(category => ({ 
          type: 'skills', 
          category: category.category,
          content: `In ${category.category}, I am skilled in: ${category.items.join(', ')}` 
        })),
        ...projects.map(project => ({ 
          type: 'project', 
          title: project.title,
          content: `${project.title}: ${project.description} (Technologies used: ${project.technologies.join(', ')})` 
        })),
        ...experience.map(exp => ({ 
          type: 'experience', 
          company: exp.company,
          position: exp.position,
          duration: exp.duration,
          content: `${exp.position} at ${exp.company} (${exp.duration}): ${exp.description}` 
        })),
        ...education.map(edu => ({ 
          type: 'education', 
          institution: edu.institution,
          content: `${edu.degree} from ${edu.institution} (${edu.duration})` 
        }))
      ];

      // Step 2: Get embeddings for the query
      const queryEmbedding = await this.getEmbedding(query);
      
      // Step 3: Get embeddings for each section and calculate similarity
      const sectionScores = await Promise.all(
        sections.map(async section => {
          const embedding = await this.getEmbedding(section.content);
          const similarity = this.cosineSimilarity(queryEmbedding, embedding);
          return { ...section, score: similarity };
        })
      );
      
      // Step 4: Sort by similarity score
      sectionScores.sort((a, b) => b.score - a.score);
      
      // Step 5: Select top relevant sections (retrieval step)
      const topSections = sectionScores.slice(0, 3);
      const context = topSections.map(s => s.content).join('\n\n');
      
      // Step 7: Generate a response using the retrieved context
      return await this.generateSmartResponse(query, context, sectionScores, profileData);
      
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
  static async generateSmartResponse(query, context, sectionScores, profileData) {
    try {
      const { basics } = profileData;
      const lowerQuery = query.toLowerCase();
      let response = '';
      
      // Handle different types of questions
      if (lowerQuery.includes('who are you') || lowerQuery.includes('tell me about yourself') || lowerQuery.includes('about you')) {
        response = `I am ${basics.name}, a ${basics.title} based in ${basics.location}. ${basics.bio}`;
      } 
      else if (lowerQuery.includes('contact') || lowerQuery.includes('email') || lowerQuery.includes('reach')) {
        response = `You can contact me at ${basics.email}. You can also find me on GitHub at ${basics.github} and LinkedIn at ${basics.linkedin}.`;
      } 
      else if (lowerQuery.includes('skill') || lowerQuery.includes('know') || lowerQuery.includes('capable')) {
        const skillSections = sectionScores.filter(s => s.type === 'skills').slice(0, 3);
        if (skillSections.length > 0) {
          response = skillSections.map(s => s.content).join('\n\n');
        } else {
          response = `My key skills include ${profileData.skills.flatMap(category => category.items).slice(0, 5).join(', ')} and more.`;
        }
      } 
      else if (lowerQuery.includes('project') || lowerQuery.includes('portfolio') || lowerQuery.includes('built')) {
        const projectSections = sectionScores.filter(s => s.type === 'project').slice(0, 3);
        if (projectSections.length > 0) {
          response = projectSections.map(s => s.content).join('\n\n');
        } else {
          response = `I've worked on various projects including ${profileData.projects.map(p => p.title).slice(0, 3).join(', ')} and others.`;
        }
      } 
      else if (lowerQuery.includes('experience') || lowerQuery.includes('work') || lowerQuery.includes('job')) {
        const expSections = sectionScores.filter(s => s.type === 'experience').slice(0, 3);
        if (expSections.length > 0) {
          response = expSections.map(s => s.content).join('\n\n');
        } else {
          response = `I currently work as a ${basics.title} at ${profileData.experience[0]?.company || 'ZAGENO Inc'}. I have experience in ${profileData.skills.flatMap(category => category.items).slice(0, 3).join(', ')} and other technologies.`;
        }
      } 
      else if (lowerQuery.includes('education') || lowerQuery.includes('degree') || lowerQuery.includes('study')) {
        const eduSections = sectionScores.filter(s => s.type === 'education');
        if (eduSections.length > 0) {
          response = eduSections.map(s => s.content).join('\n\n');
        } else if (profileData.education && profileData.education.length > 0) {
          response = `I studied ${profileData.education[0].degree} at ${profileData.education[0].institution}.`;
        } else {
          response = `I have formal education in computer science and continue to learn through practical experience and self-study.`;
        }
      }
      else if (lowerQuery.includes('location') || lowerQuery.includes('where') || lowerQuery.includes('based')) {
        response = `I am based in ${basics.location}.`;
      }
      else if (lowerQuery.includes('focus') || lowerQuery.includes('current') || lowerQuery.includes('working on')) {
        response = `I'm currently focused on leading low code platform development with voice interface. My work involves using ${profileData.skills.flatMap(category => category.items).slice(0, 3).join(', ')} and other technologies.`;
      }
      else {
        // Use the top relevant sections for general questions
        response = sectionScores.slice(0, 2).map(s => s.content).join('\n\n');
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
  static fallbackSearch(query, profileData) {
    const searchText = query.toLowerCase();
    const results = [];
    const { basics, skills, projects, experience, education } = profileData;
    
    // Basic information
    if (searchText.includes('name') || searchText.includes('who')) {
      results.push(`${basics.name} is a ${basics.title} based in ${basics.location}.`);
    }
    
    if (searchText.includes('about') || searchText.includes('bio')) {
      results.push(basics.bio);
    }
    
    // Skills
    if (searchText.includes('skill') || searchText.includes('know')) {
      skills.forEach(category => {
        results.push(`${category.category} skills: ${category.items.join(', ')}`);
      });
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
        results.push(`I have several years of experience with ${technology} as part of my work as a ${basics.title}.`);
      }
    }
    
    // Default response
    if (results.length === 0) {
      results.push(`I'm an AI assistant for ${basics.name}. You can ask me about their skills, projects, experience, education, or contact information.`);
    }
    
    return results.join('\n\n');
  }
}

export default AIHandler;
