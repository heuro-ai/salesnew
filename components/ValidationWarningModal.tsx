import React from 'react';
import type { Company } from '../types';
import { ValidationBadge } from './ValidationBadge';

interface ValidationWarningModalProps {
  selectedCompanies: Company[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const ValidationWarningModal: React.FC<ValidationWarningModalProps> = ({
  selectedCompanies,
  onConfirm,
  onCancel
}) => {
  const invalidEmails = selectedCompanies.filter(c => c.contact.validation_status === 'invalid');
  const softFailEmails = selectedCompanies.filter(c => c.contact.validation_status === 'soft-fail');
  const unknownEmails = selectedCompanies.filter(c => c.contact.validation_status === 'unknown');
  const validEmails = selectedCompanies.filter(c => c.contact.validation_status === 'valid');

  const hasProblematicEmails = invalidEmails.length > 0 || softFailEmails.length > 0 || unknownEmails.length > 0;

  if (!hasProblematicEmails) {
    onConfirm();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Email Validation Warning
              </h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>Some of the selected companies have email addresses that may not be deliverable:</p>
              </div>

              <div className="mt-4 space-y-4">
                {invalidEmails.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex items-center mb-2">
                      <ValidationBadge status="invalid" size="sm" />
                      <span className="ml-2 font-semibold text-red-900">Invalid Emails ({invalidEmails.length})</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                      {invalidEmails.map((company, idx) => (
                        <li key={idx}>
                          {company.company} - {company.contact.validated_email}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {softFailEmails.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex items-center mb-2">
                      <ValidationBadge status="soft-fail" size="sm" />
                      <span className="ml-2 font-semibold text-yellow-900">Risky Emails ({softFailEmails.length})</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                      {softFailEmails.map((company, idx) => (
                        <li key={idx}>
                          {company.company} - {company.contact.validated_email}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {unknownEmails.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                    <div className="flex items-center mb-2">
                      <ValidationBadge status="unknown" size="sm" />
                      <span className="ml-2 font-semibold text-slate-900">Unknown Status ({unknownEmails.length})</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                      {unknownEmails.map((company, idx) => (
                        <li key={idx}>
                          {company.company} - {company.contact.validated_email}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {validEmails.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center mb-2">
                      <ValidationBadge status="valid" size="sm" />
                      <span className="ml-2 font-semibold text-green-900">Valid Emails ({validEmails.length})</span>
                    </div>
                    <p className="text-sm text-green-800">
                      {validEmails.length} {validEmails.length === 1 ? 'company has' : 'companies have'} verified email addresses.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Adding leads with invalid or risky emails may result in bounced messages and lower deliverability rates.
                  Consider removing these leads or manually verifying the email addresses before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add to CRM Anyway ({selectedCompanies.length})
          </button>
        </div>
      </div>
    </div>
  );
};
