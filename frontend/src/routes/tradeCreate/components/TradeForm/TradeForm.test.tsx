import { describe, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router';

import { compressTradeImages } from '@/domains/trade/compressTradeImages';
import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { ToastProvider } from '@/shared/ui/toast';
import { server } from '@/test/server';

import TradeForm from './TradeForm';

jest.mock('@/domains/trade/compressTradeImages', () => ({
  TRADE_IMAGE_COMPRESSION_ERROR_MESSAGE:
    '이미지를 최적화하지 못했습니다. 다시 시도해주세요.',
  compressTradeImages: jest.fn(
    async (
      files: File[],
      onProgress?: (progress: {
        percentage: number;
        completedCount: number;
        totalCount: number;
      }) => void,
    ) => {
      onProgress?.({
        percentage: 100,
        completedCount: files.length,
        totalCount: files.length,
      });

      return files.map(
        (file) =>
          new File([file], file.name.replace(/\.[^.]+$/, '.webp'), {
            type: 'image/webp',
            lastModified: file.lastModified,
          }),
      );
    },
  ),
}));

const mockedCompressTradeImages = jest.mocked(compressTradeImages);
const TRADE_IMAGE_COMPRESSION_ERROR_MESSAGE =
  '이미지를 최적화하지 못했습니다. 다시 시도해주세요.';

jest.mock('@/features/placeSearch/KakaoPlaceSearchDialog', () => ({
  KakaoPlaceSearchDialog: ({
    open,
    title = '거래 장소 선택',
    onClose,
    onSelect,
  }: {
    open: boolean;
    title?: string;
    onClose: () => void;
    onSelect: (place: {
      name: string;
      address: string;
      latitude: number;
      longitude: number;
    }) => void;
  }) =>
    open ? (
      <button
        type="button"
        onClick={() => {
          onSelect({
            name: '홍대 가챠샵',
            address: '서울특별시 마포구 양화로 100',
            latitude: 37.5563,
            longitude: 126.9236,
          });
          onClose();
        }}
      >
        {title} 테스트 장소 선택
      </button>
    ) : null,
}));

function renderTradeForm() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <TradeForm />
      </ToastProvider>
    </MemoryRouter>,
  );
}

