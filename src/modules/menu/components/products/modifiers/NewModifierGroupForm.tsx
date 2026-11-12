'use client';

import { useState } from 'react';
import { Alert } from '../../../../../components/ui/Alert';
import { Button } from '../../../../../components/ui/Button';
import { FormField } from '../../../../../components/ui/FormField';
import { Input } from '../../../../../components/ui/Input';
import { useStaffI18n } from '../../../../../lib/i18n/client';
import * as menuApi from '../../../api';
import type {
  ModifierGroup
} from '../../../types/index';
import {
  describeError,
  isUnauthenticatedError,
  redirectToLogin,
} from '../../../../../lib/api/user-errors';

export function NewModifierGroupForm({
  restaurantId,
  productId,
  nextDisplayOrder,
  onCancel,
  onCreated,
}: {
  restaurantId: string;
  productId: string;
  nextDisplayOrder: number;
  onCancel: () => void;
  onCreated: (group: ModifierGroup) => void;
}) {
  const { t } = useStaffI18n();
  const [name, setName] = useState('');
  const [helperText, setHelperText] = useState('');
  const [minimumSelections, setMinimumSelections] = useState('0');
  const [maximumSelections, setMaximumSelections] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (name.trim() === '') {
      setError(t('menu.tr.nameRequired'));
      return;
    }
    const minimum = Number(minimumSelections);
    const maximum = Number(maximumSelections);
    if (!Number.isInteger(minimum) || minimum < 0) {
      setError(t('mod.err.minInvalid'));
      return;
    }
    if (!Number.isInteger(maximum) || maximum < 1) {
      setError(t('mod.err.maxInvalid'));
      return;
    }
    if (maximum < minimum) {
      setError(t('mod.err.maxLessThanMin'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await menuApi.createModifierGroup(restaurantId, productId, {
        name: name.trim(),
        helperText: helperText.trim() === '' ? null : helperText.trim(),
        status: 'ACTIVE',
        minimumSelections: minimum,
        maximumSelections: maximum,
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
    <div className="rounded-md border border-border p-4 flex flex-col gap-3">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <FormField label={t('menu.tr.name')} htmlFor="new-group-name">
        <Input id="new-group-name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} />
      </FormField>
      <FormField label={t('mod.helperOptional')} htmlFor="new-group-helper">
        <Input
          id="new-group-helper"
          value={helperText}
          onChange={(e) => setHelperText(e.target.value)}
          disabled={isSubmitting}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('mod.minSelections')} htmlFor="new-group-min">
          <Input
            id="new-group-min"
            type="number"
            min={0}
            step={1}
            value={minimumSelections}
            onChange={(e) => setMinimumSelections(e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label={t('mod.maxSelections')} htmlFor="new-group-max">
          <Input
            id="new-group-max"
            type="number"
            min={1}
            step={1}
            value={maximumSelections}
            onChange={(e) => setMaximumSelections(e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
      </div>
      <div className="flex gap-2">
        <Button type="button" disabled={isSubmitting} onClick={() => void handleSave()}>
          {isSubmitting ? t('common.saving') : t('mod.addGroup')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
