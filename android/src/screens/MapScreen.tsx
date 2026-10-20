import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { ComingSoonCard } from '../components/ComingSoonCard';
import { colors } from '../theme/colors';

export function MapScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader title="지도" />
      <View style={styles.content}>
        <View style={styles.mapPreview} accessibilityLabel="지도 기능 준비 영역">
          <View style={[styles.road, styles.roadHorizontal]} />
          <View style={[styles.road, styles.roadVertical]} />
          <View style={styles.pin}>
            <Text style={styles.pinText}>G</Text>
          </View>
        </View>
        <ComingSoonCard
          title="내 주변 가챠 매장"
          description="위치 권한과 지도 SDK 선택은 별도 이슈에서 검증한 뒤 실제 매장 데이터와 연결합니다."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mapPreview: {
    minHeight: 250,
    marginBottom: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#f1eee7',
  },
  road: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  roadHorizontal: {
    width: '130%',
    height: 38,
    transform: [{ rotate: '-9deg' }],
  },
  roadVertical: {
    width: 32,
    height: '130%',
    transform: [{ rotate: '17deg' }],
  },
  pin: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: colors.background,
    borderRadius: 28,
    backgroundColor: colors.primary,
  },
  pinText: {
    color: colors.background,
    fontSize: 19,
    fontWeight: '900',
  },
});
