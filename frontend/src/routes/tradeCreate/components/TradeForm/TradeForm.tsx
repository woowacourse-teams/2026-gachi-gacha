import { type FormEvent, type KeyboardEvent, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router';

import { createTrade } from '@/domains/trade/api/createTrade';
import { updateTrade } from '@/domains/trade/api/updateTrade';
import {
  compressTradeImages,
  type TradeImageCompressionProgress,
} from '@/domains/trade/compressTradeImages';
import type { TradeCategory } from '@/domains/trade/tradeCategoryType';
import type {
  CreateTradeRequest,
  TradePlaceInput,
} from '@/domains/trade/tradeCreateType';
import { KakaoPlaceSearchDialog } from '@/features/placeSearch/KakaoPlaceSearchDialog';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { preventIosInputZoom } from '@/shared/styles/preventIosInputZoom';
import { useToast } from '@/shared/ui/toast';

import PhotoUploader from '../PhotoUploader';
import StickyActionBar from '../StickyActionBar';
import TradeSubmissionOverlay from '../TradeSubmissionOverlay';
import TradeCategoryField from './TradeCategoryField';

const MAX_SHORT_TEXT_LENGTH = 255;

type SubmissionState =
  | { stage: 'idle' }
  | ({ stage: 'compressing' } & TradeImageCompressionProgress)
  | { stage: 'uploading' };

export interface TradeFormInitialValues {
  title: string;
  description: string;
  desiredProduction: string;
  categories: TradeCategory[];
  purchaseStore: TradePlaceInput | null;
  tradePlace: TradePlaceInput | null;
  imageUrls: string[];
  // 폼에서 편집하지 않지만, PUT은 전체 교체라 기존 값을 그대로 보내야 지워지지 않는다.
  availableTime?: string | null;
}

type TradeFormProps =
  | { mode?: 'create'; initialValues?: TradeFormInitialValues }
  | { mode: 'edit'; tradeId: number; initialValues: TradeFormInitialValues };

type RequiredField = 'photo' | 'title' | 'description' | 'category';

/** 폼에 보이는 순서대로 검사해 첫 번째로 빠진 필수 항목 하나만 알린다. */
const REQUIRED_FIELD_MESSAGES: Record<RequiredField, string> = {
  photo: '사진을 1장 이상 등록해주세요.',
  title: '제목을 입력해주세요.',
  description: '설명을 입력해주세요.',
  category: '카테고리를 1개 이상 선택해주세요.',
};

const REQUIRED_FIELD_FOCUS_TARGETS: Record<RequiredField, string> = {
  photo: '[role="group"][aria-labelledby="trade-photo-label"] button',
  title: '#trade-title',
  description: '#trade-description',
  category: '#trade-category-search',
};

function findMissingRequiredField({
  hasPhoto,
  title,
  description,
  categoryCount,
}: {
  hasPhoto: boolean;
  title: string;
  description: string;
  categoryCount: number;
}): RequiredField | null {
  if (!hasPhoto) return 'photo';
  if (!title) return 'title';
  if (!description) return 'description';
  if (categoryCount === 0) return 'category';
  return null;
}

function focusRequiredField(form: HTMLFormElement, field: RequiredField) {
  const target = form.querySelector<HTMLElement>(
    REQUIRED_FIELD_FOCUS_TARGETS[field],
  );

  target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  target?.focus({ preventScroll: true });
}

function createSubmissionFailureMessage(
  isEditMode: boolean,
  error: unknown,
): string {
  const summary = `${isEditMode ? '수정' : '등록'}하지 못했어요. 내용은 그대로예요.`;
  const reason = error instanceof Error ? error.message.trim() : '';

  return reason ? `${summary}\n${reason}` : summary;
}

export default function TradeForm(props: TradeFormProps) {
  const { mode = 'create', initialValues } = props;
  const navigate = useNavigate();
  const isEditMode = mode === 'edit';
  const formId = isEditMode ? 'trade-edit-form' : 'trade-create-form';
  const submittingRef = useRef(false);
  const [images, setImages] = useState<File[]>([]);
  const { showToast, hideToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [invalidField, setInvalidField] = useState<RequiredField | null>(null);
  const [purchaseStore, setPurchaseStore] = useState<TradePlaceInput | null>(
    initialValues?.purchaseStore ?? null,
  );
  const [tradePlace, setTradePlace] = useState<TradePlaceInput | null>(
    initialValues?.tradePlace ?? null,
  );
  const [isPurchaseStoreDialogOpen, setIsPurchaseStoreDialogOpen] =
    useState(false);
  const [isPlaceDialogOpen, setIsPlaceDialogOpen] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    stage: 'idle',
  });
  const isSubmitting = submissionState.stage !== 'idle';
  const [selectedCategories, setSelectedCategories] = useState<TradeCategory[]>(
    initialValues?.categories ?? [],
  );

  function selectCategory(category: TradeCategory) {
    if (invalidField === 'category') {
      setInvalidField(null);
    }

    captureAnalyticsEvent('trade_category_toggled', {
      mode: isEditMode ? 'edit' : 'create',
      category_id: category.categoryId,
      action: 'selected',
    });
    setSelectedCategories((currentCategories) =>
      currentCategories.some(
        ({ categoryId }) => categoryId === category.categoryId,
      )
        ? currentCategories
        : [...currentCategories, category],
    );
  }

  function removeCategory(categoryId: number) {
    captureAnalyticsEvent('trade_category_toggled', {
      mode: isEditMode ? 'edit' : 'create',
      category_id: categoryId,
      action: 'removed',
    });
    setSelectedCategories((currentCategories) =>
      currentCategories.filter(
        (category) => category.categoryId !== categoryId,
      ),
    );
  }

  // 단일 행 input에서 Enter를 누르면 브라우저가 폼을 암묵적으로 제출하므로 막는다.
  // textarea의 줄바꿈과 버튼의 Enter 동작은 그대로 둔다.
  function preventImplicitSubmit(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault();
    }
  }

  function changeImages(nextImages: File[]) {
    setImages(nextImages);

    if (nextImages.length > 0 && invalidField === 'photo') {
      setInvalidField(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const form = event.currentTarget;
    const title = readFormControlText(form, 'title');
    const description = readFormControlText(form, 'description');
    const desiredProduction = readFormControlText(form, 'desiredProduction');
    const missingField = findMissingRequiredField({
      hasPhoto: images.length > 0 || Boolean(initialValues?.imageUrls.length),
      title,
      description,
      categoryCount: selectedCategories.length,
    });

    if (missingField) {
      setInvalidField(missingField);
      showToast({
        tone: 'error',
        message: REQUIRED_FIELD_MESSAGES[missingField],
      });
      focusRequiredField(form, missingField);
      return;
    }

    const request: CreateTradeRequest = {
      title,
      description,
      categoryIds: selectedCategories.map((category) => category.categoryId),
      ...(desiredProduction ? { desiredProduction } : {}),
      ...(purchaseStore ? { purchaseStore } : {}),
      ...(tradePlace ? { tradePlace } : {}),
      ...(initialValues?.availableTime
        ? { availableTime: initialValues.availableTime }
        : {}),
    };

    setInvalidField(null);
    hideToast();
    submittingRef.current = true;
    setSubmissionState(
      images.length > 0
        ? {
            stage: 'compressing',
            percentage: 0,
            completedCount: 0,
            totalCount: images.length,
          }
        : { stage: 'uploading' },
    );

    const analyticsMode = isEditMode ? 'edit' : 'create';
    const editingTradeId = props.mode === 'edit' ? props.tradeId : null;

    captureAnalyticsEvent('trade_form_submitted', {
      mode: analyticsMode,
      trade_id: editingTradeId,
      image_count: images.length || initialValues?.imageUrls.length || 0,
      category_count: selectedCategories.length,
      has_purchase_store: purchaseStore !== null,
      has_trade_place: tradePlace !== null,
      has_desired_product: Boolean(desiredProduction),
    });

    try {
      const compressedImages = await compressTradeImages(images, (progress) => {
        setSubmissionState({ stage: 'compressing', ...progress });
      });

      setSubmissionState({ stage: 'uploading' });

      const savedTrade =
        props.mode === 'edit'
          ? await updateTrade({
              tradeId: props.tradeId,
              request,
              images: compressedImages,
            })
          : await createTrade({ request, images: compressedImages });

      captureAnalyticsEvent('trade_form_completed', {
        mode: analyticsMode,
        trade_id: savedTrade.tradeId,
        outcome: 'success',
      });

      navigate(`/trade/${savedTrade.tradeId}`);
    } catch (error: unknown) {
      captureAnalyticsEvent('trade_form_completed', {
        mode: analyticsMode,
        trade_id: editingTradeId,
        outcome: 'failure',
      });
      showToast({
        tone: 'error',
        message: createSubmissionFailureMessage(isEditMode, error),
        action: {
          label: '다시 시도',
          onClick: () => formRef.current?.requestSubmit(),
        },
      });
      setSubmissionState({ stage: 'idle' });
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <>
      <Form
        ref={formRef}
        id={formId}
        aria-busy={isSubmitting}
        onKeyDown={preventImplicitSubmit}
        onSubmit={(event) => void handleSubmit(event)}
      >
        <ItemSection aria-labelledby="offered-item-heading">
          <ItemSectionHeader>
            <ItemSectionTitle id="offered-item-heading">
              가지고 있는 것
            </ItemSectionTitle>
            <ItemSectionDescription>
              교환에 내놓을 상품의 사진과 상태를 알려주세요.
            </ItemSectionDescription>
          </ItemSectionHeader>

          <PhotoUploader
            files={images}
            {...(initialValues
              ? { initialImageUrls: initialValues.imageUrls }
              : {})}
            onFilesChange={changeImages}
          />

          <Field>
            <Label htmlFor="trade-title">
              제목 <RequiredMark aria-hidden="true">*</RequiredMark>
            </Label>
            <Input
              id="trade-title"
              name="title"
              enterKeyHint="next"
              defaultValue={initialValues?.title}
              required
              maxLength={MAX_SHORT_TEXT_LENGTH}
              aria-invalid={invalidField === 'title' || undefined}
              placeholder="가지고 있는 가챠를 알아보기 쉽게 적어주세요"
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.nativeEvent.isComposing &&
                  event.nativeEvent.keyCode !== 229
                ) {
                  event.preventDefault();
                  formRef.current
                    ?.querySelector<HTMLTextAreaElement>('#trade-description')
                    ?.focus();
                }
              }}
              onChange={() => {
                if (invalidField === 'title') {
                  setInvalidField(null);
                }
              }}
            />
          </Field>

          <Field>
            <Label htmlFor="trade-description">
              설명 <RequiredMark aria-hidden="true">*</RequiredMark>
            </Label>
            <Textarea
              id="trade-description"
              name="description"
              defaultValue={initialValues?.description}
              required
              aria-invalid={invalidField === 'description' || undefined}
              placeholder="상품의 상태와 거래 방법을 자세히 적어주세요"
              onChange={() => {
                if (invalidField === 'description') {
                  setInvalidField(null);
                }
              }}
            />
            <InputContinuationButton
              type="button"
              onClick={() => {
                formRef.current
                  ?.querySelector<HTMLInputElement>('#trade-category-search')
                  ?.focus();
              }}
            >
              설명 입력을 마치고 카테고리로 이동
            </InputContinuationButton>
          </Field>

          <OfferedFields>
            <TradeCategoryField
              selectedCategories={selectedCategories}
              onSelect={selectCategory}
              onRemove={removeCategory}
              invalid={invalidField === 'category'}
            />
            <Field>
              <Label
                id="purchase-store-label"
                htmlFor="purchase-store"
                aria-hidden="true"
              >
                구매 매장 <OptionalMark>(선택)</OptionalMark>
              </Label>
              <PlaceSelectButton
                id="purchase-store"
                type="button"
                aria-labelledby="purchase-store-label purchase-store-value"
                aria-haspopup="dialog"
                onClick={() => setIsPurchaseStoreDialogOpen(true)}
              >
                <LocationIcon aria-hidden="true" />
                <PlaceText id="purchase-store-value">
                  <PlacePrimary data-placeholder={!purchaseStore}>
                    {purchaseStore?.name ||
                      purchaseStore?.address ||
                      '가챠를 구매한 매장을 선택해주세요'}
                  </PlacePrimary>
                  {purchaseStore?.name && (
                    <PlaceSecondary>{purchaseStore.address}</PlaceSecondary>
                  )}
                </PlaceText>
              </PlaceSelectButton>
              {purchaseStore && (
                <>
                  <ClearPlaceButton
                    type="button"
                    aria-label="구매 매장 선택 해제"
                    onClick={() => {
                      captureAnalyticsEvent('place_selection_cleared', {
                        place_context: 'trade_purchase_store',
                        trade_form_mode: isEditMode ? 'edit' : 'create',
                      });
                      setPurchaseStore(null);
                    }}
                  >
                    선택 해제
                  </ClearPlaceButton>
                  {purchaseStore.name && (
                    <input
                      type="hidden"
                      name="purchaseStore.name"
                      value={purchaseStore.name}
                    />
                  )}
                  <input
                    type="hidden"
                    name="purchaseStore.address"
                    value={purchaseStore.address}
                  />
                  <input
                    type="hidden"
                    name="purchaseStore.latitude"
                    value={purchaseStore.latitude}
                  />
                  <input
                    type="hidden"
                    name="purchaseStore.longitude"
                    value={purchaseStore.longitude}
                  />
                </>
              )}
            </Field>
          </OfferedFields>
        </ItemSection>

        <ItemSection aria-labelledby="desired-item-heading">
          <ItemSectionHeader>
            <ItemSectionTitle id="desired-item-heading">
              얻고 싶은 것
            </ItemSectionTitle>
            <ItemSectionDescription>
              원하는 상품이 없다면 비워두고 제안을 받을 수 있어요.
            </ItemSectionDescription>
          </ItemSectionHeader>

          <Field>
            <Label htmlFor="trade-desired-production">
              얻고 싶은 상품 <OptionalMark>(선택)</OptionalMark>
            </Label>
            <Input
              id="trade-desired-production"
              name="desiredProduction"
              defaultValue={initialValues?.desiredProduction}
              maxLength={MAX_SHORT_TEXT_LENGTH}
              placeholder="예: 시나모롤 키링 또는 산리오 랜덤 상품"
            />
          </Field>
        </ItemSection>

        <Field>
          <Label
            id="trade-place-label"
            htmlFor="trade-place"
            aria-hidden="true"
          >
            거래 장소 <OptionalMark>(선택)</OptionalMark>
          </Label>
          <PlaceSelectButton
            id="trade-place"
            type="button"
            aria-labelledby="trade-place-label trade-place-value"
            aria-haspopup="dialog"
            onClick={() => setIsPlaceDialogOpen(true)}
          >
            <LocationIcon aria-hidden="true" />
            <PlaceText id="trade-place-value">
              <PlacePrimary data-placeholder={!tradePlace}>
                {tradePlace?.name ||
                  tradePlace?.address ||
                  '거래할 장소를 선택해주세요'}
              </PlacePrimary>
              {tradePlace?.name && (
                <PlaceSecondary>{tradePlace.address}</PlaceSecondary>
              )}
            </PlaceText>
          </PlaceSelectButton>
          {tradePlace && (
            <>
              <ClearPlaceButton
                type="button"
                aria-label="거래 장소 선택 해제"
                onClick={() => {
                  captureAnalyticsEvent('place_selection_cleared', {
                    place_context: 'trade_exchange_place',
                    trade_form_mode: isEditMode ? 'edit' : 'create',
                  });
                  setTradePlace(null);
                }}
              >
                선택 해제
              </ClearPlaceButton>
              {tradePlace.name && (
                <input
                  type="hidden"
                  name="tradePlace.name"
                  value={tradePlace.name}
                />
              )}
              <input
                type="hidden"
                name="tradePlace.address"
                value={tradePlace.address}
              />
              <input
                type="hidden"
                name="tradePlace.latitude"
                value={tradePlace.latitude}
              />
              <input
                type="hidden"
                name="tradePlace.longitude"
                value={tradePlace.longitude}
              />
            </>
          )}
        </Field>
      </Form>

      <StickyActionBar
        isSubmitting={isSubmitting}
        formId={formId}
        cancelTo={props.mode === 'edit' ? `/trade/${props.tradeId}` : '/trade'}
        submitLabel={isEditMode ? '수정하기' : '등록하기'}
        submittingLabel={isEditMode ? '수정 중...' : '등록 중...'}
      />

      {submissionState.stage !== 'idle' && (
        <TradeSubmissionOverlay
          {...submissionState}
          action={isEditMode ? 'edit' : 'create'}
        />
      )}

      <KakaoPlaceSearchDialog
        open={isPurchaseStoreDialogOpen}
        analyticsContext="trade_purchase_store"
        analyticsTradeFormMode={isEditMode ? 'edit' : 'create'}
        title="구매 매장 선택"
        description="가챠를 구매한 매장이나 지점명을 검색해주세요."
        onClose={() => setIsPurchaseStoreDialogOpen(false)}
        onSelect={setPurchaseStore}
      />
      <KakaoPlaceSearchDialog
        open={isPlaceDialogOpen}
        analyticsContext="trade_exchange_place"
        analyticsTradeFormMode={isEditMode ? 'edit' : 'create'}
        title="거래 장소 선택"
        description="지하철역이나 건물명을 검색해주세요."
        onClose={() => setIsPlaceDialogOpen(false)}
        onSelect={setTradePlace}
      />
    </>
  );
}

