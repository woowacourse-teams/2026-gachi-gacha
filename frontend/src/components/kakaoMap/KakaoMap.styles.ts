import styled from '@emotion/styled';

export const MapContainer = styled.div`
  width: 100%;
  height: 100%;
`;

export const StorePinButton = styled.button`
  position: relative;
  display: grid;
  width: 48px;
  height: 48px;
  padding: 0;
  color: #ffffff;
  font-size: 19px;
  cursor: pointer;
  background: #a8461c;
  border: 4px solid #ffffff;
  border-radius: 50% 50% 50% 9px;
  box-shadow: 0 8px 20px rgb(111 49 22 / 30%);
  transform: rotate(-45deg);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
  place-items: center;

  span {
    display: block;
    transform: rotate(45deg);
  }

  &:hover {
    box-shadow: 0 10px 24px rgb(111 49 22 / 40%);
    transform: rotate(-45deg) scale(1.08);
  }

  &:focus-visible {
    outline: 4px solid rgb(168 70 28 / 25%);
    outline-offset: 4px;
  }
`;
