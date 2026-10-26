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

import { getMemberReportEndpoint } from '../../config/memberSafety';
import { colors } from '../../theme/colors';
import {
  MEMBER_REPORT_REASONS,
  type MemberReportReason,
  type MemberReportSubmission,
  type MemberReportTarget,
} from './memberSafetyApi';

interface ReportDialogProps {
  target: MemberReportTarget | null;
  onClose: () => void;
  onSubmit: (submission: MemberReportSubmission) => Promise<void>;
}

export function ReportDialog({ target, onClose, onSubmit }: ReportDialogProps) {
  const [reason, setReason] = useState<MemberReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isConfigured = Boolean(getMemberReportEndpoint());

  useEffect(() => {
    if (!target) return;
    setReason(null);
    setDetails('');
    setIsSubmitted(false);
    setErrorMessage(null);
  }, [target]);

  async function handleSubmit() {
    if (!reason || isSubmitting || !isConfigured) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({ reason, details: details.trim() });
      setIsSubmitted(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '신고를 접수하지 못했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => {
        if (!isSubmitting) onClose();
      }}
      transparent
      visible={target !== null}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable
          accessibilityLabel="신고 창 닫기"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityViewIsModal style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" style={styles.title}>
                {target?.nickname ?? '사용자'}님 신고하기
              </Text>
              <Text style={styles.description}>문제가 되는 이유를 선택해 주세요.</Text>
            </View>
            <Pressable
              accessibilityLabel="신고 창 닫기"
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {isSubmitted ? (
            <View accessibilityLiveRegion="polite" style={styles.submitted}>
              <Text style={styles.submittedTitle}>신고를 접수했어요.</Text>
              <Text style={styles.description}>확인 후 필요한 조치를 진행할게요.</Text>
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>확인</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.reasonList}>
                {MEMBER_REPORT_REASONS.map((item) => {
                  const selected = reason === item.value;

                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      key={item.value}
                      onPress={() => setReason(item.value)}
                      style={[styles.reason, selected && styles.reasonSelected]}
                    >
                      <View style={[styles.radio, selected && styles.radioSelected]} />
                      <Text style={styles.reasonText}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.detailsLabel}>자세한 내용 (선택)</Text>
              <TextInput
                accessibilityLabel="신고 상세 내용"
                maxLength={500}
                multiline
                onChangeText={setDetails}
                placeholder="확인에 필요한 내용을 적어주세요."
                placeholderTextColor={colors.textMuted}
                style={styles.detailsInput}
                textAlignVertical="top"
                value={details}
              />
              {!isConfigured && (
                <Text accessibilityLiveRegion="polite" style={styles.notice}>
                  신고 접수 기능을 준비하고 있어요.
                </Text>
              )}
              {errorMessage && (
                <Text accessibilityLiveRegion="assertive" style={styles.error}>
                  {errorMessage}
                </Text>
              )}
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={onClose}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>취소</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={!reason || !isConfigured || isSubmitting}
                  onPress={() => void handleSubmit()}
                  style={[
                    styles.primaryButton,
                    (!reason || !isConfigured || isSubmitting) && styles.disabled,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {isConfigured ? '신고 접수' : '접수 준비 중'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: 'rgba(24, 21, 22, 0.56)',
  },
  panel: {
    maxHeight: '88%',
    padding: 22,
    borderRadius: 24,
    backgroundColor: colors.background,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1 },
  title: { color: colors.text, fontSize: 21, fontWeight: '800' },
  description: { marginTop: 6, color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.surface,
  },
  closeText: { color: colors.text, fontSize: 25, lineHeight: 27 },
  reasonList: { marginTop: 20, gap: 8 },
  reason: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  reasonSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: { width: 18, height: 18, borderWidth: 2, borderColor: colors.textMuted, borderRadius: 9 },
  radioSelected: { borderWidth: 5, borderColor: colors.primary, backgroundColor: colors.background },
  reasonText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  detailsLabel: { marginTop: 18, color: colors.text, fontSize: 14, fontWeight: '700' },
  detailsInput: {
    minHeight: 96,
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  notice: { marginTop: 12, padding: 12, borderRadius: 12, color: colors.textMuted, backgroundColor: colors.surface, fontSize: 13 },
  error: { marginTop: 12, color: colors.primary, fontSize: 13 },
  actions: { marginTop: 20, flexDirection: 'row', gap: 8 },
  secondaryButton: {
    minHeight: 46,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  secondaryButtonText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  primaryButton: {
    minHeight: 46,
    paddingHorizontal: 18,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  primaryButtonText: { color: colors.background, fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.42 },
  submitted: { minHeight: 230, alignItems: 'center', justifyContent: 'center' },
  submittedTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
});
