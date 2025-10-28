import React from 'react';
import type { CrmLead } from '../types';

interface CrmTableProps {
  leads: CrmLead[];
  onUpdateLead: (updatedLead: CrmLead) => void;
  onStartRolePlay: (lead: CrmLead) => void;
}

export const CrmTable: React.FC<CrmTableProps> = ({ leads, onUpdateLead, onStartRolePlay }) => {

  const handleUpdate = (lead: CrmLead, updates: Partial<CrmLead>) => {
    let finalUpdates = { ...updates };
    if (updates.emailSent === true && !lead.lastContacted) {
      finalUpdates.lastContacted = new Date().toLocaleDateString();
    }
    onUpdateLead({ ...lead, ...finalUpdates });
  };

  const statusOptions: CrmLead['status'][] = ['New', 'Contacted', 'Meeting', 'Negotiation', 'Closed'];
  const statusColorMap: { [key in CrmLead['status']]: string } = {
    'New': 'bg-blue-100 text-blue-800',
    'Contacted': 'bg-yellow-100 text-yellow-800',
    'Meeting': 'bg-purple-100 text-purple-800',
    'Negotiation': 'bg-orange-100 text-orange-800',
    'Closed': 'bg-green-100 text-green-800',
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">CRM Leads</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your sales pipeline. Track statuses, add notes, and practice your pitch.
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Company</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contact</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email Sent</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reply</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Contacted</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900">{lead.company}</div>
                        <div className="text-gray-500">{lead.website}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="text-gray-900">{lead.contact.name}</div>
                        <div className="text-gray-500">{lead.contact.title}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdate(lead, { status: e.target.value as CrmLead['status'] })}
                          className={`text-xs font-semibold inline-flex items-center px-2.5 py-1 rounded-full border-none focus:ring-2 focus:ring-indigo-500 ${statusColorMap[lead.status]}`}
                        >
                          {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                       <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={lead.emailSent} onChange={e => handleUpdate(lead, {emailSent: e.target.checked})}/>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={lead.replyReceived} onChange={e => handleUpdate(lead, {replyReceived: e.target.checked})}/>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{lead.lastContacted || 'N/A'}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => onStartRolePlay(lead)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          AI Role-Play<span className="sr-only">, {lead.company}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};