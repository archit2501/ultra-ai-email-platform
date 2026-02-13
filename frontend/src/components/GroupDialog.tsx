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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users,
  Zap,
  Loader2,
  Plus,
  X,
  Sparkles,
  Building2,
  MapPin,
  Tag,
  TrendingUp,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { recipientGroupsAPI, recipientsAPI } from "@/lib/api";
import type { RecipientGroup, RecipientGroupCreate, Recipient } from "@/types";

const groupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  group_type: z.enum(["static", "dynamic"]),
  color: z.string().optional(),
  auto_refresh: z.boolean().optional(),
});

type GroupFormData = z.infer<typeof groupSchema>;

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: RecipientGroup | null;
  onSuccess?: () => void;
}

const COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Red", value: "#ef4444" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Orange", value: "#f97316" },
];

export function GroupDialog({ open, onOpenChange, group, onSuccess }: GroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [groupType, setGroupType] = useState<"static" | "dynamic">("static");
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);

  // Dynamic filters state
  const [filterCompanies, setFilterCompanies] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterCountries, setFilterCountries] = useState<string[]>([]);
  const [filterPositions, setFilterPositions] = useState<string[]>([]);
  const [minEngagement, setMinEngagement] = useState<number>(0);
  const [companyInput, setCompanyInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [countryInput, setCountryInput] = useState("");
  const [positionInput, setPositionInput] = useState("");

  // Preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{ count: number; sample: Recipient[] } | null>(null);

  const isEditMode = !!group;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
      group_type: "static",
      color: COLORS[0].value,
      auto_refresh: true,
    },
  });

  useEffect(() => {
    if (group) {
      reset({
        name: group.name,
        description: group.description || "",
        group_type: group.group_type,
        color: group.color || COLORS[0].value,
        auto_refresh: group.auto_refresh,
      });
      setGroupType(group.group_type);
      setSelectedColor(group.color || COLORS[0].value);

      // Load filter criteria
      if (group.filter_criteria) {
        setFilterCompanies(group.filter_criteria.companies || []);
        setFilterTags(group.filter_criteria.tags || []);
        setFilterCountries(group.filter_criteria.countries || []);
        setFilterPositions(group.filter_criteria.positions || []);
        setMinEngagement(group.filter_criteria.min_engagement_score || 0);
      }
    } else {
      reset({
        name: "",
        description: "",
        group_type: "static",
        color: COLORS[0].value,
        auto_refresh: true,
      });
      setGroupType("static");
      setSelectedColor(COLORS[0].value);
      setFilterCompanies([]);
      setFilterTags([]);
      setFilterCountries([]);
      setFilterPositions([]);
      setMinEngagement(0);
    }
  }, [group, reset]);

  const onSubmit = async (data: GroupFormData) => {
    setLoading(true);
    try {
      const payload: RecipientGroupCreate = {
        name: data.name,
        description: data.description,
        group_type: groupType,
        color: selectedColor,
        auto_refresh: groupType === "dynamic" ? (data.auto_refresh ?? true) : false,
        filter_criteria:
          groupType === "dynamic"
            ? {
                companies: filterCompanies.length > 0 ? filterCompanies : undefined,
                tags: filterTags.length > 0 ? filterTags : undefined,
                countries: filterCountries.length > 0 ? filterCountries : undefined,
                positions: filterPositions.length > 0 ? filterPositions : undefined,
                min_engagement_score: minEngagement > 0 ? minEngagement : undefined,
                is_active: true,
                exclude_unsubscribed: true,
              }
            : undefined,
      };

      if (isEditMode) {
        await recipientGroupsAPI.update(group.id, payload);
        toast.success("Group updated successfully!", {
          description: `${data.name} has been updated`,
        });
      } else {
        await recipientGroupsAPI.create(payload);
        toast.success("Group created successfully!", {
          description: `${data.name} has been created`,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(isEditMode ? "Failed to update group" : "Failed to create group", {
        description: error.response?.data?.detail || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (groupType !== "dynamic") return;

    setPreviewLoading(true);
    try {
      const filters = {
        companies: filterCompanies.length > 0 ? filterCompanies : undefined,
        tags: filterTags.length > 0 ? filterTags : undefined,
        countries: filterCountries.length > 0 ? filterCountries : undefined,
        positions: filterPositions.length > 0 ? filterPositions : undefined,
        min_engagement_score: minEngagement > 0 ? minEngagement : undefined,
        is_active: true,
        exclude_unsubscribed: true,
      };

      const { data } = await recipientGroupsAPI.previewDynamicFilters(filters);
      setPreviewData(data);

      toast.success(`Found ${data.count} matching recipients`, {
        description: data.count > 0 ? "See preview below" : "Try adjusting your filters",
      });
    } catch (error: any) {
      toast.error("Failed to preview filters");
    } finally {
      setPreviewLoading(false);
    }
  };

  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    if (value.trim()) {
      setter((prev) => [...prev, value.trim()]);
    }
  };

  const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((prev) => prev.filter((item) => item !== value));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {isEditMode ? "Edit Group" : "Create New Group"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update group settings and criteria"
                  : "Create a new recipient group with static or dynamic membership"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name" className="text-slate-300">
                  Group Name <span className="text-error">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Tech Leads APAC"
                  {...register("name")}
                  className="mt-1.5 bg-card border-border focus:border-accent"
                />
                {errors.name && (
                  <p className="text-error text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="description" className="text-slate-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe this group..."
                  {...register("description")}
                  className="mt-1.5 bg-card border-border focus:border-accent"
                  rows={2}
                />
              </div>

              {/* Color Picker */}
              <div className="col-span-2">
                <Label className="text-slate-300 mb-3 block">Group Color</Label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color.value);
                        setValue("color", color.value);
                      }}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        selectedColor === color.value
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Group Type Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
              Group Type
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer transition-all ${
                  groupType === "static"
                    ? "border-info bg-info/10"
                    : "border-border hover:border-border"
                }`}
                onClick={() => {
                  setGroupType("static");
                  setValue("group_type", "static");
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-info/20 rounded-lg">
                      <Users className="w-5 h-5 text-info" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Static Group</h4>
                      <p className="text-xs text-muted-foreground">
                        Manually add and remove recipients. Full control over membership.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  groupType === "dynamic"
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-border"
                }`}
                onClick={() => {
                  setGroupType("dynamic");
                  setValue("group_type", "dynamic");
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-accent/20 rounded-lg">
                      <Zap className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Dynamic Group</h4>
                      <p className="text-xs text-muted-foreground">
                        Auto-populate based on filters. Updates automatically.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Dynamic Filters (only for dynamic groups) */}
          {groupType === "dynamic" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 border-t border-border pt-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-warning to-warning rounded-full" />
                  Filter Criteria
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  disabled={previewLoading}
                  className="border-border hover:border-warning"
                >
                  {previewLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Preview
                </Button>
              </div>

              <Tabs defaultValue="companies" className="w-full">
                <TabsList className="bg-slate-800/50">
                  <TabsTrigger value="companies">Companies</TabsTrigger>
                  <TabsTrigger value="tags">Tags</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                </TabsList>

                {/* Companies Tab */}
                <TabsContent value="companies" className="space-y-3 mt-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add company name"
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem(setFilterCompanies, companyInput);
                          setCompanyInput("");
                        }
                      }}
                      className="bg-card border-border"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        addItem(setFilterCompanies, companyInput);
                        setCompanyInput("");
                      }}
                      variant="outline"
                      className="border-border"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {filterCompanies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {filterCompanies.map((company) => (
                        <Badge
                          key={company}
                          variant="secondary"
                          className="bg-info/20 text-info border-info/30 pl-3 pr-1"
                        >
                          {company}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1"
                            onClick={() => removeItem(setFilterCompanies, company)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Tags Tab */}
                <TabsContent value="tags" className="space-y-3 mt-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem(setFilterTags, tagInput);
                          setTagInput("");
                        }
                      }}
                      className="bg-card border-border"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        addItem(setFilterTags, tagInput);
                        setTagInput("");
                      }}
                      variant="outline"
                      className="border-border"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {filterTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {filterTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-accent/20 text-accent border-accent/30 pl-3 pr-1"
                        >
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1"
                            onClick={() => removeItem(setFilterTags, tag)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Location Tab */}
                <TabsContent value="location" className="space-y-4 mt-3">
                  <div>
                    <Label className="text-slate-300 mb-2 block">Countries</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add country"
                        value={countryInput}
                        onChange={(e) => setCountryInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addItem(setFilterCountries, countryInput);
                            setCountryInput("");
                          }
                        }}
                        className="bg-card border-border"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addItem(setFilterCountries, countryInput);
                          setCountryInput("");
                        }}
                        variant="outline"
                        className="border-border"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {filterCountries.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {filterCountries.map((country) => (
                          <Badge
                            key={country}
                            variant="secondary"
                            className="bg-success/20 text-success border-success/30 pl-3 pr-1"
                          >
                            {country}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-1"
                              onClick={() => removeItem(setFilterCountries, country)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-slate-300 mb-2 block">Positions</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add position"
                        value={positionInput}
                        onChange={(e) => setPositionInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addItem(setFilterPositions, positionInput);
                            setPositionInput("");
                          }
                        }}
                        className="bg-card border-border"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addItem(setFilterPositions, positionInput);
                          setPositionInput("");
                        }}
                        variant="outline"
                        className="border-border"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {filterPositions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {filterPositions.map((position) => (
                          <Badge
                            key={position}
                            variant="secondary"
                            className="bg-info/20 text-info border-info/30 pl-3 pr-1"
                          >
                            {position}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-1"
                              onClick={() => removeItem(setFilterPositions, position)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Engagement Tab */}
                <TabsContent value="engagement" className="space-y-3 mt-3">
                  <div>
                    <Label htmlFor="minEngagement" className="text-slate-300 mb-2 block">
                      Minimum Engagement Score: {minEngagement}
                    </Label>
                    <Input
                      id="minEngagement"
                      type="range"
                      min="0"
                      max="100"
                      value={minEngagement}
                      onChange={(e) => setMinEngagement(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0 (All)</span>
                      <span>50 (Medium)</span>
                      <span>100 (High)</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Preview Results */}
              {previewData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white">Preview Results</h4>
                    <Badge className="bg-info">
                      {previewData.count} recipients
                    </Badge>
                  </div>
                  {previewData.sample.length > 0 ? (
                    <div className="space-y-2">
                      {previewData.sample.slice(0, 3).map((recipient) => (
                        <div
                          key={recipient.id}
                          className="flex items-center gap-3 text-sm p-2 bg-card rounded"
                        >
                          <div className="flex-1">
                            <p className="text-white font-medium">{recipient.name || recipient.email}</p>
                            <p className="text-muted-foreground text-xs">
                              {recipient.company} • {recipient.country}
                            </p>
                          </div>
                          <Badge variant="outline">{recipient.engagement_score.toFixed(1)}</Badge>
                        </div>
                      ))}
                      {previewData.count > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{previewData.count - 3} more recipients
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">No matching recipients found</p>
                  )}
                </motion.div>
              )}

              {/* Auto Refresh Toggle */}
              <div className="flex items-center justify-between p-4 bg-card rounded-lg">
                <div>
                  <Label htmlFor="auto_refresh" className="text-slate-300 font-medium">
                    Auto-Refresh
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically update membership when filters are evaluated
                  </p>
                </div>
                <Switch
                  id="auto_refresh"
                  checked={watch("auto_refresh")}
                  onCheckedChange={(checked) => setValue("auto_refresh", checked)}
                />
              </div>
            </motion.div>
          )}

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
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditMode ? "Update Group" : "Create Group"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
