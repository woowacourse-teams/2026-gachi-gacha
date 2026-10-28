import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

const webBaseUrl = Constants.expoConfig?.extra?.webBaseUrl;
const initialUrl = typeof webBaseUrl === 'string' ? `${webBaseUrl}/trade` : null;

export default function App() {
  const webView = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const retry = () => {
    setError(null);
    setLoading(true);
    webView.current?.reload();
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        {initialUrl ? (
          <WebView
            ref={webView}
            source={{ uri: initialUrl }}
            style={styles.webView}
            javaScriptEnabled
            sharedCookiesEnabled
            allowsBackForwardNavigationGestures
            onLoadStart={() => {
              setLoading(true);
              setError(null);
            }}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('화면을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.');
            }}
            onShouldStartLoadWithRequest={({ url }) => {
              if (/^https:\/\//i.test(url) || url === 'about:blank') return true;
              if (/^(http|mailto|tel|sms):/i.test(url)) {
                void Linking.openURL(url).catch(() => {
                  setError('외부 앱을 열지 못했습니다.');
                });
              }
              return false;
            }}
          />
        ) : (
          <View style={styles.message}>
            <Text>앱 주소 설정을 확인해 주세요.</Text>
          </View>
        )}
        {loading && !error && initialUrl && (
          <View style={styles.loading} pointerEvents="none" accessibilityLabel="불러오는 중">
            <ActivityIndicator size="large" color="#E73456" />
          </View>
        )}
        {error && (
          <View style={styles.message} accessibilityLabel="웹 화면 오류">
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={retry} style={styles.retryButton} accessibilityRole="button">
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  webView: { flex: 1, backgroundColor: '#FFFFFF' },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  message: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorText: { color: '#242424', textAlign: 'center', fontSize: 16 },
  retryButton: {
    backgroundColor: '#E73456',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
