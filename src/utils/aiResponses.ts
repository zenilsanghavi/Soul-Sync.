// Built-in replies for Wellness Companion, used when the local LLM (Ollama) is unavailable

import { detectCrisis, getCrisisResources, crisisMessage } from './crisis';

// Types
interface UserMessage {
  sentiment?: string;
  keywords?: string[];
}

interface AIResponse {
  message: string;
  framework: string;
  followUpQuestions: string[];
  resources: string[];
  exercises: string[];
  interventions: string[];
}

// Conversation starters
export const conversationStarters = {
  casual: [
    "Hello! I'm here to support you today. How are you feeling right now?",
    "Hi there! What's been on your mind lately?",
    "Good to see you! How are you feeling right now?",
    "Welcome! I'm here to listen and help. What would you like to talk about?"
  ],
  supportive: [
    "I'm here for you. What's been weighing on your heart?",
    "You're not alone in this. What's been challenging for you lately?",
    "I can sense you might be going through something difficult. Want to share?",
    "Sometimes it helps to talk things through. What's on your mind?"
  ],
  therapeutic: [
    "What brings you here today? What would you like to work on?",
    "Can you tell me about what's been troubling you lately?",
    "What symptoms or concerns have you been experiencing?",
    "How long have you been dealing with these feelings?"
  ]
};

// Reply styles, loosely inspired by common self-help approaches
const frameworks = {
  cbt: {
    name: "Thoughts & Feelings",
    responses: [
      "I notice you mentioned some challenging thoughts. Our thoughts, feelings and actions often affect each other. What was going through your mind when you felt that way?",
      "Let's look at that thought together. Sometimes our minds can play tricks on us. What makes that thought feel true, and is there anything that doesn't quite fit it?",
      "It sounds like you're experiencing some difficult emotions. The way we think about a situation can shape how we feel about it. What thoughts might be feeding these feelings?",
      "I'd like to help you identify any thinking patterns that might be causing distress. Can you walk me through what happened and what you were thinking at each step?"
    ],
    followUps: [
      "What thoughts went through your mind when this happened?",
      "How did those thoughts make you feel?",
      "What evidence supports or challenges this thought?",
      "What would you tell a friend in this situation?"
    ],
    exercises: [
      "Keep a daily thought diary noting situations, thoughts, emotions, and behaviors",
      "Practice the 5-4-3-2-1 grounding technique when feeling overwhelmed",
      "Challenge negative thoughts by asking: Is this thought realistic?",
      "Schedule pleasant activities throughout your week"
    ],
    interventions: [
      "Thought Record: Track your thoughts, feelings, and behaviors to identify patterns",
      "Cognitive Restructuring: Work on challenging and reframing unhelpful thoughts"
    ]
  },
  dbt: {
    name: "Strong Emotions",
    responses: [
      "I can hear the intensity in what you're sharing. Two things can be true at once: you can feel overwhelmed AND be capable of getting through this. How does that sit with you?",
      "It sounds like you're feeling some intense emotions right now. Slowing your breathing can help take the edge off. Would you like to try a quick breathing exercise together?",
      "Sometimes it helps just to notice a feeling without judging it. Can you describe what you're feeling right now without labelling it as good or bad?",
      "I notice you're being quite hard on yourself. If you stepped back and looked at this calmly, what might you tell yourself about this situation?"
    ],
    followUps: [
      "What emotions are you experiencing right now?",
      "How intense are these feelings on a scale of 1-10?",
      "What would help you feel more grounded in this moment?",
      "What skills have helped you cope with intense emotions before?"
    ],
    exercises: [
      "Practice the STOP skill: Stop, Take a breath, Observe, Proceed mindfully",
      "Use ice cubes or cold water on your face/hands when emotions feel overwhelming",
      "Try the 4-7-8 breathing technique: Inhale for 4, hold for 7, exhale for 8",
      "Practice opposite action: Do the opposite of what your emotion urges you to do"
    ],
    interventions: [
      "Distress Tolerance: TIPP (Temperature, Intense exercise, Paced breathing)",
      "Emotion Regulation: PLEASE skills for maintaining emotional balance"
    ]
  },
  mindfulness: {
    name: "Mindfulness",
    responses: [
      "Let's take a moment to pause and notice what's happening right now. Can you feel your feet on the ground and your breath moving in and out?",
      "Mindfulness teaches us to observe our thoughts and feelings without getting caught up in them. What do you notice when you simply observe this experience?",
      "Sometimes when we're overwhelmed, returning to the present moment can be helpful. What are three things you can see around you right now?",
      "Mindfulness isn't about stopping thoughts or feelings, but about changing our relationship with them. How might you hold this experience with more kindness?"
    ],
    followUps: [
      "What do you notice in your body right now?",
      "Can you describe this experience without judging it?",
      "What happens when you simply observe these thoughts?",
      "How might you hold this experience with more kindness?"
    ],
    exercises: [
      "Practice 10 minutes of daily breath meditation",
      "Try mindful eating with one meal per day",
      "Use the STOP technique: Stop, Take a breath, Observe, Proceed",
      "Practice the 3-minute breathing space throughout the day"
    ],
    interventions: [
      "Breath Awareness: Focusing attention on the natural rhythm of breathing",
      "Body Scan: Systematically noticing sensations throughout the body"
    ]
  },
  humanistic: {
    name: "Person-Centered Approach",
    responses: [
      "I hear you, and I want you to know that your feelings are completely valid. You are the expert on your own experience. What feels most important for you to explore right now?",
      "It takes courage to share what you're going through. I'm honored that you trust me with these feelings. What would feel most supportive for you in this moment?",
      "You have incredible strength within you, even if it doesn't feel that way right now. What has helped you get through difficult times before?",
      "I believe in your capacity to find your own answers and path forward. What does your inner wisdom tell you about this situation?"
    ],
    followUps: [
      "What feels most important for you right now?",
      "How would you like to be supported in this moment?",
      "What does your inner wisdom tell you?",
      "What do you need most right now?"
    ],
    exercises: [
      "Practice self-compassion by speaking to yourself as you would a dear friend",
      "Write a letter to yourself from the perspective of an unconditionally loving friend",
      "Spend time in nature and notice what emerges naturally",
      "Practice expressing your authentic feelings through art, music, or writing"
    ],
    interventions: [
      "Unconditional Positive Regard: Accepting yourself completely",
      "Empathetic Understanding: Deeply listening to your own experience"
    ]
  }
};

