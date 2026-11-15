'use client';
import type { Draft } from './offer-draft';
import { OfferItemRow } from './OfferItemRow';

import { useOffersEditor } from './use-offers-editor';
import { MenuItemPicker } from './MenuItemPicker';
import {
  MAX_SLOTS,
  MAX_OPTIONS,
  MAX_PICK,
  ALL_DAYS,
  typedItem,
  emptyGroup,
  addIncluded,
  addChoice,
  draftToPublicOffer,
  type DraftItem,
} from './offer-draft';
import { Alert } from '../../../../../components/ui/Alert';

import { Button } from '../../../../../components/ui/Button';

import { FormField } from '../../../../../components/ui/FormField';
import { Input } from '../../../../../components/ui/Input';

import { PageHeader } from '../../../../../components/ui/PageHeader';
import { SectionCard } from '../../../../../components/ui/SectionCard';
import { Select } from '../../../../../components/ui/Select';
import { Switch } from '../../../../../components/ui/Switch';
import {
  localeDirection,
  localeLabel,
} from '../../../../../lib/i18n/locale-labels';
import type { MessageKey } from '../../../../../lib/i18n/messages/index';
import { resolveAssetUrl } from '../../../../../lib/infrastructure/asset-url';

import { ImageField } from '../../../../menu/image-field';
import { validateImageFile } from '../../../../menu/image-validation';

