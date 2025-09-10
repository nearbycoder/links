import { useState, useEffect } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  // Always start with initialValue to prevent hydration mismatch
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage after hydration
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      console.log(`Loading ${key} from localStorage:`, item)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.log(`Error loading ${key} from localStorage:`, error)
    }
    setIsHydrated(true)
  }, [key])

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      // Only save to localStorage after hydration
      if (isHydrated && typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
        console.log(`Saved ${key} to localStorage:`, valueToStore)
      }
    } catch (error) {
      console.log(`Error saving ${key} to localStorage:`, error)
    }
  }

  // Listen for changes to this localStorage key from other tabs/windows
  useEffect(() => {
    if (!isHydrated) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue)
          console.log(`localStorage changed for ${key}, updating to:`, newValue)
          setStoredValue(newValue)
        } catch (error) {
          console.log(`Error parsing localStorage change for ${key}:`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, isHydrated])

  return [storedValue, setValue]
}
