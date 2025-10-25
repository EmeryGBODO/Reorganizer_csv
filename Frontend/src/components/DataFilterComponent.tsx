import React, { useState, useEffect } from 'react';
import { Filter, Search, X, RotateCcw } from 'lucide-react';

// Définit la structure des critères de filtre qu'on remontera au parent
export interface FilterCriteria {
  column: string;
  value: string;
}

export interface CombinedFilters {
  filter1: FilterCriteria;
  filter2: FilterCriteria;
}

interface DataFilterComponentProps {
  headers: string[]; // Liste des en-têtes de colonnes disponibles
  onFilterChange: (filters: CombinedFilters) => void; // Callback pour notifier le parent des changements
  initialFilters?: CombinedFilters; // Pour potentiellement restaurer l'état
}

const DataFilterComponent: React.FC<DataFilterComponentProps> = ({
  headers,
  onFilterChange,
  initialFilters = {
    filter1: { column: '', value: '' },
    filter2: { column: '', value: '' },
  }
}) => {
  const [filter1Column, setFilter1Column] = useState<string>(initialFilters.filter1.column);
  const [filter1Value, setFilter1Value] = useState<string>(initialFilters.filter1.value);
  const [filter2Column, setFilter2Column] = useState<string>(initialFilters.filter2.column);
  const [filter2Value, setFilter2Value] = useState<string>(initialFilters.filter2.value);

  // Effet pour appeler onFilterChange quand un état de filtre change
  useEffect(() => {
    onFilterChange({
      filter1: { column: filter1Column, value: filter1Value },
      filter2: { column: filter2Column, value: filter2Value },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter1Column, filter1Value, filter2Column, filter2Value]); // onFilterChange est stable

  // Fonction pour réinitialiser un filtre spécifique
  const resetFilter = (filterNumber: 1 | 2) => {
    if (filterNumber === 1) {
      setFilter1Column('');
      setFilter1Value('');
    } else {
      setFilter2Column('');
      setFilter2Value('');
    }
  };

  // Fonction pour rendre un bloc de filtre (Select + Input)
  const renderFilterBlock = (
    filterNumber: 1 | 2,
    selectedColumn: string,
    setColumn: (value: string) => void,
    filterValue: string,
    setValue: (value: string) => void
  ) => {
    return (
      <div className="flex flex-col sm:flex-row items-stretch gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
        {/* Sélecteur de Colonne */}
        <div className="flex-1 min-w-[150px]">
          <label htmlFor={`filter${filterNumber}-column`} className="sr-only">
            Colonne {filterNumber}
          </label>
          <select
            id={`filter${filterNumber}-column`}
            value={selectedColumn}
            onChange={(e) => setColumn(e.target.value)}
            className="w-full h-full px-3 py-2 border border-gray-300 dark:border-gray-500 dark:bg-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm"
          >
            <option value="">-- Choisir une colonne --</option>
            {headers.map((header) => (
              <option key={header} value={header}>
                {header.replace(/_/g, ' ')} {/* Affiche les noms de manière plus lisible */}
              </option>
            ))}
          </select>
        </div>

        {/* Champ de Recherche */}
        <div className="relative flex-1 min-w-[150px]">
           <label htmlFor={`filter${filterNumber}-value`} className="sr-only">
            Rechercher dans la colonne {filterNumber}
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            id={`filter${filterNumber}-value`}
            value={filterValue}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Filtrer ${selectedColumn ? `"${selectedColumn.replace(/_/g, ' ')}"` : '...'} `}
            disabled={!selectedColumn} // Désactivé si aucune colonne n'est choisie
            className="w-full h-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-500 dark:bg-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          />
           {/* Bouton pour effacer la recherche */}
           {filterValue && (
            <button
                type="button"
                onClick={() => setValue('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Effacer la recherche"
            >
                <X className="h-4 w-4" />
            </button>
           )}
        </div>

         {/* Bouton pour réinitialiser le filtre complet */}
         {(selectedColumn || filterValue) && (
             <button
                type="button"
                onClick={() => resetFilter(filterNumber)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                aria-label={`Réinitialiser le filtre ${filterNumber}`}
             >
                <RotateCcw className="h-4 w-4" />
             </button>
         )}
      </div>
    );
  };

  // Rendu principal du composant
  return (
    <div className="mb-6 space-y-4">
       <div className="flex items-center text-gray-700 dark:text-gray-300">
         <Filter className="h-5 w-5 mr-2 text-orange-500"/>
         <h3 className="text-md font-semibold">Filtrer les données affichées</h3>
       </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bloc Filtre 1 */}
        {renderFilterBlock(1, filter1Column, setFilter1Column, filter1Value, setFilter1Value)}

        {/* Bloc Filtre 2 */}
        {renderFilterBlock(2, filter2Column, setFilter2Column, filter2Value, setFilter2Value)}
      </div>
    </div>
  );
};

export default DataFilterComponent;