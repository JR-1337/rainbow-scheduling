import React from 'react';
import { THEME } from '../theme';
import { haptic } from './uiKit';

/**
 * Shared mobile bottom nav frame for both admin and employee views.
 *
 * @param {Array} tabs - [{ key, icon: Component, label, badge }]
 *   badge: null | {type: 'dot', show: boolean} | {type: 'count', value: number}
 * @param {string} activeKey
 * @param {(key: string) => void} onTabClick
 */
const MobileBottomNavShell = ({ tabs, activeKey, onTabClick }) => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-[100] border-t"
    style={{
      backgroundColor: THEME.bg.secondary,
      borderColor: THEME.border.subtle,
      paddingBottom: 'env(safe-area-inset-bottom)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}
    aria-label="Primary"
  >
    <div className="flex justify-around items-stretch h-14">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const active = tab.key === activeKey;
        const ariaLabel = tab.badge?.type === 'count' && tab.badge.value > 0
          ? `${tab.label} (${tab.badge.value} pending)`
          : tab.label;
        return (
          <button
            key={tab.key}
            onClick={() => { haptic(); onTabClick(tab.key); }}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px]"
            style={{ color: active ? THEME.accent.blue : THEME.text.muted }}
            aria-label={ariaLabel}
            aria-current={active ? 'page' : undefined}
          >
            <div className="relative">
              <Icon size={20} />
              {tab.badge?.type === 'dot' && tab.badge.show && (
                <div
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#F87171' }}
                />
              )}
              {tab.badge?.type === 'count' && tab.badge.value > 0 && (
                <div
                  className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#F87171', fontSize: '9px', fontWeight: 700, color: '#FFFFFF' }}
                >
                  {tab.badge.value > 9 ? '9+' : tab.badge.value}
                </div>
              )}
            </div>
            <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default MobileBottomNavShell;
