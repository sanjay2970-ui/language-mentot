
export interface Persona {
  id: string;
  name: string;
  tagline: string;
  description: string;
  dialect: string;
  analogies: string[];
  colloquialisms: string[];
  icon: string;
  color: string;
  gradient: string;
  accentColor: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Explanation {
  id: string;
  term: string;
  tamilExplanation: string;
  imageUrl?: string;
  timestamp: number;
  personaId: string;
  chatHistory: ChatMessage[];
}
