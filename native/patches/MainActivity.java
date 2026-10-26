package io.github.thesousaleo.acervo;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Mantém o layout igual em todos os aparelhos: o WebView não aplica a escala
        // de fonte do sistema (que fazia partes do app passarem da largura da tela).
        this.getBridge().getWebView().getSettings().setTextZoom(100);
        this.getBridge().getWebView().getSettings().setSupportZoom(false);
    }
}
