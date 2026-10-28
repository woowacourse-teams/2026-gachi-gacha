import SwiftUI
import WebKit

@main
struct GachiGachaApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

private struct ContentView: View {
    @StateObject private var browser = BrowserModel()

    var body: some View {
        ZStack {
            BrowserView(browser: browser)

            if browser.isLoading {
                ProgressView("불러오는 중")
                    .padding(16)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
                    .accessibilityIdentifier("web-loading")
            }

            if let errorMessage = browser.errorMessage {
                VStack(spacing: 16) {
                    Image(systemName: "wifi.exclamationmark")
                        .font(.largeTitle)
                    Text(errorMessage)
                        .multilineTextAlignment(.center)
                    Button("다시 시도", action: browser.retry)
                        .buttonStyle(.borderedProminent)
                }
                .padding(24)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(uiColor: .systemBackground))
                .accessibilityIdentifier("web-error")
            }
        }
        .background(Color(uiColor: .systemBackground))
    }
}

private struct BrowserView: UIViewRepresentable {
    @ObservedObject var browser: BrowserModel

    func makeUIView(context: Context) -> WKWebView {
        browser.webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

@MainActor
private final class BrowserModel: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate {
    @Published var isLoading = false
    @Published var errorMessage: String?

    let webView: WKWebView
    private let startURL: URL?

    override init() {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.websiteDataStore = .default()

        webView = WKWebView(frame: .zero, configuration: configuration)
        startURL = Self.configuredStartURL()
        super.init()

        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true

        if let startURL {
            webView.load(URLRequest(url: startURL))
        } else {
            errorMessage = "앱 주소 설정을 확인해 주세요."
        }
    }

    func retry() {
        errorMessage = nil
        if webView.url != nil {
            webView.reload()
        } else if let startURL {
            webView.load(URLRequest(url: startURL))
        } else {
            errorMessage = "앱 주소 설정을 확인해 주세요."
        }
    }

    private static func configuredStartURL() -> URL? {
        guard let value = Bundle.main.object(forInfoDictionaryKey: "AppBaseURL") as? String,
              let url = URL(string: value),
              url.scheme == "https",
              url.host != nil else {
            return nil
        }
        return url
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        isLoading = true
        errorMessage = nil
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        isLoading = false
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        show(error)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        show(error)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        isLoading = false
        errorMessage = "화면을 불러오지 못했습니다. 다시 시도해 주세요."
    }

    private func show(_ error: Error) {
        guard (error as NSError).code != NSURLErrorCancelled else { return }
        isLoading = false
        errorMessage = "화면을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요."
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }

        if url.scheme == "http" || url.scheme == "https" {
            decisionHandler(.allow)
        } else {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
        }
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil {
            webView.load(navigationAction.request)
        }
        return nil
    }
}
