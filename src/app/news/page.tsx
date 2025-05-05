"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Parser from "rss-parser";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  Clock,
  RefreshCw,
  AlertTriangle,
  Rss,
  Search,
  Brain,
  Heart,
  Sparkles,
  Bookmark,
  Share2,
  ThumbsUp,
  BookOpen,
  Moon,
  Sun,
  ImageIcon, // Import the ImageIcon component
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

// RSS feed sources with categorization
const rssFeeds = [
  {
    name: "Psychology Today - Irrelationship Blog",
    url: "http://www.psychologytoday.com/blog/irrelationship/feed",
    category: "relationships",
  },
  {
    name: "NIMH Main Feed",
    url: "https://www.nimh.nih.gov/site-info/index-rss.atom",
    category: "research",
  },
  {
    name: "PsyBlog",
    url: "https://www.spring.org.uk/feed",
    category: "mental-tips",
  },
  {
    name: "Psychreg",
    url: "https://www.psychreg.org/feed",
    category: "selfcare",
  },
  {
    name: "Zen Habits",
    url: "https://zenhabits.net/feed/",
    category: "daily-calm",
  },
  {
    name: "SAMHSA",
    url: "https://www.samhsa.gov/about/laws-regulations-policies/website/rss-feed",
    category: "mental-health",
  },
  {
    name: "Positive Psychology News",
    url: "https://positivepsychologynews.com/feed",
    category: "happiness",
  },
  {
    name: "GoodTherapy Blog",
    url: "https://rss.feedspot.com/psychotherapy_rss_feeds/1.xml",
    category: "therapy-tips",
  },
];

// Define types
type FeedItem = {
  title: string;
  link: string;
  contentSnippet: string;
  isoDate: string;
  feedName: string;
  category: string;
  image?: string;
};