// Sentiment analysis
export const analyzeSentiment = (message: string): string => {
  const lowerMessage = message.toLowerCase();

  if (detectCrisis(message)) {
    return 'crisis';
  }

  // Negative keywords
  const negativeKeywords = ['sad', 'depressed', 'anxious', 'worried', 'angry', 'frustrated', 'hopeless', 'overwhelmed'];
  if (negativeKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'negative';
  }

  // Positive keywords
  const positiveKeywords = ['happy', 'good', 'great', 'excited', 'grateful', 'better', 'improving'];
  if (positiveKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'positive';
  }

  return 'neutral';
};

// Keyword extraction
export const extractKeywords = (message: string): string[] => {
  const keywords: string[] = [];
  const lowerMessage = message.toLowerCase();

  const keywordMap = {
    emotions: ['sad', 'happy', 'angry', 'anxious', 'depressed', 'excited', 'frustrated', 'overwhelmed', 'hopeless'],
    relationships: ['family', 'friends', 'partner', 'relationship', 'marriage', 'divorce', 'conflict'],
    work: ['work', 'job', 'career', 'school', 'stress', 'pressure'],
    health: ['sleep', 'eating', 'health', 'pain', 'tired', 'exhausted'],
    trauma: ['trauma', 'abuse', 'ptsd', 'flashback', 'trigger']
  };

  Object.values(keywordMap).flat().forEach(keyword => {
    if (lowerMessage.includes(keyword)) {
      keywords.push(keyword);
    }
  });

  return keywords;
};

