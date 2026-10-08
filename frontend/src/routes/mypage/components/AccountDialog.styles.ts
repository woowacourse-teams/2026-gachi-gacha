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
  width: min(calc(100% - 32px), 480px);
  max-height: calc(100dvh - 32px);
  padding: 0;
  border: 0;
  border-radius: ${radius.dialog};
  margin: auto;
  background: transparent;

  &::backdrop {
    background: rgb(36 33 34 / 48%);
    backdrop-filter: blur(2px);
  }
`;

export const Panel = styled.div`
  overflow-y: auto;
  max-height: calc(100dvh - 32px);
  padding: ${space.xl};
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  background: ${color.surface};
  box-shadow: ${shadow.dialog};

  @media (max-width: 520px) {
    padding: ${space.lg};
    border-radius: ${radius.card};
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
  font-size: ${fontSize.sectionTitle};
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
  border: 0;
  border-radius: ${radius.circle};
  background: ${color.surfaceMuted};
  color: ${color.text};
  cursor: pointer;
  font-size: 26px;
  line-height: 1;
  place-items: center;

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

export const InteractiveField = styled.div`
  display: grid;
  gap: ${space.xs};
`;

export const FieldLabel = styled.span`
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
`;

export const Input = styled.input`
  width: 100%;
  min-height: 48px;
  padding: 0 ${space.md};
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surface};
  color: ${color.text};
  font: inherit;

  &::placeholder {
    color: ${color.textSubtle};
  }

  &:focus {
    border-color: ${color.primary};
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const PlaceSelectButton = styled.button`
  display: flex;
  width: 100%;
  min-height: 64px;
  padding: ${space.sm} ${space.md};
  align-items: center;
  justify-content: space-between;
  gap: ${space.md};
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surface};
  color: ${color.text};
  cursor: pointer;
  font: inherit;
  text-align: left;

  &:focus-visible {
    border-color: ${color.primary};
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const PlaceSelection = styled.span`
  display: grid;
  min-width: 0;
  gap: 2px;
`;

export const PlaceSelectionName = styled.strong<{ $empty?: boolean }>`
  overflow: hidden;
  color: ${({ $empty }) => ($empty ? color.textSubtle : color.text)};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.medium};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PlaceSelectionAddress = styled.span`
  overflow: hidden;
  color: ${color.textSubtle};
  font-size: ${fontSize.caption};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PlaceSearchAction = styled.span`
  flex: 0 0 auto;
  color: ${color.primary};
  font-size: ${fontSize.caption};
  font-weight: ${fontWeight.bold};
`;

export const ClearPlaceButton = styled.button`
  width: fit-content;
  padding: 2px 0;
  border: 0;
  background: transparent;
  color: ${color.textMuted};
  cursor: pointer;
  font-size: ${fontSize.caption};
  text-decoration: underline;
  text-underline-offset: 3px;

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const FieldHint = styled.span`
  color: ${color.textSubtle};
  font-size: ${fontSize.caption};
  line-height: ${lineHeight.body};
`;

export const Warning = styled.div`
  padding: ${space.md};
  border-radius: ${radius.control};
  background: ${color.primarySoft};
  color: ${color.text};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.relaxed};
`;

export const ErrorMessage = styled.p`
  margin: 0;
  color: ${color.primary};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.body};
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${space.sm};
`;

const actionButtonStyles = `
  min-height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const SecondaryButton = styled.button`
  ${actionButtonStyles}
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
`;

export const PrimaryButton = styled.button`
  ${actionButtonStyles}
  border: 1px solid ${color.primary};
  background: ${color.primary};
  color: #ffffff;
`;

export const DangerButton = styled(PrimaryButton)`
  box-shadow: 0 8px 18px rgb(217 59 84 / 18%);
`;
