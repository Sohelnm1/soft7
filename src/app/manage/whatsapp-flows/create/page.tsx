"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2, CheckCircle, XCircle, Layout, CornerUpRight, Smartphone, Box } from "lucide-react";

// --- TYPES ---
type FieldType = "text" | "number" | "date" | "select";

interface Field {
  id: string;
  label: string;
  type: FieldType;
  instructions: string;
  required: boolean;
}

interface Notification {
  message: string;
  type: 'success' | 'error' | null;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// --- COMPONENTS ---

const NotificationToast = ({ notification, onClose }: { notification: Notification; onClose: () => void }) => {
  if (!notification.type) return null;

  const isSuccess = notification.type === 'success';
  const icon = isSuccess ? <CheckCircle className="w-5 h-5 text-teal-400" /> : <XCircle className="w-5 h-5 text-red-400" />;
  const colorClass = isSuccess ? 'bg-teal-50 border-teal-300' : 'bg-red-50 border-red-300';

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-2xl flex items-center space-x-3 border ${colorClass} z-50`}>
      {icon}
      <p className={`text-sm font-medium ${isSuccess ? 'text-teal-800' : 'text-red-800'}`}>{notification.message}</p>
      <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
};

const InputGroup = ({
  label,
  value,
  onChange,
  placeholder,
  instructions,
  maxChars,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  instructions?: string;
  maxChars?: number;
  type?: "text" | "textarea";
}) => {
  const charCount = value.length;
  const isOverLimit = maxChars !== undefined && charCount > maxChars;
  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div>
      <div className="flex justify-between items-end">
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        {maxChars !== undefined && (
          <span className={`text-xs ${isOverLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
            {charCount}/{maxChars}
          </span>
        )}
      </div>
      <InputComponent
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxChars}
        rows={type === 'textarea' ? 3 : undefined}
        className={`w-full border ${isOverLimit ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${type === 'textarea' ? 'resize-none' : ''}`}
      />
      {instructions && <p className="text-xs text-gray-400 mt-1">{instructions}</p>}
    </div>
  );
};

