import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const ITEMS_PER_PAGE = 3;

export function PreviousComparisons({ repoA, repoB, onPaginationChange }) {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchComparisons = async () => {
      try {
        const response = await fetch('/api/get-previous-comparisons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ repoA, repoB }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch comparisons');
        }

        const data = await response.json();
        setComparisons(data.comparisons || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComparisons();
  }, [repoA, repoB]);

  useEffect(() => {
    const totalPages = Math.ceil(comparisons.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    onPaginationChange?.({
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, comparisons.length),
      total: comparisons.length
    });
  }, [currentPage, comparisons.length, onPaginationChange]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading previous evaluations...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }

  if (comparisons.length === 0) {
    return <div className="text-sm text-muted-foreground">No previous evaluations found.</div>;
  }

  const totalPages = Math.ceil(comparisons.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentComparisons = comparisons.slice(startIndex, endIndex);

  return (
    <div className="h-[600px] flex flex-col space-y-2">
      <div className="flex-1 space-y-3">
        {currentComparisons.map((comparison, index) => (
          <Card key={index} className="bg-muted/50">
            <CardContent className="py-3">
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    Choice: {comparison.choice === 'A' ? repoA : repoB}
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-sm text-primary">{comparison.multiplier}x</span>
                    <span className="text-muted-foreground"> more valuable</span>
                  </div>
                </div>
                <ScrollArea className="h-[100px]">
                  <p className="text-sm text-muted-foreground pr-4">{comparison.reasoning}</p>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
