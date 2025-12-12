import { User } from "../types";

const USERS_KEY = 'ai_lab_users';
const SESSION_KEY = 'ai_lab_session';

// Helper to get users from storage
const getUsers = (): any[] => {
  const usersStr = localStorage.getItem(USERS_KEY);
  return usersStr ? JSON.parse(usersStr) : [];
};

export const register = (name: string, email: string, password: string): User => {
  const users = getUsers();
  
  if (users.find((u: any) => u.email === email)) {
    throw new Error("User already exists");
  }

  const newUser = {
    id: crypto.randomUUID(),
    name,
    email,
    password // NOTE: In a real app, never store plain text passwords!
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  // Auto login after register
  const userSession: User = { id: newUser.id, name: newUser.name, email: newUser.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
  
  return userSession;
};

export const login = (email: string, password: string): User => {
  const users = getUsers();
  const user = users.find((u: any) => u.email === email && u.password === password);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const userSession: User = { id: user.id, name: user.name, email: user.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
  
  return userSession;
};

export const logout = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): User | null => {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  return sessionStr ? JSON.parse(sessionStr) : null;
};
