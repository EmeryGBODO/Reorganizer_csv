import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

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
      <div className="text-center py-12 text-gray-500">
        <p>Aucune donnée à afficher.</p>
        <p className="text-sm mt-1">Générez des données depuis le serveur pour commencer.</p>
      </div>
    );
  }

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: '600px' }} // Hauteur fixe obligatoire
      >
        {/* On utilise des divs avec des rôles ARIA pour l'accessibilité */}
        <div role="grid" className="relative w-full">
          {/* EN-TÊTE STICKY */}
          <div
            role="row"
            className="flex bg-gray-50 sticky top-0 z-10 border-b border-gray-200"
          >
            {headers.map((header) => (
              <div
                key={header}
                role="columnheader"
                // --- STYLE DE LA CELLULE D'EN-TÊTE ---
                // flex: 1 permet aux colonnes de partager l'espace équitablement.
                // la bordure droite crée la ligne verticale.
                className="flex-1 px-6 py-3 text-xs font-bold text-gray-800 uppercase whitespace-nowrap border-r border-gray-200 last:border-r-0"
                style={{ minWidth: '150px' }} // Donnez une largeur minimale à vos colonnes
              >
                {header.replace(/_/g, ' ')}
              </div>
            ))}
          </div>

          {/* CORPS VIRTUALISÉ */}
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
                      // --- STYLE DE LA CELLULE DE DONNÉES ---
                      // Doit correspondre à la structure de l'en-tête pour l'alignement.
                      className="flex-1 px-6 py-4 text-sm text-gray-700 whitespace-nowrap border-b border-r border-gray-200 last:border-r-0"
                      style={{ minWidth: '150px' }}
                    >
                      {String(row[header] ?? '')}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 py-3 bg-gray-50 text-xs text-gray-600 border-t">
        {totalRowCount.toLocaleString()} lignes au total. Le traitement s'appliquera à l'ensemble des données.
      </div>
    </div>
  );
};

export default DataTable;