'use client';

import { useState } from 'react';
import { Alert } from '../../../../../components/ui/Alert';
import { Button } from '../../../../../components/ui/Button';
import { FormField } from '../../../../../components/ui/FormField';
import { Input } from '../../../../../components/ui/Input';
import { useStaffI18n } from '../../../../../lib/i18n/client';
import * as menuApi from '../../../api';
import type {
  ModifierOption
} from '../../../types/index';
import {
  describeError,
  isUnauthenticatedError,
  redirectToLogin,
} from '../../../../../lib/api/user-errors';
import { MONEY_DECIMAL_PATTERN } from './model';

export function NewModifierOptionForm({
  restaurantId,
  productId,
  groupId,
  nextDisplayOrder,
  onCancel,
  onCreated,
}: {
  restaurantId: string;
  productId: string;
  groupId: string;
  nextDisplayOrder: number;
  onCancel: () => void;
  onCreated: (option: ModifierOption) => void;
}) {
  const { t } = useStaffI18n();
  const [name, setName] = useState('');
  const [priceAdjustment, setPriceAdjustment] = useState('0.00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (name.trim() === '') {
      setError(t('menu.tr.nameRequired'));
      return;
    }
    if (!MONEY_DECIMAL_PATTERN.test(priceAdjustment)) {
      setError(t('mod.err.priceInvalid'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await menuApi.createModifierOption(restaurantId, productId, groupId, {
        name: name.trim(),
        status: 'ACTIVE',
        priceAdjustment,
        displayOrder: nextDisplayOrder,
      });
      onCreated(created);
    } catch (err) {
      if (isUnauthenticatedError(err)) {
        redirectToLogin();
        return;
      }
      setError(describeError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md bg-muted p-3">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('menu.tr.name')} htmlFor="new-option-name">
          <Input
            id="new-option-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label={t('mod.priceAdjustment')} htmlFor="new-option-price">
          <Input
            id="new-option-price"
            inputMode="decimal"
            dir="ltr"
            value={priceAdjustment}
            onChange={(e) => setPriceAdjustment(e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
      </div>
      <div className="flex gap-2">
        <Button type="button" disabled={isSubmitting} onClick={() => void handleSave()}>
          {isSubmitting ? t('common.saving') : t('mod.addOption')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
