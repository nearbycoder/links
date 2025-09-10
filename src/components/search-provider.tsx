import { createContext, useContext, useState, ReactNode } from 'react'
import { SearchCommand } from './search-command'

interface SearchContextType {
  openSearch: () => void
  closeSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

interface SearchProviderProps {
  children: ReactNode
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [open, setOpen] = useState(false)

  const openSearch = () => setOpen(true)
  const closeSearch = () => setOpen(false)

  return (
    <SearchContext.Provider value={{ openSearch, closeSearch }}>
      {children}
      <SearchCommand open={open} onOpenChange={setOpen} />
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}
