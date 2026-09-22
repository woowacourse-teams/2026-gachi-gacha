import styled from '@emotion/styled';

export const Page = styled.main`
  display: flex;
  min-height: 100dvh;
  padding: 32px 20px;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 50% 38%, rgb(217 59 84 / 10%), transparent 34%),
    var(--color-surface, #ffffff);
  color: var(--color-text, #242122);
  text-align: center;
`;

export const Content = styled.section`
  display: flex;
  width: min(100%, 520px);
  align-items: center;
  flex-direction: column;
`;

export const Logo = styled.img`
  width: min(32vw, 124px);
  height: min(32vw, 124px);
  margin-bottom: 28px;
  object-fit: contain;
  filter: drop-shadow(0 12px 24px rgb(217 59 84 / 14%));
`;

export const Eyebrow = styled.p`
  margin: 0 0 10px;
  color: var(--color-primary, #d93b54);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.08em;
`;

export const Title = styled.h1`
  margin: 0;
  font-size: clamp(26px, 5vw, 38px);
  line-height: 1.3;
  letter-spacing: -0.035em;
`;

export const Description = styled.p`
  margin: 16px 0 0;
  color: var(--color-text-muted, #696466);
  font-size: clamp(15px, 2.8vw, 17px);
  line-height: 1.7;
`;

export const SearchLink = styled.a`
  display: inline-flex;
  min-height: 48px;
  margin-top: 32px;
  padding: 0 24px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--color-primary, #d93b54);
  box-shadow: 0 8px 20px rgb(217 59 84 / 20%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  text-decoration: none;

  &:hover {
    background: var(--color-primary-hover, #c73149);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 4px;
  }
`;
