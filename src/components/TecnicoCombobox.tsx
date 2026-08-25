import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';

type Tecnico = { id: number; name: string };
type TecnicosResponse = { tecnicos: Tecnico[] };

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft';
const SEM_TECNICO_ID = 'tecnico-option-sem-tecnico';

export function TecnicoCombobox({
  value,
  onChange,
}: {
  value: Tecnico | null;
  onChange: (tecnico: Tecnico | null) => void;
}) {
  const [inputValue, setInputValue] = useState(value?.name ?? '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = 'tecnico-combobox-listbox';

  const { data } = useQuery({
    queryKey: ['tecnicos'],
    queryFn: () => apiFetch<TecnicosResponse>('/api/admin/tecnicos'),
  });

  const tecnicos = data?.tecnicos ?? [];
  const filtered = useMemo(
    () => tecnicos.filter((t) => t.name.toLowerCase().includes(inputValue.toLowerCase())),
    [tecnicos, inputValue],
  );

  function selectTecnico(tecnico: Tecnico | null) {
    onChange(tecnico);
    setInputValue(tecnico?.name ?? '');
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    const count = filtered.length + 1; // +1 for "Sem técnico atribuído"
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % count);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + count) % count);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      if (activeIndex === 0) selectTecnico(null);
      else selectTecnico(filtered[activeIndex - 1]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <label htmlFor="tecnico-combobox-input" className="mb-1 block text-sm font-medium text-foreground">
        Técnico (opcional)
      </label>
      <input
        id="tecnico-combobox-input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          activeIndex === 0 ? SEM_TECNICO_ID : activeIndex > 0 ? `tecnico-option-${filtered[activeIndex - 1].id}` : undefined
        }
        autoComplete="off"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        placeholder="Escrever nome do técnico..."
        className={INPUT_CLASS}
      />
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-secondary shadow-lg"
        >
          <li
            id={SEM_TECNICO_ID}
            role="option"
            aria-selected={activeIndex === 0}
            onMouseDown={(e) => {
              e.preventDefault();
              selectTecnico(null);
            }}
            className={`cursor-pointer px-3 py-2 text-sm ${
              activeIndex === 0 ? 'bg-electric/15 text-electric-soft' : 'text-muted-foreground hover:bg-secondary/70'
            }`}
          >
            Sem técnico atribuído
          </li>
          {filtered.map((tecnico, index) => (
            <li
              key={tecnico.id}
              id={`tecnico-option-${tecnico.id}`}
              role="option"
              aria-selected={index + 1 === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                selectTecnico(tecnico);
              }}
              className={`cursor-pointer px-3 py-2 text-sm ${
                index + 1 === activeIndex ? 'bg-electric/15 text-electric-soft' : 'text-foreground/80 hover:bg-secondary/70'
              }`}
            >
              {tecnico.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
