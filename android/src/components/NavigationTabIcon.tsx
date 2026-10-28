import Svg, { Path } from 'react-native-svg';

import {
  navigationTabIconPaths,
  type NavigationTabIconName,
} from '../../assets/navigation/tabIcons';

type Props = {
  color: string;
  name: NavigationTabIconName;
  size?: number;
};

export function NavigationTabIcon({ color, name, size = 24 }: Props) {
  return (
    <Svg
      accessible={false}
      height={size}
      pointerEvents="none"
      viewBox="0 0 24 24"
      width={size}
    >
      <Path d={navigationTabIconPaths[name]} fill={color} />
    </Svg>
  );
}
