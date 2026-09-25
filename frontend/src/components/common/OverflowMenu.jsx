import { useEffect, useRef, useState } from 'react';

/** A small "..." menu for secondary actions that don't need top billing. */
export default function OverflowMenu({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="overflow-menu" ref={ref}>
      <button
        type="button"
        className="btn-secondary icon-button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="More actions"
        aria-expanded={isOpen}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {isOpen && (
        <div className="overflow-menu-dropdown" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={item.danger ? 'overflow-item-danger' : ''}
              onClick={() => {
                setIsOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
