import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';

import { Logo } from './LogoImagePlaceholder.styles';

export function LogoImagePlaceholder() {
  return (
    <Logo src={gachiGachaLogo} alt="" aria-hidden="true" draggable="false" />
  );
}
