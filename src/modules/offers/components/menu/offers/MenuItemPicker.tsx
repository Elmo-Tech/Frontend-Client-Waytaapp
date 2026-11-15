'use client';

import { menuItem, type DraftItem } from './offer-draft';

import { FormField } from '../../../../../components/ui/FormField';

import { Select } from '../../../../../components/ui/Select';

import type { MenuItemChoice } from '../../../api/offers';

export function MenuItemPicker({
  id,
  label,
  placeholder,
  items,
  locale,
  defaultLocale,
  onPick,
}: {
  id: string;
  label: string;
  placeholder: string;
  items: MenuItemChoice[] | null;
  locale: string;
  defaultLocale: string;
  onPick: (item: DraftItem) => void;
}) {
  const name = (names: Record<string, string>): string =>
    names[locale] ?? names[defaultLocale] ?? Object.values(names)[0] ?? '';
  const byCategory = new Map<string, MenuItemChoice[]>();
  for (const choice of items ?? []) {
    const category = name(choice.categoryNames);
    byCategory.set(category, [...(byCategory.get(category) ?? []), choice]);
  }
  return (
    <FormField label={label} htmlFor={id}>
      <Select
        id={id}
        value=""
        disabled={items === null}
        onChange={(event) => {
          const [productId, variantId] = event.target.value.split('|');
          const choice = (items ?? []).find(
            (candidate) => candidate.id === productId,
          );
          if (choice) onPick(menuItem(choice, variantId || null));
        }}
      >
        <option value="">{placeholder}</option>
        {[...byCategory.entries()].map(([category, choices]) => (
          <optgroup key={category} label={category}>
            {choices.flatMap((choice) =>
              choice.variants.length === 0
                ? [
                    <option key={choice.id} value={choice.id}>
                      {name(choice.names)}
                    </option>,
                  ]
                : choice.variants.map((variant) => (
                    <option
                      key={`${choice.id}|${variant.id}`}
                      value={`${choice.id}|${variant.id}`}
                    >
                      {name(choice.names)} ({name(variant.names)})
                    </option>
                  )),
            )}
          </optgroup>
        ))}
      </Select>
    </FormField>
  );
}
