import { DemoLink } from './DemoLink';
import { Icon } from './Icon';
import { formatSamplePrice } from '../data/demoData';
import type { DemoProduct } from '../demoType';

export function ProductCard({
  product,
  navigate,
  isLiked,
  onLike,
}: {
  product: DemoProduct;
  navigate: (href: string) => void;
  isLiked: boolean;
  onLike: () => void;
}) {
  return (
    <article className="promo-product-card">
      <div className="promo-product-image">
        <DemoLink
          href={'/demo/search?gachaId=' + product.id}
          navigate={navigate}
          aria-label={product.name + ' 보유 매장 예시 보기'}
        >
          <img src={product.image} alt="" loading="lazy" decoding="async" />
        </DemoLink>
        <button
          className={'promo-like' + (isLiked ? ' is-liked' : '')}
          aria-label={product.name + (isLiked ? ' 관심 해제' : ' 관심 표시')}
          aria-pressed={isLiked}
          onClick={onLike}
        >
          <Icon name="heart" />
        </button>
      </div>
      <DemoLink
        href={'/demo/search?gachaId=' + product.id}
        navigate={navigate}
        className="promo-product-title"
        title={product.name}
      >
        {product.name}
      </DemoLink>
      <div className="promo-product-meta">
        <span>{product.categories.slice(0, 2).join(' · ')}</span>
        <strong>{formatSamplePrice(product.samplePrice)}</strong>
      </div>
      <p className="promo-product-footnote">가격·보유 매장은 체험용 예시</p>
    </article>
  );
}
