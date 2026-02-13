import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

export interface KeyboardShortcutGroup {
  group: string;
  shortcuts: KeyboardShortcut[];
}

/**
 * Hook to register keyboard shortcuts
 * @param shortcuts Array of keyboard shortcuts to register
 * @param enabled Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcutsRef.current) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}

/**
 * Hook for global navigation shortcuts
 */
export function useGlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: 'd',
      alt: true,
      description: 'Go to Dashboard',
      action: () => {
        if (!pathname?.includes('/dashboard')) {
          router.push('/dashboard');
          toast.info('Navigated to Dashboard');
        }
      },
    },
    {
      key: 'a',
      alt: true,
      description: 'Go to Applications',
      action: () => {
        if (!pathname?.includes('/applications')) {
          router.push('/applications');
          toast.info('Navigated to Applications');
        }
      },
    },
    {
      key: 't',
      alt: true,
      description: 'Go to A/B Testing',
      action: () => {
        if (!pathname?.includes('/ab-testing')) {
          router.push('/ab-testing');
          toast.info('Navigated to A/B Testing');
        }
      },
    },
    {
      key: 'm',
      alt: true,
      description: 'Go to Template Marketplace',
      action: () => {
        if (!pathname?.includes('/marketplace')) {
          router.push('/marketplace');
          toast.info('Navigated to Template Marketplace');
        }
      },
    },
    {
      key: 'y',
      alt: true,
      description: 'Go to Analytics',
      action: () => {
        if (!pathname?.includes('/template-analytics')) {
          router.push('/template-analytics');
          toast.info('Navigated to Template Analytics');
        }
      },
    },
    // Help shortcut
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      action: () => {
        toast.info('Keyboard shortcuts help opened', {
          description: 'Alt+D: Dashboard | Alt+A: Applications | Alt+T: A/B Testing | Alt+M: Marketplace | Alt+Y: Analytics',
          duration: 5000,
        });
      },
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

/**
 * Hook for list page shortcuts (common CRUD operations)
 */
export function useListPageShortcuts({
  onNew,
  onRefresh,
  onSearch,
}: {
  onNew?: () => void;
  onRefresh?: () => void;
  onSearch?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (onNew) {
    shortcuts.push({
      key: 'n',
      description: 'Create new item',
      action: onNew,
    });
  }

  if (onRefresh) {
    shortcuts.push({
      key: 'r',
      description: 'Refresh list',
      action: onRefresh,
    });
  }

  if (onSearch) {
    shortcuts.push({
      key: '/',
      description: 'Focus search',
      action: onSearch,
    });
  }

  useKeyboardShortcuts(shortcuts);
}

/**
 * Hook for modal shortcuts
 */
export function useModalShortcuts({
  onClose,
  onSave,
  enabled = true,
}: {
  onClose: () => void;
  onSave?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'Escape',
      description: 'Close modal',
      action: onClose,
    },
  ];

  if (onSave) {
    shortcuts.push({
      key: 's',
      ctrl: true,
      description: 'Save',
      action: onSave,
    });
    shortcuts.push({
      key: 'Enter',
      ctrl: true,
      description: 'Save',
      action: onSave,
    });
  }

  useKeyboardShortcuts(shortcuts, enabled);
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.meta) parts.push('Cmd');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
}

/**
 * Get all available shortcuts for help display
 */
export function getAvailableShortcuts(): KeyboardShortcutGroup[] {
  return [
    {
      group: 'Navigation',
      shortcuts: [
        {
          key: 'd',
          alt: true,
          description: 'Go to Dashboard',
          action: () => {},
        },
        {
          key: 'a',
          alt: true,
          description: 'Go to Applications',
          action: () => {},
        },
        {
          key: 't',
          alt: true,
          description: 'Go to A/B Testing',
          action: () => {},
        },
        {
          key: 'm',
          alt: true,
          description: 'Go to Template Marketplace',
          action: () => {},
        },
        {
          key: 'y',
          alt: true,
          description: 'Go to Analytics',
          action: () => {},
        },
      ],
    },
    {
      group: 'Actions',
      shortcuts: [
        {
          key: 'n',
          description: 'Create new item',
          action: () => {},
        },
        {
          key: 'r',
          description: 'Refresh list',
          action: () => {},
        },
        {
          key: '/',
          description: 'Focus search',
          action: () => {},
        },
      ],
    },
    {
      group: 'Modals',
      shortcuts: [
        {
          key: 'Escape',
          description: 'Close modal',
          action: () => {},
        },
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          action: () => {},
        },
      ],
    },
    {
      group: 'Help',
      shortcuts: [
        {
          key: '?',
          shift: true,
          description: 'Show keyboard shortcuts',
          action: () => {},
        },
      ],
    },
  ];
}