const FieldListItem = ({ field, index, onDelete }: { field: Field; index: number; onDelete: (id: string) => void }) => (
  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
    <div className="flex items-center space-x-3">
      <span className="font-mono text-xs text-gray-500">{index + 1}.</span>
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{field.label || `Untitled Field`}</h3>
        <p className="text-xs text-gray-500">
          {field.type === 'text' ? 'Text Input' : 'Basic Field'}
          {field.required && <span className="ml-2 text-red-500 font-medium">(Required)</span>}
        </p>
      </div>
    </div>
    <button onClick={() => onDelete(field.id)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition">
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

const ScreenPreview = ({ screenTitle, largeHeading, textContent, footerButtonLabel, fields }: { screenTitle: string; largeHeading: string; textContent: string; footerButtonLabel: string; fields: Field[] }) => (
  <div className="w-full">
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-lg relative overflow-hidden">
      <div className="p-3 bg-gray-100 border-b border-gray-200 flex items-center justify-between text-gray-700">
        <span className="text-xs font-semibold flex items-center"><Smartphone className="w-3 h-3 mr-1" /> Mobile Screen Layout</span>
        <span className="text-xs font-medium px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Live Preview</span>
      </div>
      <div className="w-full flex flex-col justify-between">
        <div className="p-4 space-y-4">
          <p className="text-xs text-[var(--theme-color)] font-semibold uppercase tracking-wider">
            Basic | {fields.length} fields
          </p>
          <p className="text-xs text-gray-500 border-b pb-2">Screen Title: <span className="font-medium text-gray-800">{screenTitle}</span></p>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-4">{largeHeading || "[Large Heading]"}</h1>
          <p className="text-xs text-gray-600 mb-4">{textContent || "[Text Content]"}</p>
          <div className="space-y-3">
            {fields.map(field => (
              <div key={field.id} className="pt-2">
                <label className="block text-xs font-semibold text-gray-700">
                  {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="mt-1 p-2 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-600">[Text Input Area]</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button className="w-full py-2 text-[var(--theme-color)]bg-[var(--theme-color)] text-white font-semibold rounded-lg text-sm flex items-center justify-center">{footerButtonLabel || "Continue"}</button>
          <p className="text-[10px] text-gray-400 text-center mt-2">Managed by the business. Learn more</p>
        </div>
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
export default function ScreenDesignerPage() {
  const searchParams = useSearchParams();
  const selectedBusiness = searchParams.get("businessId") || "1703864723671954";

  const [screenTitle, setScreenTitle] = useState("Welcome to our form");
  const [largeHeading, setLargeHeading] = useState("Your Name");
  const [textContent, setTextContent] = useState("Managed by the business. Learn more");
  const [footerButtonLabel, setFooterButtonLabel] = useState("Continue");

  const [fields, setFields] = useState<Field[]>([{ id: generateId(), label: "Your Name", type: "text", instructions: "", required: true }]);
  const [notification, setNotification] = useState<Notification>({ message: '', type: null });

  const addField = () => setFields([...fields, { id: generateId(), label: `New Field ${fields.length + 1}`, type: "text", instructions: "", required: false }]);
  const deleteField = (id: string) => setFields(fields.filter(f => f.id !== id));

  const handlePublishScreen = async () => {
    if (!screenTitle.trim() || !largeHeading.trim() || fields.length === 0) {
      setNotification({ message: "Screen Title, Heading, and at least one field are required.", type: 'error' });
      setTimeout(() => setNotification({ message: '', type: null }), 4000);
      return;
    }

    try {
      const res = await fetch("/api/whatsapp-flows/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBusiness,
          name: `Flow - ${screenTitle}`,
          flowId: Math.random().toString(36).substring(2, 10),
          categories: "General",
          status: "Active",
          validation: JSON.stringify({ screenTitle, largeHeading, textContent, footerButtonLabel, fields })
        })
      });

      if (res.ok) {
        setNotification({ message: `Flow '${screenTitle}' saved successfully!`, type: 'success' });
        setTimeout(() => setNotification({ message: '', type: null }), 4000);
      } else {
        const err = await res.json();
        setNotification({ message: err.error || "Failed to save screen", type: 'error' });
        setTimeout(() => setNotification({ message: '', type: null }), 4000);
      }
    } catch (error) {
      console.error(error);
      setNotification({ message: "Failed to connect to the server", type: 'error' });
      setTimeout(() => setNotification({ message: '', type: null }), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative flex">
      <NotificationToast notification={notification} onClose={() => setNotification({ message: '', type: null })} />

      <div className="w-full grid lg:grid-cols-3">
        <div className="p-8 lg:col-span-2 space-y-8 border-r border-gray-200">
          {/* Header */}
          <header className="mb-8 flex items-center justify-between">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center">
              <Layout className="w-8 h-8 mr-3 text-[var(--theme-color)] fill-indigo-100" />
              Screen Designer
            </h1>
            <button onClick={handlePublishScreen} className="px-6 py-2.5 text-base font-semibold text-[var(--theme-color)]bg-[var(--theme-color)] text-white rounded-xl hover:bg-indigo-700 flex items-center shadow-lg">
              <CornerUpRight className="w-5 h-5 mr-2" /> Publish Screen
            </button>
          </header>

          {/* Screen Config */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-indigo-500 space-y-5">
            <InputGroup label="Screen Title" value={screenTitle} onChange={e => setScreenTitle(e.target.value)} maxChars={60} />
            <InputGroup label="Large Heading" value={largeHeading} onChange={e => setLargeHeading(e.target.value)} maxChars={20} />
            <InputGroup label="Text Content" value={textContent} onChange={e => setTextContent(e.target.value)} maxChars={80} type="textarea" />
          </div>

          {/* Fields */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-gray-400">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Fields ({fields.length})</h2>
            <div className="space-y-3">{fields.map((field, i) => <FieldListItem key={field.id} field={field} index={i} onDelete={deleteField} />)}</div>
            <button onClick={addField} className="mt-4 w-full py-3 bg-indigo-50 text-[var(--theme-color)] rounded-xl border-dashed border border-indigo-300 flex items-center justify-center text-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Field (Text)
            </button>
          </div>

          {/* Footer Button */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-teal-500">
            <InputGroup label="Footer Button Label" value={footerButtonLabel} onChange={e => setFooterButtonLabel(e.target.value)} maxChars={20} />
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1 p-8 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Layout className="w-5 h-5 mr-2 text-indigo-500" /> Screen Preview
          </h2>
          <ScreenPreview screenTitle={screenTitle} largeHeading={largeHeading} textContent={textContent} footerButtonLabel={footerButtonLabel} fields={fields} />
        </div>
      </div>
    </div>
  );
}
