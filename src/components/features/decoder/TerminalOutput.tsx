import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

interface TerminalOutputProps {
  logs: string[];
  className?: string;
  isAnalyzing?: boolean;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
  logs,
  className = '',
  isAnalyzing = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Clean log message formatting
  const formatLog = (raw: string) => {
    return raw
      .replace(/^>\s*/, '')
      .replace('SUHVWLJH', 'Ciphertext')
      .replace('PRESTIGE', 'PRESTIGE');
  };

  return (
    <div className={`surface-card p-4 space-y-3 font-sans text-xs ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-content-secondary" />
          <span className="font-semibold text-content-primary">Execution log</span>
        </div>
        <span className="text-[11px] text-content-tertiary">
          {isAnalyzing ? 'Active' : 'Idle'}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="h-40 overflow-y-auto space-y-1 font-technical text-[11px] text-content-secondary leading-relaxed pr-1"
      >
        {logs.map((log, index) => {
          const isHighlight = log.includes('MATCH') || log.includes('CONFIRMED') || log.includes('SUCCESS');
          const isFailure = log.includes('FAILED');

          return (
            <div
              key={index}
              className={`flex items-start gap-2 ${
                isHighlight
                  ? 'text-brand-600 dark:text-brand-400 font-medium'
                  : isFailure
                  ? 'text-content-tertiary'
                  : 'text-content-secondary'
              }`}
            >
              <span className="text-content-tertiary select-none w-5 text-right shrink-0">
                {index + 1}
              </span>
              <span>{formatLog(log)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
