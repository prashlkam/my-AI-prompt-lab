import { Category, Prompt } from "./types";

// Using Gemini models as per instructions
export const DEFAULT_MODEL = 'gemini-2.5-flash';
export const ADVANCED_MODEL = 'gemini-3-pro-preview';

// Rough cost estimation per 1k tokens (Hypothetical for demo purposes)
export const COST_PER_1K_INPUT = 0.0001; 
export const COST_PER_1K_OUTPUT = 0.0004;

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Creative Writing', parentId: null },
  { id: 'cat_2', name: 'Coding', parentId: null },
  { id: 'cat_3', name: 'Research', parentId: null },
  { id: 'cat_4', name: 'Business', parentId: null },
  { id: 'cat_1_1', name: 'Fiction', parentId: 'cat_1' },
  { id: 'cat_1_2', name: 'Poetry', parentId: 'cat_1' },
  { id: 'cat_2_1', name: 'React', parentId: 'cat_2' },
  { id: 'cat_2_2', name: 'Python', parentId: 'cat_2' },
];

export const INITIAL_PROMPTS: Prompt[] = [
  {
    id: 'p_1',
    title: 'Story Outline for Sci-Fi Novel',
    content: 'Write a chapter outline for a science fiction novel set on a water planet where humanity lives on giant floating cities. The protagonist is a diver who finds an ancient artifact.',
    categoryId: 'cat_1_1',
    tags: ['sci-fi', 'outline', 'creative'],
    isFavorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {
      score: 8,
      tokens: 45,
      estimatedCost: 0.000045,
    }
  },
  {
    id: 'p_2',
    title: 'Python Data Processing Function',
    content: 'Create a Python function using Pandas to clean a CSV dataset. It should remove null rows, normalize column names to snake_case, and fill missing integer values with the median.',
    categoryId: 'cat_2_2',
    tags: ['python', 'pandas', 'coding'],
    isFavorite: true,
    createdAt: Date.now() - 100000,
    updatedAt: Date.now(),
    metadata: {
      score: 9,
      tokens: 38,
      estimatedCost: 0.000038,
    }
  }
];

export const FUN_PROMPTS_LIST = [
  "Explain quantum physics to a 5-year-old using only emojis.",
  "Write a polite resignation letter from a cat to its owner.",
  "Describe the color blue to someone who has been blind their whole life.",
  "You are a medieval knight who has time-traveled to a modern Apple Store. Describe your experience."
];
