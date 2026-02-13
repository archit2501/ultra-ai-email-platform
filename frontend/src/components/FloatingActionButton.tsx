"use client";

import { useState } from "react";
import { Plus, FileText, Upload, Mail, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const actions = [
    {
      icon: FileText,
      label: "New Application",
      color: "from-blue-600 to-blue-700",
      onClick: () => router.push("/applications?new=true"),
    },
    {
      icon: Upload,
      label: "Upload Resume",
      color: "from-purple-600 to-purple-700",
      onClick: () => router.push("/resumes?upload=true"),
    },
    {
      icon: Mail,
      label: "Create Template",
      color: "from-pink-600 to-pink-700",
      onClick: () => router.push("/templates?new=true"),
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action Buttons */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 mb-2">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  aria-label={action.label}
                  className={`group relative w-14 h-14 rounded-full bg-gradient-to-r ${action.color} shadow-2xl flex items-center justify-center hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" aria-hidden="true" />

                  {/* Tooltip */}
                  <div className="absolute right-16 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    <span className="text-sm text-white">{action.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close quick actions menu" : "Open quick actions menu"}
        aria-expanded={isOpen}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-2xl shadow-blue-500/50 flex items-center justify-center hover:shadow-blue-500/70 transition-shadow"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <X className="w-7 h-7 text-white" />
          ) : (
            <Plus className="w-7 h-7 text-white" />
          )}
        </motion.div>
      </motion.button>

      {/* Ripple Effect */}
      {isOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 rounded-full bg-blue-500 pointer-events-none"
        />
      )}
    </div>
  );
}
