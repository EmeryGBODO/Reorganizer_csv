import React from 'react';
import { Campaign } from '../types';

interface FiltersProps {
  campaigns: Campaign[];
  agents: { id: string; name: string }[];
  selectedCampaignId: string;
  onCampaignChange: (id: string) => void;
  onAgentChange: (id: string) => void;
  onDateChange: (dates: { start: string; end: string }) => void;
  dateRange:{ start: string; end:string};
  disabled?: boolean;
}

const Filters: React.FC<FiltersProps> = ({
  campaigns,
  agents,
  selectedCampaignId,
  onCampaignChange,
  onAgentChange,
  onDateChange,
  dateRange,
  disabled = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 ">
      

      <div>
        <label htmlFor="agent-filter" className="block text-sm font-medium text-gray-700 mb-1">
          Agent
        </label>
        <select
          id="agent-filter"
          onChange={(e) => onAgentChange(e.target.value)}
          disabled={disabled}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Tous les agents</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            disabled={disabled}
            onChange={(e) => onDateChange({ start: e.target.value, end: '' })} // Simplifié pour l'exemple
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            disabled={disabled}
            onChange={(e) => onDateChange({ start: '', end: e.target.value })} // Simplifié pour l'exemple
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default Filters;