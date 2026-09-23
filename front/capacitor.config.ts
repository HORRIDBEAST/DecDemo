import type { CapacitorConfig } from '@capacitor/cli';

// Thin native shell: the WebView loads the live Vercel deployment, so Next.js API routes,
// Supabase auth and the NestJS/FastAPI backends behave exactly as they do in the browser.
const config: CapacitorConfig = {
  appId: 'com.claimlens.app',
  appName: 'ClaimLens',
  webDir: 'www', // only holds an offline fallback page; the app itself is served from server.url
  server: {
    // DEV/HACKATHON ONLY: pointed at the android-migration branch's Vercel preview
    // deployment so in-progress UI changes are testable on-device without touching
    // production. Switch back to https://dec-demo.vercel.app before the demo, or once
    // this branch merges to main. See ROLLBACK.md.
    url: 'https://dec-demo-git-android-migration-horridbeasts-projects.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
};

export default config;