// Category icons mapping
const categoryIcons: Record<string, JSX.Element> = {
  "relationships": <Heart className="h-4 w-4" />,
  "research": <Brain className="h-4 w-4" />,
  "mental-tips": <Sparkles className="h-4 w-4" />,
  "selfcare": <Heart className="h-4 w-4" />,
  "daily-calm": <BookOpen className="h-4 w-4" />,
  "mental-health": <Brain className="h-4 w-4" />,
  "happiness": <ThumbsUp className="h-4 w-4" />,
  "therapy-tips": <BookOpen className="h-4 w-4" />,
  "all": <Rss className="h-4 w-4" />
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  if (!dateString) return "No date";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Extract a snippet from content
const getSnippet = (content: string | undefined, maxLength = 150): string => {
  if (!content) return "";
  
  // Remove HTML tags
  const plainText = content.replace(/<[^>]*>?/gm, '');
  
  if (plainText.length <= maxLength) return plainText;
  
  // Find the last space before maxLength
  const lastSpace = plainText.substring(0, maxLength).lastIndexOf(' ');
  return `${plainText.substring(0, lastSpace)}...`;
};

// Generate a placeholder image based on category
const getCategoryImage = (category: string) => {
  const colors: Record<string, string> = {
    "relationships": "#FF6B6B",
    "research": "#4ECDC4",
    "mental-tips": "#FF9F1C",
    "selfcare": "#A78BFA",
    "daily-calm": "#2EC4B6",
    "mental-health": "#3A86FF",
    "happiness": "#FFBE0B",
    "therapy-tips": "#FB5607",
  };
  
  const bgColor = colors[category] || "#6366F1";
  
  return `https://via.placeholder.com/600x400/${bgColor.replace('#', '')}?text=${category.replace('-', ' ')}`;
};

// Loading skeleton component
const NewsItemSkeleton = () => (
  <Card className="h-full overflow-hidden">
    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-48 w-full"></div>
    <CardHeader>
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </CardContent>
    <CardFooter>
      <Skeleton className="h-4 w-1/3" />
    </CardFooter>
  </Card>
);

// Category card component for the homepage
const CategoryCard = ({ category, icon, count, onClick }: { 
  category: string; 
  icon: JSX.Element;
  count: number; 
  onClick: () => void;
}) => (
  <motion.div
    whileHover={{ y: -5 }}
    whileTap={{ scale: 0.98 }}
  >
    <Card 
      className="cursor-pointer h-full overflow-hidden group"
      onClick={onClick}
    >
      <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-6 flex flex-col items-center justify-center gap-3 transition-all group-hover:from-primary/30 group-hover:to-primary/20">
        <div className="p-3 bg-primary/10 rounded-full text-primary">
          {icon}
        </div>
        <h3 className="text-lg font-semibold capitalize">{category.replace('-', ' ')}</h3>
        <Badge variant="outline">{count} articles</Badge>
      </div>
    </Card>
  </motion.div>
);

// Featured article component
const FeaturedArticle = ({ article }: { article: FeedItem }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        <div
          className="h-64 bg-cover bg-center"
          style={{
            backgroundImage: `url(${article.image || getCategoryImage(article.category)})`,
          }}
        />
        <div className="flex flex-col h-full">
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <div>
                <Badge variant="secondary" className="mb-2 capitalize">
                  {categoryIcons[article.category]}
                  <span className="ml-1">{article.category.replace('-', ' ')}</span>
                </Badge>
                <CardTitle className="text-2xl">{article.title}</CardTitle>
              </div>
            </div>
            <CardDescription className="text-sm flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(article.isoDate)}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-grow">
            <p className="text-base">{article.contentSnippet}</p>
          </CardContent>

          <CardFooter className="pt-2 flex justify-between items-center">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Rss className="h-3 w-3" />
              {article.feedName}
            </span>
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-1"
              asChild
            >
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read Article <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </CardFooter>
        </div>
      </div>
    </Card>
  </motion.div>
);

// News Item component with animation
const NewsItem = ({ item, index }: { item: FeedItem; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
  >
    <Card className="flex flex-col h-full rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out group overflow-hidden">
      {item.image ? (
        <div 
          className="h-48 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ 
            backgroundImage: `url(${item.image})`
          }}
        />
      ) : (
        <div className="h-48 flex items-center justify-center bg-muted">
          {categoryIcons[item.category] ? categoryIcons[item.category] : <Rss className="h-4 w-4" />}
        </div>
      )}
      <CardHeader className="p-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-xl font-semibold leading-tight group-hover:text-primary transition-colors">{item.title}</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="capitalize text-xs flex items-center gap-1">
                  {categoryIcons[item.category] ? categoryIcons[item.category] : <Rss className="h-3 w-3" />}
                  <span>{item.category.replace('-', ' ')}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Category: {item.category.replace('-', ' ')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-sm flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDate(item.isoDate)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow p-4">
        <p className="text-base leading-relaxed">{item.contentSnippet}</p>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between items-center p-4">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Rss className="h-3 w-3" />
          {item.feedName}
        </span>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save article</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share article</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            variant="default" 
            size="sm" 
            className="ml-2 rounded-full"
            asChild
          >
            <a 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              Read <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  </motion.div>
);

const NewsPage = () => {
  const [newsItems, setNewsItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [viewMode, setViewMode] = useState<"cards" | "categories">("cards");
  const itemsPerPage = 9;

  // Effect to apply theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Extract unique categories from feeds
  const categories = useMemo(() => {
    const allCategories = new Set(rssFeeds.map(feed => feed.category));
    return ["all", ...Array.from(allCategories)];
  }, []);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use Promise.all to fetch all feeds in parallel
      const feedPromises = rssFeeds.map(async (feed) => {
        try {
          const response = await fetch(`/api/rss-proxy?url=${encodeURIComponent(feed.url)}`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          
          const xmlText = await response.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          
          // Parse the XML - this would use a library like rss-parser on the server
          // or custom parsing logic here
          const items = Array.from(xmlDoc.querySelectorAll('item')).map(item => {
            let imageUrl = null;

            // Try to get image from enclosure tag
            const enclosure = item.querySelector('enclosure');
            if (enclosure) {
              imageUrl = enclosure.getAttribute('url');
            }

            // If no enclosure, try to find image in description
            if (!imageUrl) {
              const description = item.querySelector('description')?.textContent;
              if (description) {
                const imgTag = description.match(/<img[^>]+src="([^">]+)"/);
                if (imgTag && imgTag.length > 1) {
                  imageUrl = imgTag[1];
                }
              }
            }

            return {
              title: item.querySelector('title')?.textContent || 'No title',
              link: item.querySelector('link')?.textContent || '',
              contentSnippet: getSnippet(item.querySelector('description')?.textContent || ""),
              isoDate: item.querySelector('pubDate')?.textContent || '',
              feedName: feed.name,
              category: feed.category,
              image: imageUrl || getCategoryImage(feed.category),
            };
          });

          return items;
        } catch (error) {
          console.error(`Error fetching feed ${feed.name}:`, error);
          return []; // Return empty array for failed feeds
        }
      });

      const results = await Promise.all(feedPromises);
      const allItems = results.flat().sort((a, b) => {
        const dateA = new Date(a.isoDate || 0);
        const dateB = new Date(b.isoDate || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setNewsItems(allItems);
    } catch (error) {
      console.error("Error fetching news:", error);
      setError("Failed to load news feeds. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    
    // Set up automatic refresh every 30 minutes
    const refreshInterval = setInterval(fetchNews, 30 * 60 * 1000);
    
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K for search focus
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
      }
      
      // Right arrow for next page
      if (e.key === 'ArrowRight' && page < totalPages) {
        setPage(p => p + 1);
      }
      
      // Left arrow for previous page
      if (e.key === 'ArrowLeft' && page > 1) {
        setPage(p => p - 1);
      }
      
      // Number keys for category selection
      if (e.key >= '0' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index === -1) {
          setActiveCategory('all');
        } else if (index >= 0 && index < categories.length - 1) {
          setActiveCategory(categories[index + 1]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fetchNews, categories, page]);

  // Filter items by category and search query
  const filteredItems = useMemo(() => {
    let items = newsItems;
    
    // Filter by category
    if (activeCategory !== "all") {
      items = items.filter(item => item.category === activeCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.contentSnippet.toLowerCase().includes(query) ||
        item.feedName.toLowerCase().includes(query)
      );
    }
    
    return items;
  }, [newsItems, activeCategory, searchQuery]);

  // Paginate items
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, page, itemsPerPage]);

  // Get featured article
  const featuredArticle = useMemo(() => {
    return newsItems[0] || null;
  }, [newsItems]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Count articles per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: newsItems.length };
    
    newsItems.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    
    return counts;
  }, [newsItems]);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setPage(1); // Reset to first page when changing category
    setViewMode("cards"); // Switch to cards view
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchNews();
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === "light" ? "dark" : "light");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 transition-colors duration-300">
      {/* Header with theme toggle */}
      <header className="sticky top-0 z-10 backdrop-blur-lg bg-background/80 border-b">
        <div className="container mx-auto py-3 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">MindfulFeed</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-input"
                placeholder="Search articles... (Ctrl+K)"
                className="pl-10 rounded-full"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1); // Reset to first page when searching
                }}
              />
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleTheme}
                    className="rounded-full"
                  >
                    {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle {theme === "light" ? "dark" : "light"} mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleRefresh} 
                    disabled={loading}
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{loading ? "Refreshing..." : "Refresh feeds"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        {/* Hero section with featured article */}
        {!loading && featuredArticle && (
          <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Featured Article</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "cards" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                >
                  Articles
                </Button>
                <Button
                  variant={viewMode === "categories" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("categories")}
                >
                  Categories
                </Button>
              </div>
            </div>
            <FeaturedArticle article={featuredArticle} />
          </section>
        )}
        
        {/* Category tabs with improved styling */}
        <ScrollArea className="pb-4 mb-4">
          <Tabs 
            defaultValue="all" 
            value={activeCategory} 
            onValueChange={handleCategoryChange}
            className="mb-6"
          >
            <TabsList className="mb-6 p-1 bg-muted/50 backdrop-blur-sm rounded-full inline-flex w-auto">
              {categories.map((category, index) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="capitalize rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-1.5"
                >
                  {categoryIcons[category]}
                  <span>{category.replace('-', ' ')}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <AnimatePresence mode="wait">
              <TabsContent value={activeCategory} className="mt-0">
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {error}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefresh}
                        className="ml-2"
                      >
                        Try Again
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                
                {loading && newsItems.length === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(6).fill(0).map((_, index) => (
                      <NewsItemSkeleton key={index} />
                    ))}
                  </div>
                ) : viewMode === "categories" ? (
                  // Categories view
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                  >
                    {categories.filter(cat => cat !== "all").map((category) => (
                      <CategoryCard
                        key={category}
                        category={category}
                        icon={categoryIcons[category]}
                        count={categoryCounts[category] || 0}
                        onClick={() => handleCategoryChange(category)}
                      />
                    ))}
                  </motion.div>
                ) : paginatedItems.length > 0 ? (
                  // Articles view
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {paginatedItems.map((item, index) => (
                      <NewsItem 
                        key={`${item.link}-${index}`} 
                        item={item} 
                        index={index}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center py-12">
                      <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No articles found</h3>
                      <p className="text-muted-foreground mb-6">
                        {searchQuery 
                          ? "Try a different search term or category."
                          : "No articles available for this category."
                        }
                      </p>
                      <div className="flex justify-center gap-3">
                        {searchQuery && (
                          <Button 
                            variant="outline" 
                            onClick={() => setSearchQuery("")}
                          >
                            Clear Search
                          </Button>
                        )}
                        <Button onClick={handleRefresh}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Feeds
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Pagination with improved UI */}
                {totalPages > 1 && viewMode === "cards" && (
                  <div className="flex justify-center mt-8">
                    <div className="bg-card flex items-center rounded-full p-1 shadow-sm border">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="rounded-full text-xs h-8 w-8 p-0"
                      >
                        «
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="rounded-full text-xs h-8 w-8 p-0"
                      >
                        ‹
                      </Button>
                      
                      <div className="px-4 font-medium text-sm">
                        {page} / {totalPages}
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="rounded-full text-xs h-8 w-8 p-0"
                      >
                        ›
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                        className="rounded-full text-xs h-8 w-8 p-0"
                      >
                        »
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </ScrollArea>
      </main>
      
      {/* Footer */}
      <footer className="border-t py-6 mt-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold">MindfulFeed</p>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Keyboard shortcuts: Ctrl+K to search, ← → for pagination, numbers 1-{categories.length-1} for categories
            </p>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">About</Button>
              <Button variant="ghost" size="sm">Privacy</Button>
              <Button variant="ghost" size="sm">Contact</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewsPage;
