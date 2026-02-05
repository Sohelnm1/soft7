"use client";

import { useState, useEffect } from "react";
import { Users, Tag, FolderPlus, User, Phone, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";

const MENU = [
  { id: "all", label: "All Contacts", icon: Users },
  { id: "group", label: "Group", icon: Users },
  { id: "create", label: "Create Group", icon: FolderPlus },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "one", label: "One", icon: User },
];

interface Contact {
  id: number;
  name: string;
  number: string;
  email?: string;
}

interface Group {
  id: string;
  name: string;
  members: number;
}

interface TagType {
  id: number;
  name: string;
  count: number;
}

export default function CreateReminderStep1() {
  const router = useRouter();

  const [activeMenu, setActiveMenu] = useState("all");
  const [selected, setSelected] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Data from API
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // Selection state
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  // Unified Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [contactRes, templateRes] = await Promise.all([
          fetch("/api/contacts?forReminder=true"),
          fetch("/api/templates/list?status=APPROVED")
        ]);

        if (contactRes.ok) {
          const data = await contactRes.json();
          setAllContacts(data.contacts || []);
          setGroups(data.groups || []);
          setTags(data.tags || []);
        }

        if (templateRes.ok) {
          const data = await templateRes.json();
          setTemplates(data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // Load/Save Draft
  useEffect(() => {
    const raw = localStorage.getItem("draftReminder");
    if (raw) {
      try {
        const d = JSON.parse(raw);
        if (d.recipients) setSelected(d.recipients);
        if (d.templateName) {
          if (d.variables) setTemplateVariables(d.variables);
        }
      } catch { }
    }
  }, []);

  useEffect(() => {
    const draft = {
      recipients: selected,
      templateName: selectedTemplate?.name,
      language: selectedTemplate?.language,
      variables: templateVariables
    };
    localStorage.setItem("draftReminder", JSON.stringify(draft));
  }, [selected, selectedTemplate, templateVariables]);

  const toggleSelect = (item: any) => {
    setSelected((prev) => {
      if (prev.find((x) => x.id === item.id && x.type === item.type)) {
        return prev.filter((x) => !(x.id === item.id && x.type === item.type));
      }
      return [...prev, item];
    });
  };

  const removeSelected = (item: any) => {
    setSelected((prev) =>
      prev.filter((x) => !(x.id === item.id && x.type === item.type))
    );
  };

  const getTemplateVariables = (components: any[]) => {
    const vars: any[] = [];
    const seen = new Set<string>();
    if (!components) return vars;
    components.forEach((c: any) => {
      if ((c.type === "BODY" || c.type === "HEADER") && c.text) {
        const matches = c.text.match(/\{\{([^}]+)\}\}/g);
        if (matches) {
          matches.forEach((m: string) => {
            const name = m.replace(/\{\{|\}\}/g, "").trim();
            if (!seen.has(name)) {
              vars.push({ name, component: c.type });
              seen.add(name);
            }
          });
        }
      }
    });
    return vars;
  };

  const handleNext = () => {
    if (selected.length === 0) {
      alert("Select at least one recipient.");
      return;
    }
    if (!selectedTemplate) {
      alert("Please select a template.");
      return;
    }

    const componentVars = getTemplateVariables(selectedTemplate.components || []);
    const missing = componentVars.find(v => !templateVariables[v.name]);
    if (missing) {
      alert(`Please fill in all template variables (Missing: {{${missing.name}}}).`);
      return;
    }

    router.push("/reminder/create/next");
  };

  const filteredContacts = allContacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.number.includes(search)
  );
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
  const filteredTags = tags.filter(t => (typeof t === 'string' ? t : t.name).toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#d1f3de]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d1f3de] p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-emerald-900">Create Reminder</h1>
          <p className="text-lg text-emerald-800">Compose your message using templates and select recipients</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 bg-[#e8f8f0] rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white">
              <h2 className="text-lg font-semibold">Select Recipients</h2>
              <p className="text-xs opacity-90">Choose contacts, groups, or tags</p>
            </div>

            <div className="p-4">
              <div className="space-y-2 mb-4">
                {MENU.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveMenu(m.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeMenu === m.id ? "bg-emerald-600 text-white shadow-md" : "hover:bg-emerald-100 text-emerald-900"
                        }`}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{m.label}</span>
                    </button>
                  );
                })}
              </div>
              <input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-emerald-400 outline-none text-sm"
              />
            </div>

            <div className="px-4 pb-4 max-h-[400px] overflow-y-auto space-y-2">
              {activeMenu === "all" && filteredContacts.map(c => (
                <div key={c.id} onClick={() => toggleSelect({ id: c.id, label: c.name, type: "contact" })}
                  className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-all ${selected.find(x => x.id === c.id && x.type === "contact") ? "bg-emerald-50 border-2 border-emerald-400" : "bg-white hover:bg-emerald-50 border-2 border-transparent"
                    }`}>
                  <div>
                    <div className="font-semibold text-sm">{c.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Phone size={10} />{c.number}</div>
                  </div>
                  {selected.find(x => x.id === c.id && x.type === "contact") && <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"><CheckIcon /></div>}
                </div>
              ))}

              {activeMenu === "group" && filteredGroups.map(g => (
                <div key={g.id} onClick={() => toggleSelect({ id: g.id, label: g.name, type: "group" })}
                  className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-all ${selected.find(x => x.id === g.id && x.type === "group") ? "bg-emerald-50 border-2 border-emerald-400" : "bg-white hover:bg-emerald-50 border-2 border-transparent"
                    }`}>
                  <div>
                    <div className="font-semibold text-sm">{g.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{g.members} members</div>
                  </div>
                  {selected.find(x => x.id === g.id && x.type === "group") && <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"><CheckIcon /></div>}
                </div>
              ))}

              {activeMenu === "tags" && filteredTags.map((t, i) => {
                const name = typeof t === "string" ? t : t.name;
                return (
                  <div key={i} onClick={() => toggleSelect({ id: name, label: name, type: "tag" })}
                    className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-all ${selected.find(x => x.label === name && x.type === "tag") ? "bg-indigo-50 border-2 border-indigo-400" : "bg-white hover:bg-indigo-50 border-2 border-transparent"
                      }`}>
                    <div className="flex items-center gap-2 font-medium text-sm"><Tag size={14} className="text-indigo-500" />{name}</div>
                    {selected.find(x => x.label === name && x.type === "tag") && <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"><CheckIcon /></div>}
                  </div>
                );
              })}

              {activeMenu === "one" && filteredContacts.map(c => (
                <div key={c.id} onClick={() => toggleSelect({ id: c.id, label: c.name, type: "one" })}
                  className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-all ${selected.find(x => x.id === c.id && x.type === "one") ? "bg-emerald-50 border-2 border-emerald-400" : "bg-white hover:bg-emerald-50 border-2 border-transparent"
                    }`}>
                  <div>
                    <div className="font-semibold text-sm">{c.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{c.number}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#e8f8f0] rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white">
                <h2 className="text-lg font-semibold">Choose Template</h2>
                <p className="text-xs opacity-90">Select a pre-approved WhatsApp template</p>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Template</label>
                  <select
                    value={selectedTemplate?.id || ""}
                    onChange={(e) => setSelectedTemplate(templates.find(t => t.id === parseInt(e.target.value)))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-400 bg-white"
                  >
                    <option value="">Select a template...</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.language})</option>)}
                  </select>
                </div>

                {selectedTemplate && (
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-xl border border-emerald-100">
                      <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Preview</h3>
                      <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {selectedTemplate.components?.find((c: any) => c.type === "BODY")?.text}
                      </div>
                    </div>

                    {getTemplateVariables(selectedTemplate.components || []).length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-4">Template Variables</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {getTemplateVariables(selectedTemplate.components || []).map((v) => (
                            <div key={v.name}>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Variable {"{{"}{v.name}{"}}"}</label>
                              <input
                                type="text"
                                value={templateVariables[v.name] || ""}
                                onChange={(e) => setTemplateVariables({ ...templateVariables, [v.name]: e.target.value })}
                                placeholder={`Enter ${v.name}...`}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-400 bg-white"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-emerald-100">
                  <button onClick={() => router.push("/reminder")}
                    className="px-6 py-2.5 rounded-lg border-2 border-red-500 text-red-500 font-medium hover:bg-red-50 transition-all">
                    Cancel
                  </button>
                  <button onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white rounded-lg font-medium shadow-lg hover:bg-emerald-700 transition-all">
                    Next Step <Send size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#e8f8f0] p-4 rounded-xl shadow-xl border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-emerald-900">Selected Recipients ({selected.length})</h3>
                {selected.length > 0 && <button onClick={() => setSelected([])} className="text-xs text-emerald-600 hover:underline font-medium">Clear All</button>}
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.length === 0 ? <p className="text-sm text-gray-500 italic">No recipients selected</p> :
                  selected.map((s, i) => (
                    <div key={i} className="group relative px-3 py-1 pr-8 rounded-full bg-emerald-500 text-white text-xs font-medium">
                      {s.label}
                      <button onClick={() => removeSelected(s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"><X size={12} /></button>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}