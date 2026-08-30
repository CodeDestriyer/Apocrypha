import { useState } from 'react';
import { useLang } from './i18n.jsx';
import { useInstall } from './installPrompt.js';

// Visible "Install Apocrypha" control. Renders nothing when the app is already
// installed (standalone) or when the platform offers no install path at all
// (e.g. desktop Firefox), so it never shows a dead button.
//
// variant:
//   'login'    — a full-width secondary button (used on the login screen).
//   'row'      — a settings-dropdown row (used in the in-app ⚙ menu).
export default function InstallAppButton({ variant = 'login' }) {
  const { t } = useLang();
  const { installed, canPrompt, ios, promptInstall } = useInstall();
  const [iosHint, setIosHint] = useState(false);

  // Already installed → nothing to offer.
  if (installed) return null;
  // Nothing to show unless we have a live prompt (Android/Chrome/Edge/desktop)
  // or we're on iOS (manual Share-sheet path).
  if (!canPrompt && !ios) return null;

  const onClick = () => {
    if (canPrompt) { promptInstall(); return; }
    if (ios) setIosHint((v) => !v);
  };

  const label = t('install.button');
  const hint = ios && iosHint ? <div className="install-ios-hint">{t('install.iosHint')}</div> : null;

  if (variant === 'row') {
    return (
      <>
        <button className="settings-row install-row" onClick={onClick}>
          <span>{label}</span>
          <span className="settings-row-value">⤓</span>
        </button>
        {hint}
      </>
    );
  }

  return (
    <div className="install-block">
      <button className="ghost-btn install-btn" onClick={onClick}>
        <span className="install-glyph" aria-hidden="true">⤓</span>
        <span>{label}</span>
      </button>
      {hint}
    </div>
  );
}