function readFormControlText(form: HTMLFormElement, name: string): string {
  const control = form.elements.namedItem(name);

  return control instanceof HTMLInputElement ||
    control instanceof HTMLTextAreaElement
    ? control.value.trim()
    : '';
}

function LocationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" {...props}>
      <path
        d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const ItemSection = styled.section`
  display: flex;
  min-width: 0;
  padding: 0 0 4px;
  flex-direction: column;
  gap: 28px;
  border: 0;
`;

const OfferedFields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 16px;

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }
`;

const ItemSectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ItemSectionTitle = styled.h2`
  margin: 0;
  color: #242429;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const ItemSectionDescription = styled.p`
  margin: 0;
  color: #777981;
  font-size: 14px;
  line-height: 1.5;
`;

const Field = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  color: #242429;
  font-size: 15px;
  font-weight: 800;
`;

const RequiredMark = styled.span`
  color: #ed174c;
`;

const OptionalMark = styled.span`
  margin-left: 4px;
  color: #92949c;
  font-size: 13px;
  font-weight: 500;
`;

const Input = styled.input`
  box-sizing: border-box;
  width: 100%;
  height: 52px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 12px;
  outline: none;
  background: #f7f7f8;
  color: #242429;
  font-size: 15px;

  &::placeholder {
    color: #92949c;
  }

  &:focus {
    border-color: #ed174c;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgb(237 23 76 / 10%);
  }

  &[aria-invalid='true'] {
    border-color: #d80f42;
    background: #ffffff;
  }

  ${preventIosInputZoom}
`;