// Generate AI response
export const generateAIResponse = (userMessage: UserMessage): AIResponse => {
  const { sentiment = 'neutral', keywords = [] } = userMessage;

  // Handle crisis situations
  if (sentiment === 'crisis') {
    return {
      message: crisisMessage,
      framework: "Crisis Support",
      followUpQuestions: ["Are you safe right now?", "Who can you call for support?"],
      resources: getCrisisResources().lines,
      exercises: [],
      interventions: ["Immediate safety planning", "Crisis hotline contact"]
    };
  }

  // Select framework based on keywords
  let selectedFramework = 'humanistic'; // Default

  if (keywords.includes('anxious') || keywords.includes('worried')) {
    selectedFramework = Math.random() > 0.5 ? 'cbt' : 'mindfulness';
  } else if (keywords.includes('angry') || keywords.includes('frustrated')) {
    selectedFramework = 'dbt';
  } else if (keywords.includes('sad') || keywords.includes('depressed')) {
    selectedFramework = 'cbt';
  } else if (keywords.includes('overwhelmed')) {
    selectedFramework = 'mindfulness';
  }

  const framework = frameworks[selectedFramework as keyof typeof frameworks];
  const response = framework.responses[Math.floor(Math.random() * framework.responses.length)];

  // Generate resources based on keywords
  const resources = generateResources(keywords);

  return {
    message: response,
    framework: framework.name,
    followUpQuestions: framework.followUps.slice(0, 3),
    resources: resources,
    exercises: framework.exercises.slice(0, 3),
    interventions: framework.interventions
  };
};

// Generate resources based on keywords
const generateResources = (keywords: string[]): string[] => {
  const resources: string[] = [];

  if (keywords.some(k => ['anxious', 'anxiety', 'worried'].includes(k))) {
    resources.push("Anxiety and Depression Association of America: https://adaa.org");
    resources.push("Calm app for guided meditation and anxiety management");
  }

  if (keywords.some(k => ['sad', 'depressed', 'depression'].includes(k))) {
    resources.push("National Alliance on Mental Illness: https://nami.org");
    resources.push("Depression and Bipolar Support Alliance: https://dbsalliance.org");
  }

  if (keywords.some(k => ['trauma', 'ptsd', 'abuse'].includes(k))) {
    resources.push("National Center for PTSD: https://ptsd.va.gov");
    resources.push("RAINN (Rape, Abuse & Incest National Network): https://rainn.org");
  }

  return resources.slice(0, 3);
};

// Coping strategies
export const getCopingStrategies = (keywords: string[]): string[] => {
  const strategies: string[] = [];

  if (keywords.includes('anxious') || keywords.includes('worried')) {
    strategies.push("Practice deep breathing: 4 counts in, hold for 4, out for 6");
    strategies.push("Use the 5-4-3-2-1 grounding technique");
    strategies.push("Try progressive muscle relaxation");
  }

  if (keywords.includes('sad') || keywords.includes('depressed')) {
    strategies.push("Engage in one small pleasant activity daily");
    strategies.push("Maintain a regular sleep schedule");
    strategies.push("Practice gratitude by writing down 3 good things daily");
  }

  if (keywords.includes('angry') || keywords.includes('frustrated')) {
    strategies.push("Take a timeout before responding");
    strategies.push("Practice deep breathing or counting to 10");
    strategies.push("Engage in physical exercise to release tension");
  }

  if (keywords.includes('overwhelmed')) {
    strategies.push("Break large tasks into smaller, manageable steps");
    strategies.push("Practice time management and prioritization");
    strategies.push("Use relaxation techniques like meditation or yoga");
  }

  // Default strategies
  if (strategies.length === 0) {
    strategies.push("Practice self-compassion - treat yourself as you would a good friend");
    strategies.push("Maintain a regular sleep schedule");
    strategies.push("Stay hydrated and eat nutritious meals");
  }

  return strategies;
};