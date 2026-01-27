"use client";

import { useState, useEffect, useRef } from "react";
import {
    Save,
    Trash2,
    Image as ImageIcon,
    Video,
    FileText,
    Bold,
    Italic,
    Strikethrough,
} from "lucide-react";

// Meta WhatsApp API Validation Rules
const META_LIMITS = {
    IMAGE_SIZE_MB: 5,
    VIDEO_SIZE_MB: 16,
    DOCUMENT_SIZE_MB: 100,
    HEADER_TEXT_LENGTH: 60,
    BODY_TEXT_LENGTH: 1024,
    FOOTER_TEXT_LENGTH: 60,
    BUTTON_TEXT_LENGTH: 25,
};

export type ComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';

export interface TemplateFormState {
    name: string;
    category: string;
    language: string;
    headerType: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    headerText: string;
    bodyText: string;
    footerText: string;
    buttons: { type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER', text: string, url?: string, phoneNumber?: string }[];
    whatsappAccountId: number | null;
    headerHandle?: string;
    bodyExamples?: Record<string, string>;
    headerExamples?: Record<string, string>;
    buttonExamples?: Record<number, string>; // index -> example full URL
    variableFormat: 'positional' | 'named'; // Type of variable: Number (positional) or Name (named)
}

interface Props {
    initialData?: TemplateFormState;
    onSubmit: (data: TemplateFormState) => void;
    loading: boolean;
    mode: 'CREATE' | 'EDIT';
    readOnly?: boolean;
    renderPreview: (data: TemplateFormState) => React.ReactNode;
}

export default function TemplateForm({ initialData, onSubmit, loading, mode, readOnly = false, renderPreview }: Props) {
    const [uploading, setUploading] = useState(false);
    const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [form, setForm] = useState<TemplateFormState>(initialData || {
        name: "",
        category: "MARKETING",
        language: "en_US",
        headerType: "NONE",
        headerText: "",
        bodyText: "",
        footerText: "",
        buttons: [],
        whatsappAccountId: null,
        bodyExamples: {},
        headerExamples: {},
        buttonExamples: {},
        variableFormat: "positional"
    });

    const [uploadMode, setUploadMode] = useState<'UPLOAD' | 'LIBRARY'>('UPLOAD');
    const [mediaLibrary, setMediaLibrary] = useState<{ id: number, name: string, url: string, type: string }[]>([]);
    const [searchMedia, setSearchMedia] = useState("");
    const [nameCheckStatus, setNameCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

    const fetchMediaLibrary = async () => {
        try {
            const res = await fetch("/api/gallery/list");
            if (res.ok) setMediaLibrary(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = () => {
        if (!form.name || !form.bodyText) {
            alert("Please fill in all required fields (Name and Body)");
            return;
        }

        // Check name availability for CREATE mode
        if (mode === 'CREATE' && nameCheckStatus === 'taken') {
            alert("Template name already exists. Please choose a different name.");
            return;
        }

        // Validate buttons
        for (let i = 0; i < form.buttons.length; i++) {
            const btn = form.buttons[i];
            if (!btn.text) {
                alert(`Button ${i + 1}: Button text is required`);
                return;
            }
            if (btn.type === 'URL') {
                if (!btn.url) {
                    alert(`Button ${i + 1}: Website URL is required for URL buttons`);
                    return;
                }
                if (!isValidUrl(btn.url)) {
                    alert(`Button ${i + 1}: Invalid URL format. Must start with http:// or https://`);
                    return;
                }
                if (btn.url.includes('{{1}}') && !form.buttonExamples?.[i]) {
                    alert(`Button ${i + 1}: Please provide an example for the dynamic URL`);
                    return;
                }
            }
            if (btn.type === 'PHONE_NUMBER') {
                if (!btn.phoneNumber) {
                    alert(`Button ${i + 1}: Phone number is required for phone buttons`);
                    return;
                }
                if (!isValidPhoneNumber(btn.phoneNumber)) {
                    alert(`Button ${i + 1}: Invalid phone number. Must start with + and include country code`);
                    return;
                }
            }
        }

        // Validate Examples for variables
        const bodyVars = getDetectedVariables(form.bodyText);
        const headerVars = form.headerType === 'TEXT' ? getDetectedVariables(form.headerText) : [];
        const isNamed = (name: string) => isNaN(parseInt(name));

        const hasNamed = bodyVars.some(isNamed) || headerVars.some(isNamed);
        const hasPositional = bodyVars.some(v => !isNamed(v)) || headerVars.some(v => !isNamed(v));

        if (form.variableFormat === 'positional' && hasNamed) {
            alert("This template is set to 'Number' format, but you have used named variables like {{name}}. Please use {{1}}, {{2}} etc. or change the Variable Type to 'Name'.");
            return;
        }

        if (form.variableFormat === 'named' && hasPositional) {
            alert("This template is set to 'Name' format, but you have used positional variables like {{1}}. Please use descriptive names like {{name}} or change the Variable Type to 'Number'.");
            return;
        }

        // Validate Button variables (URL buttons only support positional {{1}})
        for (let i = 0; i < form.buttons.length; i++) {
            const btn = form.buttons[i];
            if (btn.type === 'URL' && btn.url) {
                const btnVars = getDetectedVariables(btn.url);
                if (btnVars.length > 0) {
                    if (btnVars.length > 1 || btnVars[0] !== '1') {
                        alert(`Button ${i + 1}: URL buttons only support a single positional variable {{1}}.`);
                        return;
                    }
                    if (hasNamed) {
                        alert(`Variable format mismatch: Template uses named variables, but URL buttons only support positional variables ({{1}}). Meta does not allow mixing formats.`);
                        return;
                    }
                }
            }
            if (btn.type === 'QUICK_REPLY' && btn.text) {
                if (getDetectedVariables(btn.text).length > 0) {
                    alert(`Button ${i + 1}: Quick Reply buttons do not support variables.`);
                    return;
                }
            }
        }

        for (const v of bodyVars) {
            if (!form.bodyExamples?.[v]) {
                alert(`Please provide an example value for body variable {{${v}}}`);
                return;
            }
        }

        for (const v of headerVars) {
            if (!form.headerExamples?.[v]) {
                alert(`Please provide an example value for header variable {{${v}}}`);
                return;
            }
        }

        onSubmit(form);
    };
    const handleMediaSelect = async (mediaId: number) => {
        if (!form.whatsappAccountId) {
            alert("Please select a WhatsApp Account first.");
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append("mediaId", mediaId.toString());
        formData.append("accountId", form.whatsappAccountId.toString());

        try {
            const res = await fetch("/api/whatsapp/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.handle) {
                setForm(f => ({ ...f, headerHandle: data.handle }));
            } else {
                alert("Processing failed: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("Processing failed");
        } finally {
            setUploading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !form.whatsappAccountId) {
            if (!form.whatsappAccountId) alert("Please select a WhatsApp Account first.");
            return;
        }

        // Validate file size based on type
        const fileSizeMB = file.size / 1024 / 1024;
        let maxSize = 0;
        let fileTypeLabel = '';

        if (form.headerType === 'IMAGE') {
            maxSize = META_LIMITS.IMAGE_SIZE_MB;
            fileTypeLabel = 'Image';
        } else if (form.headerType === 'VIDEO') {
            maxSize = META_LIMITS.VIDEO_SIZE_MB;
            fileTypeLabel = 'Video';
        } else if (form.headerType === 'DOCUMENT') {
            maxSize = META_LIMITS.DOCUMENT_SIZE_MB;
            fileTypeLabel = 'Document';
        }

        if (fileSizeMB > maxSize) {
            alert(`${fileTypeLabel} file size exceeds Meta's limit of ${maxSize}MB. Your file is ${fileSizeMB.toFixed(2)}MB.`);
            e.target.value = ''; // Reset input
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("accountId", form.whatsappAccountId.toString());

        try {
            const res = await fetch("/api/whatsapp/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.handle) {
                setForm(f => ({ ...f, headerHandle: data.handle }));
            } else {
                alert("Upload failed: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const [accounts, setAccounts] = useState<{ id: number, name: string, phoneNumber: string }[]>([]);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await fetch("/api/whatsapp/accounts");
                if (res.ok) {
                    const data = await res.json();
                    setAccounts(data);
                    // Pre-select first account if creating and none selected
                    if (mode === 'CREATE' && data.length > 0 && !form.whatsappAccountId) {
                        setForm(f => ({ ...f, whatsappAccountId: data[0].id }));
                    }
                }
            } catch (e) {
                console.error("Failed to fetch accounts");
            }
        };
        fetchAccounts();
    }, [mode]); // Dependencies: mode changes rarely, but good to reset if mode switches (not likely for this component instance)

    useEffect(() => {
        if (initialData) setForm(initialData);
    }, [initialData]);

    // Clear media handle when header type changes
    useEffect(() => {
        if (form.headerHandle) {
            setForm(f => ({ ...f, headerHandle: undefined }));
        }
    }, [form.headerType]);

    // Check template name uniqueness (only for CREATE mode)
    useEffect(() => {
        if (mode !== 'CREATE' || !form.name || !form.whatsappAccountId) {
            setNameCheckStatus('idle');
            return;
        }

        setNameCheckStatus('checking');
        const timeoutId = setTimeout(async () => {
            try {
                const res = await fetch(`/api/templates/check-name?name=${encodeURIComponent(form.name)}&accountId=${form.whatsappAccountId}`);
                const data = await res.json();
                setNameCheckStatus(data.available ? 'available' : 'taken');
            } catch (error) {
                console.error('Name check failed:', error);
                setNameCheckStatus('idle');
            }
        }, 500); // Debounce for 500ms

        return () => clearTimeout(timeoutId);
    }, [form.name, form.whatsappAccountId, mode]);

    const applyFormatting = (formatType: 'bold' | 'italic' | 'strikethrough') => {
        const textarea = bodyTextareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = form.bodyText.substring(start, end);

        let formattedText = '';
        let wrapper = '';

        switch (formatType) {
            case 'bold':
                wrapper = '*';
                formattedText = `*${selectedText || 'bold text'}*`;
                break;
            case 'italic':
                wrapper = '_';
                formattedText = `_${selectedText || 'italic text'}_`;
                break;
            case 'strikethrough':
                wrapper = '~';
                formattedText = `~${selectedText || 'strikethrough text'}~`;
                break;
        }

        const newText = form.bodyText.substring(0, start) + formattedText + form.bodyText.substring(end);
        setForm({ ...form, bodyText: newText });

        // Restore focus and set cursor position
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + (selectedText ? formattedText.length : wrapper.length + 1);
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    // Validation helpers
    const isValidUrl = (url: string): boolean => {
        // Allow URLs with variables like {{1}}
        const urlPattern = /^https?:\/\/.+/i;
        return urlPattern.test(url);
    };

    const isValidPhoneNumber = (phone: string): boolean => {
        // Must start with + and have at least country code and number
        const phonePattern = /^\+[1-9]\d{1,14}$/;
        return phonePattern.test(phone);
    };

    const handleAddButton = () => {
        if (form.buttons.length >= 3) return;
        setForm({
            ...form,
            buttons: [...form.buttons, { type: 'QUICK_REPLY', text: '' }]
        });
    };

    const getDetectedVariables = (text: string) => {
        const matches = text.match(/\{\{([^}]+)\}\}/g);
        if (!matches) return [];
        // Extract names and sort them
        const vars = Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, "").trim())))
            .sort((a, b) => {
                const aNum = parseInt(a);
                const bNum = parseInt(b);
                if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                return a.localeCompare(b);
            });
        return vars;
    };

    const bodyVars = getDetectedVariables(form.bodyText);
    const headerVars = form.headerType === 'TEXT' ? getDetectedVariables(form.headerText) : [];

    return (
        <div className="relative">
            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4 shadow-2xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                        <p className="text-lg font-semibold">Submitting template...</p>
                        <p className="text-sm text-gray-500">Please wait while we process your request</p>
                    </div>
                </div>
            )}
            <div className="flex flex-col lg:flex-row h-full">
                {/* Editor Side */}
                <div className={`flex-1 p-6 space-y-6 overflow-y-auto ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                        <h2 className="font-semibold text-lg">Template Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 ${nameCheckStatus === 'taken' ? 'border-red-500 bg-red-50' :
                                        nameCheckStatus === 'available' ? 'border-green-500 bg-green-50' : ''
                                        }`}
                                    placeholder="welcome_message"
                                    disabled={mode === 'EDIT'} // Name is usually immutable
                                />
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-gray-400">Lowercase, underscores only</p>
                                    {mode === 'CREATE' && form.name && (
                                        <p className={`text-xs ${nameCheckStatus === 'checking' ? 'text-gray-400' :
                                            nameCheckStatus === 'available' ? 'text-green-600' :
                                                nameCheckStatus === 'taken' ? 'text-red-600' : ''
                                            }`}>
                                            {nameCheckStatus === 'checking' && '⏳ Checking...'}
                                            {nameCheckStatus === 'available' && '✓ Available'}
                                            {nameCheckStatus === 'taken' && '✗ Name already exists'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="MARKETING">Marketing</option>
                                    <option value="UTILITY">Utility</option>
                                    <option value="AUTHENTICATION">Authentication</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                <select
                                    value={form.language}
                                    onChange={e => setForm({ ...form, language: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                                    disabled={mode === 'EDIT'}
                                >
                                    <option value="en_US">English (US)</option>
                                    <option value="en_GB">English (UK)</option>
                                    <option value="es">Spanish</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Account</label>
                                {loading && accounts.length === 0 ? (
                                    <div className="text-sm text-gray-400 p-2">Loading accounts...</div>
                                ) : (
                                    <select
                                        value={form.whatsappAccountId || ''}
                                        onChange={e => setForm({ ...form, whatsappAccountId: Number(e.target.value) })}
                                        className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                                        disabled={mode === 'EDIT'}
                                    >
                                        <option value="" disabled>Select Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name || acc.phoneNumber} ({acc.phoneNumber})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Variable Type Selector - Matching Meta's UI */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                            <div className="flex items-center gap-2">
                                <h2 className="font-semibold text-lg">Type of variable</h2>
                                <div className="group relative">
                                    <div className="cursor-help w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-[10px] text-gray-600 font-bold">i</div>
                                    <div className="absolute left-6 top-0 w-64 p-2 bg-gray-800 text-white text-xs rounded hidden group-hover:block z-10">
                                        Choose 'Number' for positional variables like {"{{1}}"}, {"{{2}}"}.
                                        Choose 'Name' for descriptive variables like {"{{name}}"}, {"{{order_id}}"}.
                                    </div>
                                </div>
                            </div>
                            <div className="w-full sm:w-64">
                                <select
                                    value={form.variableFormat}
                                    onChange={e => setForm({ ...form, variableFormat: e.target.value as 'positional' | 'named' })}
                                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="positional">Number ({"{{1}}, {{2}}"})</option>
                                    <option value="named">Name ({"{{var_name}}"})</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="font-semibold text-lg">Header <span className="text-gray-400 text-sm font-normal">(Optional)</span></h2>
                        </div>
                        <div className="flex gap-2">
                            {['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setForm({ ...form, headerType: type as any })}
                                    className={`px-3 py-1.5 text-sm border rounded-lg ${form.headerType === type ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        {form.headerType === 'TEXT' && (
                            <div className="space-y-1">
                                <input
                                    value={form.headerText}
                                    onChange={e => setForm({ ...form, headerText: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                    placeholder="Header text..."
                                    maxLength={META_LIMITS.HEADER_TEXT_LENGTH}
                                />
                                <div className={`text-xs text-right ${form.headerText.length > META_LIMITS.HEADER_TEXT_LENGTH - 10 ? 'text-orange-500' : 'text-gray-400'}`}>
                                    {form.headerText.length}/{META_LIMITS.HEADER_TEXT_LENGTH}
                                </div>
                                {headerVars.length > 0 && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                                        <p className="text-xs font-bold text-blue-700 uppercase">Header Variable Examples</p>
                                        {headerVars.map(v => (
                                            <div key={v} className="flex flex-col gap-1">
                                                <label className="text-[10px] text-gray-500 font-medium">Value for {'{{' + v + '}}'}</label>
                                                <input
                                                    value={form.headerExamples?.[v] || ""}
                                                    onChange={e => setForm({
                                                        ...form,
                                                        headerExamples: { ...form.headerExamples, [v]: e.target.value }
                                                    })}
                                                    placeholder={`e.g. John`}
                                                    className="w-full border rounded-md px-2 py-1 text-xs"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {(form.headerType === 'IMAGE' || form.headerType === 'VIDEO' || form.headerType === 'DOCUMENT') && (
                            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                                {/* Tabs */}
                                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setUploadMode('UPLOAD')}
                                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${uploadMode === 'UPLOAD'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        Upload New
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUploadMode('LIBRARY');
                                            fetchMediaLibrary();
                                        }}
                                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${uploadMode === 'LIBRARY'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        Select from Library
                                    </button>
                                </div>

                                {uploading ? (
                                    <div className="text-center p-6 bg-gray-50 rounded text-sm text-gray-500">
                                        Processing Media... (This may take a moment)
                                    </div>
                                ) : form.headerHandle ? (
                                    <div className="flex items-center justify-between bg-green-50 p-3 rounded text-green-700 text-sm">
                                        <span>Media Attached Successfully</span>
                                        <button
                                            onClick={() => setForm({ ...form, headerHandle: undefined })}
                                            className="text-red-500 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {uploadMode === 'UPLOAD' && (
                                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    accept={
                                                        form.headerType === 'IMAGE' ? "image/*" :
                                                            form.headerType === 'VIDEO' ? "video/*" :
                                                                ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                                    }
                                                    onChange={handleFileUpload}
                                                />
                                                <div className="mx-auto w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
                                                    {form.headerType === 'IMAGE' && <ImageIcon size={20} />}
                                                    {form.headerType === 'VIDEO' && <Video size={20} />}
                                                    {form.headerType === 'DOCUMENT' && <FileText size={20} />}
                                                </div>
                                                <div className="text-sm font-medium text-gray-700">Click to upload {form.headerType.toLowerCase()}</div>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Max size: {form.headerType === 'IMAGE' ? META_LIMITS.IMAGE_SIZE_MB : form.headerType === 'VIDEO' ? META_LIMITS.VIDEO_SIZE_MB : META_LIMITS.DOCUMENT_SIZE_MB}MB
                                                </p>
                                                <p className="text-xs text-gray-400">File will be saved to Gallery</p>
                                            </div>
                                        )}

                                        {uploadMode === 'LIBRARY' && (
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="Search media..."
                                                    value={searchMedia}
                                                    onChange={e => setSearchMedia(e.target.value)}
                                                    className="w-full border rounded px-3 py-2 text-sm"
                                                />
                                                <div className="max-h-48 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 border rounded p-2 bg-gray-50">
                                                    {mediaLibrary
                                                        .filter(m => {
                                                            const searchMatch = m.name.toLowerCase().includes(searchMedia.toLowerCase());
                                                            if (!searchMatch) return false;

                                                            if (form.headerType === 'IMAGE') {
                                                                return m.type.startsWith('image/');
                                                            } else if (form.headerType === 'VIDEO') {
                                                                return m.type.startsWith('video/');
                                                            } else if (form.headerType === 'DOCUMENT') {
                                                                // Accept PDF and MS Office formats
                                                                return m.type === 'application/pdf' ||
                                                                    m.type.includes('msword') ||
                                                                    m.type.includes('ms-excel') ||
                                                                    m.type.includes('ms-powerpoint') ||
                                                                    m.type.includes('officedocument');
                                                            }
                                                            return false;
                                                        })
                                                        .map(m => (
                                                            <div
                                                                key={m.id}
                                                                onClick={() => handleMediaSelect(m.id)}
                                                                className="bg-white p-2 rounded border cursor-pointer hover:border-blue-500 text-center text-xs truncate shadow-sm transition"
                                                            >
                                                                {m.type.startsWith('image') ? (
                                                                    <div className="w-full h-16 bg-gray-200 mb-1 rounded bg-cover bg-center" style={{ backgroundImage: `url(${m.url})` }} />
                                                                ) : (
                                                                    <div className="w-full h-16 bg-gray-100 mb-1 rounded flex items-center justify-center text-gray-400">{m.type.split('/')[1]}</div>
                                                                )}
                                                                {m.name}
                                                            </div>
                                                        ))}
                                                    {mediaLibrary.length === 0 && <div className="col-span-3 text-center text-gray-400 py-4">No media found</div>}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                {!form.whatsappAccountId && <p className="text-xs text-red-400 mt-2">Select an account first</p>}
                            </div>
                        )}
                    </div>

                    {/* Body */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                        <h2 className="font-semibold text-lg">Body <span className="text-red-500">*</span></h2>

                        {/* Formatting Toolbar */}
                        <div className="flex gap-1 p-2 bg-gray-50 rounded-lg border">
                            <button
                                type="button"
                                onClick={() => applyFormatting('bold')}
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Bold (*text*)"
                            >
                                <Bold className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFormatting('italic')}
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Italic (_text_)"
                            >
                                <Italic className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFormatting('strikethrough')}
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Strikethrough (~text~)"
                            >
                                <Strikethrough className="w-4 h-4" />
                            </button>
                            <div className="flex-1"></div>
                            <div className="text-xs text-gray-500 flex items-center px-2">
                                WhatsApp Formatting
                            </div>
                        </div>

                        <textarea
                            ref={bodyTextareaRef}
                            value={form.bodyText}
                            onChange={e => setForm({ ...form, bodyText: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2 text-sm h-32 font-mono"
                            placeholder={form.variableFormat === 'positional'
                                ? "Enter your message text here. Use {{1}}, {{2}} for variables."
                                : "Enter your message text here. Use {{first_name}}, {{order_id}} for variables."
                            }
                            maxLength={META_LIMITS.BODY_TEXT_LENGTH}
                        />

                        {bodyVars.length > 0 && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                                <p className="text-xs font-bold text-blue-700 uppercase">Body Variable Examples</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {bodyVars.map(v => (
                                        <div key={v} className="flex flex-col gap-1">
                                            <label className="text-[10px] text-gray-500 font-medium">Value for {'{{' + v + '}}'}</label>
                                            <input
                                                value={form.bodyExamples?.[v] || ""}
                                                onChange={e => setForm({
                                                    ...form,
                                                    bodyExamples: { ...form.bodyExamples, [v]: e.target.value }
                                                })}
                                                placeholder={`Sample for {{${v}}}`}
                                                className="w-full border rounded-md px-2 py-1 text-xs"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-400">
                                Formatting: *bold* _italic_ ~strikethrough~ | Variables: {'{{1}}'} {'{{2}}'}
                            </p>
                            <div className={`text-xs ${form.bodyText.length > META_LIMITS.BODY_TEXT_LENGTH - 50 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                                {form.bodyText.length}/{META_LIMITS.BODY_TEXT_LENGTH}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                        <h2 className="font-semibold text-lg">Footer <span className="text-gray-400 text-sm font-normal">(Optional)</span></h2>
                        <div className="space-y-1">
                            <input
                                value={form.footerText}
                                onChange={e => setForm({ ...form, footerText: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                placeholder="Footer text (e.g. Reply STOP to unsubscribe)"
                                maxLength={META_LIMITS.FOOTER_TEXT_LENGTH}
                            />
                            {form.footerText && (
                                <div className={`text-xs text-right ${form.footerText.length > META_LIMITS.FOOTER_TEXT_LENGTH - 10 ? 'text-orange-500' : 'text-gray-400'}`}>
                                    {form.footerText.length}/{META_LIMITS.FOOTER_TEXT_LENGTH}
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-lg">Buttons <span className="text-gray-400 text-sm font-normal">(Optional, max 3)</span></h2>
                                {form.buttons.length < 3 && (
                                    <button
                                        type="button"
                                        onClick={handleAddButton}
                                        className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                    >
                                        + Add Button
                                    </button>
                                )}
                            </div>
                            {form.buttons.map((btn, idx) => (
                                <div key={idx} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-600 mb-1 block">Type of Action</label>
                                            <select
                                                value={btn.type}
                                                onChange={e => {
                                                    const newButtons = [...form.buttons];
                                                    newButtons[idx].type = e.target.value as any;
                                                    // Clear type-specific fields when changing type
                                                    if (e.target.value === 'QUICK_REPLY') {
                                                        delete newButtons[idx].url;
                                                        delete newButtons[idx].phoneNumber;
                                                    } else if (e.target.value === 'URL') {
                                                        delete newButtons[idx].phoneNumber;
                                                    } else if (e.target.value === 'PHONE_NUMBER') {
                                                        delete newButtons[idx].url;
                                                    }
                                                    setForm({ ...form, buttons: newButtons });
                                                }}
                                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                            >
                                                <option value="QUICK_REPLY">Quick Reply</option>
                                                <option value="URL">Visit Website</option>
                                                <option value="PHONE_NUMBER">Call Phone Number</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-600 mb-1 block">Button Text <span className="text-red-500">*</span></label>
                                            <input
                                                value={btn.text}
                                                onChange={e => {
                                                    const newButtons = [...form.buttons];
                                                    newButtons[idx].text = e.target.value;
                                                    setForm({ ...form, buttons: newButtons });
                                                }}
                                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                                placeholder={`Button Text (max ${META_LIMITS.BUTTON_TEXT_LENGTH})`}
                                                maxLength={META_LIMITS.BUTTON_TEXT_LENGTH}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newButtons = form.buttons.filter((_, i) => i !== idx);
                                                setForm({ ...form, buttons: newButtons });
                                            }}
                                            className="text-red-500 hover:bg-red-50 px-2 rounded self-end mb-0.5"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* URL Button Fields */}
                                    {btn.type === 'URL' && (
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-xs text-gray-600 mb-1 block">Website URL <span className="text-red-500">*</span></label>
                                                <input
                                                    value={btn.url || ''}
                                                    onChange={e => {
                                                        const newButtons = [...form.buttons];
                                                        newButtons[idx].url = e.target.value;
                                                        setForm({ ...form, buttons: newButtons });
                                                    }}
                                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                                    placeholder="https://example.com or https://example.com/{{1}}"
                                                    type="url"
                                                />
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Must start with http:// or https://. Can include {'{{1}}'} for dynamic URLs.
                                                </p>
                                            </div>
                                            {btn.url && btn.url.includes('{{1}}') && (
                                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
                                                    <label className="text-xs font-bold text-blue-700 uppercase block">URL Example</label>
                                                    <input
                                                        value={form.buttonExamples?.[idx] || ''}
                                                        onChange={e => {
                                                            setForm({
                                                                ...form,
                                                                buttonExamples: { ...form.buttonExamples, [idx]: e.target.value }
                                                            });
                                                        }}
                                                        className="w-full border rounded px-3 py-2 text-sm bg-white"
                                                        placeholder="Full sample URL (e.g. https://example.com/summer-sale)"
                                                    />
                                                    <p className="text-[10px] text-gray-500">Provide a full URL with a sample value replaced.</p>
                                                </div>
                                            )}
                                            {btn.url && !isValidUrl(btn.url) && (
                                                <p className="text-xs text-red-500">⚠ Invalid URL format. Must start with http:// or https://</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Phone Number Button Fields */}
                                    {btn.type === 'PHONE_NUMBER' && (
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-xs text-gray-600 mb-1 block">Phone Number <span className="text-red-500">*</span></label>
                                                <input
                                                    value={btn.phoneNumber || ''}
                                                    onChange={e => {
                                                        const newButtons = [...form.buttons];
                                                        newButtons[idx].phoneNumber = e.target.value;
                                                        setForm({ ...form, buttons: newButtons });
                                                    }}
                                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                                    placeholder="+1234567890 (include country code)"
                                                    type="tel"
                                                />
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Must include country code with + prefix (e.g., +1 for US, +91 for India)
                                                </p>
                                            </div>
                                            {btn.phoneNumber && !isValidPhoneNumber(btn.phoneNumber) && (
                                                <p className="text-xs text-red-500">⚠ Invalid phone number. Must start with + and country code</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {form.buttons.length === 0 && <p className="text-sm text-gray-400 italic">No buttons added.</p>}
                        </div>

                        <div className="flex justify-end pt-4 pb-12">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg disabled:opacity-50"
                            >
                                {loading ? "Saving..." : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        {mode === 'CREATE' ? 'Submit Template' : 'Save Changes'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Side */}
                <div className="w-full lg:w-96 bg-gray-100 border-l p-8 hidden lg:flex flex-col items-center justify-center sticky top-0 h-screen">
                    {renderPreview(form)}
                    <div className="mt-6 text-gray-500 text-sm font-medium">
                        Live Preview
                    </div>
                </div>
            </div>
        </div >
    );
}
