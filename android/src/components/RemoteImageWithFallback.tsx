import { useEffect, useState } from 'react';
import {
  Image,
  type ImageResizeMode,
  type ImageStyle,
  StyleSheet,
  type StyleProp,
  View,
} from 'react-native';

type Props = {
  accessibilityLabel?: string;
  resizeMode?: ImageResizeMode;
  style: StyleProp<ImageStyle>;
  uri: string | null | undefined;
};

const logo = require('../../assets/gacha-logo.png');

/**
 * 원격 이미지가 느리거나 실패해도 빈 칸을 노출하지 않는다.
 * 로고를 먼저 그린 뒤 디코딩까지 끝난 원격 이미지만 위에 표시한다.
 */
export function RemoteImageWithFallback({
  accessibilityLabel,
  resizeMode = 'cover',
  style,
  uri,
}: Props) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [uri]);

  return (
    <View style={[styles.frame, style]}>
      <Image
        accessibilityLabel={uri ? undefined : accessibilityLabel}
        resizeMode="contain"
        source={logo}
        style={[styles.logo, isLoaded && styles.hidden]}
      />
      {uri ? (
        <Image
          accessibilityLabel={accessibilityLabel}
          key={uri}
          onError={() => setIsLoaded(false)}
          onLoad={() => setIsLoaded(true)}
          resizeMode={resizeMode}
          source={{ uri }}
          style={[styles.remoteImage, !isLoaded && styles.hidden]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f3f4',
  },
  logo: {
    width: '42%',
    height: '42%',
  },
  remoteImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  hidden: { opacity: 0 },
});
