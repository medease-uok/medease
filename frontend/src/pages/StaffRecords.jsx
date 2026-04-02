import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText, FlaskConical, FolderOpen,
} from 'lucide-react';
import { useAuth } from '../data/AuthContext';
import MedicalRecords from './MedicalRecords';
import LabReports from './LabReports';
import MedicalDocuments from './MedicalDocuments';

const ALL_TABS = [
  { id: 'records', label: 'Medical Records', icon: FileText, roles: ['doctor', 'nurse', 'admin'] },
  { id: 'lab-reports', label: 'Lab Reports', icon: FlaskConical, roles: ['doctor', 'nurse', 'admin', 'lab_technician'] },
  { id: 'documents', label: 'Documents', icon: FolderOpen, roles: ['doctor', 'nurse', 'admin'] },
];

const TAB_COMPONENTS = {
  records: MedicalRecords,
  'lab-reports': LabReports,
  documents: MedicalDocuments,
};

export default function StaffRecords() {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role;

  // Filter tabs based on user role
  const TABS = ALL_TABS.filter(tab => !tab.roles || tab.roles.includes(userRole));

  // Default to first available tab for the user
  const defaultTab = TABS[0]?.id || 'lab-reports';

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab = (requestedTab && TABS.find((t) => t.id === requestedTab)?.id) || defaultTab;
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
