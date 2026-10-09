const KEY = 'zipzip-macera-settings-v1';

interface SettingsData {
  music: boolean;
  sfx: boolean;
}

function load(): SettingsData {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<SettingsData>;
    return { music: data.music ?? true, sfx: data.sfx ?? true };
  } catch {
    return { music: true, sfx: true };
  }
}

/** Kullanıcı tercihleri; tarayıcıda saklanır (erişilemezse varsayılanlar kullanılır). */
export const Settings = {
  ...load(),

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ music: Settings.music, sfx: Settings.sfx }));
    } catch {
      /* depolama kapalı */
    }
  },
};
