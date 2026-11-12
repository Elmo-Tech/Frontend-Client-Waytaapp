import type { RestaurantLocalesResponse } from '../../../../settings/types';
import type {
  ModifierGroup
} from '../../../types/index';

/** Mirrors the Backend's accepted decimal-string shape (money-decimal.ts) -- helpful client validation only, never authoritative (CLAUDE.md #27). */
export const MONEY_DECIMAL_PATTERN = /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/;

export interface ModifiersSectionProps {
  restaurantId: string;
  productId: string;
  currencyCode: string;
  canManage: boolean;
  /** Same Restaurant Languages response `ProductEditor` already fetches for its own `ProductTranslationSection` -- reused here rather than a second fetch. */
  locales: RestaurantLocalesResponse | null;
  /** Called with the current Groups whenever they load or change, so the Product Editor's guest preview can show them. */
  onGroupsChange?: (groups: ModifierGroup[]) => void;
}
