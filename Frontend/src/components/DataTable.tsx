import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import '../style.css'

interface DataTableProps {
  headers: string[];
  data: Record<string, any>[];
  totalRowCount: number;
  className?: string;
}

const DataTable: React.FC<DataTableProps> = ({ headers, data, totalRowCount, className = '' }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: totalRowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 53, // Hauteur estimée d'une ligne
    overscan: 5,
  });

  if (totalRowCount === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>Aucune donnée à afficher.</p>
        <p className="text-sm mt-1">Générez des données depuis le serveur pour commencer.</p>
      </div>
    );
  }

  const virtualRows = rowVirtualizer.getVirtualItems();
  
  // Calcule la largeur minimale totale pour le contenu interne
  const totalTableWidth = headers.length * 150; // 150px est le minWidth de chaque colonne

  return (
    <div>
      <div className="px-6 py-3 bg-transparent dark:bg-transparent text-xs text-gray-600 dark:text-gray-400 dark:border-gray-600">
        {totalRowCount.toLocaleString()} lignes au total. Le traitement s'appliquera à l'ensemble des données.
      </div>

      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden ${className}`}>
        <div
          ref={parentRef}
          className="overflow-auto component-scrollbar" /* <-- CLASSE AJOUTÉE ICI */
          style={{ height: '600px' }}
        >
          {/* Le conteneur interne doit avoir une largeur minimale pour pousser l'overflow */}
          <div role="grid" className="relative" style={{ minWidth: `${totalTableWidth}px` }}>
            {/* EN-TÊTE */}
            <div
              role="row"
              className="flex bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-600"
            >
              {headers.map((header) => (
                <div
                  key={header}
                  role="columnheader"
                  className="flex-1 px-6 py-3 text-xs font-bold text-gray-800 dark:text-gray-200 uppercase border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                  style={{ minWidth: '150px', overflow: 'hidden' }}
                >
                  <div className="overflow-x-auto max-w-full whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {header.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>

            {/* LIGNES VIRTUALISÉES */}
            <div
              className="relative"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {virtualRows.map((virtualRow) => {
                const row = data[virtualRow.index];
                if (!row) return null;

                return (
                  <div
                    key={virtualRow.key}
                    role="row"
                    className="flex absolute top-0 left-0 w-full"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    {headers.map((header) => (
                      <div
                        key={`${virtualRow.key}-${header}`}
                        role="gridcell"
                        className="flex-1 px-6 py-4 text-sm text-gray-700 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                        style={{
                          minWidth: '150px',
                          overflow: 'hidden',
                        }}
                      >
                        <div className="overflow-x-auto max-w-full whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                          {String(row[header] ?? '')}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;