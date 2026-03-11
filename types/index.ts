export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  classId?: string;
  points: number;
  streak: number;
  rank: number;
  createdAt: string;
}

export interface ReadingMaterial {
  _id: string;
  title: string;
  professorName: string;
  subject: string;
  weekNumber: number;
  readingTimeMinutes: number;
  keyTermsCount: number;
  summaryContent: string;
  coreConcepts: { title: string; description: string; citation?: string }[];
  keyTheorists: { name: string; contribution: string }[];
  fullContent?: { heading: string; body: string }[];
  pdfUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface Puzzle {
  _id: string;
  title: string;
  readingMaterialId: string;
  createdBy: string | User;
  assignedTo: string;
  puzzleType: 'wordle' | 'quiz';
  solutionWord: string;
  clue: string;
  maxAttempts: number;
  dateActive: string;
  createdAt: string;
}

export interface PuzzleAttempt {
  _id: string;
  puzzleId: string;
  userId: string;
  guesses: string[];
  attemptsUsed: number;
  solved: boolean;
  completedAt?: string;
}

export interface LeaderboardEntry {
  _id: string;
  name: string;
  points: number;
  streak: number;
  rank: number;
}
