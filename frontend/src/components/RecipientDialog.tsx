"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X, Sparkles, Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { recipientsAPI } from "@/lib/api";
import type { Recipient, RecipientCreate, RecipientUpdate } from "@/types";

const recipientSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  tags: z.string().optional(),
});

type RecipientFormData = z.infer<typeof recipientSchema>;

interface RecipientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient?: Recipient | null;
  onSuccess?: () => void;
}

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany",
  "France", "India", "China", "Japan", "Brazil", "Singapore", "Netherlands",
  "Sweden", "Switzerland", "Spain", "Italy", "South Korea", "Other"
];

const LANGUAGES = ["en", "es", "fr", "de", "zh", "ja", "pt", "hi", "ko", "it", "nl", "sv"];

export function RecipientDialog({ open, onOpenChange, recipient, onSuccess }: RecipientDialogProps) {
  const [loading, setLoading] = useState(false);
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const isEditMode = !!recipient;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<RecipientFormData>({
    resolver: zodResolver(recipientSchema),
    defaultValues: {
      email: "",
      name: "",
      company: "",
      position: "",
      country: "",
      language: "en",
      tags: "",
    },
  });

  // Load recipient data when editing
  useEffect(() => {
    if (recipient) {
      reset({
        email: recipient.email,
        name: recipient.name || "",
        company: recipient.company || "",
        position: recipient.position || "",
        country: recipient.country || "",
        language: recipient.language || "en",
        tags: recipient.tags || "",
      });

      // Load tags
      if (recipient.tags) {
        setTags(recipient.tags.split(",").map(t => t.trim()));
      }

      // Load custom fields
      if (recipient.custom_fields) {
        const fields = Object.entries(recipient.custom_fields).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        setCustomFields(fields);
      }
    } else {
      reset({
        email: "",
        name: "",
        company: "",
        position: "",
        country: "",
        language: "en",
        tags: "",
      });
      setTags([]);
      setCustomFields([]);
    }
  }, [recipient, reset]);

  const onSubmit = async (data: RecipientFormData) => {
    setLoading(true);
    try {
      // Build custom fields object
      const customFieldsObj: Record<string, string> = {};
      customFields.forEach(({ key, value }) => {
        if (key.trim()) {
          customFieldsObj[key] = value;
        }
      });

      const payload = {
        ...data,
        tags: tags.join(", "),
        custom_fields: Object.keys(customFieldsObj).length > 0 ? customFieldsObj : undefined,
      };

      if (isEditMode) {
        await recipientsAPI.update(recipient.id, payload as RecipientUpdate);
        toast.success("Recipient updated successfully!", {
          description: `${data.email} has been updated`,
        });
      } else {
        await recipientsAPI.create(payload as RecipientCreate);
        toast.success("Recipient created successfully!", {
          description: `${data.email} has been added to your directory`,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(isEditMode ? "Failed to update recipient" : "Failed to create recipient", {
        description: error.response?.data?.detail || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: "", value: "" }]);
  };

  const updateCustomField = (index: number, field: "key" | "value", value: string) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-info/20 to-info/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-info" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {isEditMode ? "Edit Recipient" : "Add New Recipient"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update recipient information and details"
                  : "Add a new recipient to your directory"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email Address <span className="text-error">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  {...register("email")}
                  className="mt-1.5 bg-card border-border focus:border-info"
                  disabled={isEditMode}
                />
                {errors.email && (
                  <p className="text-error text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="name" className="text-slate-300">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register("name")}
                  className="mt-1.5 bg-card border-border focus:border-info"
                />
              </div>

              <div>
                <Label htmlFor="company" className="text-slate-300">
                  Company
                </Label>
                <Input
                  id="company"
                  placeholder="Acme Corp"
                  {...register("company")}
                  className="mt-1.5 bg-card border-border focus:border-info"
                />
              </div>

              <div>
                <Label htmlFor="position" className="text-slate-300">
                  Position
                </Label>
                <Input
                  id="position"
                  placeholder="Senior Engineer"
                  {...register("position")}
                  className="mt-1.5 bg-card border-border focus:border-info"
                />
              </div>

              <div>
                <Label htmlFor="country" className="text-slate-300">
                  Country
                </Label>
                <Select
                  value={watch("country")}
                  onValueChange={(value) => setValue("country", value)}
                >
                  <SelectTrigger className="mt-1.5 bg-card border-border">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language" className="text-slate-300">
                  Language
                </Label>
                <Select
                  value={watch("language")}
                  onValueChange={(value) => setValue("language", value)}
                >
                  <SelectTrigger className="mt-1.5 bg-card border-border">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              Tags
            </h3>

            <div className="flex gap-2">
              <Input
                placeholder="Add tag (e.g., VIP, Lead, etc.)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="bg-card border-border focus:border-accent"
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                className="border-border hover:border-accent"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {tags.map((tag, index) => (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge
                        variant="secondary"
                        className="bg-accent/20 text-accent border-accent/30 pl-3 pr-1 py-1"
                      >
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-accent/20"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-warning to-warning rounded-full" />
                Custom Fields
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomField}
                className="border-border hover:border-warning"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>

            {customFields.length > 0 && (
              <div className="space-y-2">
                <AnimatePresence>
                  {customFields.map((field, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-2"
                    >
                      <Input
                        placeholder="Field name"
                        value={field.key}
                        onChange={(e) => updateCustomField(index, "key", e.target.value)}
                        className="bg-card border-border"
                      />
                      <Input
                        placeholder="Field value"
                        value={field.value}
                        onChange={(e) => updateCustomField(index, "value", e.target.value)}
                        className="bg-card border-border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomField(index)}
                        className="text-error hover:bg-error/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-info to-info hover:from-info hover:to-info"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditMode ? "Update Recipient" : "Create Recipient"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
