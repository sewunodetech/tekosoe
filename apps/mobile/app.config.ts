import type { ConfigContext, ExpoConfig } from 'expo/config';
import { AndroidConfig, withAndroidStyles, type ConfigPlugin } from 'expo/config-plugins';

// Domain passkey (rpId) harus sama dengan yang dipakai src/lib/env.ts dan domain yang
// melayani /.well-known (apps/web). Saat build EAS nilainya diambil dari environment EAS.
const passkeyDomain = process.env.EXPO_PUBLIC_PASSKEY_DOMAIN || 'www.tekosue.xyz';
// Domain link undangan (https://<webDomain>/j/<kode>); sama dengan default di src/lib/env.ts.
const webDomain = process.env.EXPO_PUBLIC_WEB_DOMAIN || passkeyDomain;

// App hanya mode terang. Beberapa ROM (MIUI/HyperOS) memaksa app terang jadi gelap saat HP
// dalam mode gelap — termasuk splash. Matikan force dark di tema app dan splash.
const withNoForceDark: ConfigPlugin = (config) =>
  withAndroidStyles(config, (cfg) => {
    for (const name of ['AppTheme', 'Theme.App.SplashScreen']) {
      cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
        add: true,
        parent: { name },
        name: 'android:forceDarkAllowed',
        value: 'false',
      });
    }
    // Latar jendela ivory (bukan latar DayNight gelap) supaya tidak ada frame kosong gelap/abu-abu.
    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: { name: 'AppTheme' },
      name: 'android:windowBackground',
      value: '@color/splashscreen_background',
    });
    return cfg;
  });

export default ({ config }: ConfigContext): ExpoConfig =>
  withNoForceDark({
    ...(config as ExpoConfig),
    ios: {
      ...config.ios,
      associatedDomains: [...new Set([`webcredentials:${passkeyDomain}`, `applinks:${passkeyDomain}`, `applinks:${webDomain}`])],
    },
    android: {
      ...config.android,
      // App Links: link undangan langsung membuka app (terverifikasi lewat /.well-known/assetlinks.json di webDomain).
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: webDomain, pathPrefix: '/j/' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
  });
