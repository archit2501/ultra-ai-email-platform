"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { getAvailableShortcuts, formatShortcut } from "@/hooks/useKeyboardShortcuts";

export function KeyboardShortcutsIndicator() {
  const [showHelp, setShowHelp] = useState(false);
  const shortcuts = getAvailableShortcuts();

  return (
    <>
      {/* Floating Help Button */}
      <motion.button
        className="fixed bottom-6 right-6 p-3 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg hover:shadow-xl transition-shadow z-40 group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowHelp(true)}
        title="Keyboard shortcuts (Shift+?)"
        aria-label="Open keyboard shortcuts help"
      >
        <Keyboard className="w-5 h-5" aria-hidden="true" />
        <motion.div
          className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={false}
        />
      </motion.button>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="shortcuts-title"
            >
              <motion.div
                className="relative max-w-2xl w-full bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl shadow-2xl border border-white/10 p-6 max-h-[80vh] overflow-y-auto"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-400/30">
                      <Keyboard className="w-6 h-6 text-purple-300" />
                    </div>
                    <div>
                      <h2 id="shortcuts-title" className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
                      <p className="text-sm text-gray-400">Speed up your workflow</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    aria-label="Close shortcuts help"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Shortcuts List */}
                <div className="space-y-6">
                  {shortcuts.map((group) => (
                    <div key={group.group}>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        {group.group}
                      </h3>
                      <div className="space-y-2">
                        {group.shortcuts.map((shortcut, index) => (
                          <motion.div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <span className="text-gray-300">{shortcut.description}</span>
                            <kbd className="px-3 py-1.5 rounded-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 text-sm font-mono text-white shadow-sm">
                              {formatShortcut(shortcut)}
                            </kbd>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-xs text-gray-500 text-center">
                    Press <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono">Shift</kbd> +{" "}
                    <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono">?</kbd> anytime to show this help
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
