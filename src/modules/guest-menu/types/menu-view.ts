import { type MenuTemplate } from '../../../config/menu-templates';
import type {
  PublicMenuData
} from './index';
export type PublicMenuViewProps = {
  data: PublicMenuData;
  publicCode: string;
  /** How the menu is laid out (DEC-044); presentation only. */
  template?: MenuTemplate;
  /** Explicit staff-frame preview flag; the server never returns draft settings. */
  designPreview?: boolean;
  /** Backend-resolved private renderer; must never be selected by public URL. */
  exclusiveRendererKey?: 'VERDE_NAPOLI_V1' | 'SHERBINY_FIRE_DOUGH_V1' | 'MAKKBOZ_HERITAGE_V1' | 'MEAT_LOVERS_BUTCHER_V1';
  /** The guest's saved light / dark pick (cookie), read on the server; null = never chose. */
  guestTheme?: 'light' | 'dark' | null;
};
