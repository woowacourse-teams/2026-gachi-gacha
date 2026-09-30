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

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { server } from '@/test/server';

import TradeForm from './TradeForm';

jest.mock('../TradePlaceSearchDialog', () => ({
  __esModule: true,
  default: ({
    open,
    title = '교환 장소 선택',
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
      <TradeForm />
    </MemoryRouter>,
  );
}

function renderTradeFormWithDetailRoute() {
  return render(
    <MemoryRouter initialEntries={['/trade/new']}>
      <Routes>
        <Route path="/trade/new" element={<TradeForm />} />
        <Route
          path="/trade/:tradeId"
          element={<p>등록된 교환 게시글 상세</p>}
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
      screen.getByRole('searchbox', { name: '카테고리' }),
      '포켓',
    );

    await waitFor(() => {
      expect(requestedKeywords.at(-1)).toBe('포켓');
    });
    await user.click(await screen.findByRole('button', { name: '포켓몬' }));

    expect(
      screen.getByRole('button', { name: '포켓몬 카테고리 선택 해제' }),
    ).toBeInTheDocument();
    expect(
      container.querySelector<HTMLInputElement>(
        'input[name="categoryIds"][value="5"]',
      ),
    ).toBeInTheDocument();
  });

  it('사진, 제목, 설명만 필수값으로 검증한다', () => {
    const { container } = renderTradeForm();

    expect(screen.getByRole('textbox', { name: /제목/ })).toBeRequired();
    expect(screen.getByRole('textbox', { name: /설명/ })).toBeRequired();
    expect(
      screen.getByRole('textbox', { name: '교환 희망 상품' }),
    ).not.toBeRequired();
    expect(
      screen.getByRole('searchbox', { name: '카테고리' }),
    ).not.toBeRequired();

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(screen.getByRole('alert')).toHaveTextContent(
      '사진을 1장 이상 등록해주세요.',
    );
  });

  it('제목과 교환 희망 상품을 255자로 제한하고 공백 제목을 안내한다', async () => {
    const user = userEvent.setup();
    const { container } = renderTradeForm();
    const titleInput = screen.getByRole('textbox', { name: /제목/ });
    const desiredProductionInput = screen.getByRole('textbox', {
      name: '교환 희망 상품',
    });

    expect(titleInput).toHaveAttribute('maxlength', '255');
    expect(desiredProductionInput).toHaveAttribute('maxlength', '255');

    await completeRequiredFields(user, container);
    await user.clear(titleInput);
    await user.type(titleInput, '   ');
    await user.click(screen.getByRole('button', { name: '등록하기' }));

    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('제목을 입력해주세요.')).toHaveAttribute(
      'id',
      'trade-title-error',
    );
  });

  it('선택한 구매 매장과 교환 장소를 다시 해제한다', async () => {
    const user = userEvent.setup();
    const { container } = renderTradeForm();

    await user.click(
      screen.getByRole('button', {
        name: '구매 매장',
      }),
    );
    await user.click(
      screen.getByRole('button', { name: '구매 매장 선택 테스트 장소 선택' }),
    );

    expect(
      container.querySelector('input[name="purchaseStore.address"]'),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '구매 매장 선택 해제' }),
    );

    expect(
      container.querySelector('input[name="purchaseStore.address"]'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '교환 장소' }));
    await user.click(
      screen.getByRole('button', { name: '교환 장소 선택 테스트 장소 선택' }),
    );

    expect(
      container.querySelector('input[name="tradePlace.address"]'),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '교환 장소 선택 해제' }),
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
      await screen.findByText('등록된 교환 게시글 상세'),
    ).toBeInTheDocument();
  });

  it('등록에 실패하면 오류를 보여주고 다시 제출할 수 있다', async () => {
    storeAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    server.use(
      http.post('/api/v1/trades', () =>
        HttpResponse.json(
          { code: 'CE001', message: '교환 게시글을 등록할 수 없습니다.' },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    const { container } = renderTradeForm();

    await completeRequiredFields(user, container);
    await user.click(screen.getByRole('button', { name: '등록하기' }));

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('교환 게시글을 등록할 수 없습니다.');
    expect(
      within(container).getByRole('button', { name: '등록하기' }),
    ).toBeEnabled();
  });
});
