// src/pages/support/KnowledgeBasePage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KBArticle, KBCategory, KBFilters } from '../../types/support';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  FolderIcon,
  PlusIcon,
  ArrowRightIcon,
  EyeIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ClockIcon,
  SparklesIcon,
  TagIcon,
  ChevronRightIcon,
  StarIcon,
  FireIcon,
  LightBulbIcon,
  WrenchScrewdriverIcon,
  QuestionMarkCircleIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { useKBArticlesQuery, useKBCategoriesQuery, useKBSearchQuery } from '../../hooks/queries/useSupportQuery';

// Category Icon Map
const getCategoryIcon = (icon?: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    '🚀': <RocketLaunchIcon className="h-6 w-6" />,
    '🔐': <ShieldCheckIcon className="h-6 w-6" />,
    '💳': <CreditCardIcon className="h-6 w-6" />,
    '🔧': <WrenchScrewdriverIcon className="h-6 w-6" />,
    '✨': <SparklesIcon className="h-6 w-6" />,
    '❓': <QuestionMarkCircleIcon className="h-6 w-6" />,
  };
  return iconMap[icon || ''] || <FolderIcon className="h-6 w-6" />;
};

// Category Card Component
const CategoryCard: React.FC<{ category: StaticKBCategory; onClick: () => void }> = ({ category, onClick }) => (
  <button
    onClick={onClick}
    className="p-6 rounded-xl border-2 border-transparent bg-white hover:border-primary hover:shadow-lg transition-all duration-200 text-left group w-full"
  >
    <div
      className="h-14 w-14 rounded-xl flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform"
      style={{ backgroundColor: category.color || '#6366f1' }}
    >
      {getCategoryIcon(category.icon)}
    </div>
    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
      {category.name}
    </h3>
    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
      {category.description || 'Browse articles in this category'}
    </p>
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{category.articles_count} articles</span>
      <ArrowRightIcon className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  </button>
);

