import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ImageViewerModal } from '../components/ImageViewerModal';
import { RemoteImageWithFallback } from '../components/RemoteImageWithFallback';
import { areTradeFeaturesEnabled } from '../config/features';
import { useAuthSession } from '../domains/auth/AuthSessionContext';
import { useChatUnread } from '../domains/chat/ChatUnreadContext';
import {
  getChatMessages,
  getChatRoom,
  markChatMessagesRead,
  uploadChatImages,
} from '../domains/chat/chatApi';
import type {
  ChatImageUpload,
  ChatMessage,
  ChatRoomSummary,
  ChatRoomUpdate,
} from '../domains/chat/chatTypes';
import { useChatSocket } from '../domains/chat/useChatSocket';
import { useMemberSafety } from '../domains/memberSafety/MemberSafetyContext';
import { UserSafetyMenu } from '../domains/memberSafety/UserSafetyMenu';
import type { RootStackParamList } from '../navigation/RootStack';
import { useBottomContentPadding } from '../shared/useBottomContentPadding';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSION_TO_MIME: Record<string, string> = {
  jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
};
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function prepareImage(asset: ImagePicker.ImagePickerAsset): ChatImageUpload {
  if (asset.fileSize !== undefined && asset.fileSize > MAX_IMAGE_SIZE) {
    throw new Error('채팅 사진은 장당 10MB 이하만 보낼 수 있어요.');
  }
  const fileName = asset.fileName?.trim() ?? '';
  const source = fileName || asset.uri.split('?')[0] || '';
  const extension = source.split('.').pop()?.toLowerCase() ?? '';
  const mimeType = asset.mimeType?.toLowerCase() ?? EXTENSION_TO_MIME[extension];
  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error('JPG, PNG, WebP 형식의 사진만 보낼 수 있어요.');
  }
  const normalizedExtension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
  return { fileName: fileName || `chat-image.${normalizedExtension}`, mimeType, uri: asset.uri };
}

function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' }).format(date);
}

