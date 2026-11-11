import styled from '@emotion/styled';
import { Link } from 'react-router';

export const Page = styled.div`
  min-height: 100dvh;
  background: #f7f5f3;
  color: #242122;
  button,
  a,
  input,
  textarea {
    &:focus-visible {
      outline: 3px solid #9b213a;
      outline-offset: 3px;
    }
  }
`;
export const Shell = styled.div`
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  background: white;
  min-height: 100dvh;
  padding-bottom: calc(104px + env(safe-area-inset-bottom, 0px));
`;
export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: env(safe-area-inset-top, 0px) 12px 0;
  min-height: 52px;
  border-bottom: 1px solid #e8e6e3;
  h1 {
    font-size: 16px;
    margin: 0;
    flex: 1;
  }
`;
export const IconButton = styled.button`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  padding: 10px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
export const Hero = styled.div`
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  background: #fff0f4;
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  span {
    font-size: 80px;
  }
`;
export const Section = styled.section`
  padding: 24px;
  border-bottom: 1px solid #e8e6e3;
  h2 {
    font-size: 20px;
    line-height: 1.5;
    margin: 10px 0;
  }
  h3 {
    font-size: 16px;
    margin: 0 0 16px;
  }
  p,
  li {
    font-size: 14px;
    line-height: 1.7;
  }
  p {
    margin: 8px 0;
  }
  ul,
  ol {
    padding-left: 20px;
    margin: 12px 0;
  }
`;
export const Badge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #9b213a;
  background: #fff0f4;
  margin-right: 8px;
`;
export const PrizeGuide = styled.img`
  display: block;
  width: 100%;
  height: auto;
  margin-top: 16px;
  border-radius: 12px;
`;
export const Info = styled.dl`
  background: #f7f5f3;
  padding: 16px;
  border-radius: 12px;
  margin: 16px 0 0;
  display: grid;
  grid-template-columns: 82px 1fr;
  row-gap: 10px;
  font-size: 13px;
  line-height: 1.6;
  dt {
    color: #696466;
  }
  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
`;
export const Notice = styled.p`
  color: #696466;
  font-size: 13px;
  line-height: 1.7;
  margin: 12px 24px;
`;
export const Footer = styled.div`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: min(100%, 560px);
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  background: #fff;
  border-top: 1px solid #e8e6e3;
  display: flex;
  gap: 8px;
  z-index: 5;
`;
export const Primary = styled.button`
  flex: 1;
  min-height: 48px;
  padding: 12px 16px;
  border: 0;
  border-radius: 12px;
  background: #bf3b51;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    background: #ddd8d9;
    color: #565153;
    cursor: default;
  }
`;
export const Secondary = styled.button`
  flex: 1;
  min-height: 48px;
  padding: 12px 16px;
  border: 1px solid #d6d1d2;
  border-radius: 12px;
  background: white;
  color: #242122;
  font-size: 15px;
  cursor: pointer;
`;
export const HomeLink = styled(Link)`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 48px;
  border-radius: 12px;
  background: #bf3b51;
  color: white;
  text-decoration: none;
  font-size: 15px;
  font-weight: 700;
`;
export const Dialog = styled.dialog`
  width: min(330px, calc(100% - 48px));
  border: 0;
  border-radius: 20px;
  padding: 24px;
  color: #242122;
  &::backdrop {
    background: rgb(0 0 0 / 40%);
  }
  h2 {
    font-size: 18px;
    margin: 0 0 12px;
  }
  p {
    font-size: 14px;
    line-height: 1.6;
  }
  div {
    display: flex;
    gap: 8px;
    margin-top: 24px;
  }
`;
export const Complete = styled.div`
  padding: 56px 24px;
  text-align: center;
  h2 {
    font-size: 22px;
  }
  p {
    color: #696466;
    font-size: 14px;
    line-height: 1.7;
  }
  > span {
    display: inline-block;
    background: #fff0f4;
    border-radius: 50%;
    padding: 20px;
    font-size: 32px;
  }
  dl {
    text-align: left;
  }
`;
