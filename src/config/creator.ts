export interface CreatorConfig {
  name: string;
  role: string;
  bio: string;
  image: string; // User will supply real photo later; empty string renders graceful placeholder
  linkedin: string;
  github: string;
  email: string;
}

export const creator: CreatorConfig = {
  name: 'A.J. Pardhiv',
  role: 'Creator & Software Engineer',
  bio: 'Building intuitive, interactive platforms to make cryptography, computational thinking, and cyber concepts approachable, engaging, and enjoyable for every learner.',
  image: '',
  linkedin: '',
  github: '',
  email: '',
};
