'use client'
import { useState, useEffect, useMemo, useRef, ElementType } from "react";
import { Plus, Upload, Download, Filter, MessageCircle, RefreshCcw, X, Phone, User, Mail, Tag, ChevronDown, Pencil, Search } from "lucide-react";
import ImportContacts from "@/app/contacts/importContacts";

import './contacts-page.css';

// --- CONTACT DATA TYPE ---

interface Contact {
  id: number;
  phone: string;
  name: string;
  source?: string;
  assignedTo?: string;
  tags?: string;
  email?: string;
  status?: string;
  wabaPhone?: string;
  interiorDesign?: string;
  name1?: string;
  test?: string;
  allowDuplicate: boolean;
  createdAt: string;
  userId: number;
  [key: string]: any;
}

const sourceColors: Record<string, string> = {
  facebook: "source-badge source-facebook",
  instagram: "source-badge source-instagram",
  whatsapp: "source-badge source-whatsapp",
  website: "source-badge source-website",
};

interface TagData {
  id: number;
  name: string;
  group?: string;
  userId: number;
  createdAt: string;
}
const isValidCSVFile = async (file: File): Promise<boolean> => {
  // ❌ Extension check
  if (!file.name.toLowerCase().endsWith(".csv")) {
    alert("❌ Only CSV files are allowed");
    return false;
  }

  // ❌ Size check (10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert("❌ CSV file size must be less than 10MB");
    return false;
  }

  // 🔍 Binary signature check
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // %PDF
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    alert("❌ PDF files are not allowed");
    return false;
  }

  // ZIP / XLSX
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    alert("❌ Excel files are not allowed");
    return false;
  }

  return true;
};


const initialContacts: Contact[] = [];

// --- PLACEHOLDER MODAL COMPONENTS ---
const ModalWrapper = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 bg-gray-900/70 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl transition-all duration-300 transform scale-100 opacity-100 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition">
                  <X size={20} />
              </button>
          </div>
          {children}
      </div>
  </div>
);

const CreateColumnModal = ({ onClose, onSubmit }: { onClose: () => void; onSubmit: (label: string, type: string, visible: boolean) => void }) => {
    const [label, setLabel] = useState("");
    const [type, setType] = useState("");
    const [visible, setVisible] = useState(true);

    const handleSubmit = () => {
        if (label && type) {
            onSubmit(label, type, visible);
            onClose();
        }
    };

    return (
        <ModalWrapper title="Create Column" onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Label</label>
                    <input
                        type="text"
                        placeholder="Enter column label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                        <option value="">Select type</option>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="date">Date</option>
                    </select>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Visibility</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Make this column visible to users</p>
                    </div>
                    <button
                        onClick={() => setVisible(!visible)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${visible ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${visible ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={onClose} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition shadow-md shadow-green-500/30 font-medium">Submit</button>
                </div>
            </div>
        </ModalWrapper>
    );
};
const handleExportDownload = async (onClose: () => void) => {
  console.log("🔥 EXPORT BUTTON CLICKED (contacts/page.tsx)");

  try {
    console.log("🚀 CALLING /api/contacts/export");

    const res = await fetch("/api/contacts/export", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Export failed");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "contacts_export.csv";
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

    console.log("✅ CSV DOWNLOAD TRIGGERED");
    alert("✅ Contacts exported successfully");

    setTimeout(onClose, 300);
  } catch (err) {
    console.error("❌ Export failed:", err);
    alert("❌ Failed to export contacts");
  }
};

const ExportContacts = ({ contacts, onClose }: { contacts: Contact[], onClose: () => void }) => (
  <ModalWrapper title="Export Contacts" onClose={onClose}>
    <p className="text-gray-600 dark:text-gray-300 mb-6">
      You are about to export <b>{contacts.length}</b> contacts. Choose your format.
    </p>

    <div className="space-y-3 mb-6">
      <label className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
        <input type="radio" name="exportFormat" defaultChecked className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-500 focus:ring-indigo-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">CSV (Comma Separated Values)</span>
      </label>

      <label className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 opacity-50">
        <input type="radio" name="exportFormat" disabled className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-500 focus:ring-indigo-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">JSON (Not yet available)</span>
      </label>
    </div>

    <div className="flex justify-end gap-3">
      <button onClick={onClose} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium">Cancel</button>
      <button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleExportDownload(onClose);
  }}
  className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md"
>
  Download Export
</button>

    </div>
  </ModalWrapper>
);
const handleImportFileChange = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // ❌ Extension check
  if (!file.name.toLowerCase().endsWith(".csv")) {
    alert("❌ Only CSV files are allowed");
    e.target.value = "";
    return;
  }

  // ❌ Binary signature check
  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // %PDF
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    alert("❌ PDF files are not allowed");
    e.target.value = "";
    return;
  }

  // ZIP / XLSX
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    alert("❌ Excel files are not allowed");
    e.target.value = "";
    return;
  }

  // ✅ Valid CSV
  alert("✅ CSV file accepted");
};



