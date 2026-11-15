import type { CategoryStatus } from '../types/index';
export interface CategoryFormState {
  name: string;
  description: string;
  status: CategoryStatus;
  displayOrder: string;
  targetMenuId: string;
}

export interface SecondaryDraft {
  name: string;
  description: string;
}
export type SecondaryDrafts = Record<string, SecondaryDraft>;

export const KEEP_CURRENT_MENU = '__keep_current_menu__';