// Article Card Component
const ArticleCard: React.FC<{ article: StaticKBArticle }> = ({ article }) => (
  <Link to={`/support/knowledge-base/${article.id}`}>
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group h-full">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {article.excerpt || article.content.substring(0, 120) + '...'}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <EyeIcon className="h-3.5 w-3.5" />
                {article.views_count}
              </span>
              <span className="flex items-center gap-1 text-green-600">
                <HandThumbUpIcon className="h-3.5 w-3.5" />
                {article.helpful_count}
              </span>
              <span className="capitalize px-2 py-0.5 bg-gray-100 rounded">
                {article.type.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

// Search Result Card Component
const SearchResultCard: React.FC<{ result: { article: StaticKBArticle; score: number } }> = ({ result }) => (
  <Link to={`/support/knowledge-base/${result.article.id}`}>
    <div className="p-4 rounded-xl bg-white border hover:shadow-md hover:border-primary transition-all duration-200 group">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
          <StarIcon className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
              {result.article.title}
            </h3>
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
              {Math.round(result.score * 100)}% match
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {result.article.excerpt || result.article.content.substring(0, 150) + '...'}
          </p>
          <div className="flex items-center gap-2">
            {result.article.tags?.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
      </div>
    </div>
  </Link>
);

type StaticKBArticle = KBArticle & { tags?: string[] };
type StaticKBCategory = KBCategory;

const KnowledgeBasePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'popular' | 'recent'>('popular');

  // Load categories and articles from backend
  const { data: categories = [], isLoading: categoriesLoading } = useKBCategoriesQuery();

  const articleFilters: KBFilters = {
    category_id: selectedCategory || undefined,
    status: 'published',
  };

  const { data: allArticles = [], isLoading: articlesLoading } = useKBArticlesQuery(articleFilters);

  // Search via backend AI/RAG
  const { data: searchResults = [], isLoading: searchLoading } = useKBSearchQuery(searchQuery);

  // Popular articles (sorted by views)
  const popularArticles = [...allArticles]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 6);
  
  // Recent articles
  const recentArticles = [...allArticles]
    .sort((a, b) =>
      new Date(b.updated_at || b.created_at || '').getTime() -
      new Date(a.updated_at || a.created_at || '').getTime()
    )
    .slice(0, 6);

  const isSearching = searchQuery.length >= 2;
  const isLoading = categoriesLoading || articlesLoading;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6">
          <BookOpenIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Knowledge Base</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Find answers to common questions and learn how to get the most out of our platform
        </p>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
          <input
            type="text"
            placeholder="Search for articles, guides, and FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Search Suggestions */}
        {!isSearching && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Popular:</span>
            {['password reset', 'billing', 'export data', 'getting started'].map(term => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="text-sm px-3 py-1 bg-gray-100 hover:bg-primary hover:text-white rounded-full transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Results */}
      {isSearching && (
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {searchResults.length} results for "{searchQuery}"
            </h2>
            <Button variant="ghost" onClick={() => setSearchQuery('')}>
              Clear search
            </Button>
          </div>
          {searchLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <QuestionMarkCircleIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try different keywords or browse our categories below
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {searchResults.map((result: { article: StaticKBArticle; score: number }) => (
                <SearchResultCard key={result.article.id} result={result} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* If no articles at all */}
      {!isLoading && !isSearching && allArticles.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <DocumentTextIcon className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No knowledge base articles yet</p>
            <p className="text-sm">Once you add articles in Supabase kb_articles, they will appear here automatically.</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content (when not searching) */}
      {!isSearching && (
        <>
          {/* Categories Grid */}
          {!selectedCategory && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Browse by Category</h2>
                <p className="text-sm text-muted-foreground">Explore topics to learn more about the platform</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {categories.map((category: StaticKBCategory) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onClick={() => setSelectedCategory(category.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Selected Category View */}
          {selectedCategory && (
            <div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 text-primary hover:underline mb-6"
              >
                <ChevronRightIcon className="h-4 w-4 rotate-180" />
                Back to all categories
              </button>
              
              {(() => {
                const category = categories.find((c: StaticKBCategory) => c.id === selectedCategory);
                return category ? (
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="h-14 w-14 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: category.color || '#6366f1' }}
                    >
                      {getCategoryIcon(category.icon)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                      <p className="text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allArticles
                  .filter((a: StaticKBArticle) => a.category_id === selectedCategory)
                  .map((article: StaticKBArticle) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
              </div>
              
              {allArticles.filter((a: StaticKBArticle) => a.category_id === selectedCategory).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No articles in this category yet</p>
                </div>
              )}
            </div>
          )}

          {/* Tabs for Popular/Recent */}
          {!selectedCategory && (
            <div className="mt-12">
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'popular', label: 'Popular Articles', icon: <FireIcon className="h-5 w-5" /> },
                    { id: 'recent', label: 'Recently Updated', icon: <ClockIcon className="h-5 w-5" /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(activeTab === 'popular' ? popularArticles : recentArticles).map((article: StaticKBArticle) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          )}

          {/* AI-Powered Suggestions */}
          {!selectedCategory && (
            <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 mt-8">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Can't find what you're looking for?</h3>
                    <p className="text-indigo-100 mb-4">
                      Our AI-powered assistant can help you find answers instantly. Just describe your issue and we'll point you to the right resources.
                    </p>
                    <div className="flex gap-3">
                      <Link to="/support">
                        <Button className="bg-white text-indigo-600 hover:bg-indigo-50">
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          Ask AI Assistant
                        </Button>
                      </Link>
                      <Link to="/support/tickets/new">
                        <Button variant="outline" className="border-white text-white hover:bg-white/10">
                          Create Support Ticket
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Quick Links Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <Card className="hover:shadow-lg transition-all duration-200 group">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <LightBulbIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Getting Started Guide</h3>
            <p className="text-sm text-muted-foreground mb-4">New to the platform? Start here to learn the basics.</p>
            <Link to="/support/knowledge-base/getting-started" className="text-primary hover:underline text-sm font-medium">
              Read Guide →
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 group">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <WrenchScrewdriverIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Troubleshooting</h3>
            <p className="text-sm text-muted-foreground mb-4">Having issues? Find solutions to common problems.</p>
            <Link to="/support/knowledge-base?category=troubleshooting" className="text-primary hover:underline text-sm font-medium">
              View Solutions →
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 group">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <BookOpenIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">API Documentation</h3>
            <p className="text-sm text-muted-foreground mb-4">Developer resources and API reference guides.</p>
            <Link to="/support/knowledge-base?category=api" className="text-primary hover:underline text-sm font-medium">
              View Docs →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
