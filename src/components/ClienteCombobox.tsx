import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';

type ClienteOption = { id: number; nome: string };
type ClientesSearchResponse = { data: ClienteOption[] };

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft';

export function ClienteCombobox({
  value,
  onChange,
}: {
  value: ClienteOption | null;
  onChange: (cliente: ClienteOption | null) => void;
}) {
  const [inputValue, setInputValue] = useState(value?.nome ?? '');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = 'cliente-combobox-listbox';

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data } = useQuery({
    queryKey: ['clientes-search', debounced],
    queryFn: () => apiFetch<ClientesSearchResponse>(`/api/admin/clientes?search=${encodeURIComponent(debounced)}`),
    enabled: debounced.trim().length >= 2,
  });

  const options = data?.data ?? [];

  function selectOption(option: ClienteOption) {
    onChange(option);
    setInputValue(option.nome);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || options.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectOption(options[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <label htmlFor="cliente-combobox-input" className="mb-1 block text-sm font-medium text-foreground">
        Cliente
      </label>
      <input
        id="cliente-combobox-input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `cliente-option-${options[activeIndex].id}` : undefined}
        autoComplete="off"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setOpen(true);
          onChange(null);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => inputValue && setOpen(true)}
        placeholder="Escrever nome, email ou telefone..."
        className={INPUT_CLASS}
      />
      {open && options.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-secondary shadow-lg"
        >
          {options.map((option, index) => (
            <li
              key={option.id}
              id={`cliente-option-${option.id}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(option);
              }}
              className={`cursor-pointer px-3 py-2 text-sm ${
                index === activeIndex ? 'bg-electric/15 text-electric-soft' : 'text-foreground/80 hover:bg-secondary/70'
              }`}
            >
              {option.nome}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