// Contact Details Panel Component
const ContactDetailsPanel = ({ contact, onClose, onSave, isEditMode, onToggleEditMode, onAddColumn }: { 
    contact: Contact; 
    onClose: () => void;
    onSave: (updatedContact: Contact) => void;
    isEditMode: boolean;
    onToggleEditMode: () => void;
    onAddColumn: () => void;
}) => {
    const [editedContact, setEditedContact] = useState<Contact>(contact);

    useEffect(() => {
        setEditedContact(contact);
    }, [contact]);

    const handleFieldChange = (field: string, value: string) => {
        setEditedContact({ ...editedContact, [field]: value });
    };

    const handleSave = () => {
        onSave(editedContact);
    };

    const customFields = [
        { key: 'email', label: 'Email' },
        { key: 'status', label: 'Status' },
        { key: 'wabaPhone', label: 'WABA Phone Number' },
        { key: 'interiorDesign', label: 'Interior Design' },
        { key: 'name1', label: 'Name 1' },
        { key: 'test', label: 'test' },
    ];

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Contact Details</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <User size={32} className="text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{editedContact.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{editedContact.source || 'Unknown source'} · {editedContact.phone}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</label>
                            
                            <span
  className={`
    inline-block mt-1 mb-2 ml-1 text-xs font-medium px-3 py-1 rounded-full border
    ${editedContact.source ? sourceColors[editedContact.source] : "bg-gray-200 text-gray-700 border-gray-300"}
  `}
>
  {editedContact.source || "N/A"}
</span>
                            <select 
                              value={editedContact.source ||''} 
                              onChange={(e) => handleFieldChange('source', e.target.value)}
                              disabled={!isEditMode}
                              className="w-full mt-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg"
                            >
                              <option value="facebook">Facebook</option>
                              <option value="instagram">Instagram</option>
                              <option value="whatsapp">Whatsapp</option>
                              <option value="website">Website</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned To</label>
                            <select 
                                value={editedContact.assignedTo || 'demo'} 
                                onChange={(e) => handleFieldChange('assignedTo', e.target.value)}
                                disabled={!isEditMode}
                                className="w-full mt-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60"
                            >
                                <option value="demo">demo</option>
                                <option value="admin">admin</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tags</label>
                            <input 
                                type="text"
                                placeholder="Add or select tags..."
                                value={editedContact.tags || ''}
                                onChange={(e) => handleFieldChange('tags', e.target.value)}
                                disabled={!isEditMode}
                                className="w-full mt-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-60"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                Columns
                            </h4>
                            <div className="flex gap-2">
                                <button 
                                    onClick={onToggleEditMode}
                                    className="p-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition shadow-sm"
                                    title="Edit columns"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button 
                                    onClick={onAddColumn}
                                    className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-lg transition shadow-sm"
                                    title="Add new column"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                        
                        {isEditMode ? (
                            <div className="space-y-4">
                                {customFields.map((field) => (
                                    <div key={field.key}>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{field.label}</label>
                                        <input
                                            type="text"
                                            value={editedContact[field.key] || ''}
                                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                            placeholder={`Enter ${field.label.toLowerCase()}`}
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm break-words"
                                        />
                                    </div>
                                ))}
                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-md font-medium"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {customFields.map((field) => (
                                    <div key={field.key} className="break-words">
                                        <span className="text-gray-500 dark:text-gray-400 text-xs block mb-1">{field.label}</span>
                                        <p className="text-gray-900 dark:text-gray-100 whitespace-nowrap overflow-hidden text-ellipsis">
  {editedContact[field.key] || '-'}
</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Multi-Select Dropdown Component
const MultiSelectDropdown = ({ 
  label, 
  options, 
  selectedValues, 
  onChange, 
  placeholder,
  searchable = false
}: {
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  searchable?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = searchable 
    ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 hover:border-red-500 transition flex items-center justify-between"
        >
          <span className={`truncate 
            ${selectedValues.length === 0 
              ? "text-gray-500 dark:text-gray-400" 
              : "text-gray-900 dark:text-gray-100"
            }`}
          > 
            {selectedValues.length > 0 
              ? `${selectedValues.length} selected` 
              : placeholder}
          </span>
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-xl max-h-64 overflow-hidden">
              
              {searchable && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-17 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}

              <div className="overflow-y-auto max-h-52">
                {filteredOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center px-4 py-2.5 hover:bg-green-300 dark:hover:bg-gray-800 dark:text-white cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option.value)}
                      onChange={() => toggleOption(option.value)}
                      className="w-4 h-4 text-orange-600 border-gray-300 dark:border-gray-500 rounded focus:ring-orange-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-white filter-option-label">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
// Filter Modal Component
const FiltersModal = ({
  filters,
  onFilterChange,
  onApply,
  onClose,
  onClear,
  availableTags
}: {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: Filters[keyof Filters]) => void;
  onApply: () => void;
  onClose: () => void;
  onClear: () => void;
  availableTags: TagData[];
}) => {
  const [isAssignedToOpen, setIsAssignedToOpen] = useState(false);
  const [isOptInOpen, setIsOptInOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);

  const sourceOptions = [
    { value: "whatsapp", label: "Whatsapp" },
    { value: "import", label: "Import" },
    { value: "website", label: "Website" },
    { value: "facebook", label: "Facebook" },
    { value: "instagram", label: "Instagram" },
    { value: "twitter", label: "Twitter" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "email", label: "Email" },
    { value: "referral", label: "Referral" }
  ];

  const tagOptions = availableTags.map(tag => ({ 
    value: tag.name.toLowerCase(), 
    label: tag.name 
  }));

  const assignedToOptions = [
    { value: "", label: "Select users..." },
    { value: "demo", label: "Demo User" },
    { value: "admin", label: "Admin" }
  ];

  const optInOptions = [
    { value: "all", label: "All contacts" },
    { value: "opted-in", label: "Opted-in only" },
    { value: "not-opted-in", label: "Not opted-in only" }
  ];

  const duplicateOptions = [
    { value: "all", label: "All contacts" },
    { value: "show-duplicates", label: "Show duplicates" },
    { value: "hide-duplicates", label: "Hide duplicates" }
  ];

  return (
    <div className="fixed inset-0 bg-gray-900/70 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-3xl shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 my-8 flex flex-col">
        
        {/* Header - Fixed */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-3xl flex-shrink-0 sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Filters</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[calc(90vh-140px)]">
          
          {/* Search by Name or Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Search by Name or Phone
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              <input
                type="text"
                value={filters.searchNamePhone}
                onChange={(e) => onFilterChange('searchNamePhone', e.target.value)}
                placeholder="Search by Name or Phone"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Created Date
              </label>
              <input
                type="date"
                value={filters.createdDate}
                onChange={(e) => onFilterChange('createdDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Reminder Date
              </label>
              <input
                type="date"
                value={filters.reminderDate}
                onChange={(e) => onFilterChange('reminderDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Assigned Date
              </label>
              <input
                type="date"
                value={filters.assignedDate}
                onChange={(e) => onFilterChange('assignedDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Source and Assigned To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiSelectDropdown
              label="Source"
              options={sourceOptions}
              selectedValues={filters.source}
              onChange={(values) => onFilterChange('source', values)}
              placeholder="Select sources..."
              searchable={false}
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Assigned To
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAssignedToOpen(!isAssignedToOpen)}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 hover:border-teal-500 transition flex items-center justify-between"
                >
                  <span className={`truncate ${filters.assignedTo ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>
                    {assignedToOptions.find(opt => opt.value === filters.assignedTo)?.label || "Select users..."}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${isAssignedToOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isAssignedToOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsAssignedToOpen(false)} />
                    <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-xl max-h-64 overflow-hidden">
                      <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                        {assignedToOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => {
                              onFilterChange('assignedTo', option.value);
                              setIsAssignedToOpen(false);
                            }}
                            className="px-4 py-2 text-gray-900 dark:text-gray-100 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition"
                          >
                            {option.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <MultiSelectDropdown
            label="Tags"
            options={tagOptions}
            selectedValues={filters.tags}
            onChange={(values) => onFilterChange('tags', values)}
            placeholder="Select tags..."
            searchable={true}
          />

          {/* Opt-In Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Opt-In Status
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOptInOpen(!isOptInOpen)}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 hover:border-teal-500 transition flex items-center justify-between"
              >
                <span className={`truncate ${filters.optInStatus !== "all" ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>
                  {filters.optInStatus !== "all" ? optInOptions.find(opt => opt.value === filters.optInStatus)?.label : "All contacts"}
                </span>
                <ChevronDown size={16} className={`transition-transform ${isOptInOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isOptInOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsOptInOpen(false)} />
                  <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-xl max-h-64 overflow-hidden">
                    <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                      {optInOptions.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => {
                            onFilterChange('optInStatus', option.value);
                            setIsOptInOpen(false);
                          }}
                          className="px-4 py-2 text-gray-900 dark:text-gray-100 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition"
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Duplicate */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Duplicate
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDuplicateOpen(!isDuplicateOpen)}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 hover:border-teal-500 transition flex items-center justify-between"
              >
                <span className={`truncate ${filters.duplicate !== "all" ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>
                  {filters.duplicate !== "all" ? duplicateOptions.find(opt => opt.value === filters.duplicate)?.label : "All contacts"}
                </span>
                <ChevronDown size={16} className={`transition-transform ${isDuplicateOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDuplicateOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsDuplicateOpen(false)} />
                  <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-xl max-h-64 overflow-hidden">
                    <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                      {duplicateOptions.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => {
                            onFilterChange('duplicate', option.value);
                            setIsDuplicateOpen(false);
                          }}
                          className="px-4 py-2 text-gray-900 dark:text-gray-100 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition"
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Show Unassigned Only Toggle */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showUnassignedOnly}
                onChange={(e) => onFilterChange('showUnassignedOnly', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-500"></div>
            </label>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Show unassigned only
            </span>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3 rounded-b-3xl flex-shrink-0 sticky bottom-0">
          <button
            onClick={onClear}
            className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-md shadow-red-500/30 font-medium"
          >
            Clear
          </button>
          <button
            onClick={onApply}
            className="px-6 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition shadow-md shadow-teal-500/30 font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN CONTACTS PAGE COMPONENT ---

export default function ContactsPage() {
  const sourceDropdownRef = useRef<HTMLDivElement>(null);
  const assignedToDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [availableTags, setAvailableTags] = useState<TagData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCreateColumn, setShowCreateColumn] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMobileBulkActions, setShowMobileBulkActions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isAssignedToOpen, setIsAssignedToOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    searchNamePhone: "",
    createdDate: "",
    reminderDate: "",
    assignedDate: "",
    source: [],
    assignedTo: "",
    tags: [],
    optInStatus: "all",
    duplicate: "all",
    showUnassignedOnly: false,
    filterGroups: []
  });
 
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
     "CREATED AT", "NAME", "PHONE NO", "SOURCE", "TAGS", "EMAIL", "STATUS", "ACTIONS"
  ]);
  
  const columnOptions = [
    "CREATED AT", "NAME", "PHONE NO", "SOURCE", "TAGS", "OPTLN", "ASSIGNED AT", "ASSIGNED TO",
    "EMAIL", "STATUS", "WABA_PHONE_NUMBER", "INTERIOR_DESIGN", "NAME_1", "TEST", "SURNAME", "ACTIONS"
  ];

  const [columnSearch, setColumnSearch] = useState("");
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
        setIsSourceOpen(false);
      }
      if (assignedToDropdownRef.current && !assignedToDropdownRef.current.contains(event.target as Node)) {
        setIsAssignedToOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const toggleColumn = (col: string) => {
    setSelectedColumns(prev =>
      prev.includes(col) ? prev.filter(item => item !== col) : [...prev, col]
    );
  };

  // Form data state with tags as array
  const [formData, setFormData] = useState({
    countryCode: "+91",
    phone: "", 
    name: "", 
    source: "", 
    assignedTo: "", 
    tags: [] as string[],
    email: "", 
    status: "", 
    wabaPhone: "", 
    interiorDesign: "", 
    name1: "", 
    test: "", 
    allowDuplicate: false,
  });

  

  // Fetch tags from API
  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags/list", {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (res.ok) {
        const tags: TagData[] = await res.json();
        console.log("📌 Fetched tags:", tags);
        setAvailableTags(tags);
      }
    } catch (error) {
      console.error("❌ Failed to fetch tags:", error);
    }
  };

  // Fetch contacts with proper cache busting
  const fetchContacts = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/contacts", {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.error("❌ Unauthorized - Token may be expired");
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data: Contact[] = await res.json();
      
      const normalizedData = data.map(contact => ({
        ...contact,
        source: contact.source?.toLowerCase()

      }));
      
      console.log("📥 Fetched contacts from API:", normalizedData);
      console.log("📊 Total contacts:", normalizedData.length);
      setContacts(normalizedData);
    } catch (error) {
      console.error("❌ Failed to fetch contacts from API:", error);
      setRefreshMessage("Error fetching contacts. Check console for details.");
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setRefreshMessage(""), 5000);
    }
  };

  // Handle saving contact updates
  const handleSaveContact = async (updatedContact: Contact) => {
    try {
        const res = await fetch(`/api/contacts/${updatedContact.id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedContact),
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        setContacts(contacts.map(c => c.id === updatedContact.id ? updatedContact : c));
        setSelectedContact(updatedContact);
        setIsEditMode(false);
        setRefreshMessage("Contact updated successfully!");
        setTimeout(() => setRefreshMessage(""), 3000);
    } catch (error) {
        console.error("Failed to update contact:", error);
        setRefreshMessage("Error updating contact. Check console for details.");
    }
  };
// ✅ FIXED DELETE CONTACT HANDLER
const handleDeleteContact = async (contactId: number) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this contact?"
  );
  if (!confirmDelete) return;

  try {
    const res = await fetch(`/api/contacts/${contactId}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error || "Delete failed");
    }

    // ✅ ALWAYS re-fetch (important)
    await fetchContacts();

    // ✅ Close side panel
    if (selectedContact?.id === contactId) {
      setSelectedContact(null);
      setIsEditMode(false);
    }

    setRefreshMessage("Contact deleted successfully!");
    setTimeout(() => setRefreshMessage(""), 3000);
  } catch (error) {
    console.error("❌ Delete failed:", error);
    alert("Delete failed. Check console.");
  }
};

  // Handle adding a new column
  const handleAddColumn = (label: string, type: string, visible: boolean) => {
    console.log("Adding new column:", { label, type, visible });
    setRefreshMessage(`Column "${label}" created successfully!`);
    setTimeout(() => setRefreshMessage(""), 3000);
  };

  useEffect(() => {
    console.log("🔄 Component mounted, fetching data...");
    fetchContacts();
    fetchTags();

    let lastFetchTime = Date.now();
    const REFETCH_INTERVAL = 10000;

    const pollTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;

      if (timeSinceLastFetch > REFETCH_INTERVAL + 1000) {
        console.log(`⏰ Detected page was hidden for ${timeSinceLastFetch}ms, re-fetching data...`);
        fetchContacts();
        fetchTags();
      }
      
      lastFetchTime = now;
    }, 5000);

    const handleFocus = () => {
      console.log("🔄 Window focused, re-fetching data...");
      fetchContacts();
      fetchTags();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("👁️ Tab became visible, re-fetching data...");
        fetchContacts();
        fetchTags();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleRefresh = async () => {
    console.log("🔄 Manual refresh triggered");
    await fetchContacts();
    await fetchTags();
    setRefreshMessage("Data successfully refreshed!");
    setTimeout(() => setRefreshMessage(""), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const checked = target.checked;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleTagsChange = (selectedTags: string[]) => {
    setFormData({ ...formData, tags: selectedTags });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const normalizedSource = formData.source 
        ? formData.source.charAt(0).toUpperCase() + formData.source.slice(1).toLowerCase()
        : formData.source;
        
      const newContactData = { 
        ...formData, 
        phone: formData.phone.trim(), 
        name: formData.name.trim(),
        source: formData.source.toLowerCase(),
        tags: formData.tags.join(','),
        createdAt: new Date().toISOString(),
      };
      
      const res = await fetch("/api/contacts", {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContactData),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      setFormData({ 
        countryCode: "+91", 
        phone: "", 
        name: "", 
        source: "", 
        assignedTo: "", 
        tags: [], 
        email: "", 
        status: "", 
        wabaPhone: "", 
        interiorDesign: "", 
        name1: "", 
        test: "", 
        allowDuplicate: false, 
      });
      setShowForm(false);
      setRefreshMessage("Contact created successfully!");

      await fetchContacts();

    } catch (error) {
      console.error("Failed to create contact:", error);
      setRefreshMessage("Error creating contact. Check console for details.");
    }
  };

  const openWhatsApp = (phone: string) => {
    if (!phone) return console.error("No phone number available for this contact.");
    const cleaned = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleaned}`, "_blank");
  };

  const handleFilterChange = (key: keyof Filters, value: Filters[keyof Filters]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      searchNamePhone: "",
      createdDate: "",
      reminderDate: "",
      assignedDate: "",
      source: [],
      assignedTo: "",
      tags: [],
      optInStatus: "all",
      duplicate: "all",
      showUnassignedOnly: false,
      filterGroups: []
    });
  };
  
  const filteredContacts = useMemo(() => {
  let result = contacts;

  // 1️⃣ Global Search (top search bar)
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.tags?.toLowerCase().includes(q) ||
      c.source?.toLowerCase().includes(q)
    );
  }

  // 2️⃣ Search inside Filters
  if (filters.searchNamePhone.trim()) {
    const q = filters.searchNamePhone.toLowerCase();
    result = result.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }

  // 3️⃣ Source Filter
  if (filters.source.length > 0) {
    result = result.filter(c =>
      c.source && filters.source.includes(c.source.toLowerCase())
    );
  }

  // 4️⃣ Assigned To
  if (filters.assignedTo) {
    result = result.filter(c =>
      c.assignedTo?.toLowerCase() === filters.assignedTo.toLowerCase()
    );
  }

  // 5️⃣ Tags
  if (filters.tags.length > 0) {
    result = result.filter(c => {
      if (!c.tags) return false;
      const contactTags = c.tags.toLowerCase().split(",");
      return filters.tags.some(tag => contactTags.includes(tag.toLowerCase()));
    });
  }

  // 6️⃣ Created Date
  if (filters.createdDate) {
    const selected = new Date(filters.createdDate).toDateString();
    result = result.filter(c => {
      const created = new Date(c.createdAt).toDateString();
      return created === selected;
    });
  }

  // 7️⃣ Reminder Date
  if (filters.reminderDate) {
    const selected = new Date(filters.reminderDate).toDateString();
    result = result.filter(c => {
      if (!c.reminderDate) return false;
      const reminder = new Date(c.reminderDate).toDateString();
      return reminder === selected;
    });
  }

  // 8️⃣ Assigned Date
  if (filters.assignedDate) {
    const selected = new Date(filters.assignedDate).toDateString();
    result = result.filter(c => {
      if (!c.assignedDate) return false;
      const assigned = new Date(c.assignedDate).toDateString();
      return assigned === selected;
    });
  }

  // 9️⃣ Show unassigned only
  if (filters.showUnassignedOnly) {
    result = result.filter(c => !c.assignedTo);
  }

  return result;
}, [contacts, searchQuery, filters]);

  
  const formatDateTime = (isoDate: string) => {
    try {
      return new Date(isoDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return "Invalid Date";
    }
  };

  const statusClasses = (status: string | undefined) => {
    switch(status?.toLowerCase()) {
      case 'active': return 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 ring-green-500/30';
      case 'inactive': return 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 ring-red-500/30';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 ring-yellow-500/30';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ring-gray-400/30';
    }
  };

  const getTagBadge = (tags: string | undefined) => {
    if (!tags) return <span className="text-gray-400 dark:text-gray-500 italic text-xs">No Tags</span>;
    return tags.split(',').map((tag, index) => (
      <span key={index} className="text-xs font-medium px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-700 mr-1 whitespace-nowrap">
        {tag.trim()}
      </span>
    ));
  };

  const ActionButton = ({ onClick, icon: Icon, label, colorClass, shadowClass, isPrimary = false, disabled = false, isSpin = false }: {
    onClick?: () => void, icon: ElementType, label: string, colorClass: string, shadowClass: string, isPrimary?: boolean, disabled?: boolean, isSpin?: boolean
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium text-sm disabled:opacity-50 
        ${isPrimary ? `text-white ${colorClass} shadow-lg ${shadowClass} hover:scale-[1.02] active:scale-[0.98]` 
          : `border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm`}
      `}
    >
      <Icon size={18} className={isSpin ? 'animate-spin' : ''} />
      {label}
    </button>
  );

  const BulkActionsMenu = () => (
    <div className="flex flex-wrap gap-3">
      <button className="!border-indigo-300 !bg-indigo-100 !text-indigo-700 px-4 py-2 rounded-xl shadow-sm text-sm">
  Broadcast
</button>

      <button className="!border-purple-300 !bg-purple-100 !text-purple-700 px-4 py-2 rounded-xl shadow-sm text-sm">
  Assign
</button>

      <button className="!border-indigo-300 !bg-indigo-100 !text-indigo-700 px-4 py-2 rounded-xl shadow-sm text-sm">
  Assign Tag
</button>
    </div>
  );

  return (
    <div className="contacts-page min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <div className="px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3 lg:pt-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">Contacts</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Manage all your customer and lead records efficiently.</p>

        {/* TOP ACTION BAR */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        
        {/* Bulk Actions (Desktop/Tablet) */}
        <div className="hidden sm:flex">
          <BulkActionsMenu />
        </div>

        {/* Mobile Bulk Actions Dropdown */}
        <div className="sm:hidden w-full relative">
          <button
            onClick={() => setShowMobileBulkActions(!showMobileBulkActions)}
            className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium text-sm shadow-sm"
          >
            Bulk Actions <ChevronDown size={16} className={`transition-transform ${showMobileBulkActions ? 'rotate-180' : 'rotate-0'}`} />
          </button>
          {showMobileBulkActions && (
            <div className="absolute top-12 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 p-2 space-y-2">
              <BulkActionsMenu />
            </div>
          )}
        </div>

        {/* Utility Buttons & Create */}
        <div className="flex flex-wrap justify-end gap-3 w-full lg:w-auto">
          <ActionButton 
            onClick={handleRefresh} 
            icon={RefreshCcw} 
            label="Refresh" 
            colorClass="bg-gray-500" 
            shadowClass="shadow-gray-500/30"
            disabled={isRefreshing}
            isSpin={isRefreshing}
          />
          <ActionButton 
            onClick={() => setShowImport(true)} 
            icon={Upload} 
            label="Import" 
            colorClass="bg-teal-600" 
            shadowClass="shadow-teal-500/30"
          />
          <ActionButton 
            onClick={() => setShowExport(true)} 
            icon={Download} 
            label="Export" 
            colorClass="bg-indigo-600" 
            shadowClass="shadow-indigo-500/30"
          />
          <ActionButton 
            onClick={() => setShowForm(true)} 
            icon={Plus} 
            label="Create Contact" 
            colorClass="bg-green-600 hover:bg-green-700" 
            shadowClass="shadow-green-500/30"
            isPrimary={true}
          />
        </div>
      </div>
      </div>
      {/* SEARCH + FILTERS + COLUMN DROPDOWN */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6 w-full flex-wrap">
      <div className="relative flex-[0.6] min-w-[150px] md:max-w-[250px]">
  <input
    type="text"
    placeholder="Search..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}

    className="w-full pl-3 pr-3 py-2 rounded-xl bg-purple-200 text-purple-800 placeholder-purple-500 outline-none shadow-sm border border-purple-300"
  />
</div>



        <div className="flex items-center gap-4 flex-wrap">
          <button 
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-200 hover:bg-purple-300 text-purple-800 rounded-xl text-sm shadow-md transition font-medium min-w-[130px] border border-purple-300" 
            onClick={() => setShowFilters(true)}
          >
            <Filter size={16} /> Filters
          </button>

          <div className="relative min-w-[156px]">
            <button
              onClick={() => setShowColumnsDropdown(prev => !prev)}
              className="bg-purple-200 hover:bg-purple-300 text-purple-800 border border-purple-300 rounded-xl px-6 py-2.5 shadow-md text-sm flex items-center justify-center gap-2 transition w-full"
            >
              Columns
              <ChevronDown size={18} className={`transition-transform ${showColumnsDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showColumnsDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowColumnsDropdown(false)} />
                <div className="absolute z-50 mt-2 right-0 w-full max-w-[200px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 max-h-[250px] overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={columnSearch}
                    onChange={(e) => setColumnSearch(e.target.value)}
                    className="w-full px-2 py-1 mb-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 outline-none"
                  />
                  <button
                    onClick={() => {
                      setSelectedColumns([]);
                      setColumnSearch("");
                    }}
                    className="w-full mb-2 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md font-medium transition shadow"
                  >
                    Reset
                  </button>
                  {columnOptions
                    .filter((col) => col.toLowerCase().includes(columnSearch.toLowerCase()))
                    .map((col) => (
                      <label
                        key={col}
                        className="flex items-center gap-2 py-1 cursor-pointer text-xs font-normal text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(col)}
                          onChange={() => toggleColumn(col)}
                          className="w-3 h-3 accent-purple-200 cursor-pointer"
                        />
                        <span className="flex-1">{col}</span>
                      </label>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
     {/* CONTACTS TABLE (Desktop/Tablet View) */}
<div className="table-container hidden md:block overflow-x-auto border rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
  <table className="min-w-full text-sm text-left border-collapse">
    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-600">
      <tr>
        {selectedColumns.includes("CREATED AT") && <th className="p-4 font-bold">Created</th>}
        {selectedColumns.includes("NAME") && <th className="p-4 font-bold">Name</th>}
        {selectedColumns.includes("PHONE NO") && <th className="p-4 font-bold">Phone</th>}
        {selectedColumns.includes("SOURCE") && <th className="p-4 font-bold">Source</th>}
        {selectedColumns.includes("TAGS") && <th className="p-4 font-bold">Tags</th>}
        {selectedColumns.includes("OPTLN") && <th className="p-4 font-bold">Opten</th>}
        {selectedColumns.includes("ASSIGNED AT") && <th className="p-4 font-bold">Assigned At</th>}
        {selectedColumns.includes("ASSIGNED TO") && <th className="p-4 font-bold">Assigned To</th>}
        {selectedColumns.includes("EMAIL") && <th className="p-4 font-bold">Email</th>}
        {selectedColumns.includes("STATUS") && <th className="p-4 font-bold">Status</th>}
        {selectedColumns.includes("WABA_PHONE_NUMBER") && <th className="p-4 font-bold">Waba Phone Number</th>}
        {selectedColumns.includes("INTERIOR_DESIGN") && <th className="p-4 font-bold">Interior Designs</th>}
        {selectedColumns.includes("NAME_1") && <th className="p-4 font-bold">Name 1</th>}
        {selectedColumns.includes("TEST") && <th className="p-4 font-bold">Test</th>}
        {selectedColumns.includes("SURNAME") && <th className="p-4 font-bold">Surname</th>}
        {selectedColumns.includes("ACTIONS") && <th className="p-4 font-bold text-center">Action</th>}
      </tr>
    </thead>
    <tbody>
      {filteredContacts.length === 0 ? (
        <tr>
          <td colSpan={selectedColumns.length} className="text-center py-10 text-gray-500 dark:text-gray-400 text-lg">
            {isRefreshing ? "Loading contacts..." : "No contacts found. Create one to get started."}
          </td>
        </tr>
      ) : (
        filteredContacts.map((c, i) => (
          <tr
            key={c.id}
            className={`border-t border-gray-100 dark:border-gray-700 ${i % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"} hover:bg-orange-50 dark:hover:bg-orange-900/30 transition duration-150`}
          >
            {/* CREATED AT */}
            {selectedColumns.includes("CREATED AT") && (
              <td className="p-4 text-gray-500 dark:text-gray-400 text-xs">
                {formatDateTime(c.createdAt)}
              </td>
            )}

            {/* NAME */}
            {selectedColumns.includes("NAME") && (
              <td className="p-4 font-semibold text-gray-800 dark:text-gray-100">
                <button 
                  onClick={() => {
                    setSelectedContact(c);
                    setIsEditMode(false);
                  }}
                  className="hover:text-orange-500 hover:underline cursor-pointer text-left transition"
                >
                  {c.name}
                </button>
              </td>
            )}
            
            {/* PHONE NO */}
            {selectedColumns.includes("PHONE NO") && (
              <td className="p-4 text-gray-600 dark:text-gray-300 font-mono text-xs">
                {c.phone}
              </td>
            )}

            {/* SOURCE */}
            {selectedColumns.includes("SOURCE") && (
              <td className="p-4">
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full border ${
                    c.source ? sourceColors[c.source] : "bg-gray-200 text-gray-700 border-gray-300"
                  }`}
                >
                  {c.source || 'N/A'}
                </span>
              </td>
            )}

            {/* TAGS */}
            {selectedColumns.includes("TAGS") && (
              <td className="p-4">{getTagBadge(c.tags)}</td>
            )}

            {/* OPTLN */}
            {selectedColumns.includes("OPTLN") && (
              <td className="p-4 text-gray-600 dark:text-gray-300 text-xs">N/A</td>
            )}

            {/* ASSIGNED AT */}
            {selectedColumns.includes("ASSIGNED AT") && (
              <td className="p-4 text-gray-500 dark:text-gray-400 text-xs">N/A</td>
            )}

            {/* ASSIGNED TO */}
            {selectedColumns.includes("ASSIGNED TO") && (
              <td className="p-4 text-gray-600 dark:text-gray-300 text-xs">
                {c.assignedTo || 'N/A'}
              </td>
            )}

            {/* EMAIL */}
            {selectedColumns.includes("EMAIL") && (
              <td className="p-4 text-gray-600 dark:text-gray-300 text-xs truncate max-w-xs">
                {c.email || 'N/A'}
              </td>
            )}

            {/* STATUS */}
            {selectedColumns.includes("STATUS") && (
              <td className="p-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ${statusClasses(c.status)}`}>
                  {c.status || 'Draft'}
                </span>
              </td>
            )}

            {/* WABA_PHONE_NUMBER */}
            {selectedColumns.includes("WABA_PHONE_NUMBER") && (
              <td className="p-4 text-gray-600 dark:text-gray-300 text-xs">
                {c.wabaPhone || 'N/A'}
              </td>
            )}

            {/* INTERIOR_DESIGN */}
            {selectedColumns.includes("INTERIOR_DESIGN") && (
              <td className="p-4 text-gray-600 dark:text-gray-300 text-xs">
                {c.interiorDesign || 'N/A'}
              </td>
            )}

            {/* NAME_1 */}
            {selectedColumns.includes("NAME_1") && (
              <td className="p-4 text-gray-600 dark:text-gray-300 text-xs">
                {c.name1 || 'N/A'}
              </td>
            )}

            {/* TEST */}
            {selectedColumns.includes("TEST") && (
              <td className="p-4 text-gray-600 dark:text-gray-300 text-xs">
                {c.test || 'N/A'}
              </td>
            )}

            {/* SURNAME */}
            {selectedColumns.includes("SURNAME") && (
              <td className="p-4 text-gray-600 dark:text-gray-300 text-xs">N/A</td>
            )}

            {/* ACTIONS */}
            {selectedColumns.includes("ACTIONS") && (
              <td className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  {/* WhatsApp Chat */}
                  <button
                    onClick={() => openWhatsApp(c.phone)}
                    className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white shadow-sm transition"
                    title="Chat on WhatsApp"
                  >
                    <MessageCircle size={16} />
                  </button>

                  {/* Edit Contact */}
                  <button
                    onClick={() => {
                      setSelectedContact(c);
                      setIsEditMode(true);
                    }}
                    className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition"
                    title="Edit Contact"
                  >
                    <Pencil size={16} />
                  </button>

                  {/* Delete Contact */}
                  <button
                    onClick={() => handleDeleteContact(c.id)}
                    className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-sm transition"
                    title="Delete Contact"
                  >
                    <X size={16} />
                  </button>
                </div>
              </td>
            )}
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
      
      {/* CONTACTS LIST (Mobile Card View) */}
      <div className="mobile-cards md:hidden space-y-4">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-lg bg-white dark:bg-gray-800 rounded-xl shadow-md">
            {isRefreshing ? "Loading contacts..." : "No contacts found. Create one to get started."}
          </div>
        ) : (
          filteredContacts.map((c) => (
            <div key={c.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:border-orange-400 transition duration-150 space-y-3">
              <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-2">
                <button 
                  onClick={() => {
                    setSelectedContact(c);
                    setIsEditMode(false);
                  }}
                  className="text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-orange-500 transition text-left"
                >
                  {c.name}
                </button>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ${statusClasses(c.status)}`}>
                  {c.status || 'Draft'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p className="flex items-center gap-2"><Phone size={14} className="text-orange-500" /> {c.phone}</p>
                <p className="flex items-center gap-2"><Mail size={14} className="text-orange-500" /> {c.email || 'N/A'}</p>
                <div className="flex flex-wrap items-center gap-1"><Tag size={14} className="text-orange-500" /> {getTagBadge(c.tags)}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">Created: {formatDateTime(c.createdAt)}</p>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => openWhatsApp(c.phone)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-green-500/30 transition"
                >
                  <MessageCircle size={16} /> Chat on WhatsApp
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE CONTACT MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-green/60 dark:bg-green/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] transform transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Add New Contact</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Primary Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  name="name" placeholder="Full Name (Required)" value={formData.name} onChange={handleChange} required
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition placeholder-gray-500 dark:placeholder-gray-400"
                />
                <div className="flex gap-2">
                  <input
                    name="countryCode"
                    placeholder="+91"
                    value={formData.countryCode || "+91"}
                    onChange={handleChange}
                    required
                    className="w-24 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition placeholder-gray-500 dark:placeholder-gray-400 text-center"
                    list="countryCodes"
                  />
                  <datalist id="countryCodes">
                    <option value="+1" />
                    <option value="+91" />
                    <option value="+44" />
                    <option value="+971" />
                    <option value="+61" />
                    <option value="+81" />
                  </datalist>
                  <input
                    name="phone"
                    placeholder="Phone Number (Required)"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="flex-grow border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <input
                name="email"
                placeholder="Email Address"
               value={formData.email}
               onChange={handleChange}
               className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
               text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2
               focus:ring-orange-500 focus:border-orange-500 transition"
  />

  {/* Right column -> Tags */}
  <div>
    <MultiSelectDropdown
      label=""
      options={availableTags.map(tag => ({ value: tag.name, label: tag.name }))}
      selectedValues={formData.tags}
      onChange={handleTagsChange}
      placeholder="Select tags..."
      searchable={true}
    />
  </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">System & Custom Fields</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
  name="source"
  value={formData.source}
  onChange={handleChange}
  className={`
    w-full px-4 py-3 rounded-xl transition
    border bg-white text-gray-900
    dark:bg-gray-900 dark:text-gray-100
    focus:ring-2 focus:ring-orange-500 focus:border-orange-500
    ${formData.source ? sourceColors[formData.source] : ""}
  `}
>
  <option value="">Select Source</option>
  <option value="facebook">Facebook</option>
  <option value="instagram">Instagram</option>
  <option value="whatsapp">WhatsApp</option>
  <option value="website">Website Form</option>
</select>

                <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition">
                  <option value="">Select Assigned User</option>
                  <option value="demo">Demo User</option>
                  <option value="admin">Admin</option>
                </select>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition">
                  <option value="">Select Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
                <input name="wabaPhone" placeholder="WABA Phone" value={formData.wabaPhone} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition placeholder-gray-500 dark:placeholder-gray-400" />
                <input name="interiorDesign" placeholder="Interior Design" value={formData.interiorDesign} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition placeholder-gray-500 dark:placeholder-gray-400" />
                <input name="name1" placeholder="Name 1 (Internal)" value={formData.name1} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition placeholder-gray-500 dark:placeholder-gray-400" />
                <input name="test" placeholder="Test Field" value={formData.test} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition placeholder-gray-500 dark:placeholder-gray-400" />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input id="allow-duplicate" type="checkbox" name="allowDuplicate" checked={formData.allowDuplicate} onChange={handleChange} className="w-5 h-5 accent-orange-500 rounded focus:ring-orange-500" />
                <label htmlFor="allow-duplicate" className="text-base font-medium text-gray-700 dark:text-gray-200 select-none">Allow duplicate contact entry</label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition shadow-lg shadow-orange-500/40 font-medium">Create Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT & IMPORT MODALS */}
      {showExport && <ExportContacts contacts={contacts} onClose={() => setShowExport(false)} />}
      {showImport && <ImportContacts onImportSuccess={handleRefresh} onClose={() => setShowImport(false)} />}
      {showCreateColumn && <CreateColumnModal onClose={() => setShowCreateColumn(false)} onSubmit={handleAddColumn} />}

      {/* FILTERS MODAL */}
      {showFilters && (
        <FiltersModal
          filters={filters}
          onFilterChange={handleFilterChange}
          onApply={handleApplyFilters}
          onClose={() => setShowFilters(false)}
          onClear={handleClearFilters}
          availableTags={availableTags}
        />
      )}

      {/* CONTACT DETAILS PANEL */}
      {selectedContact && (
        <ContactDetailsPanel 
          contact={selectedContact} 
          onClose={() => {
            setSelectedContact(null);
            setIsEditMode(false);
          }} 
          onSave={handleSaveContact}
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onAddColumn={() => setShowCreateColumn(true)}
        />
      )}

      {/* REFRESH TOAST */}
      {refreshMessage && (
        <div className={`fixed bottom-6 right-6 text-white px-5 py-3 rounded-xl shadow-lg transition-opacity duration-300 font-medium z-50 
          ${refreshMessage.includes('Error') ? 'bg-red-600' : 'bg-green-600'}`}>
          {refreshMessage}
        </div>
      )}
    </div>
  );
}