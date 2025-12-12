export interface PromptMetadata {
  score?: number;
  tokens?: number;
  estimatedCost?: number; // In USD
  runtimeMs?: number;
  modelUsed?: string;
  feedback?: string; // AI feedback on the prompt
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  metadata: PromptMetadata;
  versions?: { content: string; createdAt: number }[]; // Simple version history
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children?: Category[]; // For recursive rendering
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export enum AIActionType {
  EVALUATE = 'EVALUATE',
  ENHANCE = 'ENHANCE',
  CODE_PLAN = 'CODE_PLAN',
  FUN_PROMPT = 'FUN_PROMPT'
}

export interface ChartDataPoint {
  name: string;
  value: number;
  cost?: number;
}