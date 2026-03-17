import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText, FlaskConical, FolderOpen,
} from 'lucide-react';
import MedicalRecords from './MedicalRecords';
import LabReports from './LabReports';
import MedicalDocuments from './MedicalDocuments';

const TABS = [
  { id: 'records', label: 'Medical Records', icon: FileText },
  { id: 'lab-reports', label: 'Lab Reports', icon: FlaskConical },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
];

const TAB_COMPONENTS = {
  records: MedicalRecords,
  'lab-reports': LabReports,
  documents: MedicalDocuments,
};

export default function StaffRecords() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.find((t) => t.id === searchParams.get('tab'))?.id || 'records';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
          Records
        </h1>
        <p className="text-slate-500 mt-1">
          Medical records, lab reports, and documents in one place.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px" aria-label="Records tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                role="tab"
                aria-selected={isActive}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        <ActiveComponent embedded />
      </div>
    </div>
  );
}
