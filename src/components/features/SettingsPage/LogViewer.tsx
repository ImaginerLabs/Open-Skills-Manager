import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  ArrowsClockwise,
  Copy,
  DownloadSimple,
  Trash,
  CaretDown,
  CaretRight,
  Funnel,
  MagnifyingGlass,
  FileText,
  X,
} from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { logService } from '@/services/logService';
import { useUIStore } from '@/stores/uiStore';
import { formatDateTime } from '@/utils/formatters';
import type { LogEntry, LogLevel, LogSource, LogFilter, LogStats } from '@/types/log';
import { LOG_MODULES } from '@/types/log';
import styles from './LogViewer.module.scss';

interface LogViewerProps {
  open: boolean;
  onClose: () => void;
}

type SourceFilter = 'all' | LogSource;

// Level colors mapping - use type assertion for CSS module classes
const LEVEL_COLORS: Record<LogLevel, string> = {
  error: styles.levelError!,
  warn: styles.levelWarn!,
  info: styles.levelInfo!,
  debug: styles.levelDebug!,
};

// Level badge styles
const LEVEL_BADGE: Record<LogLevel, string> = {
  error: styles.badgeError!,
  warn: styles.badgeWarn!,
  info: styles.badgeInfo!,
  debug: styles.badgeDebug!,
};

// Level labels
const LEVEL_LABELS: Record<LogLevel, string> = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
  debug: 'DEBUG',
};

// Format context for display
function formatContext(context: Record<string, unknown>): string {
  try {
    return JSON.stringify(context, null, 2);
  } catch {
    return String(context);
  }
}

// All available levels
const ALL_LEVELS: LogLevel[] = ['error', 'warn', 'info', 'debug'];

// All available modules
const ALL_MODULES = Object.values(LOG_MODULES);

