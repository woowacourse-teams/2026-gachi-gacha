import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { type NavigationProp, useIsFocused, useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ImageViewerModal } from '../components/ImageViewerModal';
import { RemoteImageWithFallback } from '../components/RemoteImageWithFallback';
import { ShareIcon } from '../components/ShareIcon';
import { AffiliateCatalogPlacement } from '../domains/affiliate/AffiliateCatalogPlacement';
import { useAuthSession } from '../domains/auth/AuthSessionContext';
import { createChatRoom, findChatRoomByTrade } from '../domains/chat/chatApi';
import { useMemberSafety } from '../domains/memberSafety/MemberSafetyContext';
import { UserSafetyMenu } from '../domains/memberSafety/UserSafetyMenu';
import { RelatedTradesSection } from '../domains/trade/RelatedTradesSection';
import { TradeCommentsSection } from '../domains/trade/TradeCommentsSection';
import {
  deleteTrade,
  getTradeDetail,
  updateTradeStatus,
} from '../domains/trade/tradeApi';
import type { TradeDetail, TradePlace } from '../domains/trade/tradeTypes';
import type { TradeStackParamList } from '../navigation/TradeStack';
import type { RootStackParamList } from '../navigation/RootStack';
import { openDirections, sharePublicPage } from '../shared/nativeActions';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<TradeStackParamList, 'TradeDetail'>;
type State = { status: 'loading' | 'error' | 'success'; data: TradeDetail | null; message: string | null };

const statusLabel = { AVAILABLE: '교환 가능', IN_PROGRESS: '교환 진행 중', COMPLETED: '교환 완료' } as const;

