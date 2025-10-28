import React, { useState } from 'react';
import type { CrmLead } from '../types';
import { ValidationBadge } from './ValidationBadge';
import { QualityScore } from './QualityScore';

interface CrmTableProps {
  leads: CrmLead[];
  onUpdateLead: (updatedLead: CrmLead) => void;
  onDeleteLead: (leadId: string) => void;
  onStartRolePlay: (lead: CrmLead) => void;
}

export const CrmTable: React.FC<CrmTableProps> = ({ leads, onUpdateLead, onDeleteLead, onStartRolePlay }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CrmLead['status']>('all');
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  const handleUpdate = (lead: CrmLead, updates: Partial<CrmLead>) => {
    let finalUpdates = { ...updates };
    if (updates.emailSent === true && !lead.lastContacted) {
      finalUpdates.lastContacted = new Date().toLocaleDateString();
    }
    onUpdateLead({ ...lead, ...finalUpdates });
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchQuery === '' ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact.validated_email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getRelativeTime = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return dateString;
  };

  const statusOptions: CrmLead['status'][] = ['New', 'Contacted', 'Meeting', 'Negotiation', 'Closed'];
  const statusColorMap: { [key in CrmLead['status']]: string } = {
    'New': 'bg-blue-100 text-blue-800',
    'Contacted': 'bg-yellow-100 text-yellow-800',
    'Meeting': 'bg-cyan-100 text-cyan-800',
    'Negotiation': 'bg-orange-100 text-orange-800',
    'Closed': 'bg-green-100 text-green-800',
  };

  if (leads.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <svg className="mx-auto h-24 w-24 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">No leads in your pipeline yet</h2>
          <p className="mt-2 text-slate-600">
            Generate leads from the Setup page and add them to your CRM to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Your Pipeline</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your sales pipeline ({filteredLeads.length} of {leads.length} leads)
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by company or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Company</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contact</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quality</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Sent</th>
                      <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Reply</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Contact</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium text-gray-900">{lead.company}</div>
                              <div className="text-gray-500 text-xs">{lead.website}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <div className="text-gray-900">{lead.contact.name}</div>
                          <div className="text-gray-500 text-xs">{lead.contact.title}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-gray-500">{lead.contact.validated_email}</span>
                            <ValidationBadge status={lead.contact.validation_status} size="sm" showLabel={false} />
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {lead.quality_score !== undefined ? (
                            <QualityScore score={lead.quality_score} size="sm" showLabel={false} />
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColorMap[lead.status]}`}>
                              {lead.status}
                            </span>
                            <select
                              value={lead.status}
                              onChange={(e) => handleUpdate(lead, { status: e.target.value as CrmLead['status'] })}
                              className="text-xs border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={lead.emailSent} onChange={e => handleUpdate(lead, {emailSent: e.target.checked})}/>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={lead.replyReceived} onChange={e => handleUpdate(lead, {replyReceived: e.target.checked})}/>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{getRelativeTime(lead.lastContacted)}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onStartRolePlay(lead)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              Practice
                            </button>
                            <button
                              onClick={() => onDeleteLead(lead.id)}
                              className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-red-700 hover:text-red-900"
                              title="Delete lead"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-200 bg-white">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{lead.company}</h3>
                        <p className="text-sm text-gray-500">{lead.contact.name} - {lead.contact.title}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColorMap[lead.status]}`}>
                        {lead.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <label className="flex items-center gap-1">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={lead.emailSent} onChange={e => handleUpdate(lead, {emailSent: e.target.checked})}/>
                        <span className="text-xs">Sent</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={lead.replyReceived} onChange={e => handleUpdate(lead, {replyReceived: e.target.checked})}/>
                        <span className="text-xs">Reply</span>
                      </label>
                      <ValidationBadge status={lead.contact.validation_status} size="sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onStartRolePlay(lead)}
                        className="flex-1 inline-flex justify-center items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        Practice Call
                      </button>
                      <button
                        onClick={() => onDeleteLead(lead.id)}
                        className="px-3 py-2 text-sm font-medium text-red-700 border border-red-300 rounded-md hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredLeads.length === 0 && leads.length > 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-slate-600">No leads match your current filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};