import { Capacitor } from '@capacitor/core';

/** Ajustes nativos: barra de status transparente e fallback de safe-area no Android. */
export async function initNative() {
  if (!Capacitor.isNativePlatform()) return;
  document.documentElement.classList.add('native', `native-${Capacitor.getPlatform()}`);
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === 'android') await StatusBar.setBackgroundColor({ color: '#00000000' });
  } catch { /* plugin indisponível */ }

  // Alguns WebViews Android ainda reportam env(safe-area-inset-*) = 0 mesmo desenhando por trás das barras.
  requestAnimationFrame(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;left:0;height:env(safe-area-inset-top,0px);width:0;padding-bottom:env(safe-area-inset-bottom,0px);visibility:hidden';
    document.body.appendChild(probe);
    const top = probe.getBoundingClientRect().height;
    const bottom = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
    probe.remove();
    const root = document.documentElement.style;
    if (top < 1) root.setProperty('--sat', '32px');
    if (bottom < 1) root.setProperty('--sab', '18px');
  });
}
