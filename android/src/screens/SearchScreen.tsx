import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { ComingSoonCard } from '../components/ComingSoonCard';
import { colors } from '../theme/colors';

export function SearchScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader title="검색" />
      <View style={styles.content}>
        <Text style={styles.heading}>어떤 가챠를 찾아볼까요?</Text>
        <TextInput
          editable={false}
          placeholder="찾고 싶은 가챠를 검색"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <ComingSoonCard
          title="가챠 검색"
          description="검색어 입력, 카테고리, 검색 결과 목록은 웹 계약을 확정한 뒤 네이티브 화면으로 연결합니다."
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
  heading: {
    marginTop: 10,
    marginBottom: 16,
    color: colors.text,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  input: {
    height: 56,
    marginBottom: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    color: colors.text,
    backgroundColor: colors.background,
    fontSize: 15,
  },
});
