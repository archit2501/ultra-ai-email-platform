"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Search, Filter, TrendingUp, Star, Users, Eye, Download,
  Clock, Tag, Heart, Share2, X, Copy, Check, Sparkles, Award,
  ThumbsUp, MessageSquare, BarChart3, ArrowUpRight, Zap, ChevronDown,
  ChevronUp, ExternalLink, Book, Package
} from 'lucide-react';
import {
  templateMarketplaceApi,
  templateAnalyticsApi,
  PublicTemplate,
  PublicTemplateDetail,
  TemplateReview,
  MarketplaceStats
} from '@/lib/api';
import { toast } from 'sonner';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useGlobalShortcuts, useListPageShortcuts } from '@/hooks/useKeyboardShortcuts';

// ============================================
// Main Template Marketplace Component
// ============================================

export default function TemplateMarketplace() {
  const [templates, setTemplates] = useState<PublicTemplate[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<PublicTemplate[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PublicTemplateDetail | null>(null);
  const [reviews, setReviews] = useState<TemplateReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'top_rated'>('popular');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const categories = [
    { value: 'cold_outreach', label: 'Cold Outreach', icon: '📧' },
    { value: 'follow_up', label: 'Follow Up', icon: '🔄' },
    { value: 'thank_you', label: 'Thank You', icon: '🙏' },
    { value: 'networking', label: 'Networking', icon: '🤝' },
    { value: 'referral_request', label: 'Referral', icon: '👥' },
    { value: 'interview_prep', label: 'Interview Prep', icon: '💼' },
    { value: 'offer_acceptance', label: 'Offer Acceptance', icon: '✅' },
    { value: 'offer_negotiation', label: 'Negotiation', icon: '💰' },
  ];

  const loadMarketplaceData = useCallback(async () => {
    setLoading(true);
    try {
      const [templatesRes, featuredRes, statsRes] = await Promise.all([
        templateMarketplaceApi.browseTemplates({
          skip: 0,
          limit: 50,
          category: selectedCategory || undefined,
          sort_by: sortBy,
          search: searchQuery || undefined,
        }),
        templateMarketplaceApi.getFeaturedTemplates(6),
        templateMarketplaceApi.getMarketplaceStats(),
      ]);

      setTemplates(templatesRes.data);
      setFeaturedTemplates(featuredRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load marketplace data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy, searchQuery]);

  useEffect(() => {
    loadMarketplaceData();
  }, [loadMarketplaceData]);

  // Keyboard shortcuts
  useGlobalShortcuts();
  useListPageShortcuts({
    onRefresh: loadMarketplaceData,
  });

  const handleTemplateClick = async (template: PublicTemplate) => {
    try {
      // Track view event
      await templateAnalyticsApi.trackEvent({
        template_id: template.id,
        event_type: 'view',
        event_metadata: {
          source: 'marketplace',
          category: template.category,
          language: template.language,
        },
      });

      const [detailRes, reviewsRes] = await Promise.all([
        templateMarketplaceApi.getTemplateDetail(template.id),
        templateMarketplaceApi.getTemplateReviews(template.id, { skip: 0, limit: 5 }),
      ]);

      setSelectedTemplate(detailRes.data);
      setReviews(reviewsRes.data);
      setShowPreviewModal(true);
    } catch (error) {
      toast.error('Failed to load template details');
      console.error('[Marketplace] Failed to view template:', error);
    }
  };

  const handleCloneTemplate = async (templateId: number) => {
    try {
      await templateMarketplaceApi.cloneTemplate(templateId);

      // Track clone event
      await templateAnalyticsApi.trackEvent({
        template_id: templateId,
        event_type: 'clone',
        event_metadata: {
          source: 'marketplace',
        },
      });

      toast.success('Template cloned to your library!', {
        style: {
          border: '1px solid #22c55e',
          background: '#064e3b',
          color: '#dcfce7',
        },
      });

      // Refresh marketplace data to update clone counts
      loadMarketplaceData();
    } catch (error) {
      toast.error('Failed to clone template');
      console.error('[Marketplace] Failed to clone template:', error);
    }
  };

  const handleFavoriteTemplate = async (templateId: number) => {
    try {
      const response = await templateMarketplaceApi.toggleFavorite(templateId);

      // Track favorite event
      await templateAnalyticsApi.trackEvent({
        template_id: templateId,
        event_type: 'favorite',
        event_metadata: {
          source: 'marketplace',
          is_favorited: response.data.is_favorited,
        },
      });

      toast.success(
        response.data.is_favorited ? 'Added to favorites!' : 'Removed from favorites!'
      );
    } catch (error) {
      toast.error('Failed to update favorite');
      console.error('[Marketplace] Failed to favorite template:', error);
    }
  };

  const handleRateTemplate = async (templateId: number, rating: number) => {
    try {
      await templateMarketplaceApi.rateTemplate(templateId, { rating });

      // Track rate event
      await templateAnalyticsApi.trackEvent({
        template_id: templateId,
        event_type: 'rate',
        event_metadata: {
          source: 'marketplace',
          rating,
        },
      });

      toast.success(`Rated ${rating} star${rating > 1 ? 's' : ''}!`);

      // Refresh data to show updated rating
      loadMarketplaceData();
    } catch (error) {
      toast.error('Failed to rate template');
      console.error('[Marketplace] Failed to rate template:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Hero Header */}
      <MarketplaceHeader stats={stats} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Templates */}
        {featuredTemplates.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Featured Templates
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTemplates.map((template, index) => (
                <FeaturedTemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleTemplateClick(template)}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest First</option>
                  <option value="top_rated">Top Rated</option>
                </select>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Categories
                </label>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-left px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                      selectedCategory === ''
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-medium'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>🌟</span>
                    <span>All Templates</span>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                        selectedCategory === category.value
                          ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-medium'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span className="text-sm">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Template Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {templates.length} {templates.length === 1 ? 'Template' : 'Templates'}
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-16">
                <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-600">No templates found</p>
                <p className="text-sm text-slate-400">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template, index) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onClick={() => handleTemplateClick(template)}
                    onClone={() => handleCloneTemplate(template.id)}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && selectedTemplate && (
          <TemplatePreviewModal
            template={selectedTemplate}
            reviews={reviews}
            onClose={() => {
              setShowPreviewModal(false);
              setSelectedTemplate(null);
            }}
            onClone={() => handleCloneTemplate(selectedTemplate.id)}
            onFavorite={() => handleFavoriteTemplate(selectedTemplate.id)}
            onRate={(rating) => handleRateTemplate(selectedTemplate.id, rating)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Marketplace Header Component
// ============================================

interface MarketplaceHeaderProps {
  stats: MarketplaceStats | null;
}

function MarketplaceHeader({ stats }: MarketplaceHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="inline-block mb-4"
          >
            <Store className="w-16 h-16 mx-auto" />
          </motion.div>
          <h1 className="text-5xl font-bold mb-4">Template Marketplace</h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto">
            Discover high-performing email templates shared by the community
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <StatCard
              icon={<Package className="w-6 h-6" />}
              value={stats.total_templates}
              label="Templates"
            />
            <StatCard
              icon={<Users className="w-6 h-6" />}
              value={stats.total_creators}
              label="Creators"
            />
            <StatCard
              icon={<Download className="w-6 h-6" />}
              value={stats.total_clones}
              label="Clones"
            />
            <StatCard
              icon={<Star className="w-6 h-6" />}
              value={stats.avg_rating.toFixed(1)}
              label="Avg Rating"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
    >
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm text-purple-100">{label}</p>
    </motion.div>
  );
}

// ============================================
// Featured Template Card
// ============================================

interface FeaturedTemplateCardProps {
  template: PublicTemplate;
  onClick: () => void;
  index: number;
}

function FeaturedTemplateCard({ template, onClick, index }: FeaturedTemplateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
      className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer overflow-hidden border-2 border-purple-200"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
              Featured
            </span>
          </div>
          {template.is_verified && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              <Check className="w-3 h-3" />
              Verified
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2">
          {template.title}
        </h3>

        <p className="text-sm text-slate-600 mb-4 line-clamp-3">
          {template.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {template.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-purple-200">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{template.avg_rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              <span>{template.total_clones}</span>
            </div>
          </div>

          <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Template Card Component
// ============================================

interface TemplateCardProps {
  template: PublicTemplate;
  onClick: () => void;
  onClone: () => void;
  index: number;
}

function TemplateCard({ template, onClick, onClone, index }: TemplateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
    >
      <div onClick={onClick} className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors">
              {template.title}
            </h3>
            <p className="text-xs text-slate-500">by {template.creator_name}</p>
          </div>
          {template.is_featured && (
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 mb-4 line-clamp-3">
          {template.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {template.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">{template.avg_rating.toFixed(1)}</span>
            <span className="text-xs">({template.total_ratings})</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{template.total_views}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            <span>{template.total_clones}</span>
          </div>
        </div>

        {/* Performance */}
        {template.avg_response_rate > 0 && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-green-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {template.avg_response_rate.toFixed(1)}% response rate
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onClone();
          }}
          className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Clone Template
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================
// Template Preview Modal
// ============================================

interface TemplatePreviewModalProps {
  template: PublicTemplateDetail;
  reviews: TemplateReview[];
  onClose: () => void;
  onClone: () => void;
  onFavorite: () => void;
  onRate: (rating: number) => void;
}

function TemplatePreviewModal({ template, reviews, onClose, onClone, onFavorite, onRate }: TemplatePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'stats' | 'reviews'>('preview');
  const [showFullContent, setShowFullContent] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {template.is_featured && (
                  <span className="px-2 py-1 bg-purple-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Featured
                  </span>
                )}
                {template.is_verified && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">{template.title}</h2>
              <p className="text-slate-600">by {template.creator_name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 mt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-lg">{template.avg_rating.toFixed(1)}</span>
              <span className="text-sm text-slate-500">({template.total_ratings} ratings)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Download className="w-5 h-5" />
              <span className="font-semibold">{template.total_clones}</span>
              <span className="text-sm">clones</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Eye className="w-5 h-5" />
              <span className="font-semibold">{template.total_views}</span>
              <span className="text-sm">views</span>
            </div>
            {template.avg_response_rate > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold">{template.avg_response_rate.toFixed(1)}%</span>
                <span className="text-sm">response rate</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {[
            { id: 'preview', label: 'Preview', icon: Eye },
            { id: 'stats', label: 'Performance', icon: BarChart3 },
            { id: 'reviews', label: `Reviews (${reviews.length})`, icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'preview' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-slate-700">{template.description}</p>
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Subject Line</h3>
                <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                  <p className="font-mono text-slate-800">{template.subject_template}</p>
                </div>
              </div>

              {/* Body */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Email Body</h3>
                <div className="p-6 bg-slate-50 rounded-xl border-2 border-slate-200">
                  <pre className={`font-sans text-slate-700 whitespace-pre-wrap ${!showFullContent ? 'line-clamp-[15]' : ''}`}>
                    {template.body_template_text}
                  </pre>
                  {template.body_template_text.length > 500 && (
                    <button
                      onClick={() => setShowFullContent(!showFullContent)}
                      className="mt-4 text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1"
                    >
                      {showFullContent ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show more
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Variables */}
              {template.variables.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Variables</h3>
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map((variable, i) => (
                      <code
                        key={i}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-mono"
                      >
                        {variable}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <StatsCard
                  icon={<TrendingUp className="w-6 h-6 text-green-600" />}
                  label="Success Rate"
                  value={`${((template.successful_uses / template.total_uses) * 100 || 0).toFixed(1)}%`}
                  sublabel={`${template.successful_uses} successful`}
                />
                <StatsCard
                  icon={<Eye className="w-6 h-6 text-blue-600" />}
                  label="Open Rate"
                  value={`${((template.total_opens / template.total_uses) * 100 || 0).toFixed(1)}%`}
                  sublabel={`${template.total_opens} opens`}
                />
                <StatsCard
                  icon={<ArrowUpRight className="w-6 h-6 text-purple-600" />}
                  label="Click Rate"
                  value={`${((template.total_clicks / template.total_opens) * 100 || 0).toFixed(1)}%`}
                  sublabel={`${template.total_clicks} clicks`}
                />
                <StatsCard
                  icon={<MessageSquare className="w-6 h-6 text-pink-600" />}
                  label="Reply Rate"
                  value={`${((template.total_replies / template.total_uses) * 100 || 0).toFixed(1)}%`}
                  sublabel={`${template.total_replies} replies`}
                />
              </div>

              {template.target_industry && (
                <div className="p-4 bg-purple-50 rounded-xl">
                  <h4 className="font-semibold text-slate-800 mb-2">Best For</h4>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p><strong>Industry:</strong> {template.target_industry}</p>
                    {template.target_position_level && (
                      <p><strong>Level:</strong> {template.target_position_level}</p>
                    )}
                    {template.target_role && (
                      <p><strong>Role:</strong> {template.target_role}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No reviews yet</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
          {/* Rating Section */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Rate this template</h4>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <motion.button
                  key={rating}
                  onMouseEnter={() => setHoverRating(rating)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => {
                    setUserRating(rating);
                    onRate(rating);
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      rating <= (hoverRating || userRating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-slate-300'
                    }`}
                  />
                </motion.button>
              ))}
              {userRating > 0 && (
                <span className="ml-2 text-sm text-slate-600">
                  You rated: {userRating} star{userRating > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsFavorited(!isFavorited);
                onFavorite();
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                isFavorited
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-red-300'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              {isFavorited ? 'Favorited' : 'Favorite'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClone}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Clone to My Library
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Helper Components
// ============================================

function StatsCard({ icon, label, value, sublabel }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="p-4 bg-gradient-to-br from-white to-slate-50 rounded-xl border-2 border-slate-200">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="font-semibold text-slate-700">{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
      <p className="text-sm text-slate-500">{sublabel}</p>
    </div>
  );
}

function ReviewCard({ review }: { review: TemplateReview }) {
  return (
    <div className="p-4 bg-white border-2 border-slate-200 rounded-xl">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
            {review.candidate_id.toString().charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-800">User #{review.candidate_id}</p>
            <p className="text-xs text-slate-500">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        {review.is_verified_use && (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1">
            <Check className="w-3 h-3" />
            Verified
          </span>
        )}
      </div>

      <p className="text-slate-700 mb-3">{review.review_text}</p>

      {(review.pros || review.cons) && (
        <div className="space-y-2 mb-3 text-sm">
          {review.pros && (
            <div className="flex items-start gap-2">
              <ThumbsUp className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-slate-600"><strong>Pros:</strong> {review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div className="flex items-start gap-2">
              <ThumbsUp className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5 rotate-180" />
              <p className="text-slate-600"><strong>Cons:</strong> {review.cons}</p>
            </div>
          )}
        </div>
      )}

      {review.emails_sent && review.responses_received && (
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span>Sent: {review.emails_sent}</span>
          <span>Responses: {review.responses_received}</span>
          <span className="font-semibold text-green-600">
            {((review.responses_received / review.emails_sent) * 100).toFixed(1)}% rate
          </span>
        </div>
      )}

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200 text-sm">
        <button className="flex items-center gap-1 text-slate-600 hover:text-green-600">
          <ThumbsUp className="w-4 h-4" />
          <span>{review.helpful_count}</span>
        </button>
        <span className="text-slate-400">Helpful</span>
      </div>
    </div>
  );
}
