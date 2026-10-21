import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  imageUrls: string[];
  initialIndex: number;
  onClose: () => void;
  title: string;
  visible: boolean;
};

export function ImageViewerModal({ imageUrls, initialIndex, onClose, title, visible }: Props) {
  const { height, width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) setActiveIndex(initialIndex);
  }, [initialIndex, visible]);

  function updateActiveIndex(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), imageUrls.length - 1));
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          <Pressable
            accessibilityLabel="사진 크게 보기 닫기"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          >
            <View accessible={false} style={styles.closeGlyph}>
              <View style={[styles.closeLine, styles.closeLineForward]} />
              <View style={[styles.closeLine, styles.closeLineBackward]} />
            </View>
          </Pressable>
        </View>
        <FlatList
          data={imageUrls}
          getItemLayout={(_, index) => ({ index, length: width, offset: width * index })}
          horizontal
          initialScrollIndex={initialIndex}
          key={`${visible}-${initialIndex}-${width}`}
          keyExtractor={(url, index) => `${url}-${index}`}
          onMomentumScrollEnd={updateActiveIndex}
          pagingEnabled
          renderItem={({ item, index }) => (
            <View style={[styles.imagePage, { height: height - 150, width }]}>
              <Image
                accessibilityLabel={`${title} 사진 ${index + 1}`}
                resizeMode="contain"
                source={{ uri: item }}
                style={styles.image}
              />
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        />
        <Text accessibilityLiveRegion="polite" style={styles.counter}>
          {activeIndex + 1} / {imageUrls.length}
        </Text>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111111' },
  header: { minHeight: 60, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  title: { flex: 1, color: '#ffffff', fontSize: 16, fontWeight: '700' },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#2f2f2f' },
  closeButtonPressed: { backgroundColor: '#4a4a4a' },
  closeGlyph: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  closeLine: { position: 'absolute', width: 20, height: 2, borderRadius: 1, backgroundColor: '#ffffff' },
  closeLineForward: { transform: [{ rotate: '45deg' }] },
  closeLineBackward: { transform: [{ rotate: '-45deg' }] },
  imagePage: { alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  counter: { paddingVertical: 14, color: '#ffffff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
