import React from 'react';
import { Table, Th, Thead, Tr, Td } from 'react-super-responsive-table';
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css';

interface DataTableProps {
  headers: string[];
  data: Record<string, any>[];
  totalRowCount: number; // Ajout pour connaître le nombre total de lignes
  className?: string;
}

const DataTable: React.FC<DataTableProps> = ({ headers, data, totalRowCount, className = '' }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Aucune donnée à afficher.</p>
        <p className="text-sm mt-1">Importez un fichier ou générez des données pour commencer.</p>
      </div>
    );
  }

  const isPreview = data.length < totalRowCount;

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="overflow-x-auto">
        <Table className="w-full text-sm text-left text-gray-700">
          <Thead className="text-xs text-gray-800 uppercase bg-gray-50">
            <Tr>
              {headers.map((header, index) => (
                <Th key={index} scope="col" className="px-6 py-3">
                  {header.replace(/_/g, ' ')}
                </Th>
              ))}
            </Tr>
          </Thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <Tr key={rowIndex} className="bg-white border-b hover:bg-gray-50">
                {headers.map((header) => (
                  <Td key={`${rowIndex}-${header}`} className="px-6 py-4">
                    {String(row[header] ?? '')}
                  </Td>
                ))}
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
      {/* Pied de tableau pour l'information de l'aperçu */}
      {isPreview && (
        <div className="px-6 py-3 bg-gray-50 text-xs text-gray-600 border-t">
          Aperçu : Affichage des {data.length} premières lignes sur {totalRowCount} au total. Le traitement s'appliquera à l'ensemble des données.
        </div>
      )}
    </div>
  );
};

export default DataTable;