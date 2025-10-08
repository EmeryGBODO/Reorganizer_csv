import React from 'react';
import { Table, Th, Thead, Tr } from 'react-super-responsive-table';
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css';

interface DataTableProps {
  headers: string[];
  data: Record<string, any>[];
  className?: string;
}

const DataTable: React.FC<DataTableProps> = ({ headers, data, className = '' }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Aucune donnée à afficher.</p>
        <p className="text-sm mt-1">Importez un fichier ou générez des données pour commencer.</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto bg-white rounded-lg shadow ${className}`}>
      <Table className="w-full text-sm text-left text-gray-700">
        <Thead className="text-xs text-gray-800 uppercase bg-gray-50">
          <Tr>
            {headers.map((header) => (
              <Th key={header} scope="col" className="px-6 py-3">
                {header.replace(/_/g, ' ')}
              </Th>
            ))}
          </Tr>
        </Thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <Tr key={rowIndex} className="bg-white border-b hover:bg-gray-50">
              {headers.map((header) => (
                <td key={`${rowIndex}-${header}`} className="px-6 py-4">
                  {String(row[header] ?? '')}
                </td>
              ))}
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default DataTable;