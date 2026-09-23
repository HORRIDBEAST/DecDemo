'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Belt-and-suspenders fix for the status bar drawing under the WebView content
 * (header text landing under the camera cutout / status bar icons). The
 * AndroidManifest.xml windowOptOutEdgeToEdgeEnforcement flag should already
 * prevent this, but some OEM Android skins (e.g. MIUI/HyperOS) don't fully
 * respect it, so this explicitly pushes the status bar out of the WebView too.
 * Renders nothing - it only runs a native-only side effect on mount.
 */
export function NativeInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    (async () => {
      try {
        const { StatusBar } = await import('@capacitor/status-bar');
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (error) {
        console.warn('StatusBar plugin unavailable:', error);
      }
    })();
  }, []);

  return null;
}
