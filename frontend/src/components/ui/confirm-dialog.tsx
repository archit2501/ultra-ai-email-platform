"use client";

import * as React from "react";
import { AlertTriangle, Trash2, AlertCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";

export type ConfirmDialogVariant = "danger" | "warning" | "info";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  confirmDisabled?: boolean;
}

const variantConfig: Record<
  ConfirmDialogVariant,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    confirmButtonClass: string;
  }
> = {
  danger: {
    icon: Trash2,
    iconColor: "text-red-500",
    confirmButtonClass: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
    confirmButtonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    confirmButtonClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
  isLoading = false,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    setInternalLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("[ConfirmDialog] Confirm action failed:", error);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const loading = isLoading || internalLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-slate-800 ${config.iconColor}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="border-slate-700 hover:bg-slate-800"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading || confirmDisabled}
            className={config.confirmButtonClass}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing confirm dialog state
export interface UseConfirmDialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  variant?: ConfirmDialogVariant;
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<UseConfirmDialogOptions | null>(null);
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback(
    (options: UseConfirmDialogOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfig(options);
        setIsOpen(true);
        resolveRef.current = resolve;
      });
    },
    []
  );

  const handleConfirm = React.useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = React.useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resolveRef.current?.(false);
      resolveRef.current = null;
    }
  }, []);

  const ConfirmDialogComponent = React.useCallback(
    () =>
      config ? (
        <ConfirmDialog
          open={isOpen}
          onOpenChange={handleOpenChange}
          title={config.title}
          description={config.description}
          confirmText={config.confirmText}
          variant={config.variant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      ) : null,
    [isOpen, config, handleOpenChange, handleConfirm, handleCancel]
  );

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
    isOpen,
  };
}

// Convenience wrappers for common delete confirmations
export function useDeleteConfirmation() {
  const { confirm, ConfirmDialog, isOpen } = useConfirmDialog();

  const confirmDelete = React.useCallback(
    (itemName: string, itemType: string = "item") => {
      return confirm({
        title: `Delete ${itemType}?`,
        description: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
        confirmText: "Delete",
        variant: "danger",
      });
    },
    [confirm]
  );

  return {
    confirmDelete,
    ConfirmDialog,
    isOpen,
  };
}
