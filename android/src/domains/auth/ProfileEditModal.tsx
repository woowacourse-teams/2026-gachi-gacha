import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { RemoteImageWithFallback } from '../../components/RemoteImageWithFallback';
import { colors } from '../../theme/colors';
import { uploadProfileImage } from './authApi';
import type { AuthMember, ProfileImageUpload } from './authTypes';
import { useAuthSession } from './AuthSessionContext';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSION_TO_MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

type Props = {
  member: AuthMember;
  onClose: () => void;
  onSaved: () => void;
  visible: boolean;
};

function resolveImageUpload(asset: ImagePicker.ImagePickerAsset): ProfileImageUpload {
  if (asset.fileSize !== undefined && asset.fileSize > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('프로필 사진은 10MB 이하만 올릴 수 있어요.');
  }

  const fileName = asset.fileName?.trim() ?? '';
  const extensionSource = fileName || asset.uri.split('?')[0] || '';
  const extension = extensionSource.split('.').pop()?.toLowerCase() ?? '';
  const mimeType = asset.mimeType?.toLowerCase() ?? EXTENSION_TO_MIME[extension];

  if (!mimeType || !MIME_TYPES.has(mimeType)) {
    throw new Error('JPG, PNG, WebP 형식의 사진만 올릴 수 있어요.');
  }

  const normalizedExtension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
  return {
    fileName: fileName || `gachigacha-profile.${normalizedExtension}`,
    mimeType,
    uri: asset.uri,
  };
}

export function ProfileEditModal({ member, onClose, onSaved, visible }: Props) {
  const { updateProfile } = useAuthSession();
  const [nickname, setNickname] = useState('');
  const [location, setLocation] = useState('');
  const [selectedImage, setSelectedImage] = useState<ProfileImageUpload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setNickname(member.nickname ?? '');
    setLocation(member.desireTradeLocation ?? '');
    setSelectedImage(null);
    setErrorMessage(null);
  }, [member.desireTradeLocation, member.nickname, visible]);

  async function selectImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ['images'],
        quality: 0.9,
      });
      if (result.canceled || !result.assets[0]) return;
      setSelectedImage(resolveImageUpload(result.assets[0]));
      setErrorMessage(null);
    } catch (error) {
      setSelectedImage(null);
      setErrorMessage(
        error instanceof Error ? error.message : '프로필 사진을 선택하지 못했습니다.',
      );
    }
  }

  async function saveProfile() {
    const normalizedNickname = nickname.trim();
    const normalizedLocation = location.trim();

    if (!normalizedNickname) {
      setErrorMessage('닉네임을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const profileImageUrl = selectedImage
        ? await uploadProfileImage(selectedImage)
        : member.profileImageUrl;
      await updateProfile({
        desireTradeLocation: normalizedLocation || null,
        nickname: normalizedNickname,
        profileImageUrl,
      });
      onSaved();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '프로필을 저장하지 못했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={isSubmitting ? undefined : onClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <Text accessibilityRole="header" style={styles.title}>프로필 수정</Text>
                <Text style={styles.description}>앱과 웹에 같은 프로필 정보가 표시돼요.</Text>
              </View>
              <Pressable
                accessibilityLabel="프로필 수정 닫기"
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={onClose}
                style={styles.closeButton}
              >
                <Text aria-hidden style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.photoArea}>
              <RemoteImageWithFallback
                accessibilityLabel="프로필 사진 미리보기"
                style={styles.avatar}
                uri={selectedImage?.uri ?? member.profileImageUrl}
              />
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => void selectImage()}
                style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}
              >
                <Text style={styles.photoButtonText}>사진 선택</Text>
              </Pressable>
              <Text style={styles.photoHelp}>JPG, PNG, WebP · 최대 10MB</Text>
            </View>

            <Text style={styles.label}>닉네임</Text>
            <TextInput
              autoCapitalize="none"
              editable={!isSubmitting}
              maxLength={30}
              onChangeText={setNickname}
              placeholder="닉네임을 입력해 주세요"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={nickname}
            />

            <Text style={styles.label}>선호 거래 지역</Text>
            <TextInput
              editable={!isSubmitting}
              maxLength={100}
              onChangeText={setLocation}
              placeholder="예: 홍대입구역 8번 출구"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={location}
            />

            {errorMessage && (
              <Text accessibilityLiveRegion="polite" style={styles.errorText}>
                {errorMessage}
              </Text>
            )}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => void saveProfile()}
              style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
            >
              {isSubmitting && <ActivityIndicator color={colors.background} size="small" />}
              <Text style={styles.saveText}>{isSubmitting ? '저장 중...' : '저장하기'}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(36, 33, 34, 0.38)',
  },
  sheet: {
    maxHeight: '90%',
    overflow: 'hidden',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.surface,
  },
  content: { padding: 22, paddingBottom: 36 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleCopy: { flex: 1 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  description: { marginTop: 6, color: colors.textMuted, fontSize: 13 },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.background,
  },
  closeText: { color: colors.text, fontSize: 27, lineHeight: 30 },
  photoArea: { marginVertical: 24, alignItems: 'center' },
  avatar: { width: 94, height: 94, borderRadius: 47 },
  photoButton: {
    minHeight: 40,
    marginTop: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  photoButtonText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  photoHelp: { marginTop: 7, color: colors.textMuted, fontSize: 11 },
  label: { marginTop: 16, color: colors.text, fontSize: 13, fontWeight: '800' },
  input: {
    minHeight: 50,
    marginTop: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 15,
  },
  errorText: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontSize: 13,
    lineHeight: 19,
  },
  saveButton: {
    minHeight: 50,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  saveText: { color: colors.background, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
