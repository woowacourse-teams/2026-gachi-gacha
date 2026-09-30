import { type FormEvent, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router';

import { createTrade } from '@/domains/trade/api/createTrade';
import type { TradeCategory } from '@/domains/trade/tradeCategoryType';
import type {
  CreateTradeRequest,
  TradePlaceInput,
} from '@/domains/trade/tradeCreateType';

import { useTradeCategories } from '../../useTradeCategories';
import PhotoUploader from '../PhotoUploader';
import StickyActionBar from '../StickyActionBar';
import TradePlaceSearchDialog from '../TradePlaceSearchDialog';

export default function TradeForm() {
  const navigate = useNavigate();
  const submittingRef = useRef(false);
  const [images, setImages] = useState<File[]>([]);
  const [photoErrorMessage, setPhotoErrorMessage] = useState<string | null>(
    null,
  );
  const [purchaseStore, setPurchaseStore] = useState<TradePlaceInput | null>(
    null,
  );
  const [tradePlace, setTradePlace] = useState<TradePlaceInput | null>(null);
  const [isPurchaseStoreDialogOpen, setIsPurchaseStoreDialogOpen] =
    useState(false);
  const [isPlaceDialogOpen, setIsPlaceDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [categoryKeyword, setCategoryKeyword] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<TradeCategory[]>(
    [],
  );
  const categoryState = useTradeCategories(categoryKeyword);
  const availableCategories =
    categoryState.status === 'success'
      ? categoryState.data.filter(
          (category) =>
            !selectedCategories.some(
              (selectedCategory) =>
                selectedCategory.categoryId === category.categoryId,
            ),
        )
      : [];

  function selectCategory(category: TradeCategory) {
    setSelectedCategories((currentCategories) => [
      ...currentCategories,
      category,
    ]);
  }

  function removeCategory(categoryId: number) {
    setSelectedCategories((currentCategories) =>
      currentCategories.filter(
        (category) => category.categoryId !== categoryId,
      ),
    );
  }

  function changeImages(nextImages: File[]) {
    setImages(nextImages);

    if (nextImages.length > 0) {
      setPhotoErrorMessage(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    if (images.length === 0) {
      setPhotoErrorMessage('사진을 1장 이상 등록해주세요.');
      return;
    }

    const title = readFormControlText(event.currentTarget, 'title');
    const description = readFormControlText(event.currentTarget, 'description');
    const desiredProduction = readFormControlText(
      event.currentTarget,
      'desiredProduction',
    );

    if (!title) {
      setSubmissionError('제목을 입력해주세요.');
      return;
    }

    if (!description) {
      setSubmissionError('설명을 입력해주세요.');
      return;
    }

    const request: CreateTradeRequest = {
      title,
      description,
      ...(selectedCategories.length > 0
        ? {
            categoryIds: selectedCategories.map(
              (category) => category.categoryId,
            ),
          }
        : {}),
      ...(desiredProduction ? { desiredProduction } : {}),
      ...(purchaseStore ? { purchaseStore } : {}),
      ...(tradePlace ? { tradePlace } : {}),
    };

    setPhotoErrorMessage(null);
    setSubmissionError(null);
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const createdTrade = await createTrade({ request, images });

      navigate(`/used-market/${createdTrade.tradeId}`);
    } catch (error: unknown) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : '교환 게시글을 등록하지 못했습니다.',
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Form
        id="secondhand-create-form"
        aria-busy={isSubmitting}
        onSubmit={(event) => void handleSubmit(event)}
      >
        <PhotoUploader
          files={images}
          errorMessage={photoErrorMessage ?? undefined}
          onFilesChange={changeImages}
        />

        <Field>
          <Label htmlFor="trade-title">
            제목 <RequiredMark aria-hidden="true">*</RequiredMark>
          </Label>
          <Input
            id="trade-title"
            name="title"
            required
            placeholder="교환할 가챠를 알아보기 쉽게 적어주세요"
          />
        </Field>

        <Field>
          <Label htmlFor="trade-category-search">카테고리</Label>
          <Input
            id="trade-category-search"
            type="search"
            value={categoryKeyword}
            autoComplete="off"
            placeholder="카테고리를 검색해주세요"
            onChange={(event) => setCategoryKeyword(event.target.value)}
          />

          {selectedCategories.length > 0 && (
            <CategoryGroup>
              <CategoryGroupLabel>선택한 카테고리</CategoryGroupLabel>
              {selectedCategories.map((category) => (
                <input
                  key={category.categoryId}
                  type="hidden"
                  name="categoryIds"
                  value={category.categoryId}
                />
              ))}
              <CategoryList aria-label="선택한 카테고리">
                {selectedCategories.map((category) => (
                  <CategoryButton
                    key={category.categoryId}
                    type="button"
                    data-selected="true"
                    aria-label={`${category.name} 카테고리 선택 해제`}
                    onClick={() => removeCategory(category.categoryId)}
                  >
                    #{category.name} ×
                  </CategoryButton>
                ))}
              </CategoryList>
            </CategoryGroup>
          )}

          <CategoryGroup>
            <CategoryGroupLabel>검색 결과</CategoryGroupLabel>
            {categoryState.status === 'idle' ? (
              <CategoryMessage>카테고리를 검색해주세요.</CategoryMessage>
            ) : categoryState.status === 'loading' ? (
              <CategoryMessage role="status">
                카테고리를 불러오는 중...
              </CategoryMessage>
            ) : categoryState.status === 'error' ? (
              <CategoryMessage role="alert">
                {categoryState.errorMessage}
              </CategoryMessage>
            ) : availableCategories.length === 0 ? (
              <CategoryMessage>검색결과가 없어요.</CategoryMessage>
            ) : (
              <CategoryList aria-label="카테고리 검색 결과">
                {availableCategories.map((category) => (
                  <CategoryButton
                    key={category.categoryId}
                    type="button"
                    data-selected="false"
                    onClick={() => selectCategory(category)}
                  >
                    {category.name}
                  </CategoryButton>
                ))}
              </CategoryList>
            )}
          </CategoryGroup>
        </Field>

        <Field>
          <Label htmlFor="trade-desired-production">교환 희망 상품</Label>
          <Input
            id="trade-desired-production"
            name="desiredProduction"
            placeholder="예: 시나모롤 키링 또는 산리오 랜덤 교환"
          />
        </Field>

        <Field>
          <Label htmlFor="purchase-store">
            구매 매장 <OptionalLabel>(선택)</OptionalLabel>
          </Label>
          <PlaceSelectButton
            id="purchase-store"
            type="button"
            onClick={() => setIsPurchaseStoreDialogOpen(true)}
          >
            <LocationIcon aria-hidden="true" />
            <PlaceText>
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

        <Field>
          <Label htmlFor="trade-place">교환 장소</Label>
          <PlaceSelectButton
            id="trade-place"
            type="button"
            onClick={() => setIsPlaceDialogOpen(true)}
          >
            <LocationIcon aria-hidden="true" />
            <PlaceText>
              <PlacePrimary data-placeholder={!tradePlace}>
                {tradePlace?.name ||
                  tradePlace?.address ||
                  '교환할 장소를 선택해주세요'}
              </PlacePrimary>
              {tradePlace?.name && (
                <PlaceSecondary>{tradePlace.address}</PlaceSecondary>
              )}
            </PlaceText>
          </PlaceSelectButton>
          {tradePlace && (
            <>
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

        <Field>
          <Label htmlFor="trade-description">
            설명 <RequiredMark aria-hidden="true">*</RequiredMark>
          </Label>
          <Textarea
            id="trade-description"
            name="description"
            required
            placeholder="가챠의 상태와 교환 방법을 자세히 적어주세요"
          />
        </Field>

        {submissionError && (
          <SubmissionError role="alert">{submissionError}</SubmissionError>
        )}
      </Form>

      <StickyActionBar isSubmitting={isSubmitting} />

      <TradePlaceSearchDialog
        open={isPurchaseStoreDialogOpen}
        title="구매 매장 선택"
        description="가챠를 구매한 매장이나 지점명을 검색해주세요."
        onClose={() => setIsPurchaseStoreDialogOpen(false)}
        onSelect={setPurchaseStore}
      />
      <TradePlaceSearchDialog
        open={isPlaceDialogOpen}
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

const OptionalLabel = styled.span`
  color: #858790;
  font-weight: 500;
`;

const RequiredMark = styled.span`
  color: #ed174c;
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

const CategoryList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const CategoryGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CategoryGroupLabel = styled.p`
  margin: 0;
  color: #777981;
  font-size: 13px;
  font-weight: 700;
`;

const CategoryMessage = styled.p`
  margin: 0;
  color: #858790;
  font-size: 14px;
`;

const CategoryButton = styled.button`
  min-height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: #f5f5f6;
  color: #6e7078;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &[data-selected='true'] {
    background: #ed174c;
    color: #ffffff;
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
`;

const SubmissionError = styled.p`
  margin: -8px 0 0;
  color: #d80f42;
  font-size: 14px;
  line-height: 1.5;
`;
