import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';
import {
  createTradeComment,
  getTradeComments,
  orderTradeComments,
  type TradeComment,
} from './tradeCommentApi';

const MAX_COMMENT_LENGTH = 500;
const MAX_GUEST_NICKNAME_LENGTH = 20;

type LoadState =
  | { status: 'loading'; comments: TradeComment[]; message: null }
  | { status: 'success'; comments: TradeComment[]; message: null }
  | { status: 'error'; comments: TradeComment[]; message: string };

interface TradeCommentsSectionProps {
  tradeId: number;
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const pad = (number: number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TradeCommentsSection({ tradeId }: TradeCommentsSectionProps) {
  const [attempt, setAttempt] = useState(0);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>({ status: 'loading', comments: [], message: null });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', comments: [], message: null });

    getTradeComments(tradeId, controller.signal)
      .then((comments) => {
        if (!controller.signal.aborted) setState({ status: 'success', comments, message: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            status: 'error',
            comments: [],
            message: error instanceof Error ? error.message : '댓글을 불러오지 못했습니다.',
          });
        }
      });

    return () => controller.abort();
  }, [attempt, tradeId]);

  const trimmedContent = content.trim();
  const canSubmit = trimmedContent.length > 0 && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const createdComment = await createTradeComment(tradeId, {
        nickname: nickname.trim() || null,
        content: trimmedContent,
      });
      if (state.status === 'success') {
        setState((current) => ({
          status: 'success',
          comments: orderTradeComments([...current.comments, createdComment]),
          message: null,
        }));
      } else {
        setAttempt((value) => value + 1);
      }
      setContent('');
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : '댓글을 등록하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        댓글 <Text style={styles.count}>{state.comments.length}</Text>
      </Text>

      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="비회원 닉네임"
          autoCapitalize="none"
          maxLength={MAX_GUEST_NICKNAME_LENGTH}
          onChangeText={setNickname}
          placeholder="이름 (선택, 미입력 시 루챠)"
          placeholderTextColor={colors.textMuted}
          style={styles.nicknameInput}
          value={nickname}
        />
        <Text style={styles.privacyNotice}>비회원 댓글에는 접속 IP 일부가 표시돼요.</Text>
        <TextInput
          accessibilityLabel="댓글 내용"
          maxLength={MAX_COMMENT_LENGTH}
          multiline
          onChangeText={setContent}
          placeholder="댓글을 입력해 주세요."
          placeholderTextColor={colors.textMuted}
          style={styles.commentInput}
          textAlignVertical="top"
          value={content}
        />
        <View style={styles.composerFooter}>
          <Text accessibilityLiveRegion="polite" style={[styles.feedback, submitError && styles.error]}>
            {submitError ?? `${content.length}/${MAX_COMMENT_LENGTH}`}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={() => void handleSubmit()}
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && styles.submitButtonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.submitButtonText}>등록</Text>
            )}
          </Pressable>
        </View>
      </View>

      {state.status === 'loading' && (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>댓글을 불러오고 있어요.</Text>
        </View>
      )}
      {state.status === 'error' && (
        <View style={styles.stateBox}>
          <Text accessibilityLiveRegion="polite" style={styles.error}>{state.message}</Text>
          <Pressable accessibilityRole="button" onPress={() => setAttempt((value) => value + 1)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </Pressable>
        </View>
      )}
      {state.status === 'success' && state.comments.length === 0 && (
        <View style={styles.stateBox}>
          <Text style={styles.emptyTitle}>아직 댓글이 없어요.</Text>
          <Text style={styles.stateText}>첫 댓글로 교환 이야기를 시작해 보세요.</Text>
        </View>
      )}
      {state.status === 'success' && state.comments.map((comment) => (
        <View key={comment.commentId} style={styles.commentRow}>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.avatar}>
            {comment.profileImageUrl ? (
              <Image source={{ uri: comment.profileImageUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{comment.nickname.trim().slice(0, 1) || '루'}</Text>
            )}
          </View>
          <View style={styles.commentBody}>
            <View style={styles.commentHeading}>
              <Text style={styles.author}>{comment.nickname}</Text>
              <Text style={styles.createdAt}>{formatCreatedAt(comment.createdAt)}</Text>
            </View>
            <Text style={styles.commentText}>{comment.content}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 28, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.border },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  count: { color: colors.primary },
  composer: { marginTop: 16, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.background },
  nicknameInput: { minHeight: 44, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.surface, color: colors.text, fontSize: 14 },
  privacyNotice: { marginTop: 7, color: colors.textMuted, fontSize: 12 },
  commentInput: { minHeight: 104, marginTop: 12, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, color: colors.text, fontSize: 15, lineHeight: 22 },
  composerFooter: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  feedback: { flex: 1, color: colors.textMuted, fontSize: 12 },
  error: { color: colors.primary, fontSize: 13, lineHeight: 19 },
  submitButton: { minWidth: 76, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.primary },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonPressed: { backgroundColor: colors.primaryPressed },
  submitButtonText: { color: colors.background, fontSize: 14, fontWeight: '800' },
  stateBox: { minHeight: 116, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stateText: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  retryButton: { minHeight: 40, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 12 },
  retryButtonText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  commentRow: { flexDirection: 'row', gap: 12, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 19, backgroundColor: colors.primarySoft },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  commentBody: { flex: 1, minWidth: 0 },
  commentHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  author: { color: colors.text, fontSize: 14, fontWeight: '800' },
  createdAt: { color: colors.textMuted, fontSize: 11 },
  commentText: { marginTop: 7, color: colors.text, fontSize: 14, lineHeight: 21 },
});