const PlaceSelectButton = styled.button`
  display: flex;
  width: 100%;
  min-height: 60px;
  padding: 10px 16px;
  align-items: center;
  gap: 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: #f7f7f8;
  color: #ed174c;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    border-color: #ed174c;
    outline: none;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgb(237 23 76 / 10%);
  }
`;

const PlaceText = styled.span`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
`;

const PlacePrimary = styled.span`
  overflow: hidden;
  color: #242429;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;

  &[data-placeholder='true'] {
    color: #92949c;
  }
`;

const PlaceSecondary = styled.span`
  overflow: hidden;
  color: #777981;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ClearPlaceButton = styled.button`
  padding: 2px 0;
  align-self: flex-end;
  border: 0;
  background: transparent;
  color: #777981;
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
`;

// 키보드를 닫는 OS 동작을 가로채지 않고, 사용자가 선택할 수 있는 다음 입력 경로만 제공한다.
const InputContinuationButton = styled.button`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;

  &:focus {
    position: static;
    width: auto;
    height: auto;
    padding: 12px 16px;
    align-self: flex-start;
    overflow: visible;
    clip-path: none;
    white-space: normal;
    border-radius: 8px;
    outline: 2px solid #ed174c;
    outline-offset: 2px;
    background: #ffffff;
    color: #242429;
    font-size: 15px;
    cursor: pointer;
  }
`;

const Textarea = styled.textarea`
  box-sizing: border-box;
  width: 100%;
  min-height: 132px;
  padding: 16px;
  resize: vertical;
  border: 1px solid transparent;
  border-radius: 12px;
  outline: none;
  background: #f7f7f8;
  color: #242429;
  font-size: 15px;
  line-height: 1.6;

  &::placeholder {
    color: #92949c;
  }

  &:focus {
    border-color: #ed174c;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgb(237 23 76 / 10%);
  }

  ${preventIosInputZoom}
`;
