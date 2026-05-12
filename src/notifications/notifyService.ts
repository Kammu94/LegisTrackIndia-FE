import type { ConfirmInput, NotifyInput, PromptInput } from './types';

export type NotifyFn = (input: NotifyInput) => string;
export type ConfirmFn = (input: ConfirmInput) => Promise<boolean>;
export type PromptFn = (input: PromptInput) => Promise<string | null>;

let notifyRef: NotifyFn | null = null;
let confirmRef: ConfirmFn | null = null;
let promptRef: PromptFn | null = null;

export const setNotifyRef = (fn: NotifyFn | null) => {
  notifyRef = fn;
};

export const setConfirmRef = (fn: ConfirmFn | null) => {
  confirmRef = fn;
};

export const setPromptRef = (fn: PromptFn | null) => {
  promptRef = fn;
};

export const notify = (input: NotifyInput) => {
  if (!notifyRef) return null;
  return notifyRef(input);
};

export const confirm = (input: ConfirmInput) => {
  if (!confirmRef) return Promise.resolve(false);
  return confirmRef(input);
};

export const prompt = (input: PromptInput) => {
  if (!promptRef) return Promise.resolve(null);
  return promptRef(input);
};
