'use client';

import { itemLabel, type DraftItem } from './offer-draft';

import { Badge } from '../../../../../components/ui/Badge';
import { Button } from '../../../../../components/ui/Button';

import { FormField } from '../../../../../components/ui/FormField';
import { Input } from '../../../../../components/ui/Input';

import {
  localeDirection,
  localeLabel,
} from '../../../../../lib/i18n/locale-labels';

import { useStaffI18n } from '../../../../../lib/i18n/client';
export function OfferItemRow({
  item,
  kind,
  onChange,
  onRemove,
  canRemove,
  locale,
  defaultLocale,
  locales,
  currencyCode,
}: {
  item: DraftItem;
  kind: 'included' | 'choice';
  onChange: (item: DraftItem) => void;
  onRemove: () => void;
  canRemove: boolean;
  locale: string;
  defaultLocale: string;
  locales: string[];
  currencyCode: string;
}) {
  const { t } = useStaffI18n();
  const linked = item.productId !== null;
  const missing = linked && itemLabel(item, locale, defaultLocale) === '';
  return (
    <li
      key={item.key}
      className="grid items-end gap-3 rounded-lg bg-muted/40 p-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto]"
    >
      <div className="flex flex-col gap-2">
        {linked ? (
          <div>
            <p dir="auto" className="text-sm font-semibold text-foreground">
              {missing
                ? t('offers.item.missing')
                : itemLabel(item, locale, defaultLocale)}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="info">{t('offers.item.menuTag')}</Badge>
              {!item.orderable ? (
                <Badge variant="warning">{t('offers.item.soldOut')}</Badge>
              ) : null}
            </p>
          </div>
        ) : (
          locales.map((code) => (
            <FormField
              key={code}
              label={t(
                code === defaultLocale
                  ? 'offers.option.nameDefault'
                  : 'offers.option.name',
                {
                  language: localeLabel(code),
                },
              )}
              htmlFor={`item-${item.key}-name-${code}`}
            >
              <Input
                id={`item-${item.key}-name-${code}`}
                dir={localeDirection(code)}
                maxLength={80}
                value={item.names[code] ?? ''}
                onChange={(event) =>
                  onChange({
                    ...item,
                    names: { ...item.names, [code]: event.target.value },
                  })
                }
              />
            </FormField>
          ))
        )}
      </div>
      {kind === 'included' ? (
        <FormField
          label={t('offers.item.quantity')}
          htmlFor={`item-${item.key}-qty`}
        >
          <Input
            id={`item-${item.key}-qty`}
            type="number"
            dir="ltr"
            min={1}
            max={99}
            value={item.quantity}
            onChange={(event) =>
              onChange({
                ...item,
                quantity: Math.min(
                  99,
                  Math.max(1, Math.floor(Number(event.target.value)) || 1),
                ),
              })
            }
          />
        </FormField>
      ) : (
        <FormField
          label={`${t('offers.option.price')} (${currencyCode})`}
          htmlFor={`item-${item.key}-price`}
        >
          <Input
            id={`item-${item.key}-price`}
            dir="ltr"
            inputMode="decimal"
            autoComplete="off"
            aria-describedby={`item-${item.key}-price-hint`}
            value={item.adjustment}
            onChange={(event) =>
              onChange({ ...item, adjustment: event.target.value })
            }
          />
          <span id={`item-${item.key}-price-hint`} className="sr-only">
            {t('offers.option.priceHint')}
          </span>
        </FormField>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!canRemove}
        onClick={onRemove}
      >
        {t('offers.option.remove')}
      </Button>
    </li>
  );
}
