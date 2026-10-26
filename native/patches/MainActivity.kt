package io.github.thesousaleo.acervo

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Mantém o layout igual em todos os aparelhos: o WebView não aplica a escala
        // de fonte do sistema (que fazia partes do app passarem da largura da tela).
        bridge.webView.settings.textZoom = 100
        bridge.webView.settings.setSupportZoom(false)
    }
}
