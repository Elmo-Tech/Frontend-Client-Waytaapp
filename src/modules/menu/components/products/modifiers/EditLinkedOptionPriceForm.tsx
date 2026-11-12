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
/**
 * FT-6B semantics cleanup: the ONLY Product-local action offered for a
 * preset-linked Option -- overriding its price for this Product. Name and
 * translations are owned by the Modifier Library and are deliberately not
 * editable here (`EditModifierOptionForm` remains for Custom Options only).
 */
export function EditLinkedOptionPriceForm({
  restaurantId,
  productId,
  groupId,
  option,
  onSaved,
  onCancel,
}: {
  restaurantId: string;
  productId: string;
  groupId: string;
  option: ModifierOption;
  onSaved: (option: ModifierOption) => void;
  onCancel: () => void;
}) {
  const { t } = useStaffI18n();
  const [priceAdjustment, setPriceAdjustment] = useState(option.priceAdjustment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!MONEY_DECIMAL_PATTERN.test(priceAdjustment)) {
      setError(t('mod.err.priceInvalid'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await menuApi.updateModifierOption(restaurantId, productId, groupId, option.id, {
        priceAdjustment,
      });
      onSaved(updated);
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
    <div className="flex flex-col gap-3 rounded-md bg-card p-3">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <p className="text-xs text-muted-foreground">{t('mod.linkedPriceNote')}</p>
      <FormField label={t('mod.priceAdjustment')} htmlFor={`edit-linked-option-price-${option.id}`}>
        <Input
          id={`edit-linked-option-price-${option.id}`}
          inputMode="decimal"
            dir="ltr"
          value={priceAdjustment}
          onChange={(e) => setPriceAdjustment(e.target.value)}
          disabled={isSubmitting}
        />
      </FormField>
      <div className="flex gap-2">
        <Button type="button" disabled={isSubmitting} onClick={() => void handleSave()}>
          {isSubmitting ? t('common.saving') : t('common.save')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
