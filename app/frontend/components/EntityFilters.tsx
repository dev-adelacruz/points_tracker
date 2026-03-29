import React, { useRef, useState } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import { useEntityFilters } from '../hooks/useEntityFilters';
import type { Team } from '../interfaces/team';
import type { Host } from '../interfaces/host';
import type { Session } from '../interfaces/session';

interface EntityFiltersProps {
  teams?: Team[];
  hosts?: Host[];
  sessions?: Session[];
  className?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sessionLabel(s: Session): string {
  return `${s.date} · ${s.session_slot === 'first' ? '1st' : '2nd'} session (${s.team_name})`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  onRemove: () => void;
}

const Chip: React.FC<ChipProps> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium">
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="p-0.5 rounded-full hover:bg-teal-200 transition-colors"
      aria-label={`Remove ${label} filter`}
    >
      <X className="w-2.5 h-2.5" />
    </button>
  </span>
);

// Multi-select dropdown (for teams)
interface MultiSelectProps {
  label: string;
  options: { id: number; label: string }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selectedIds, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = (id: number) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 h-9 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-colors shadow-sm ${
          selectedIds.length > 0
            ? 'border-teal-400 bg-teal-50 text-teal-700'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        <span>{label}</span>
        {selectedIds.length > 0 && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-bold">
            {selectedIds.length}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-20 w-52 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/80 overflow-hidden">
            {options.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400">No options available</p>
            ) : (
              <ul className="py-1 max-h-52 overflow-y-auto">
                {options.map(({ id, label: optLabel }) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        selectedIds.includes(id)
                          ? 'bg-teal-600 border-teal-600'
                          : 'border-slate-300'
                      }`}>
                        {selectedIds.includes(id) && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="truncate">{optLabel}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Searchable single/multi select dropdown (for hosts)
interface SearchableSelectProps {
  label: string;
  options: { id: number; label: string }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, options, selectedIds, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const toggle = (id: number) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 h-9 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-colors shadow-sm ${
          selectedIds.length > 0
            ? 'border-teal-400 bg-teal-50 text-teal-700'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        <span>{label}</span>
        {selectedIds.length > 0 && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-bold">
            {selectedIds.length}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setQuery(''); }} />
          <div className="absolute left-0 top-full mt-1.5 z-20 w-60 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/80 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100">
              <div className="flex items-center gap-2 px-2 h-8 rounded-lg bg-slate-50 border border-slate-200">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
                  autoFocus
                />
              </div>
            </div>
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400">No results</p>
            ) : (
              <ul className="py-1 max-h-52 overflow-y-auto">
                {filtered.map(({ id, label: optLabel }) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        selectedIds.includes(id)
                          ? 'bg-teal-600 border-teal-600'
                          : 'border-slate-300'
                      }`}>
                        {selectedIds.includes(id) && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="truncate">{optLabel}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const EntityFilters: React.FC<EntityFiltersProps> = ({
  teams = [],
  hosts = [],
  sessions = [],
  className = '',
}) => {
  const [filters, { setTeams, setHosts, setSessions, clearAll }] = useEntityFilters();

  const teamOptions    = teams.map((t) => ({ id: t.id, label: t.name }));
  const hostOptions    = hosts.map((h) => ({ id: h.id, label: h.email }));
  const sessionOptions = sessions.map((s) => ({ id: s.id, label: sessionLabel(s) }));

  const activeTeams    = teams.filter((t) => filters.teamIds.includes(t.id));
  const activeHosts    = hosts.filter((h) => filters.hostIds.includes(h.id));
  const activeSessions = sessions.filter((s) => filters.sessionIds.includes(s.id));

  const hasFilters =
    filters.teamIds.length > 0 ||
    filters.hostIds.length > 0 ||
    filters.sessionIds.length > 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {teams.length > 0 && (
          <MultiSelect
            label="Team"
            options={teamOptions}
            selectedIds={filters.teamIds}
            onChange={setTeams}
          />
        )}
        {hosts.length > 0 && (
          <SearchableSelect
            label="Host"
            options={hostOptions}
            selectedIds={filters.hostIds}
            onChange={setHosts}
          />
        )}
        {sessions.length > 0 && (
          <MultiSelect
            label="Session"
            options={sessionOptions}
            selectedIds={filters.sessionIds}
            onChange={setSessions}
          />
        )}
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeTeams.map((t) => (
            <Chip
              key={`team-${t.id}`}
              label={`Team: ${t.name}`}
              onRemove={() => setTeams(filters.teamIds.filter((id) => id !== t.id))}
            />
          ))}
          {activeHosts.map((h) => (
            <Chip
              key={`host-${h.id}`}
              label={`Host: ${h.email}`}
              onRemove={() => setHosts(filters.hostIds.filter((id) => id !== h.id))}
            />
          ))}
          {activeSessions.map((s) => (
            <Chip
              key={`session-${s.id}`}
              label={`Session: ${sessionLabel(s)}`}
              onRemove={() => setSessions(filters.sessionIds.filter((id) => id !== s.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EntityFilters;
