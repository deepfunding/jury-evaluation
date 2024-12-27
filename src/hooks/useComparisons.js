import { useState, useEffect } from 'react';

export function useComparisons({ repoA, repoB }) {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchComparisons = async () => {
      try {
        setLoading(true);
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
        setComparisons(data.comparisons);
        setCurrentPage(1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComparisons();
  }, [repoA, repoB]);

  return {
    comparisons,
    loading,
    error,
    currentPage,
    setCurrentPage
  };
} 
