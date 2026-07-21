'use client';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export function SearchBar({ placeholder = 'Buscar...', value, onChange, onSearch }: SearchBarProps) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        className="flex-1 rounded border px-3 py-1.5"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="submit"
        className="rounded bg-zinc-900 px-4 py-1.5 text-sm text-white hover:bg-zinc-700"
      >
        Buscar
      </button>
    </form>
  );
}
