import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { ComingSoonCard } from '../components/ComingSoonCard';
import { colors } from '../theme/colors';

export function TradeScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader title="거래/교환" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>가까운 사람과 함께</Text>
        <Text style={styles.heading}>중복 굿즈를 교환해 보세요</Text>
        <Text style={styles.body}>
          웹의 거래 목록과 작성 흐름은 API 연결 단계에서 동일한 기준으로
          옮길 예정이에요.
        </Text>
        <ComingSoonCard
          title="거래/교환 화면 기반 완료"
          description="목록, 상세, 글쓰기 화면이 들어갈 네이티브 진입 구조와 안전영역을 먼저 준비했습니다."
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  eyebrow: {
    marginTop: 12,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  heading: {
    marginTop: 8,
    color: colors.text,
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -1,
  },
  body: {
    marginTop: 12,
    marginBottom: 28,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
});
