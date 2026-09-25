import { useState } from 'react';

export default function CopyablePhone({ phone }) {
  const [copied, setCopied] = useState(false);

  if (!phone) return <span>—</span>;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — nothing to fall back to gracefully.
    }
  }

  return (
    <button type="button" className="copyable-phone mono" onClick={handleCopy} aria-label={`Copy phone number ${phone}`}>
      {phone}
      <span className="copyable-phone-hint">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}