export function LogViewer({ open, onClose }: LogViewerProps): React.ReactElement | null {
  const { showToast, showConfirmDialog } = useUIStore();

  // State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [logPath, setLogPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [selectedLevels, setSelectedLevels] = useState<LogLevel[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded log entries
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Dropdown state
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showModuleDropdown, setShowModuleDropdown] = useState(false);

  // Refs for click outside detection
  const levelDropdownRef = useRef<HTMLDivElement>(null);
  const moduleDropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search query
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update debounced search with 300ms delay
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(target)) {
        setShowLevelDropdown(false);
      }
      if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(target)) {
        setShowModuleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter: LogFilter = {
        ...(selectedLevels.length > 0 && {
          level: selectedLevels.length === 1 ? selectedLevels[0] : selectedLevels,
        }),
        ...(selectedModules.length > 0 && {
          module: selectedModules.length === 1 ? selectedModules[0] : selectedModules,
        }),
        ...(sourceFilter !== 'all' && { source: sourceFilter }),
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      };

      // Use combined API to avoid duplicate file reads
      const result = await logService.listWithStats({ filter, limit: 500 });

      if (result.success) {
        setLogs(result.data.logs);
        setStats(result.data.stats);
        setLogPath(result.data.path);
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  }, [selectedLevels, selectedModules, sourceFilter, debouncedSearch, showToast]);

  // Initial fetch and filter changes
  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, fetchLogs]);

  // Toggle log expansion
  const toggleExpand = useCallback((index: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      const id = String(index);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Toggle level filter
  const toggleLevel = useCallback((level: LogLevel) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  }, []);

  // Toggle module filter
  const toggleModule = useCallback((module: string) => {
    setSelectedModules((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    );
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedLevels([]);
    setSelectedModules([]);
    setSourceFilter('all');
    setSearchQuery('');
  }, []);

  // Copy all logs
  const handleCopyAll = useCallback(async () => {
    try {
      const text = logs
        .map((log) => {
          const parts = [
            `[${log.timestamp}]`,
            `[${log.level.toUpperCase()}]`,
            `[${log.source}]`,
            `[${log.module}]`,
            `[${log.code}]`,
            log.message,
          ];
          if (log.context) {
            parts.push(JSON.stringify(log.context));
          }
          if (log.stackTrace) {
            parts.push('\n' + log.stackTrace);
          }
          return parts.join(' ');
        })
        .join('\n');

      await navigator.clipboard.writeText(text);
      showToast('success', 'Logs copied to clipboard');
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to copy logs');
    }
  }, [logs, showToast]);

  // Export logs
  const handleExport = useCallback(
    async (format: 'json' | 'txt') => {
      try {
        const filter: LogFilter = {
          ...(selectedLevels.length > 0 && {
            level: selectedLevels.length === 1 ? selectedLevels[0] : selectedLevels,
          }),
          ...(selectedModules.length > 0 && {
            module: selectedModules.length === 1 ? selectedModules[0] : selectedModules,
          }),
          ...(sourceFilter !== 'all' && { source: sourceFilter }),
          ...(searchQuery.trim() && { search: searchQuery.trim() }),
        };

        const exportFormat = format === 'txt' ? 'txt' : 'json';
        const result = await logService.export(
          exportFormat,
          Object.keys(filter).length > 0 ? filter : undefined
        );
        if (result.success) {
          showToast('success', `Logs exported to ${result.data}`);
        } else {
          showToast('error', result.error.message);
        }
      } catch (e) {
        showToast('error', e instanceof Error ? e.message : 'Failed to export logs');
      }
    },
    [selectedLevels, selectedModules, sourceFilter, searchQuery, showToast]
  );

  // Clear logs
  const handleClear = useCallback(() => {
    showConfirmDialog({
      title: 'Clear Logs',
      message: 'Are you sure you want to clear all logs? This action cannot be undone.',
      confirmText: 'Clear',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const result = await logService.clear();
          if (result.success) {
            showToast('success', `Cleared ${result.data} log entries`);
            fetchLogs();
          } else {
            showToast('error', result.error.message);
          }
        } catch (e) {
          showToast('error', e instanceof Error ? e.message : 'Failed to clear logs');
        }
      },
    });
  }, [showConfirmDialog, showToast, fetchLogs]);

  // Check if any filter is active
  const hasActiveFilters =
    selectedLevels.length > 0 ||
    selectedModules.length > 0 ||
    sourceFilter !== 'all' ||
    debouncedSearch.trim() !== '';

  // Filter summary text
  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (selectedLevels.length > 0) {
      parts.push(`${selectedLevels.length} level${selectedLevels.length > 1 ? 's' : ''}`);
    }
    if (selectedModules.length > 0) {
      parts.push(`${selectedModules.length} module${selectedModules.length > 1 ? 's' : ''}`);
    }
    if (sourceFilter !== 'all') {
      parts.push(sourceFilter);
    }
    if (debouncedSearch.trim()) {
      parts.push(`"${debouncedSearch}"`);
    }
    return parts.length > 0 ? parts.join(', ') : 'All logs';
  }, [selectedLevels, selectedModules, sourceFilter, debouncedSearch]);

  return (
    <Modal open={open} onClose={onClose} title="Logs" className={styles.modal} data-testid="log-viewer">
      {/* Toolbar */}
      <div className={styles.toolbar}>
        {/* Search */}
        <div className={styles.searchContainer}>
          <MagnifyingGlass size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Filter buttons */}
        <div className={styles.filterButtons}>
          {/* Level filter */}
          <div className={styles.dropdown} ref={levelDropdownRef}>
            <button
              type="button"
              className={`${styles.filterButton} ${selectedLevels.length > 0 ? styles.active : ''}`}
              onClick={() => {
                setShowLevelDropdown(!showLevelDropdown);
                setShowModuleDropdown(false);
              }}
            >
              <Funnel size={14} />
              <span>Level</span>
              <span className={`${styles.badge} ${selectedLevels.length === 0 ? styles.badgeHidden : ''}`}>
                {selectedLevels.length}
              </span>
              <CaretDown size={12} className={showLevelDropdown ? styles.caretUp : ''} />
            </button>
            {showLevelDropdown && (
              <div className={styles.dropdownMenu}>
                {ALL_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`${styles.dropdownItem} ${selectedLevels.includes(level) ? styles.selected : ''}`}
                    onClick={() => toggleLevel(level)}
                  >
                    <span className={`${styles.levelIndicator} ${LEVEL_COLORS[level]}`} />
                    <span>{LEVEL_LABELS[level]}</span>
                    {stats && <span className={styles.count}>{stats.byLevel[level]}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Module filter */}
          <div className={styles.dropdown} ref={moduleDropdownRef}>
            <button
              type="button"
              className={`${styles.filterButton} ${selectedModules.length > 0 ? styles.active : ''}`}
              onClick={() => {
                setShowModuleDropdown(!showModuleDropdown);
                setShowLevelDropdown(false);
              }}
            >
              <FileText size={14} />
              <span>Module</span>
              <span className={`${styles.badge} ${selectedModules.length === 0 ? styles.badgeHidden : ''}`}>
                {selectedModules.length}
              </span>
              <CaretDown size={12} className={showModuleDropdown ? styles.caretUp : ''} />
            </button>
            {showModuleDropdown && (
              <div className={styles.dropdownMenu}>
                {ALL_MODULES.map((module) => (
                  <button
                    key={module}
                    type="button"
                    className={`${styles.dropdownItem} ${selectedModules.includes(module) ? styles.selected : ''}`}
                    onClick={() => toggleModule(module)}
                  >
                    <span>{module}</span>
                    {stats && <span className={styles.count}>{stats.byModule[module] || 0}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Source filter */}
          <div className={styles.sourceToggle}>
            <button
              type="button"
              className={`${styles.sourceButton} ${sourceFilter === 'all' ? styles.active : ''}`}
              onClick={() => setSourceFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`${styles.sourceButton} ${sourceFilter === 'FRONTEND' ? styles.active : ''}`}
              onClick={() => setSourceFilter('FRONTEND')}
            >
              Frontend
            </button>
            <button
              type="button"
              className={`${styles.sourceButton} ${sourceFilter === 'BACKEND' ? styles.active : ''}`}
              onClick={() => setSourceFilter('BACKEND')}
            >
              Backend
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className={styles.actionButtons}>
          <Button variant="ghost" size="small" onClick={fetchLogs} disabled={isLoading}>
            <ArrowsClockwise size={16} className={isLoading ? styles.spinning : ''} />
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={clearFilters}
            title="Clear filters"
            disabled={!hasActiveFilters}
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className={styles.statsBar}>
        <span className={styles.stat}>
          {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
          {stats && stats.total !== logs.length && ` of ${stats.total}`}
        </span>
        <span className={styles.filterSummary}>{filterSummary}</span>
        {logPath && (
          <span className={styles.path} title={logPath}>
            {logPath}
          </span>
        )}
      </div>

      {/* Log list */}
      <div className={styles.logList}>
        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : logs.length === 0 ? (
          <div className={styles.empty}>No logs found</div>
        ) : (
          logs.map((log, index) => {
            const id = String(index);
            const isExpanded = expandedIds.has(id);

            return (
              <div
                key={id}
                className={`${styles.logEntry} ${LEVEL_COLORS[log.level]}`}
                onClick={() => log.context || log.stackTrace ? toggleExpand(index) : undefined}
                style={{ cursor: log.context || log.stackTrace ? 'pointer' : 'default' }}
              >
                <div className={styles.logHeader}>
                  <span className={styles.expandIcon}>
                    {log.context || log.stackTrace ? (
                      isExpanded ? <CaretDown size={14} /> : <CaretRight size={14} />
                    ) : (
                      <span style={{ width: 14, display: 'inline-block' }} />
                    )}
                  </span>
                  <span className={styles.timestamp}>{formatDateTime(log.timestamp, { includeSeconds: true })}</span>
                  <span className={`${styles.level} ${LEVEL_BADGE[log.level]}`}>
                    {LEVEL_LABELS[log.level]}
                  </span>
                  <span className={styles.source}>{log.source}</span>
                  <span className={styles.module}>[{log.module}]</span>
                  <span className={styles.code}>[{log.code}]</span>
                  <span className={styles.message}>{log.message}</span>
                </div>
                {isExpanded && (log.context || log.stackTrace) && (
                  <div className={styles.logDetails}>
                    {log.context && Object.keys(log.context).length > 0 && (
                      <div className={styles.contextSection}>
                        <span className={styles.contextLabel}>Context:</span>
                        <pre className={styles.contextValue}>{formatContext(log.context)}</pre>
                      </div>
                    )}
                    {log.stackTrace && (
                      <div className={styles.stackSection}>
                        <span className={styles.contextLabel}>Stack Trace:</span>
                        <pre className={styles.stackValue}>{log.stackTrace}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <Button variant="ghost" size="small" onClick={handleCopyAll} disabled={logs.length === 0}>
            <Copy size={16} />
            <span>Copy All</span>
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={() => handleExport('json')}
            disabled={logs.length === 0}
          >
            <DownloadSimple size={16} />
            <span>Export JSON</span>
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={() => handleExport('txt')}
            disabled={logs.length === 0}
          >
            <DownloadSimple size={16} />
            <span>Export TXT</span>
          </Button>
        </div>
        <div className={styles.footerRight}>
          <Button variant="danger" size="small" onClick={handleClear} disabled={logs.length === 0}>
            <Trash size={16} />
            <span>Clear Logs</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
