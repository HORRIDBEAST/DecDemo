import type { CapacitorConfig } from '@capacitor/cli';

// Thin native shell: the WebView loads the live Vercel deployment, so Next.js API routes,
// Supabase auth and the NestJS/FastAPI backends behave exactly as they do in the browser.
const config: CapacitorConfig = {
  appId: 'com.claimlens.app',
  appName: 'ClaimLens',
  webDir: 'www', // only holds an offline fallback page; the app itself is served from server.url
  server: {
    url: 'https://dec-demo.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
};

export default config;
