import styled from '@emotion/styled';

import { Section as DetailSection } from './StoreVisitInfo.styles';
export {
  SectionTitle,
  InfoList as PriceList,
  InfoContent as PriceRow,
  InfoLabel as PriceLabel,
  InfoValue as PriceValue,
} from './StoreVisitInfo.styles';
export const Section = styled(DetailSection)`
  grid-area: prices;
`;
