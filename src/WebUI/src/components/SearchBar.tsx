import { Search, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = "Tìm kiếm Galaxy..." }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch?.(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'w-72' : 'w-10'}`}>
        {isOpen && (
          <div className="absolute right-0 w-full">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onSearch?.(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
                if (e.key === 'Escape') {
                  setIsOpen(false);
                  setQuery('');
                }
              }}
              placeholder={placeholder}
              className="w-full px-4 py-2 pr-10 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 focus:outline-none focus:border-samsung-blue focus:ring-1 focus:ring-samsung-blue/30 transition-all"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          if (isOpen) handleSearch();
          else setIsOpen(true);
        }}
        className="absolute right-0 p-2 hover:bg-gray-100/70 rounded-full transition-colors duration-200"
        aria-label="Search"
      >
        <Search size={18} className="text-gray-700" />
      </button>
    </div>
  );
}
