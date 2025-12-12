import { Category, Prompt } from "../types";
import { INITIAL_CATEGORIES, INITIAL_PROMPTS } from "../constants";

const PROMPTS_KEY = 'ai_lab_prompts';
const CATEGORIES_KEY = 'ai_lab_categories';

export const getPrompts = (): Prompt[] => {
  const stored = localStorage.getItem(PROMPTS_KEY);
  if (!stored) {
    localStorage.setItem(PROMPTS_KEY, JSON.stringify(INITIAL_PROMPTS));
    return INITIAL_PROMPTS;
  }
  return JSON.parse(stored);
};

export const savePrompts = (prompts: Prompt[]): void => {
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
};

export const getCategories = (): Category[] => {
  const stored = localStorage.getItem(CATEGORIES_KEY);
  if (!stored) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  }
  return JSON.parse(stored);
};

export const saveCategories = (categories: Category[]): void => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};
