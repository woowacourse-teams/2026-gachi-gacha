import styled from '@emotion/styled';

import {
  color,
  focusRing,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  radius,
  shadow,
  space,
} from '@/shared/styles/tokens';

export const Dialog = styled.dialog`
  width: min(calc(100% - 32px), 540px);
  max-height: min(760px, calc(100dvh - 32px));
  padding: 0;
  border: 0;
  border-radius: ${radius.dialog};
  margin: auto;
  background: transparent;
  box-shadow: ${shadow.dialog};
  overflow-y: auto;

  &::backdrop {
    background: rgb(36 33 34 / 48%);
    backdrop-filter: blur(2px);
  }
`;

export const Panel = styled.section`
  padding: ${space.xl};
  background: ${color.surface};

  @media (max-width: 520px) {
    padding: ${space.lg};
  }
`;

export const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${space.md};
`;

export const Title = styled.h2`
  margin: 0;
  font-size: ${fontSize.detailTitle};
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.heading};
  line-height: ${lineHeight.heading};
`;

export const Description = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.relaxed};
`;

export const CloseButton = styled.button`
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border: 1px solid ${color.border};
  border-radius: ${radius.circle};
  background: ${color.surface};
  color: ${color.text};
  cursor: pointer;
  font-size: 24px;
  place-items: center;

  &:hover {
    border-color: ${color.primary};
    color: ${color.primary};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const Form = styled.form`
  display: grid;
  margin-top: ${space.xl};
  gap: ${space.lg};
`;

export const Field = styled.label`
  display: grid;
  gap: ${space.xs};
`;

export const FieldLabel = styled.span`
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
`;

export const Select = styled.select`
  width: 100%;
  height: 48px;
  padding: 0 ${space.md};
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surface};
  color: ${color.text};
  font: inherit;
  font-size: ${fontSize.body};

  &:focus-visible {
    border-color: ${color.primary};
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const Textarea = styled.textarea`
  width: 100%;
  min-height: 180px;
  padding: ${space.md};
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surface};
  color: ${color.text};
  font: inherit;
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};
  resize: vertical;

  &::placeholder {
    color: ${color.textSubtle};
  }

  &:focus-visible {
    border-color: ${color.primary};
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const FieldMeta = styled.span`
  color: ${color.textSubtle};
  font-size: ${fontSize.caption};
  text-align: right;
`;

export const PrivacyHint = styled.p`
  padding: ${space.sm};
  border-radius: ${radius.small};
  margin: 0;
  background: ${color.surfaceMuted};
  color: ${color.textMuted};
  font-size: ${fontSize.caption};
  line-height: ${lineHeight.relaxed};

  a {
    color: ${color.primary};
    font-weight: ${fontWeight.bold};
    text-underline-offset: 2px;
  }
`;

export const ErrorMessage = styled.p`
  padding: ${space.sm};
  border-radius: ${radius.small};
  margin: 0;
  background: ${color.primarySoft};
  color: ${color.primary};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.relaxed};
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${space.sm};
`;

export const SecondaryButton = styled.button`
  min-height: 46px;
  padding: 0 ${space.lg};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.textMuted};
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const SubmitButton = styled.button`
  min-height: 46px;
  padding: 0 ${space.xl};
  border: 0;
  border-radius: ${radius.pill};
  background: ${color.primary};
  color: #ffffff;
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};

  &:hover:not(:disabled) {
    background: ${color.primaryHover};
  }

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const Success = styled.div`
  display: grid;
  min-height: 320px;
  align-content: center;
  justify-items: center;
  gap: ${space.md};
  text-align: center;
`;

export const SuccessIcon = styled.span`
  display: grid;
  width: 64px;
  height: 64px;
  border-radius: ${radius.circle};
  background: ${color.primary};
  color: #ffffff;
  font-size: 30px;
  place-items: center;
`;
