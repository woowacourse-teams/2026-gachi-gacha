import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RemoteImageWithFallback } from '../../components/RemoteImageWithFallback';
import { colors } from '../../theme/colors';
import {
  findMatchingAffiliateCategory,
  getVisibleAffiliateProducts,
  isAllowedAffiliateUrl,
} from './affiliateCatalog';
import type { AffiliateCatalogProduct } from './affiliateCatalogType';
import { AFFILIATE_CATALOG } from './generatedCatalog';

const DISCLOSURE =
  '이 굿즈들은 네이버 쇼핑 커넥트 제휴로, 판매 발생 시 수수료를 제공받습니다.';

type PlacementProps = {
  categoryNames: readonly string[];
  placementPath: '/search' | '/map' | '/trade';
  title?: string;
};

async function openAffiliateProduct(product: AffiliateCatalogProduct) {
  if (!isAllowedAffiliateUrl(product.affiliateUrl)) {
    Alert.alert('상품 링크를 열 수 없어요', '안전한 네이버 제휴 링크인지 확인해 주세요.');
    return;
  }

  try {
    await Linking.openURL(product.affiliateUrl);
  } catch {
    Alert.alert('상품 링크를 열 수 없어요', '잠시 후 다시 시도해 주세요.');
  }
}

function AffiliateProductCard({ product }: { product: AffiliateCatalogProduct }) {
  return (
    <Pressable
      accessibilityHint="시스템 브라우저에서 네이버 상품을 엽니다."
      accessibilityLabel={`${product.title}, 네이버에서 보기`}
      accessibilityRole="link"
      onPress={() => void openAffiliateProduct(product)}
      style={({ pressed }) => [styles.productCard, pressed && styles.pressed]}
    >
      <RemoteImageWithFallback
        accessibilityLabel={`${product.title} 상품 이미지`}
        style={styles.productImage}
        uri={product.thumbnailUrl}
      />
      <Text numberOfLines={2} style={styles.productTitle}>{product.title}</Text>
      <Text style={styles.externalHint}>네이버에서 보기 ↗</Text>
    </Pressable>
  );
}

function AffiliateCatalogSection({
  categoryName,
  placementPath,
}: {
  categoryName: string;
  placementPath: PlacementProps['placementPath'];
}) {
  const products = useMemo(
    () => getVisibleAffiliateProducts({
      catalog: AFFILIATE_CATALOG,
      categoryName,
      placementPath,
    }),
    [categoryName, placementPath],
  );

  if (products.length === 0) return null;

  return (
    <View accessibilityLabel="네이버 쇼핑 커넥트 제휴 상품" style={styles.section}>
      <View style={styles.titleRow}>
        <View style={styles.badge}><Text style={styles.badgeText}>제휴</Text></View>
        <Text style={styles.sectionTitle}>네이버 쇼핑에서 파는 {categoryName} 굿즈</Text>
      </View>
      <Text style={styles.disclosure}>{DISCLOSURE}</Text>
      <FlatList
        contentContainerStyle={styles.productList}
        data={products}
        horizontal
        keyExtractor={({ id }) => id}
        renderItem={({ item }) => <AffiliateProductCard product={item} />}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

function useMatchingCategory({ categoryNames, placementPath, title }: PlacementProps) {
  return useMemo(
    () => findMatchingAffiliateCategory({
      catalog: AFFILIATE_CATALOG,
      categoryNames,
      placementPath,
      ...(title === undefined ? {} : { title }),
    }),
    [categoryNames, placementPath, title],
  );
}

export function AffiliateCatalogPlacement(props: PlacementProps) {
  const categoryName = useMatchingCategory(props);
  if (!categoryName) return null;

  return (
    <AffiliateCatalogSection
      categoryName={categoryName}
      placementPath={props.placementPath}
    />
  );
}

export function MapAffiliateCatalogButton(props: PlacementProps) {
  const [visible, setVisible] = useState(false);
  const categoryName = useMatchingCategory(props);
  if (!categoryName) return null;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}
      >
        <Text style={styles.mapButtonText}>제휴 굿즈 보기</Text>
      </Pressable>
      <Modal
        animationType="slide"
        onRequestClose={() => setVisible(false)}
        transparent
        visible={visible}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Pressable
              accessibilityLabel="제휴 상품 닫기"
              accessibilityRole="button"
              onPress={() => setVisible(false)}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </Pressable>
            <AffiliateCatalogSection
              categoryName={categoryName}
              placementPath={props.placementPath}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  titleRow: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 9 },
  badge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: '#24253a' },
  badgeText: { color: colors.background, fontSize: 11, fontWeight: '800' },
  sectionTitle: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '800', lineHeight: 23 },
  disclosure: { marginTop: 8, paddingHorizontal: 16, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  productList: { paddingTop: 16, paddingHorizontal: 16, gap: 12 },
  productCard: {
    width: 190,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  productImage: { width: '100%', aspectRatio: 1, borderRadius: 12 },
  productTitle: { minHeight: 42, marginTop: 10, color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  externalHint: { marginTop: 8, color: colors.primary, fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.72 },
  mapButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 17,
    backgroundColor: colors.background,
  },
  mapButtonText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20, 18, 19, 0.42)' },
  modalSheet: { maxHeight: '72%', paddingTop: 10, paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.background },
  modalHandle: { width: 42, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: '#d5d5d8' },
  closeButton: { minHeight: 44, paddingHorizontal: 18, alignSelf: 'flex-end', justifyContent: 'center' },
  closeButtonText: { color: colors.primary, fontWeight: '800' },
});
