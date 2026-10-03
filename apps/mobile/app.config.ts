import type { ConfigContext, ExpoConfig } from 'expo/config';
import { AndroidConfig, withAndroidStyles, type ConfigPlugin } from 'expo/config-plugins';

// Domain passkey (rpId) harus sama dengan yang dipakai src/lib/env.ts dan domain yang
// melayani /.well-known (apps/web). Saat build EAS nilainya diambil dari environment EAS.
const passkeyDomain = process.env.EXPO_PUBLIC_PASSKEY_DOMAIN || 'tekosoe.mulalabs.biz.id';

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
      associatedDomains: [`webcredentials:${passkeyDomain}`, `applinks:${passkeyDomain}`],
    },
  });