export function TradeDetailScreen({ navigation, route }: Props) {
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const scrollRef = useRef<ScrollView>(null);
  const { memberId, status: authStatus } = useAuthSession();
  const { isMemberBlocked } = useMemberSafety();
  const [attempt, setAttempt] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isUpdatingOwnerAction, setIsUpdatingOwnerAction] = useState(false);
  const [state, setState] = useState<State>({ status: 'loading', data: null, message: null });

  useEffect(() => {
    if (!isFocused) return;
    const controller = new AbortController();
    setState({ status: 'loading', data: null, message: null });
    getTradeDetail(route.params.tradeId, controller.signal)
      .then((data) => setState({ status: 'success', data, message: null }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', data: null, message: error instanceof Error ? error.message : '교환글을 불러오지 못했습니다.' });
      });
    return () => controller.abort();
  }, [attempt, isFocused, route.params.tradeId]);

  if (state.status === 'loading') return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (state.status === 'error' || !state.data) return <View style={styles.center}><Text style={styles.muted}>{state.message}</Text><Pressable style={styles.retry} onPress={() => setAttempt((value) => value + 1)}><Text style={styles.retryText}>다시 시도</Text></Pressable></View>;

  const trade = state.data;

  if (isMemberBlocked(trade.memberId)) {
    return (
      <View style={styles.center}>
        <Text style={styles.blockedTitle}>차단한 사용자의 글이에요</Text>
        <Text style={styles.muted}>차단을 해제하면 이 교환글을 다시 확인할 수 있어요.</Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.retry}>
          <Text style={styles.retryText}>목록으로 돌아가기</Text>
        </Pressable>
      </View>
    );
  }
  const rows = [
    ['얻고 싶은 것', trade.desiredProduction || '협의'],
    ['가능 시간', trade.availableTime || '협의'],
  ];
  const locations: Array<{ emptyValue: string; label: string; place: TradePlace | null }> = [
    { emptyValue: '미입력', label: '구매 매장', place: trade.purchaseStore },
    { emptyValue: '협의', label: '거래 장소', place: trade.tradePlace },
  ];

  async function handleShare() {
    try {
      await sharePublicPage({
        title: trade.title,
        message: `${trade.title}\n가치가챠에서 교환글을 확인해 보세요.`,
        path: `/trade/${trade.tradeId}`,
      });
    } catch {
      Alert.alert('공유할 수 없어요', '잠시 후 다시 시도해 주세요.');
    }
  }

  async function handlePlaceDirections(label: string, place: TradePlace) {
    try {
      await openDirections({
        label: place.name || label,
        latitude: place.latitude,
        longitude: place.longitude,
      });
    } catch {
      Alert.alert('지도를 열 수 없어요', '잠시 후 다시 시도해 주세요.');
    }
  }

  function revealCommentComposer() {
    scrollRef.current?.scrollToEnd({ animated: true });
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 220);
  }

  async function enterChat() {
    if (isStartingChat) return;
    setIsStartingChat(true);
    try {
      const existingRoomId = await findChatRoomByTrade(trade.tradeId);
      const roomId = existingRoomId ?? await createChatRoom(trade.tradeId);
      rootNavigation.navigate('ChatRoom', { roomId });
    } catch (error) {
      Alert.alert(
        '채팅방에 입장하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsStartingChat(false);
    }
  }

  async function changeStatus(status: TradeDetail['status']) {
    if (isUpdatingOwnerAction || trade.status === status) return;
    setIsUpdatingOwnerAction(true);
    try {
      const updated = await updateTradeStatus(trade.tradeId, status);
      setState({ status: 'success', data: updated, message: null });
    } catch (error) {
      Alert.alert(
        '교환 상태를 바꾸지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsUpdatingOwnerAction(false);
    }
  }

  function confirmDelete() {
    Alert.alert('교환글을 삭제할까요?', '삭제한 글은 복구할 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          setIsUpdatingOwnerAction(true);
          void deleteTrade(trade.tradeId)
            .then(() => navigation.goBack())
            .catch((error: unknown) => Alert.alert(
              '교환글을 삭제하지 못했어요',
              error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
            ))
            .finally(() => setIsUpdatingOwnerAction(false));
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ref={scrollRef}
        style={styles.screen}
      >
      {trade.imageUrls.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {trade.imageUrls.map((url, index) => (
            <Pressable
              accessibilityLabel={`${trade.title} 사진 ${index + 1}`}
              accessibilityRole="button"
              key={`${url}-${index}`}
              onPress={() => setSelectedImageIndex(index)}
              style={styles.imageFrame}
            >
              <RemoteImageWithFallback
                accessibilityLabel={`${trade.title} 사진 ${index + 1}`}
                style={styles.image}
                uri={url}
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <RemoteImageWithFallback
          accessibilityLabel="가치가챠 기본 이미지"
          style={styles.imageFrame}
          uri={null}
        />
      )}
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={styles.itemRole}>가지고 있는 것</Text>
          <Text style={styles.title}>{trade.title}</Text>
        </View>
        <View style={styles.titleActions}>
          <View style={styles.badge}><Text style={styles.badgeText}>{statusLabel[trade.status]}</Text></View>
          <Pressable
            accessibilityLabel={`${trade.title} 공유하기`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => void handleShare()}
            style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
          >
            <ShareIcon />
          </Pressable>
          {authStatus === 'authenticated' && memberId !== trade.memberId && (
            <UserSafetyMenu
              onBlocked={() => navigation.goBack()}
              referenceId={String(trade.tradeId)}
              source="trade"
              targetMemberId={trade.memberId}
              targetNickname="작성자"
            />
          )}
        </View>
      </View>
      <Text style={styles.categories}>{trade.categories.join(' · ') || '카테고리 미설정'}</Text>
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>가지고 있는 상품 설명</Text>
      <Text style={styles.description}>{trade.description || '작성된 설명이 없어요.'}</Text>
      <View style={styles.infoBox}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
          </View>
        ))}
        {locations.map(({ emptyValue, label, place }) => (
          <View key={label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{place?.name || place?.address || emptyValue}</Text>
            {place && (
              <Pressable
                accessibilityLabel={`${place.name || label} 지도에서 보기`}
                accessibilityRole="button"
                onPress={() => void handlePlaceDirections(label, place)}
                style={({ pressed }) => [styles.mapButton, pressed && styles.mapButtonPressed]}
              >
                <Text style={styles.mapButtonText}>지도에서 보기</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>
      {authStatus === 'authenticated' && memberId === trade.memberId && (
        <View style={styles.ownerPanel}>
          <Text style={styles.ownerTitle}>내 교환글 관리</Text>
          <View style={styles.statusActions}>
            {Object.entries(statusLabel).map(([status, label]) => {
              const selected = trade.status === status;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  disabled={isUpdatingOwnerAction}
                  key={status}
                  onPress={() => void changeStatus(status as TradeDetail['status'])}
                  style={[styles.statusButton, selected && styles.statusButtonSelected]}
                >
                  <Text style={[styles.statusButtonText, selected && styles.statusButtonTextSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.ownerButtonRow}>
            <Pressable accessibilityRole="button" disabled={isUpdatingOwnerAction} onPress={() => navigation.navigate('TradeEdit', { tradeId: trade.tradeId })} style={styles.editTradeButton}><Text style={styles.editTradeText}>수정</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={isUpdatingOwnerAction} onPress={confirmDelete} style={styles.deleteTradeButton}><Text style={styles.deleteTradeText}>삭제</Text></Pressable>
          </View>
        </View>
      )}
      {authStatus === 'authenticated' && memberId !== null && memberId !== trade.memberId && (
        <Pressable
          accessibilityRole="button"
          disabled={isStartingChat}
          onPress={() => void enterChat()}
          style={({ pressed }) => [
            styles.chatButton,
            (pressed || isStartingChat) && styles.shareButtonPressed,
          ]}
        >
          {isStartingChat && <ActivityIndicator color={colors.background} size="small" />}
          <Text style={styles.chatButtonText}>{isStartingChat ? '채팅방 확인 중...' : '채팅하기'}</Text>
        </Pressable>
      )}
      <TradeCommentsSection
        onComposerFocus={revealCommentComposer}
        tradeId={trade.tradeId}
      />
      <AffiliateCatalogPlacement
        categoryNames={trade.categories}
        placementPath="/trade"
        title={trade.title}
      />
      <RelatedTradesSection
        onSelectTrade={(tradeId) => navigation.push('TradeDetail', { tradeId })}
        tradeId={trade.tradeId}
      />
      <ImageViewerModal
        imageUrls={trade.imageUrls}
        initialIndex={selectedImageIndex ?? 0}
        onClose={() => setSelectedImageIndex(null)}
        title={trade.title}
        visible={selectedImageIndex !== null}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 18, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: colors.surface },
  muted: { color: colors.textMuted, textAlign: 'center' },
  blockedTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
  retry: { paddingHorizontal: 20, minHeight: 44, justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary },
  retryText: { color: colors.background, fontWeight: '700' },
  imageFrame: { width: 340, maxWidth: '100%', aspectRatio: 1, marginRight: 12, overflow: 'hidden', borderRadius: 20, backgroundColor: '#f0f0f2' },
  image: { width: '100%', height: '100%' },
  titleRow: { marginTop: 22, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleCopy: { flex: 1, minWidth: 0 },
  itemRole: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  title: { marginTop: 6, color: colors.text, fontSize: 24, fontWeight: '800', lineHeight: 32 },
  titleActions: { alignItems: 'flex-end', gap: 9 },
  badge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14, backgroundColor: colors.primarySoft },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  categories: { marginTop: 12, color: '#4e5058', fontWeight: '700' },
  shareButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 21, backgroundColor: colors.background },
  shareButtonPressed: { backgroundColor: colors.primarySoft },
  divider: { height: 1, marginVertical: 22, backgroundColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  description: { marginTop: 12, color: colors.text, fontSize: 15, lineHeight: 24 },
  infoBox: { marginTop: 24, padding: 16, gap: 16, borderRadius: 18, backgroundColor: colors.background },
  infoRow: { gap: 6 },
  infoLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  infoValue: { color: colors.text, fontSize: 14, lineHeight: 20 },
  mapButton: { minHeight: 40, marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 15, justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 12, backgroundColor: colors.background },
  mapButtonPressed: { backgroundColor: colors.primarySoft },
  mapButtonText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  chatButton: { minHeight: 50, marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, backgroundColor: colors.primary },
  chatButtonText: { color: colors.background, fontSize: 15, fontWeight: '800' },
  ownerPanel: { marginTop: 22, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.background },
  ownerTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  statusActions: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusButton: { minHeight: 38, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 19 },
  statusButtonSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  statusButtonText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  statusButtonTextSelected: { color: colors.background },
  ownerButtonRow: { marginTop: 14, flexDirection: 'row', gap: 10 },
  editTradeButton: { minHeight: 42, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 13 },
  editTradeText: { color: colors.primary, fontWeight: '800' },
  deleteTradeButton: { minHeight: 42, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.primarySoft },
  deleteTradeText: { color: colors.primary, fontWeight: '800' },
});
