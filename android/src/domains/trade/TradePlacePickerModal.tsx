import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GachiKakaoMapView } from '../../../modules/gachi-kakao-map';
import { isKakaoMapConfigured } from '../../config/maps';
import { colors } from '../../theme/colors';
import type { TradePlaceInput } from './tradeTypes';

type Props = {
  initialValue: TradePlaceInput | null;
  onClose: () => void;
  onSelect: (place: TradePlaceInput) => void;
  title: string;
  visible: boolean;
};

const HONGDAE_CENTER = { latitude: 37.5563, longitude: 126.9236 };

function isKoreanCoordinate(latitude: number, longitude: number) {
  return latitude >= 33 && latitude <= 39 && longitude >= 124 && longitude <= 132;
}

export function TradePlacePickerModal({
  initialValue,
  onClose,
  onSelect,
  title,
  visible,
}: Props) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coordinate, setCoordinate] = useState(HONGDAE_CENTER);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMapError, setHasMapError] = useState(false);
  const mapConfigured = isKakaoMapConfigured();
  const canSave = mapConfigured && !hasMapError;

  useEffect(() => {
    if (!visible) return;
    setName(initialValue?.name ?? '');
    setAddress(initialValue?.address ?? '');
    setCoordinate(initialValue ?? HONGDAE_CENTER);
    setErrorMessage(null);
    setHasMapError(false);
  }, [initialValue, visible]);

  function save() {
    const normalizedAddress = address.trim();
    if (!normalizedAddress) {
      setErrorMessage('장소 주소를 입력해 주세요.');
      return;
    }
    if (!isKoreanCoordinate(coordinate.latitude, coordinate.longitude)) {
      setErrorMessage('대한민국 범위 안의 장소를 지도 중심에 맞춰 주세요.');
      return;
    }
    onSelect({
      ...(name.trim() ? { name: name.trim() } : {}),
      address: normalizedAddress,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
    onClose();
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      visible={visible}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.screen}
        >
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.headerButton}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              disabled={!canSave}
              onPress={save}
              style={styles.headerButton}
            >
              <Text style={[styles.saveText, !canSave && styles.disabledText]}>선택</Text>
            </Pressable>
          </View>

          <View style={styles.copy}>
            <Text style={styles.description}>
              주소와 장소명을 입력한 뒤, 지도를 움직여 중심 표시를 실제 위치에 맞춰 주세요.
            </Text>
            <TextInput
              maxLength={255}
              onChangeText={setName}
              placeholder="장소명 (선택)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={name}
            />
            <TextInput
              maxLength={255}
              onChangeText={setAddress}
              placeholder="주소"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={address}
            />
          </View>

          <View style={styles.mapFrame}>
            {mapConfigured ? (
              <>
                <GachiKakaoMapView
                  active={visible}
                  center={initialValue ?? HONGDAE_CENTER}
                  markers={[]}
                  onCameraMoveEnd={({ nativeEvent }) => {
                    setCoordinate(nativeEvent);
                    setErrorMessage(null);
                  }}
                  onMapError={() => {
                    setHasMapError(true);
                    setErrorMessage('지도를 불러오지 못했습니다. 장소를 저장하지 않았어요.');
                  }}
                  showsUserLocation={false}
                  style={styles.map}
                />
                <View accessibilityElementsHidden pointerEvents="none" style={styles.crosshair}>
                  <View style={styles.crosshairRing} />
                  <View style={styles.crosshairDot} />
                </View>
              </>
            ) : (
              <View style={styles.mapFallback}>
                <Text style={styles.errorText}>Kakao 지도 설정이 없어 장소를 선택할 수 없어요.</Text>
              </View>
            )}
          </View>
          <Text style={styles.coordinateText}>
            중심 좌표 {coordinate.latitude.toFixed(5)}, {coordinate.longitude.toFixed(5)}
          </Text>
          {errorMessage && (
            <Text accessibilityLiveRegion="polite" style={styles.errorText}>{errorMessage}</Text>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.surface },
  header: { minHeight: 56, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background },
  headerButton: { minWidth: 64, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  cancelText: { color: colors.textMuted, fontWeight: '700' },
  saveText: { color: colors.primary, fontWeight: '800' },
  disabledText: { opacity: 0.35 },
  copy: { padding: 16, gap: 10 },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  input: { minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 14, color: colors.text, backgroundColor: colors.background },
  mapFrame: { position: 'relative', height: 330, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: '#f3f1ed' },
  map: { flex: 1 },
  mapFallback: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  crosshair: { position: 'absolute', top: '50%', left: '50%', width: 32, height: 32, marginTop: -16, marginLeft: -16, alignItems: 'center', justifyContent: 'center' },
  crosshairRing: { position: 'absolute', width: 30, height: 30, borderWidth: 3, borderColor: colors.primary, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.7)' },
  crosshairDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  coordinateText: { marginTop: 12, color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  errorText: { marginTop: 10, paddingHorizontal: 18, color: colors.primary, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
