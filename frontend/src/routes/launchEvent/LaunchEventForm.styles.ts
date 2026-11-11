import { css } from '@emotion/react';
import styled from '@emotion/styled';

import { preventIosInputZoom } from '@/shared/styles/preventIosInputZoom';
import { color, focusRing, fontWeight, radius } from '@/shared/styles/tokens';

const focus = css`
  &:focus-visible {
    outline: none;
    box-shadow: ${focusRing};
  }
`;

export const Form = styled.form`
  padding: 20px 16px calc(144px + env(safe-area-inset-bottom));
  color: ${color.text};
`;

export const Summary = styled.div`
  padding: 14px;
  margin-bottom: 26px;
  border-radius: 12px;
  background: ${color.surfaceMuted};

  strong {
    display: block;
    margin-bottom: 5px;
    font-size: 14px;
    font-weight: ${fontWeight.bold};
  }

  p {
    margin: 5px 0 0;
    color: ${color.textMuted};
    font-size: 12px;
    line-height: 1.6;
  }
`;

export const Field = styled.div`
  margin-bottom: 26px;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 9px;
  font-size: 14px;
  font-weight: ${fontWeight.bold};
`;

export const Required = styled.span`
  margin-left: 3px;
  color: ${color.primary};
`;

export const Optional = styled.span`
  margin-left: 5px;
  color: ${color.textMuted};
  font-size: 12px;
  font-weight: ${fontWeight.regular};
`;

const input = css`
  display: block;
  width: 100%;
  padding: 13px 14px;
  border: 1px solid ${color.border};
  border-radius: 10px;
  color: ${color.text};
  background: ${color.surface};
  font: inherit;
  font-size: 16px;
  line-height: 1.5;
  box-sizing: border-box;

  &::placeholder {
    color: ${color.textSubtle};
  }

  &:focus {
    border-color: ${color.primary};
    outline: none;
    box-shadow: ${focusRing};
  }

  &[aria-invalid='true'] {
    border-color: ${color.primary};
  }
`;

export const Input = styled.input`
  ${input}
  ${preventIosInputZoom}
  min-height: 50px;
  outline: none;
`;

export const Textarea = styled.textarea`
  ${input}
  ${preventIosInputZoom}
  min-height: 144px;
  outline: none;
  resize: vertical;
`;

export const Hint = styled.p`
  margin: 8px 0 0;
  color: ${color.textMuted};
  font-size: 12px;
  line-height: 1.6;
`;

export const Counter = styled.p`
  margin: 7px 0 0;
  color: ${color.textMuted};
  text-align: right;
  font-size: 12px;
`;

export const ErrorText = styled.p`
  margin: 8px 0 0;
  color: ${color.primary};
  font-size: 12px;
  line-height: 1.5;
  ${focus}
`;

export const PhotoRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
`;

export const Photo = styled.div`
  position: relative;
  width: 72px;
  height: 72px;

  img {
    width: 100%;
    height: 100%;
    border: 1px solid ${color.borderSubtle};
    border-radius: 10px;
    object-fit: cover;
    box-sizing: border-box;
  }
`;

export const RemovePhoto = styled.button`
  position: absolute;
  top: -12px;
  right: -12px;
  display: grid;
  width: 44px;
  height: 44px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: ${radius.circle};
  background: transparent;
  cursor: pointer;

  span {
    display: grid;
    width: 20px;
    height: 20px;
    place-items: center;
    border: 2px solid ${color.surface};
    border-radius: ${radius.circle};
    color: ${color.surface};
    background: ${color.text};
    font-size: 17px;
    line-height: 1;
  }

  ${focus}
`;

export const AddPhoto = styled.button`
  display: flex;
  width: 72px;
  min-height: 72px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
  border: 1px dashed #d7d1d3;
  border-radius: 10px;
  color: ${color.textMuted};
  background: ${color.surfaceMuted};
  font-size: 11px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  ${focus}
`;

export const ConsentCard = styled.fieldset`
  min-width: 0;
  padding: 0 14px;
  margin: 28px 0 0;
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
`;

export const ConsentRow = styled.div`
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: 4px;

  &:first-of-type {
    min-height: 56px;
    border-bottom: 1px solid ${color.borderSubtle};
    font-weight: ${fontWeight.bold};
  }

  label {
    display: flex;
    min-height: 44px;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    cursor: pointer;
  }

  input {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: #d93b54;
    ${focus}
  }
`;

export const TermsButton = styled.button`
  flex-shrink: 0;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  color: ${color.textMuted};
  background: transparent;
  font-size: 12px;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  ${focus}
`;

export const Footer = styled.div`
  position: fixed;
  z-index: 45;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  max-width: 560px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  margin: 0 auto;
  border-top: 1px solid ${color.borderSubtle};
  background: ${color.surface};
  box-sizing: border-box;

  p {
    margin: 9px 0 0;
    color: ${color.textMuted};
    font-size: 11px;
    text-align: center;
  }
`;

export const SubmitButton = styled.button`
  width: 100%;
  min-height: 52px;
  padding: 12px 16px;
  border: 0;
  border-radius: 10px;
  color: ${color.surface};
  background: ${color.primary};
  font: inherit;
  font-size: 15px;
  font-weight: ${fontWeight.bold};
  cursor: pointer;

  &:disabled {
    color: #8c8587;
    background: #eeeaea;
    cursor: default;
  }

  ${focus}
`;

export const Hidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

export const TermsDialog = styled.dialog`
  width: min(360px, calc(100vw - 40px));
  max-height: calc(100dvh - 48px);
  padding: 24px;
  border: 0;
  border-radius: 18px;
  color: ${color.text};
  background: ${color.surface};
  box-sizing: border-box;

  &::backdrop {
    background: rgb(24 20 22 / 45%);
  }

  h2 {
    margin: 0 0 16px;
    font-size: 19px;
    line-height: 1.4;
  }

  p,
  li {
    margin: 0 0 12px;
    font-size: 14px;
    line-height: 1.7;
  }

  ul {
    padding-left: 20px;
  }
`;
