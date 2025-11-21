import { useState, useEffect, useCallback } from 'react';

// SIGNAL: Generic Type constraints for reusability
export function usePersistentStore<T extends { id: string }>(key: string, migrator: (data: any) => T[]) {
  const [items, setItems] = useState<T[]>([]);

  // Initialize with Error Boundary logic inside
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setItems(migrator(JSON.parse(stored)));
      }
    } catch (error) {
      console.error(`[STORAGE CORRUPTION] Failed to load ${key}`, error);
      // In a real app, we would emit a telemetry event here
    }
  }, [key, migrator]);

  const persist = useCallback((newItems: T[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(newItems));
      setItems(newItems);
    } catch (e) {
      console.error("Quota Exceeded", e);
    }
  }, [key]);

  const add = useCallback((item: T) => {
    persist([...items, item]);
  }, [items, persist]);

  const addHead = useCallback((item: T) => {
    persist([item, ...items]);
  }, [items, persist]);

  const addSorted = useCallback((item: T, sortFn: (a: T, b: T) => number) => {
    persist([...items, item].sort(sortFn));
  }, [items, persist]);

  const update = useCallback((item: T) => {
    persist(items.map(i => i.id === item.id ? item : i));
  }, [items, persist]);

  const remove = useCallback((id: string) => {
    persist(items.filter(i => i.id !== id));
  }, [items, persist]);

  return { items, add, addHead, addSorted, update, remove };
}