export function ChatRoomScreen({ navigation, route }: Props) {
  const composerBottomPadding = useBottomContentPadding(10);
  const roomId = route.params.roomId;
  const tradeFeaturesEnabled = areTradeFeaturesEnabled();
  const isFocused = useIsFocused();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const { memberId } = useAuthSession();
  const { isMemberBlocked } = useMemberSafety();
  const { refreshUnreadCount, setUnreadCount } = useChatUnread();
  const [room, setRoom] = useState<ChatRoomSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nextLastSequence, setNextLastSequence] = useState<number | null>(null);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [composer, setComposer] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ index: number; urls: string[] } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    Promise.all([
      getChatRoom(roomId, controller.signal),
      getChatMessages(roomId, { signal: controller.signal }),
    ])
      .then(([roomData, messagePage]) => {
        if (controller.signal.aborted) return;
        const sorted = [...messagePage.messages].sort((a, b) => a.sequence - b.sequence);
        setRoom(roomData);
        setMessages(sorted);
        setHasPrevious(messagePage.hasNext);
        setNextLastSequence(messagePage.nextLastSequence);
        setStatus('success');
        setErrorMessage(null);
        navigation.setOptions({ title: roomData.otherMember.nickname });
        const latest = sorted.at(-1);
        if (latest) {
          void markChatMessagesRead(roomId, latest.sequence)
            .then(() => refreshUnreadCount())
            .catch(() => undefined);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setStatus('error');
          setErrorMessage(error instanceof Error ? error.message : '채팅방을 불러오지 못했습니다.');
        }
      });
    return () => controller.abort();
  }, [attempt, navigation, refreshUnreadCount, roomId]);

  const receiveMessage = useCallback((message: ChatMessage) => {
    if (message.roomId !== roomId || isMemberBlocked(message.senderId)) return;
    setMessages((current) => {
      if (current.some(({ messageId }) => messageId === message.messageId)) return current;
      return [...current, message].sort((a, b) => a.sequence - b.sequence);
    });
    if (message.senderId !== memberId) {
      void markChatMessagesRead(roomId, message.sequence)
        .then(() => refreshUnreadCount())
        .catch(() => undefined);
    }
  }, [isMemberBlocked, memberId, refreshUnreadCount, roomId]);

  const receiveRoomUpdate = useCallback((update: ChatRoomUpdate) => {
    setUnreadCount(update.totalUnreadCount);
    if (update.room.roomId === roomId) setRoom({ ...update.room, unreadCount: 0 });
  }, [roomId, setUnreadCount]);

  const socket = useChatSocket({
    active: isFocused,
    memberId,
    onMessage: receiveMessage,
    onRoomUpdate: receiveRoomUpdate,
    roomId,
  });

  const lastMessageId = messages.at(-1)?.messageId;
  useEffect(() => {
    if (lastMessageId) requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [lastMessageId]);

  async function loadPrevious() {
    if (!hasPrevious || nextLastSequence === null || isLoadingPrevious) return;
    setIsLoadingPrevious(true);
    setSendError(null);
    try {
      const page = await getChatMessages(roomId, { lastSequence: nextLastSequence });
      setMessages((current) => {
        const byId = new Map([...page.messages, ...current].map((message) => [message.messageId, message]));
        return [...byId.values()].sort((a, b) => a.sequence - b.sequence);
      });
      setHasPrevious(page.hasNext);
      setNextLastSequence(page.nextLastSequence);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : '이전 메시지를 불러오지 못했습니다.');
    } finally {
      setIsLoadingPrevious(false);
    }
  }

  async function sendText() {
    const content = composer.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setSendError(null);
    try {
      socket.sendTextMessage(content);
      setComposer('');
    } catch (error) {
      setSendError(error instanceof Error ? error.message : '메시지를 보내지 못했습니다.');
    } finally {
      setIsSending(false);
    }
  }

  async function sendImages() {
    if (isSending) return;
    setSendError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ['images'],
        quality: 0.9,
        selectionLimit: 10,
      });
      if (result.canceled) return;
      if (result.assets.length === 0 || result.assets.length > 10) {
        throw new Error('사진은 한 번에 최대 10장까지 보낼 수 있어요.');
      }
      setIsSending(true);
      const files = await uploadChatImages(result.assets.map(prepareImage));
      socket.sendImageMessage(composer, files);
      setComposer('');
    } catch (error) {
      setSendError(error instanceof Error ? error.message : '사진을 보내지 못했습니다.');
    } finally {
      setIsSending(false);
    }
  }

  const blocked = room ? isMemberBlocked(room.otherMember.memberId) : false;
  const connectionLabel = useMemo(() => {
    if (socket.status === 'connected') return null;
    if (socket.errorMessage) return socket.errorMessage;
    if (socket.status === 'connecting') return '채팅 서버에 연결하고 있어요.';
    return '채팅 서버 연결이 끊어졌어요.';
  }, [socket.errorMessage, socket.status]);

  function openTrade() {
    if (!room || !tradeFeaturesEnabled) return;
    navigation.navigate('Main', {
      screen: 'Trade',
      params: { screen: 'TradeDetail', params: { tradeId: room.trade.tradeId } },
    });
  }

  if (status === 'loading') return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.muted}>대화를 불러오고 있어요.</Text></View>;
  if (status === 'error' || !room || blocked) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateTitle}>{blocked ? '차단한 사용자와의 채팅이에요' : '채팅방을 불러오지 못했어요'}</Text>
        <Text style={styles.muted}>{blocked ? '차단을 해제하면 대화를 다시 확인할 수 있어요.' : errorMessage}</Text>
        {!blocked && <Pressable accessibilityRole="button" onPress={() => setAttempt((current) => current + 1)} style={styles.retryButton}><Text style={styles.retryText}>다시 시도</Text></Pressable>}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <View style={styles.tradeContext}>
        <Pressable
          accessibilityLabel={`${room.trade.title} 교환글 보기`}
          accessibilityRole={tradeFeaturesEnabled ? 'button' : undefined}
          disabled={!tradeFeaturesEnabled}
          onPress={openTrade}
          style={({ pressed }) => [styles.tradeLink, pressed && styles.tradeLinkPressed]}
        >
          <RemoteImageWithFallback accessibilityLabel={`${room.trade.title} 이미지`} style={styles.tradeImage} uri={room.trade.thumbnailUrl} />
          <View style={styles.tradeCopy}>
            <Text numberOfLines={1} style={styles.tradeEyebrow}>교환 게시글</Text>
            <Text numberOfLines={2} style={styles.tradeTitle}>{room.trade.title}</Text>
          </View>
          {tradeFeaturesEnabled && <Text aria-hidden style={styles.tradeArrow}>›</Text>}
        </Pressable>
        <UserSafetyMenu
          onBlocked={() => navigation.goBack()}
          referenceId={String(roomId)}
          source="chat"
          targetMemberId={room.otherMember.memberId}
          targetNickname={room.otherMember.nickname}
        />
      </View>
      {connectionLabel && (
        <View style={styles.connectionNotice}>
          <Text style={styles.connectionNoticeText}>{connectionLabel}</Text>
          {socket.status !== 'connected' && socket.errorMessage && (
            <Pressable accessibilityRole="button" onPress={socket.retry}>
              <Text style={styles.connectionRetryText}>다시 연결</Text>
            </Pressable>
          )}
        </View>
      )}
      <FlatList
        contentContainerStyle={styles.messageList}
        data={messages}
        keyExtractor={({ messageId }) => messageId}
        ListEmptyComponent={<View style={styles.emptyMessages}><Text style={styles.muted}>첫 메시지를 보내 대화를 시작해 보세요.</Text></View>}
        ListHeaderComponent={hasPrevious ? (
          <Pressable accessibilityRole="button" disabled={isLoadingPrevious} onPress={() => void loadPrevious()} style={styles.previousButton}>
            <Text style={styles.previousText}>{isLoadingPrevious ? '불러오는 중…' : '이전 메시지 보기'}</Text>
          </Pressable>
        ) : null}
        ref={listRef}
        renderItem={({ item }) => {
          const mine = item.senderId === memberId;
          const imageUrls = item.files.map(({ url }) => url);
          if (item.type === 'ENTER' || item.type === 'LEAVE') {
            return <Text style={styles.systemMessage}>{item.content}</Text>;
          }
          return (
            <View style={[styles.messageRow, mine && styles.messageRowMine]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                {imageUrls.length > 0 && (
                  <View style={styles.messageImages}>
                    {imageUrls.map((url, index) => (
                      <Pressable key={`${item.messageId}-${url}`} onPress={() => setViewer({ index, urls: imageUrls })}>
                        <RemoteImageWithFallback accessibilityLabel={`채팅 사진 ${index + 1}`} style={styles.messageImage} uri={url} />
                      </Pressable>
                    ))}
                  </View>
                )}
                {item.content ? <Text style={[styles.messageText, mine && styles.messageTextMine]}>{item.content}</Text> : null}
              </View>
              <Text style={styles.messageTime}>{formatMessageTime(item.createdAt)}</Text>
            </View>
          );
        }}
      />
      {sendError && <Text style={styles.sendError}>{sendError}</Text>}
      <View style={[styles.composerRow, { paddingBottom: composerBottomPadding }]}>
        <Pressable accessibilityLabel="사진 보내기" accessibilityRole="button" disabled={isSending} onPress={() => void sendImages()} style={styles.imageButton}>
          <Text aria-hidden style={styles.imageButtonText}>＋</Text>
        </Pressable>
        <TextInput
          editable={!isSending}
          maxLength={1000}
          multiline
          onChangeText={setComposer}
          placeholder="메시지를 입력해 주세요"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={composer}
        />
        <Pressable accessibilityRole="button" disabled={isSending || !composer.trim()} onPress={() => void sendText()} style={styles.sendButton}>
          {isSending ? <ActivityIndicator color={colors.background} size="small" /> : <Text style={styles.sendButtonText}>전송</Text>}
        </Pressable>
      </View>
      <ImageViewerModal imageUrls={viewer?.urls ?? []} initialIndex={viewer?.index ?? 0} onClose={() => setViewer(null)} title="채팅 사진" visible={viewer !== null} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.surface },
  stateTitle: { color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retryButton: { minHeight: 44, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary },
  retryText: { color: colors.background, fontSize: 13, fontWeight: '800' },
  tradeContext: { minHeight: 76, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, backgroundColor: colors.background },
  tradeLink: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12 },
  tradeLinkPressed: { opacity: 0.72 },
  tradeImage: { width: 52, height: 52, borderRadius: 12 },
  tradeCopy: { flex: 1, minWidth: 0 },
  tradeEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  tradeTitle: { marginTop: 4, color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  tradeArrow: { color: colors.textMuted, fontSize: 22 },
  connectionNotice: { padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#fff8df' },
  connectionNoticeText: { color: '#8a651c', fontSize: 11, textAlign: 'center' },
  connectionRetryText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  messageList: { flexGrow: 1, padding: 14, gap: 10 },
  emptyMessages: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center' },
  previousButton: { minHeight: 38, marginBottom: 8, alignSelf: 'center', paddingHorizontal: 14, justifyContent: 'center', borderRadius: 19, backgroundColor: colors.background },
  previousText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  systemMessage: { alignSelf: 'center', paddingVertical: 4, color: colors.textMuted, fontSize: 11 },
  messageRow: { maxWidth: '82%', alignSelf: 'flex-start', alignItems: 'flex-start' },
  messageRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { maxWidth: '100%', padding: 11, borderRadius: 16 },
  bubbleMine: { borderBottomRightRadius: 4, backgroundColor: colors.primary },
  bubbleOther: { borderBottomLeftRadius: 4, backgroundColor: colors.background },
  messageText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  messageTextMine: { color: colors.background },
  messageTime: { marginTop: 4, color: colors.textMuted, fontSize: 9 },
  messageImages: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  messageImage: { width: 118, height: 118, borderRadius: 11 },
  sendError: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.primarySoft, color: colors.primary, fontSize: 11, textAlign: 'center' },
  composerRow: { paddingHorizontal: 10, paddingTop: 10, flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.background },
  imageButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 21 },
  imageButtonText: { color: colors.primary, fontSize: 26, lineHeight: 29 },
  input: { maxHeight: 120, minHeight: 42, flex: 1, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 18, color: colors.text, fontSize: 14 },
  sendButton: { minWidth: 56, height: 42, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.primary },
  sendButtonText: { color: colors.background, fontSize: 13, fontWeight: '800' },
});
