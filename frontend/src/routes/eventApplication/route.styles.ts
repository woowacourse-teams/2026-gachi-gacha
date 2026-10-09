import styled from '@emotion/styled';
import { Link } from 'react-router';

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

export const Page = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: #fffaf8;
`;

export const Main = styled.main`
  width: min(100% - 40px, 960px);
  padding: ${space.xl} 0 96px;
  margin: 0 auto;

  @media (max-width: 520px) {
    width: min(100% - 24px, 960px);
  }
`;

export const BackLink = styled(Link)`
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  text-decoration: none;

  &:hover {
    color: ${color.primary};
  }
`;

export const Hero = styled.header`
  padding: clamp(${space.xl}, 6vw, 64px);
  border: 1px solid #f1c7ce;
  border-radius: ${radius.dialog};
  margin: ${space.lg} 0 ${space.xxl};
  background:
    radial-gradient(circle at 88% 18%, rgb(237 142 78 / 22%), transparent 28%),
    linear-gradient(135deg, #fff5f7 0%, #fffaf3 100%);
  box-shadow: ${shadow.card};
`;

export const EventBadge = styled.span`
  display: inline-flex;
  padding: 7px 12px;
  border-radius: 999px;
  background: ${color.primary};
  color: #ffffff;
  font-size: ${fontSize.caption};
  font-weight: ${fontWeight.bold};
`;

export const Header = styled.h1`
  max-width: 680px;
  margin: ${space.md} 0 ${space.sm};
  font-size: clamp(32px, 6vw, 52px);
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.title};
  line-height: 1.14;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${fontSize.sectionTitle};
  font-weight: ${fontWeight.extraBold};
  line-height: ${lineHeight.heading};
`;

export const SectionDescription = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};
`;

export const GuideGrid = styled.ol`
  display: grid;
  padding: 0;
  margin: ${space.lg} 0 ${space.xxl};
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${space.sm};
  list-style: none;

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 440px) {
    grid-template-columns: 1fr;
  }
`;

export const GuideCard = styled.li`
  display: flex;
  min-height: 112px;
  padding: ${space.md};
  border: 1px solid ${color.border};
  border-radius: ${radius.card};
  background: ${color.surface};
  gap: ${space.sm};
`;

export const GuideNumber = styled.span`
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: 50%;
  background: #ed8e4e;
  color: #ffffff;
  font-weight: ${fontWeight.bold};
  place-items: center;
`;

export const GuideText = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  gap: ${space.xxs};
  line-height: ${lineHeight.body};

  strong {
    color: ${color.text};
    font-size: ${fontSize.body};
  }
`;

export const InstagramLink = styled.a`
  color: ${color.primary};
  font-weight: ${fontWeight.bold};
`;

export const FormCard = styled.section`
  padding: clamp(${space.lg}, 5vw, ${space.xxl});
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  background: ${color.surface};
  box-shadow: ${shadow.card};
`;

export const Form = styled.form`
  display: grid;
  margin-top: ${space.xl};
  gap: ${space.xl};

  fieldset {
    min-width: 0;
    padding: 0;
    border: 0;
    margin: 0;
  }
`;

export const TrackGrid = styled.div`
  display: grid;
  margin-top: ${space.sm};
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${space.sm};

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

export const TrackLabel = styled.label`
  cursor: pointer;

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }

  input:focus-visible + div {
    box-shadow: ${focusRing};
  }

  input:checked + div {
    border-color: ${color.primary};
    background: ${color.primarySoft};
  }
`;

export const TrackCard = styled.div`
  min-height: 116px;
  padding: ${space.md};
  border: 1px solid ${color.border};
  border-radius: ${radius.card};
  background: ${color.surface};
`;

export const TrackTitle = styled.strong`
  display: block;
  color: ${color.text};
  font-size: ${fontSize.body};
`;

export const TrackDescription = styled.span`
  display: block;
  margin-top: ${space.xs};
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.body};
`;

export const Field = styled.div`
  display: grid;
  gap: ${space.xs};
`;

export const FieldLabel = styled.label`
  color: ${color.text};
  font-size: ${fontSize.body};
  font-weight: ${fontWeight.bold};
`;

export const FieldDescription = styled.span`
  color: ${color.textMuted};
  font-size: ${fontSize.caption};
  line-height: ${lineHeight.body};
`;

export const Input = styled.input`
  width: 100%;
  min-height: 52px;
  padding: 0 ${space.md};
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surface};
  color: ${color.text};
  font: inherit;

  &:focus {
    border-color: ${color.primary};
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const ConsentLabel = styled.label`
  display: flex;
  padding: ${space.md};
  align-items: flex-start;
  border-radius: ${radius.control};
  background: ${color.surfaceMuted};
  color: ${color.textMuted};
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  gap: ${space.sm};
  line-height: ${lineHeight.body};

  input {
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
    margin-top: 2px;
    accent-color: ${color.primary};
  }
`;

export const ConsentNotice = styled.div`
  padding: ${space.md};
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surfaceMuted};
  color: ${color.textMuted};
  font-size: ${fontSize.caption};
  line-height: ${lineHeight.body};

  strong {
    color: ${color.text};
    font-size: ${fontSize.bodySmall};
  }

  dl {
    display: grid;
    margin: ${space.sm} 0;
    gap: ${space.xs};
  }

  dl div {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: ${space.sm};
  }

  dt {
    color: ${color.text};
    font-weight: ${fontWeight.bold};
  }

  dd,
  p {
    margin: 0;
  }
`;

export const PrivacyLink = styled.a`
  color: ${color.primary};
  font-weight: ${fontWeight.bold};
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const SubmitButton = styled.button`
  min-width: 180px;
  min-height: 52px;
  padding: 0 ${space.lg};
  border: 0;
  border-radius: ${radius.control};
  background: ${color.primary};
  color: #ffffff;
  cursor: pointer;
  font-size: ${fontSize.body};
  font-weight: ${fontWeight.bold};

  &:disabled {
    cursor: wait;
    opacity: 0.62;
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const StateCard = styled.section`
  padding: clamp(${space.xl}, 8vw, 72px) ${space.lg};
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  background: ${color.surface};
  box-shadow: ${shadow.card};
  text-align: center;
`;

export const StateTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${fontSize.sectionTitle};
`;

export const StateDescription = styled.p`
  margin: ${space.sm} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.body};

  &[role='alert'] {
    color: ${color.primary};
    font-weight: ${fontWeight.bold};
  }
`;

export const SuccessLink = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  padding: 0 ${space.lg};
  align-items: center;
  justify-content: center;
  border-radius: ${radius.control};
  margin-top: ${space.lg};
  background: ${color.primary};
  color: #ffffff;
  font-weight: ${fontWeight.bold};
  text-decoration: none;
`;
