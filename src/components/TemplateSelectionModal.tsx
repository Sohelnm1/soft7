"use client";

import { useEffect, useState } from "react";
import { Search, X, Check, Loader2, MessageSquare } from "lucide-react";

type Template = {
    id: string;
    name: string;
    language: string;
    category: string;
    status: string;
    components: any; // Using any for now to be flexible with JSON
};

type TemplateSelectionModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template: Template) => void;
    selectedTemplateId?: string;
};

export default function TemplateSelectionModal({
    isOpen,
    onClose,
    onSelect,
    selectedTemplateId,
}: TemplateSelectionModalProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            // Fetch only approved templates
            const res = await fetch("/api/templates/list?status=APPROVED");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setTemplates(data);
        } catch (err) {
            console.error("Error loading templates", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = templates.filter((t) => {
        const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
        const matchCategory =
            filterCategory === "all" ||
            t.category.toLowerCase() === filterCategory.toLowerCase();
        return matchSearch && matchCategory;
    });

    // Basic helper to preview body test
    const getPreviewText = (components: any) => {
        if (!Array.isArray(components)) return "No preview available";
        const body = components.find((c: any) => c.type === "BODY");
        return body?.text || "No text content";
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-emerald-600" />
                        Select Message Template
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="all">All Categories</option>
                        <option value="MARKETING">Marketing</option>
                        <option value="UTILITY">Utility</option>
                        <option value="AUTHENTICATION">Authentication</option>
                    </select>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-950/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-2 text-emerald-600" />
                            <p>Loading templates...</p>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                            <p className="text-lg font-medium">No templates found</p>
                            <p className="text-sm">Try adjusting your filters or search query</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTemplates.map((template) => {
                                const isSelected = selectedTemplateId === template.id;
                                return (
                                    <div
                                        key={template.id}
                                        onClick={() => onSelect(template)}
                                        className={`
                      cursor-pointer group relative flex flex-col
                      bg-white dark:bg-gray-800 
                      border-2 rounded-xl p-4 transition-all duration-200
                      hover:shadow-md hover:border-emerald-400
                      ${isSelected
                                                ? "border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600"
                                                : "border-gray-100 dark:border-gray-700"
                                            }
                    `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={template.name}>
                                                    {template.name}
                                                </h3>
                                                <span className="text-xs text-gray-500 capitalize bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full inline-block mt-1">
                                                    {template.category.toLowerCase()}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center ml-2">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg text-xs italic">
                                            "{getPreviewText(template.components)}"
                                        </div>

                                        <div className="mt-auto pt-3 flex justify-between items-center text-xs text-gray-400">
                                            <span>{template.language}</span>
                                            <span className={`uppercase font-bold ${template.status === 'APPROVED' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {template.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 font-medium mr-2">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
