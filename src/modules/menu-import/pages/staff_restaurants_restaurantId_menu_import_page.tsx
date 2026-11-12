import { redirect } from 'next/navigation';
import { Alert } from '../../../components/ui/Alert';
import { usesMenuImport } from '../../../lib/auth/entitlements';
import { getAuthSessionState } from '../../../lib/auth/session';
import { getStaffI18n } from '../../../lib/i18n/server';
import {
  canManageMenu,
  canViewMenu,
} from '../../menu/capabilities';
import { MenuImportWorkspace } from '../components/menu/import/MenuImportWorkspace';

interface MenuImportPageProps {
  params: Promise<{ restaurantId: string }>;
}

/**
 * Menu Import (DEC-040): `/staff/restaurants/[restaurantId]/menu/import`.
 * Same session / Membership / operational checks as the Menu page; the import
 * needs `menu.manage` with Restaurant-wide scope. Capability gating here is UX
 * only -- every `/menu-imports` route re-checks authority on the Backend.
 */
export default async function MenuImportPage({ params }: MenuImportPageProps) {
  const { restaurantId } = await params;
  const { t } = await getStaffI18n();
  const sessionState = await getAuthSessionState();

  if (sessionState.status === 'unauthenticated') {
    redirect('/login');
  }
  if (sessionState.status === 'error') {
    return <Alert variant="error">{sessionState.message}</Alert>;
  }

  const membership = sessionState.context.memberships.find(
    (candidate) => candidate.restaurant.id === restaurantId,
  );
  if (!membership) {
    return <Alert variant="error">{t('guard.restaurantNotFound')}</Alert>;
  }
  if (membership.restaurant.status !== 'ACTIVE') {
    return (
      <Alert variant="error">
        {t('guard.notOperational', {
          state: t(
            membership.restaurant.status === 'SUSPENDED' ? 'guard.state.suspended' : 'guard.state.inactive',
          ),
        })}
      </Alert>
    );
  }
  // A platform feature (DEC-057): off unless the platform turned it on. UX only; the Backend refuses the upload too.
  if (!usesMenuImport(membership)) {
    return <Alert variant="info">{t('features.page.menuImport')}</Alert>;
  }
  if (!canViewMenu(membership) || !canManageMenu(membership)) {
    return <Alert variant="error">{t('guard.noPermission.menu')}</Alert>;
  }

  return (
    <MenuImportWorkspace
      restaurantId={restaurantId}
      currencyCode={membership.restaurant.currencyCode}
    />
  );
}
