import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Trash2 } from 'lucide-react';
import { InvestigationReport } from '../types/report';
import { InteractiveBook } from '../components/features/book/InteractiveBook';
import { downloadReportAsFile } from '../utils/exportReport';
import { soundService } from '../services/sound';

interface ReportsPageProps {
  reports: InvestigationReport[];
  activeReport: InvestigationReport | null;
  onOpenReport: (report: InvestigationReport) => void;
  onDeleteReport?: (id: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  reports,
  activeReport,
  onOpenReport,
  onDeleteReport,
}) => {
  const [selectedForBook, setSelectedForBook] = useState<InvestigationReport | null>(activeReport || reports[0] || null);

  // Synchronize when activeReport or reports list changes
  useEffect(() => {
    if (activeReport) {
      setSelectedForBook(activeReport);
    } else if (reports.length > 0 && (!selectedForBook || !reports.some((r) => r.id === selectedForBook.id))) {
      setSelectedForBook(reports[0]);
    } else if (reports.length === 0) {
      setSelectedForBook(null);
    }
  }, [activeReport, reports]);

  const handleDownload = (rep: InvestigationReport) => {
    soundService.playKeyClick();
    downloadReportAsFile(rep);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-content-primary tracking-tight">
            Reports
          </h1>
          <p className="text-sm text-content-secondary">
            Study mathematical mechanisms, cryptanalytic findings, and decoding reports.
          </p>
        </div>
      </div>

      {/* Interactive Book Study View */}
      {selectedForBook ? (
        <InteractiveBook
          report={selectedForBook}
          onDownload={() => handleDownload(selectedForBook)}
        />
      ) : (
        <div className="surface-card p-12 text-center text-xs text-content-secondary space-y-2">
          <BookOpen className="w-8 h-8 text-content-tertiary mx-auto" />
          <p className="text-sm font-medium text-content-primary">No report selected</p>
          <p className="text-content-tertiary">Decode a cipher in the workspace to generate your first decoding report.</p>
        </div>
      )}

      {/* Report Archive Table */}
      <div className="space-y-3 pt-6 border-t border-border-subtle">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Saved Decoding Reports ({reports.length})
        </h3>

        <div className="surface-card divide-y divide-border-subtle">
          {reports.map((rep) => {
            const isSelected = selectedForBook?.id === rep.id;
            const cleanTitle = rep.title
              ? rep.title
                  .replace(/MISSION\s*\d*\s*[:·-]?\s*/gi, '')
                  .replace(/Ghost Protocol\s*(Infiltration)?/gi, 'Decoding Session')
                  .replace(/Infiltration/gi, 'Analysis')
                  .trim() || `${rep.cipherName} · Decoding Session`
              : `${rep.cipherName} · Decoding Session`;

            return (
              <div
                key={rep.id}
                data-report-id={rep.id}
                onClick={() => {
                  soundService.playKeyClick();
                  setSelectedForBook(rep);
                  onOpenReport(rep);
                }}
                className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                  isSelected ? 'bg-surface-secondary' : 'hover:bg-surface-secondary/40'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-brand-500 uppercase">
                      {rep.cipherName}
                    </span>
                    <span className="text-content-tertiary">·</span>
                    <span className="text-sm font-medium text-content-primary truncate">
                      {cleanTitle.includes(rep.cipherName) ? cleanTitle : `${cleanTitle} · Decoding Session`}
                    </span>
                  </div>
                  <div className="text-xs text-content-secondary">
                    {rep.timestamp} · {rep.statistics.timeTakenSeconds}s · Confidence {rep.statistics.confidence}%
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(rep);
                    }}
                    className="p-1.5 text-content-secondary hover:text-content-primary hover:bg-surface-secondary rounded transition-colors"
                    title="Download PDF (.pdf)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {onDeleteReport && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundService.playKeyClick();
                        onDeleteReport(rep.id);
                      }}
                      className="p-1.5 text-content-secondary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="text-xs text-brand-500 font-medium">
                    {isSelected ? 'Reading' : 'Open'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
