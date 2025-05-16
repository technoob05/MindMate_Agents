import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, ChevronDown, ChevronUp, FileText, Star, Award, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface SourceDocumentsProps {
  sourceDocs: Array<{
    pageContent: string;
    metadata: Record<string, any>;
  }>;
}

export function SourceDocuments({ sourceDocs }: SourceDocumentsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!sourceDocs || sourceDocs.length === 0) {
    return null;
  }

  // Scroll to the selected source
  useEffect(() => {
    if (isExpanded && activeIndex !== null && containerRef.current) {
      const container = containerRef.current;
      const activeElement = container.querySelector(`[data-index="${activeIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeIndex, isExpanded]);

  return (
    <div className="mt-3">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-3 text-xs flex items-center gap-1.5 text-primary font-medium hover:bg-primary/10"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <BookOpen size={16} className="text-primary" />
          <span>
            {sourceDocs.length} {sourceDocs.length === 1 ? 'nguồn' : 'nguồn'} tài liệu tham khảo
          </span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
        
        <div className="flex gap-1">
          {sourceDocs.map((_, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 500, damping: 30 }}
              onClick={() => {
                if (!isExpanded) setIsExpanded(true);
                setActiveIndex(index);
              }}
              className={`h-3 w-3 rounded-full cursor-pointer border border-primary/30 ${activeIndex === index ? 'bg-primary' : 'bg-primary/20'} hover:bg-primary/50 transition-colors`}
            />
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 border-2 border-primary/20 rounded-lg overflow-hidden bg-gradient-to-br from-background to-muted/50"
          >
            <div 
              ref={containerRef}
              className="max-h-80 overflow-y-auto p-0.5 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
            >
              <div className="space-y-3 p-3">
                {sourceDocs.map((doc, index) => (
                  <motion.div
                    key={index}
                    data-index={index}
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 + index * 0.15 }}
                    className={`space-y-2 p-3 rounded-lg transition-colors duration-300 ${
                      activeIndex === index 
                        ? 'bg-primary/10 shadow-md border border-primary/30' 
                        : 'bg-card/50 hover:bg-card/80 border border-border/50'
                    }`}
                    onClick={() => setActiveIndex(index === activeIndex ? null : index)}
                  >
                    {/* Source header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${getSourceColor(doc.metadata.relevanceScore || 0.5)}`}>
                          <FileText size={16} className="text-white" />
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm flex items-center gap-1">
                            {doc.metadata.source || 'Tài liệu tham khảo'}
                            {(doc.metadata.relevanceScore || 0) > 0.85 && (
                              <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            )}
                          </h4>
                          {doc.metadata.page && (
                            <div className="text-xs text-muted-foreground">
                              Trang {doc.metadata.page}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Relevance score */}
                      {doc.metadata.relevanceScore && (
                        <Badge 
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            getRelevanceBadgeClass(doc.metadata.relevanceScore)
                          }`}
                        >
                          {Math.round(doc.metadata.relevanceScore * 100)}% phù hợp
                        </Badge>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="bg-muted/40 rounded-md p-3 text-xs leading-relaxed border border-border/30">
                      {doc.pageContent}
                    </div>
                    
                    {/* Additional metadata */}
                    {doc.metadata.author && (
                      <div className="flex justify-between items-center text-xs pt-1 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Award size={12} />
                          {doc.metadata.author}
                        </span>
                        
                        {doc.metadata.url && (
                          <Button
                            variant="ghost"
                            size="sm" 
                            className="h-6 px-2 text-[10px] flex items-center gap-1"
                          >
                            <ExternalLink size={10} />
                            <span>Xem nguồn</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to get color based on relevance score
function getSourceColor(score: number): string {
  if (score > 0.9) return 'bg-green-500';
  if (score > 0.8) return 'bg-blue-500';
  if (score > 0.7) return 'bg-indigo-500';
  if (score > 0.6) return 'bg-purple-500';
  if (score > 0.5) return 'bg-amber-500';
  return 'bg-slate-500';
}

// Helper function to get badge class based on relevance score
function getRelevanceBadgeClass(score: number): string {
  if (score > 0.9) return 'bg-green-100 text-green-800 border-green-300';
  if (score > 0.8) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (score > 0.7) return 'bg-indigo-100 text-indigo-800 border-indigo-300';
  if (score > 0.6) return 'bg-purple-100 text-purple-800 border-purple-300';
  if (score > 0.5) return 'bg-amber-100 text-amber-800 border-amber-300';
  return 'bg-slate-100 text-slate-800 border-slate-300';
} 