function renderTradeFormWithDetailRoute() {
  return render(
    <MemoryRouter initialEntries={['/trade/new']}>
      <Routes>
        <Route
          path="/trade/new"
          element={
            <ToastProvider>
              <TradeForm />
            </ToastProvider>
          }
        />
        <Route
          path="/trade/:tradeId"
          element={<p>등록된 거래 게시글 상세</p>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

async function completeRequiredFields(
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
) {
  const fileInput =
    container.querySelector<HTMLInputElement>('input[type="file"]');

  if (!fileInput) {
    throw new Error('사진 입력을 찾을 수 없습니다.');
  }

  await user.upload(
    fileInput,
    new File(['image'], 'kuromi.png', { type: 'image/png' }),
  );
  await user.type(
    screen.getByRole('textbox', { name: /제목/ }),
    '쿠로미 피규어 교환해요',
  );
  await user.type(
    screen.getByRole('textbox', { name: /설명/ }),
    '개봉만 한 상품입니다.',
  );
  await selectCategory(user);
}

async function selectCategory(user: ReturnType<typeof userEvent.setup>) {
  server.use(
    http.get('/api/v1/categories', () =>
      HttpResponse.json({
        code: 'C000',
        message: '정상',
        data: { items: [{ categoryId: 5, name: '산리오' }] },
      }),
    ),
  );
  await user.type(screen.getByRole('searchbox', { name: /카테고리/ }), '산리');
  await user.click(
    await screen.findByRole('button', { name: '산리오 카테고리에 추가' }),
  );
}

function createTradeResponse() {
  return {
    code: 'C001',
    message: '정상 생성',
    data: {
      tradeId: 15,
      memberId: 3,
      title: '쿠로미 피규어 교환해요',
      description: '개봉만 한 상품입니다.',
      desiredProduction: null,
      categories: [],
      status: 'AVAILABLE',
      purchaseStore: null,
      tradePlace: null,
      availableTime: null,
      imageUrls: ['https://cdn.example.com/kuromi.png'],
      createdAt: '2026-09-30T19:00:00',
      updatedAt: '2026-09-30T19:00:00',
    },
  };
}

describe('TradeForm', () => {
  it('카테고리를 검색하고 ID를 가진 선택값으로 보관한다', async () => {
    const requestedKeywords: Array<string | null> = [];

    server.use(
      http.get('/api/v1/categories', ({ request }) => {
        const keyword = new URL(request.url).searchParams.get('keyword');

        requestedKeywords.push(keyword);

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            items:
              keyword === '포켓'
                ? [{ categoryId: 5, name: '포켓몬' }]
                : [
                    { categoryId: 1, name: '산리오' },
                    { categoryId: 5, name: '포켓몬' },
                  ],
          },
        });
      }),
    );
    const user = userEvent.setup();
    const { container } = renderTradeForm();

    expect(screen.getByText('카테고리를 검색해주세요.')).toBeInTheDocument();
    expect(requestedKeywords).toHaveLength(0);

    await user.type(
      screen.getByRole('searchbox', { name: /카테고리/ }),
      '포켓',
    );

    await waitFor(() => {
      expect(requestedKeywords.at(-1)).toBe('포켓');
    });
    await user.click(
      await screen.findByRole('button', { name: '포켓몬 카테고리에 추가' }),
    );

    expect(
      screen.getByRole('button', { name: '포켓몬 카테고리 선택 해제' }),
    ).toBeInTheDocument();
    expect(
      container.querySelector<HTMLInputElement>(
        'input[name="categoryIds"][value="5"]',
      ),
    ).toBeInTheDocument();
  });

  it('카테고리 검색창 Enter로 첫 결과를 확인한 뒤 명시적으로 추가한다', async () => {
    server.use(
      http.get('/api/v1/categories', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            items: [
              { categoryId: 5, name: '포켓몬' },
              { categoryId: 7, name: '포켓몬 카드' },
            ],
          },
        }),
      ),
    );
    const user = userEvent.setup();
    renderTradeForm();
    const categorySearch = screen.getByRole('searchbox', {
      name: /카테고리/,
    });

    await user.type(categorySearch, '포켓');
    const firstResult = await screen.findByRole('button', {
      name: '포켓몬 카테고리에 추가',
    });
    await user.keyboard('{Enter}');

    expect(firstResult).toHaveFocus();
    expect(
      screen.queryByRole('button', { name: '포켓몬 카테고리 선택 해제' }),
    ).not.toBeInTheDocument();
    await user.keyboard('{Enter}');

    expect(
      screen.getByRole('button', { name: '포켓몬 카테고리 선택 해제' }),
    ).toBeInTheDocument();
    expect(categorySearch).toHaveValue('');
    expect(
      screen.getByRole('button', { name: '포켓몬 카테고리 선택 해제' }),
    ).toHaveFocus();
  });

  it('제목 다음에는 설명으로 이동하고 설명 Enter는 제출 없이 줄바꿈한다', async () => {
    const user = userEvent.setup();
    const { container } = renderTradeForm();
    const onSubmit = jest.fn();
    container.querySelector('form')?.addEventListener('submit', onSubmit);
    const title = screen.getByRole('textbox', { name: /제목/ });
    const description = screen.getByRole('textbox', { name: /설명/ });

    expect(title).toHaveAttribute('enterkeyhint', 'next');
    expect(description).not.toHaveAttribute('enterkeyhint');
    expect(
      screen.queryByRole('button', {
        name: '설명 입력을 마치고 카테고리로 이동',
      }),
    ).not.toBeInTheDocument();
    await user.type(title, '치이카와{Enter}');
    expect(description).toHaveFocus();
    await user.type(
      description,
      '개봉만 한 상품입니다.{Enter}직거래를 원해요.',
    );
    expect(description).toHaveValue('개봉만 한 상품입니다.\n직거래를 원해요.');
    expect(description).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('설명 다음 Tab은 카테고리로 바로 이동하고 역순으로 돌아올 수 있다', async () => {
    const user = userEvent.setup();
    renderTradeForm();
    const description = screen.getByRole('textbox', { name: /설명/ });
    const category = screen.getByRole('searchbox', { name: /카테고리/ });

    await user.click(description);
    await user.tab();
    expect(category).toHaveFocus();
    await user.tab({ shift: true });
    expect(description).toHaveFocus();
  });

  it('수정 모드에서도 기존 설명에 줄바꿈을 추가하고 Tab으로 카테고리로 이동한다', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ToastProvider>
          <TradeForm
            mode="edit"
            tradeId={15}
            initialValues={{
              title: '치이카와',
              description: '기존 상품 상태',
              desiredProduction: '',
              categories: [],
              purchaseStore: null,
              tradePlace: null,
              imageUrls: [],
            }}
          />
        </ToastProvider>
      </MemoryRouter>,
    );
    const description = screen.getByRole('textbox', { name: /설명/ });

    await user.type(description, '{End}{Enter}추가 상품 상태');

    expect(description).toHaveValue('기존 상품 상태\n추가 상품 상태');
    expect(description).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('searchbox', { name: /카테고리/ })).toHaveFocus();
  });

  it('설명에서 Shift+Enter로 줄바꿈하고 계속 입력할 수 있다', async () => {
    const user = userEvent.setup();
    renderTradeForm();
    const description = screen.getByRole('textbox', { name: /설명/ });

    await user.type(description, '첫 줄');
    await user.keyboard('{Shift>}{Enter}{/Shift}둘째 줄');

    expect(description).toHaveValue('첫 줄\n둘째 줄');
    expect(description).toHaveFocus();
  });

  it('여러 줄 설명을 붙여넣은 뒤 Tab으로 이동해도 내용을 보존한다', async () => {
    const user = userEvent.setup();
    renderTradeForm();
    const description = screen.getByRole('textbox', { name: /설명/ });

    await user.click(description);
    await user.paste('상품 상태\n개봉만 했어요.\n직거래를 원해요.');
    await user.tab();

    expect(description).toHaveValue(
      '상품 상태\n개봉만 했어요.\n직거래를 원해요.',
    );
    expect(screen.getByRole('searchbox', { name: /카테고리/ })).toHaveFocus();
  });

  it('제목과 설명의 한글 조합 확정에는 다음 입력 초점을 강제하지 않는다', async () => {
    const user = userEvent.setup();
    renderTradeForm();
    const title = screen.getByRole('textbox', { name: /제목/ });
    const description = screen.getByRole('textbox', { name: /설명/ });
    await user.click(title);
    fireEvent.keyDown(title, { key: 'Enter', isComposing: true });
    expect(title).toHaveFocus();
    fireEvent.keyDown(title, { key: 'Enter', keyCode: 229 });
    expect(title).toHaveFocus();
    await user.click(description);
    expect(
      fireEvent.keyDown(description, { key: 'Enter', isComposing: true }),
    ).toBe(true);
    expect(description).toHaveFocus();
    expect(fireEvent.keyDown(description, { key: 'Enter', keyCode: 229 })).toBe(
      true,
    );
    expect(description).toHaveFocus();
  });

  it('설명의 단순 blur에는 카테고리 초점을 강제하지 않는다', async () => {
    const user = userEvent.setup();
    renderTradeForm();
    const description = screen.getByRole('textbox', { name: /설명/ });

    await user.click(description);
    (description as HTMLTextAreaElement).blur();
    expect(description).not.toHaveFocus();
    expect(
      screen.getByRole('searchbox', { name: /카테고리/ }),
    ).not.toHaveFocus();
    expect(screen.getByRole('textbox', { name: /설명/ })).toBe(description);
  });

  it('단일 행 입력에서는 Enter로 폼을 제출하지 않는다', () => {
    renderTradeForm();
    const singleLineInputs = [
      screen.getByRole('textbox', { name: /제목/ }),
      screen.getByRole('textbox', { name: /얻고 싶은 상품/ }),
      screen.getByRole('searchbox', { name: /카테고리/ }),
    ];

    singleLineInputs.forEach((input) => {
      // fireEvent는 기본 동작이 막히면 false를 반환한다.
      expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(false);
    });
  });

  it('사진, 제목, 설명, 카테고리를 필수로 검증하고 첫 누락 항목을 토스트로 알린다', () => {
    const { container } = renderTradeForm();

    expect(screen.getByRole('textbox', { name: /제목/ })).toBeRequired();
    expect(screen.getByRole('textbox', { name: /설명/ })).toBeRequired();
    expect(
      screen.getByRole('textbox', { name: /얻고 싶은 상품/ }),
    ).not.toBeRequired();
    expect(screen.getByRole('searchbox', { name: /카테고리/ })).toBeRequired();

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(screen.getByRole('alert')).toHaveTextContent(
      '사진을 1장 이상 등록해주세요.',
    );
  });

  it('카테고리를 고르지 않으면 등록하지 않고 토스트로 알린 뒤 카테고리 검색으로 이동한다', async () => {
    let requestCount = 0;

    server.use(
      http.post('/api/v1/trades', () => {
        requestCount += 1;
        return HttpResponse.json(createTradeResponse(), { status: 201 });
      }),
    );
    const user = userEvent.setup();
    const { container } = renderTradeForm();
    const fileInput =
      container.querySelector<HTMLInputElement>('input[type="file"]');

    await user.upload(
      fileInput as HTMLInputElement,
      new File(['image'], 'kuromi.png', { type: 'image/png' }),
    );
    await user.type(screen.getByRole('textbox', { name: /제목/ }), '쿠로미');
    await user.type(screen.getByRole('textbox', { name: /설명/ }), '새 상품');
    await user.click(screen.getByRole('button', { name: '등록하기' }));

    const categorySearch = screen.getByRole('searchbox', { name: /카테고리/ });

    expect(screen.getByRole('alert')).toHaveTextContent(
      '카테고리를 1개 이상 선택해주세요.',
    );
    expect(categorySearch).toHaveAttribute('aria-invalid', 'true');
    expect(categorySearch).toHaveFocus();
    expect(requestCount).toBe(0);

    await selectCategory(user);
    expect(categorySearch).not.toHaveAttribute('aria-invalid');
  });

  it('필수 항목을 먼저 보여주고 선택 항목임을 일관되게 안내한다', () => {
    renderTradeForm();

    expect(
      screen.getByRole('heading', { name: '가지고 있는 것' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '얻고 싶은 것' }),
    ).toBeInTheDocument();

    const fields = [
      screen.getByRole('group', { name: /사진/ }),
      screen.getByRole('textbox', { name: /제목/ }),
      screen.getByRole('textbox', { name: /설명/ }),
      screen.getByRole('searchbox', { name: /카테고리/ }),
      screen.getByRole('button', { name: /구매 매장/ }),
      screen.getByRole('textbox', { name: /얻고 싶은 상품/ }),
      screen.getByRole('button', { name: /거래 장소/ }),
    ];

    fields.slice(0, -1).forEach((field, index) => {
      expect(
        field.compareDocumentPosition(fields[index + 1]!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
    expect(screen.getAllByText('(선택)')).toHaveLength(3);
  });

  it('제목과 얻고 싶은 상품을 255자로 제한하고 공백 제목을 안내한다', async () => {
    const user = userEvent.setup();
    const { container } = renderTradeForm();
    const titleInput = screen.getByRole('textbox', { name: /제목/ });
    const desiredProductionInput = screen.getByRole('textbox', {
      name: /얻고 싶은 상품/,
    });

    expect(titleInput).toHaveAttribute('maxlength', '255');
    expect(desiredProductionInput).toHaveAttribute('maxlength', '255');

    await completeRequiredFields(user, container);
    await user.clear(titleInput);
    await user.type(titleInput, '   ');
    await user.click(screen.getByRole('button', { name: '등록하기' }));

    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    expect(titleInput).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('제목을 입력해주세요.');
  });

  it('선택한 구매 매장과 거래 장소를 다시 해제한다', async () => {
    const user = userEvent.setup();
    const { container } = renderTradeForm();

    expect(
      screen.getByRole('button', {
        name: '구매 매장 (선택) 가챠를 구매한 매장을 선택해주세요',
      }),
    ).toHaveAttribute('aria-haspopup', 'dialog');

    await user.click(
      screen.getByRole('button', {
        name: /구매 매장/,
      }),
    );
    await user.click(
      screen.getByRole('button', { name: '구매 매장 선택 테스트 장소 선택' }),
    );

    expect(
      container.querySelector('input[name="purchaseStore.address"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: '구매 매장 (선택) 홍대 가챠샵 서울특별시 마포구 양화로 100',
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '구매 매장 선택 해제' }),
    );

    expect(
      container.querySelector('input[name="purchaseStore.address"]'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /거래 장소/ }));
    await user.click(
      screen.getByRole('button', { name: '거래 장소 선택 테스트 장소 선택' }),
    );

    expect(
      container.querySelector('input[name="tradePlace.address"]'),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '거래 장소 선택 해제' }),
    );

    expect(
      container.querySelector('input[name="tradePlace.address"]'),
    ).not.toBeInTheDocument();
  });

  it('등록 중 중복 제출을 막고 성공하면 생성된 상세 페이지로 이동한다', async () => {
    let requestCount = 0;
    let releaseRequest: () => void = () => undefined;
    const responseDelay = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    storeAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    server.use(
      http.post('/api/v1/trades', async () => {
        requestCount += 1;
        await responseDelay;

        return HttpResponse.json(createTradeResponse(), { status: 201 });
      }),
    );
    const user = userEvent.setup();
    const { container } = renderTradeFormWithDetailRoute();

    await completeRequiredFields(user, container);
    await user.click(screen.getByRole('button', { name: '등록하기' }));

    const submittingButton = await screen.findByRole('button', {
      name: '등록 중...',
    });

    expect(submittingButton).toBeDisabled();
    await user.click(submittingButton);
    expect(requestCount).toBe(1);

    releaseRequest();

    expect(
      await screen.findByText('등록된 거래 게시글 상세'),
    ).toBeInTheDocument();
  });

  it('등록 버튼을 누르면 압축 진행률을 보여준 뒤 등록 상태로 전환한다', async () => {
    let finishCompression: () => void = () => undefined;
    let finishRequest: () => void = () => undefined;
    const requestDelay = new Promise<void>((resolve) => {
      finishRequest = resolve;
    });

    mockedCompressTradeImages.mockImplementationOnce(
      (files, onProgress) =>
        new Promise<File[]>((resolve) => {
          onProgress?.({
            percentage: 42,
            completedCount: 0,
            totalCount: files.length,
          });
          finishCompression = () => {
            resolve(
              files.map(
                (file) =>
                  new File([file], 'kuromi.webp', { type: 'image/webp' }),
              ),
            );
          };
        }),
    );
    storeAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    server.use(
      http.post('/api/v1/trades', async () => {
        await requestDelay;

        return HttpResponse.json(createTradeResponse(), { status: 201 });
      }),
    );
    const user = userEvent.setup();
    const { container } = renderTradeFormWithDetailRoute();

    await completeRequiredFields(user, container);
    await user.click(screen.getByRole('button', { name: '등록하기' }));

    expect(
      await screen.findByRole('dialog', { name: '이미지 최적화 중' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: '이미지 최적화 진행률' }),
    ).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByText('0/1개 처리 중')).toBeInTheDocument();

    finishCompression();

    expect(
      await screen.findByRole('dialog', { name: '게시글 등록 중' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    finishRequest();

    expect(
      await screen.findByText('등록된 거래 게시글 상세'),
    ).toBeInTheDocument();
  });

  it('이미지 압축에 실패하면 요청하지 않고 작성 내용을 보존한다', async () => {
    let requestCount = 0;

    mockedCompressTradeImages.mockRejectedValueOnce(
      new Error(TRADE_IMAGE_COMPRESSION_ERROR_MESSAGE),
    );
    storeAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    server.use(
      http.post('/api/v1/trades', () => {
        requestCount += 1;

        return HttpResponse.json(createTradeResponse(), { status: 201 });
      }),
    );
    const user = userEvent.setup();
    const { container } = renderTradeForm();

    await completeRequiredFields(user, container);
    await user.click(screen.getByRole('button', { name: '등록하기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      TRADE_IMAGE_COMPRESSION_ERROR_MESSAGE,
    );
    expect(requestCount).toBe(0);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /제목/ })).toHaveValue(
      '쿠로미 피규어 교환해요',
    );
    expect(screen.getByRole('button', { name: '등록하기' })).toBeEnabled();
  });

  it('등록에 실패하면 오류를 보여주고 다시 제출할 수 있다', async () => {
    storeAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    let requests = 0;
    server.use(
      http.post('/api/v1/trades', () => {
        requests += 1;
        return requests === 1
          ? HttpResponse.json(
              { code: 'CE001', message: '교환 게시글을 등록할 수 없습니다.' },
              { status: 400 },
            )
          : HttpResponse.json(createTradeResponse(), { status: 201 });
      }),
    );
    const user = userEvent.setup();
    const { container } = renderTradeFormWithDetailRoute();

    await completeRequiredFields(user, container);
    await user.click(screen.getByRole('button', { name: '등록하기' }));

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('등록하지 못했어요. 내용은 그대로예요.');
    expect(alert).toHaveTextContent('교환 게시글을 등록할 수 없습니다.');
    expect(screen.getByRole('textbox', { name: /제목/ })).toHaveValue(
      '쿠로미 피규어 교환해요',
    );
    expect(screen.getByRole('textbox', { name: /설명/ })).toHaveValue(
      '개봉만 한 상품입니다.',
    );
    await user.click(within(alert).getByRole('button', { name: '다시 시도' }));
    expect(
      await screen.findByText('등록된 거래 게시글 상세'),
    ).toBeInTheDocument();
    expect(requests).toBe(2);
  });
});