import type { OfferBadge } from '../../../api/offers';
import { OfferPreview } from './OfferPreview';
export function OfferEditor({
  editor,
  draft,
  defaultLocale,
  currencyCode,
}: {
  editor: ReturnType<typeof useOffersEditor>;
  draft: Draft;
  defaultLocale: string;
  currencyCode: string;
}) {
  const {
    t,
    locale,
    locales,
    menuItems,
    setDraft,
    formError,
    saving,
    setPhotoFile,
    photoRemoved,
    setPhotoRemoved,
    photoError,
    setPhotoError,
    photoPreview,
    patchDraft,
    patchGroup,
    moveGroup,
    handleSave,
    dayName,
  } = editor;
  /** One row of an item (included or a choice): its name, a menu / typed tag, quantity or extra price, remove. */
  function renderItem(
    item: DraftItem,
    kind: 'included' | 'choice',
    onChange: (next: DraftItem) => void,
    onRemove: () => void,
    canRemove: boolean,
  ) {
    return (
      <OfferItemRow
        key={item.key}
        item={item}
        kind={kind}
        onChange={onChange}
        onRemove={onRemove}
        canRemove={canRemove}
        locale={locale}
        defaultLocale={defaultLocale}
        locales={locales}
        currencyCode={currencyCode}
      />
    );
  }

  const optionCount =
    draft.included.length +
    draft.groups.reduce((sum, group) => sum + group.options.length, 0);
  const dayOrder = locale === 'ar' ? [6, 0, 1, 2, 3, 4, 5] : ALL_DAYS;
  const imageUrl = photoRemoved
    ? null
    : (photoPreview ?? resolveAssetUrl(draft.imageAssetPath));
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
      <form
        className="flex min-w-0 flex-col gap-6"
        onSubmit={(event) => void handleSave(event)}
        noValidate
      >
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDraft(null)}
            disabled={saving}
          >
            {t('offers.back')}
          </Button>
        </div>
        <PageHeader
          title={draft.id ? t('offers.editor.edit') : t('offers.editor.create')}
          description={t('offers.limits', {
            slots: MAX_SLOTS,
            options: MAX_OPTIONS,
          })}
        />
        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <SectionCard title={t('offers.section.basics')}>
          <div className="flex flex-col gap-4">
            {locales.map((code) => (
              <FormField
                key={code}
                label={t(
                  code === defaultLocale
                    ? 'offers.field.nameDefault'
                    : 'offers.field.name',
                  {
                    language: localeLabel(code),
                  },
                )}
                htmlFor={`offer-name-${code}`}
              >
                <Input
                  id={`offer-name-${code}`}
                  dir={localeDirection(code)}
                  maxLength={120}
                  value={draft.names[code] ?? ''}
                  onChange={(event) =>
                    patchDraft((current) => ({
                      ...current,
                      names: { ...current.names, [code]: event.target.value },
                    }))
                  }
                />
              </FormField>
            ))}
            {locales.map((code) => (
              <FormField
                key={code}
                label={t('offers.field.description', {
                  language: localeLabel(code),
                })}
                htmlFor={`offer-description-${code}`}
              >
                <Input
                  id={`offer-description-${code}`}
                  dir={localeDirection(code)}
                  maxLength={300}
                  value={draft.descriptions[code] ?? ''}
                  onChange={(event) =>
                    patchDraft((current) => ({
                      ...current,
                      descriptions: {
                        ...current.descriptions,
                        [code]: event.target.value,
                      },
                    }))
                  }
                />
              </FormField>
            ))}
            <p className="-mt-2 text-xs text-muted-foreground">
              {t('offers.field.descriptionHint')}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label={`${t('offers.field.price')} (${currencyCode})`}
                htmlFor="offer-price"
              >
                <Input
                  id="offer-price"
                  dir="ltr"
                  inputMode="decimal"
                  autoComplete="off"
                  value={draft.price}
                  onChange={(event) =>
                    patchDraft((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t('offers.field.priceHint')}
                </p>
              </FormField>
              <FormField label={t('offers.field.badge')} htmlFor="offer-badge">
                <Select
                  id="offer-badge"
                  value={draft.badge}
                  onChange={(event) =>
                    patchDraft((current) => ({
                      ...current,
                      badge: event.target.value as OfferBadge,
                    }))
                  }
                >
                  {(['OFFER', 'GIFT', 'MOST_ORDERED'] as const).map((badge) => (
                    <option key={badge} value={badge}>
                      {t(`offers.badge.${badge}` as MessageKey)}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t('offers.section.photo')}>
          <ImageField
            idPrefix="offer"
            imageUrl={imageUrl}
            onSelectFile={(file) => {
              const problem = validateImageFile(file);
              if (problem) {
                setPhotoError(problem);
                return;
              }
              setPhotoError(null);
              setPhotoRemoved(false);
              setPhotoFile(file);
            }}
            onRemove={
              imageUrl
                ? () => {
                    setPhotoFile(null);
                    setPhotoRemoved(true);
                  }
                : undefined
            }
            isBusy={saving}
            error={photoError}
            selectLabel={
              imageUrl ? t('offers.photo.replace') : t('offers.photo.choose')
            }
            removeLabel={t('offers.photo.remove')}
            helperText={t('offers.photo.hint')}
          />
        </SectionCard>

        <SectionCard
          title={t('offers.section.included')}
          description={`${t('offers.included.hint')} (${optionCount}/${MAX_OPTIONS})`}
        >
          <div className="flex flex-col gap-4">
            {draft.included.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('offers.included.empty')}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {draft.included.map((item) =>
                  renderItem(
                    item,
                    'included',
                    (next) =>
                      patchDraft((current) => ({
                        ...current,
                        included: current.included.map((candidate) =>
                          candidate.key === item.key ? next : candidate,
                        ),
                      })),
                    () =>
                      patchDraft((current) => ({
                        ...current,
                        included: current.included.filter(
                          (candidate) => candidate.key !== item.key,
                        ),
                      })),
                    true,
                  ),
                )}
              </ul>
            )}
            <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <MenuItemPicker
                id="included-menu-picker"
                label={t('offers.item.fromMenu')}
                placeholder={t('offers.item.pickPlaceholder')}
                items={menuItems}
                locale={locale}
                defaultLocale={defaultLocale}
                onPick={(picked) =>
                  patchDraft((current) => ({
                    ...current,
                    included: addIncluded(current.included, picked),
                  }))
                }
              />
              <Button
                type="button"
                variant="secondary"
                disabled={optionCount >= MAX_OPTIONS}
                onClick={() =>
                  patchDraft((current) => ({
                    ...current,
                    included: [...current.included, typedItem()],
                  }))
                }
              >
                {t('offers.item.addCustom')}
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={t('offers.section.groups')}
          description={t('offers.groups.hint')}
        >
          <div className="flex flex-col gap-4">
            {draft.groups.map((group, groupIndex) => (
              <fieldset
                key={group.key}
                className="min-w-0 rounded-xl border border-border bg-card p-4"
              >
                <legend className="px-1 text-sm font-bold text-foreground">
                  {t('offers.group.title', { number: groupIndex + 1 })}
                </legend>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
                    <div className="flex flex-col gap-3">
                      {locales.map((code) => (
                        <FormField
                          key={code}
                          label={t(
                            code === defaultLocale
                              ? 'offers.group.titleDefault'
                              : 'offers.group.titleField',
                            {
                              language: localeLabel(code),
                            },
                          )}
                          htmlFor={`group-${group.key}-title-${code}`}
                        >
                          <Input
                            id={`group-${group.key}-title-${code}`}
                            dir={localeDirection(code)}
                            maxLength={80}
                            value={group.titles[code] ?? ''}
                            onChange={(event) =>
                              patchGroup(group.key, (current) => ({
                                ...current,
                                titles: {
                                  ...current.titles,
                                  [code]: event.target.value,
                                },
                              }))
                            }
                          />
                        </FormField>
                      ))}
                    </div>
                    <FormField
                      label={t('offers.group.count')}
                      htmlFor={`group-${group.key}-count`}
                    >
                      <Input
                        id={`group-${group.key}-count`}
                        type="number"
                        dir="ltr"
                        min={1}
                        max={MAX_PICK}
                        value={group.count}
                        onChange={(event) =>
                          patchGroup(group.key, (current) => ({
                            ...current,
                            count: Math.min(
                              MAX_PICK,
                              Math.max(
                                1,
                                Math.floor(Number(event.target.value)) || 1,
                              ),
                            ),
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('offers.group.countHint')}
                      </p>
                    </FormField>
                  </div>

                  <ul className="flex flex-col gap-3">
                    {group.options.map((option) =>
                      renderItem(
                        option,
                        'choice',
                        (next) =>
                          patchGroup(group.key, (current) => ({
                            ...current,
                            options: current.options.map((candidate) =>
                              candidate.key === option.key ? next : candidate,
                            ),
                          })),
                        () =>
                          patchGroup(group.key, (current) => ({
                            ...current,
                            options: current.options.filter(
                              (candidate) => candidate.key !== option.key,
                            ),
                          })),
                        group.options.length > 1,
                      ),
                    )}
                  </ul>
                  <p className="-mt-1 text-xs text-muted-foreground">
                    {t('offers.option.priceHint')}
                  </p>

                  <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <MenuItemPicker
                      id={`group-${group.key}-menu-picker`}
                      label={t('offers.group.addFromMenu')}
                      placeholder={t('offers.item.pickPlaceholder')}
                      items={menuItems}
                      locale={locale}
                      defaultLocale={defaultLocale}
                      onPick={(picked) =>
                        patchGroup(group.key, (current) => ({
                          ...current,
                          options: addChoice(current.options, picked),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={optionCount >= MAX_OPTIONS}
                      onClick={() =>
                        patchGroup(group.key, (current) => ({
                          ...current,
                          options: [...current.options, typedItem()],
                        }))
                      }
                    >
                      {t('offers.item.addCustom')}
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={groupIndex === 0}
                      onClick={() => moveGroup(group.key, -1)}
                    >
                      {t('offers.group.moveUp')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={groupIndex === draft.groups.length - 1}
                      onClick={() => moveGroup(group.key, 1)}
                    >
                      {t('offers.group.moveDown')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        patchDraft((current) => ({
                          ...current,
                          groups: current.groups.filter(
                            (candidate) => candidate.key !== group.key,
                          ),
                        }))
                      }
                    >
                      {t('offers.group.remove')}
                    </Button>
                  </div>
                </div>
              </fieldset>
            ))}
            <div>
              <Button
                type="button"
                variant="secondary"
                disabled={
                  draft.groups.length + (draft.included.length > 0 ? 1 : 0) >=
                  MAX_SLOTS
                }
                onClick={() =>
                  patchDraft((current) => ({
                    ...current,
                    groups: [...current.groups, emptyGroup()],
                  }))
                }
              >
                {t('offers.group.add')}
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t('offers.section.when')}>
          <div className="flex flex-col gap-4">
            <fieldset className="min-w-0">
              <legend className="mb-1.5 text-sm font-medium text-secondary-foreground">
                {t('offers.field.days')}
              </legend>
              <div className="flex flex-wrap gap-2">
                {dayOrder.map((day) => {
                  const on = draft.days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        patchDraft((current) => ({
                          ...current,
                          days: on
                            ? current.days.filter((d) => d !== day)
                            : [...current.days, day],
                        }))
                      }
                      className={`min-h-10 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                        on
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground hover:bg-muted'
                      }`}
                    >
                      {dayName(day)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t('offers.field.daysHint')}
              </p>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label={t('offers.field.startsOn')}
                htmlFor="offer-starts"
              >
                <Input
                  id="offer-starts"
                  type="date"
                  dir="ltr"
                  value={draft.startsOn}
                  onChange={(event) =>
                    patchDraft((current) => ({
                      ...current,
                      startsOn: event.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField label={t('offers.field.endsOn')} htmlFor="offer-ends">
                <Input
                  id="offer-ends"
                  type="date"
                  dir="ltr"
                  value={draft.endsOn}
                  min={draft.startsOn || undefined}
                  onChange={(event) =>
                    patchDraft((current) => ({
                      ...current,
                      endsOn: event.target.value,
                    }))
                  }
                />
              </FormField>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t('offers.field.active')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('offers.field.activeHint')}
                </p>
              </div>
              <Switch
                checked={draft.active}
                onCheckedChange={(next) =>
                  patchDraft((current) => ({ ...current, active: next }))
                }
                label={t('offers.field.active')}
              />
            </div>
          </div>
        </SectionCard>

        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-background/95 px-1 py-3 backdrop-blur">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDraft(null)}
            disabled={saving}
          >
            {t('offers.back')}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? t('offers.editor.saving') : t('offers.editor.save')}
          </Button>
        </div>
      </form>
      <div className="min-w-0 xl:sticky xl:top-4">
        <OfferPreview
          offer={(language) =>
            draftToPublicOffer(
              draft,
              language,
              defaultLocale,
              t('offers.preview.placeholderName'),
            )
          }
          currencyCode={currencyCode}
          imageUrl={imageUrl}
        />
      </div>
    </div>
  );
}
