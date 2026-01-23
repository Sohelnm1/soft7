"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Mail,
  MessageSquare,
  FileText,
  Users,
  Tag as TagIcon,
  X,
} from "lucide-react";
import TemplateSelectionModal from "@/components/TemplateSelectionModal";

type Step = 1 | 2 | 3 | 4;

type Contact = {
  id: number;
  name: string;
  phone: string;
  tags: string;
};

type Tag = {
  id: number;
  name: string;
};

type Group = {
  id: number;
  name: string;
};

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const [form, setForm] = useState({
    name: "",
    type: "WhatsApp",
    messageTemplate: "",
    selectedTemplate: "",
    schedulingMode: "later" as "now" | "later",
    audience: {
      selectAll: false,
      contacts: [] as number[],
      groups: [] as string[],
      tags: [] as string[],
    },
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "17:00",
  });

  const [submitting, setSubmitting] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [allContactsSearch, setAllContactsSearch] = useState("");
  const [contactsOpen, setContactsOpen] = useState(false);

  // Tags and Groups state
  const [tags, setTags] = useState<Tag[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // Fetch when step 2 is opened
  useEffect(() => {
    if (step === 2) {
      fetchContacts();
      fetchTags();
    }
  }, [step]);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await fetch("/api/contacts?forCampaign=true");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setContacts(data.items || []);
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchTags = async () => {
    setLoadingTags(true);
    try {
      const res = await fetch("/api/tags/list", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch tags");

      const data = await res.json();

      // Same DB tags as Contacts page
      setTags(data);
    } catch (err) {
      console.error("❌ Error fetching tags:", err);
      setTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  function updateField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((s) => ({ ...s, [k]: v }));
    if (k === "startDate" || k === "startTime" || k === "endDate" || k === "endTime") {
      setScheduleError(null);
    }
  }

  const validateSchedule = (): boolean => {
    setScheduleError(null);

    // If running immediately, we don't need to validate future dates
    if (form.schedulingMode === "now") return true;

    if (!form.startDate) {
      setScheduleError("Start date is required");
      return false;
    }

    if (form.endDate) {
      if (form.endDate < form.startDate) {
        setScheduleError("End date cannot be before start date");
        return false;
      }

      if (form.endDate === form.startDate) {
        const startDateTime = new Date(`${form.startDate}T${form.startTime}`);
        const endDateTime = new Date(`${form.endDate}T${form.endTime}`);

        if (endDateTime <= startDateTime) {
          setScheduleError("End time must be after start time on the same day");
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (step === 3 && !validateSchedule()) {
      return;
    }
    if (step < 4) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const handlePrev = () => {
    if (step === 1) {
      router.push("/campaigns");
    } else {
      setStep((s) => (s - 1) as Step);
    }
  };

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      // Prepared payload
      const payload = { ...form };

      // If "Run Now", set today's date and time
      if (form.schedulingMode === "now") {
        const now = new Date();
        payload.startDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
        // Format HH:MM
        payload.startTime = now.toTimeString().slice(0, 5);
      }

      const res = await fetch("/campaigns/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to create campaign");
      }

      // OPTIONAL: If "Run Now", we could trigger execution immediately here?
      // For now, we just create it with today's date. 
      // The user can then click the "Run" button on the list page or we can auto-run.
      // Let's stick to creating it as "Scheduled" for today 
      // but maybe we can trigger the run call right after? 

      const createdCampaign = await res.json();

      if (form.schedulingMode === "now") {
        // Auto-trigger run
        await fetch('/campaigns/execute/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: createdCampaign.id })
        });
      }

      router.push("/campaigns");
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  const toggleContact = (contactId: number) => {
    updateField("audience", {
      ...form.audience,
      contacts: form.audience.contacts.includes(contactId)
        ? form.audience.contacts.filter((id) => id !== contactId)
        : [...form.audience.contacts, contactId],
    });
  };

  const toggleSelectAll = () => {
    const newSelectAll = !form.audience.selectAll;
    updateField("audience", {
      ...form.audience,
      selectAll: newSelectAll,
      contacts: newSelectAll ? contacts.map((c) => c.id) : [],
    });
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(allContactsSearch.toLowerCase()) ||
      contact.phone.includes(allContactsSearch)
  );

  const steps = ["Basic Info", "Contact", "Schedule", "Review"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-8 h-8 text-emerald-600" />
            {steps[step - 1]}
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((s, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${idx + 1 === step
                    ? "bg-emerald-600 text-white ring-4 ring-emerald-200"
                    : idx + 1 < step
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-200 text-gray-500"
                    }`}
                >
                  {idx + 1}
                </div>
                <span className="text-xs mt-1 text-gray-600 hidden sm:block">{s}</span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-emerald-100">
          <div className="min-h-[400px]">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Basic Information</h2>

                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="Enter campaign name"
                  />
                </div>

                {/* Campaign Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Campaign Type
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: "WhatsApp", icon: MessageSquare, label: "WhatsApp" },
                      { value: "Email", icon: Mail, label: "Email" },
                      { value: "SMS", icon: MessageSquare, label: "SMS" },
                    ].map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => updateField("type", type.value)}
                          className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition ${form.type === type.value
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-md"
                            : "border-gray-300 hover:border-emerald-400"
                            }`}
                        >
                          <Icon className="w-8 h-8 mb-2" />
                          <span className="font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message Template */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message Template
                  </label>
                  <div className="flex gap-3">
                    {form.name && form.messageTemplate ? (
                      <div className="w-full flex items-center justify-between p-4 border-2 border-emerald-500 bg-emerald-50 rounded-xl">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800">{form.messageTemplate}</span>
                          <span className="text-sm text-emerald-600">Selected Template</span>
                        </div>
                        <button
                          onClick={() => setTemplateModalOpen(true)}
                          className="text-sm font-semibold text-emerald-700 hover:underline"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTemplateModalOpen(true)}
                        className="px-4 py-2 border-2 border-emerald-600 text-emerald-700 rounded-lg font-medium hover:bg-emerald-50 transition"
                      >
                        Select Template
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <TemplateSelectionModal
              isOpen={templateModalOpen}
              onClose={() => setTemplateModalOpen(false)}
              onSelect={(template) => {
                updateField("messageTemplate", template.name);
                updateField("selectedTemplate", template.id);
                setTemplateModalOpen(false);
              }}
              selectedTemplateId={form.selectedTemplate}
            />

            {/* Step 2: Contact/Audience */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Contacts</h2>

                {loadingContacts ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  </div>
                ) : (
                  <>
                    {/* Select All Contacts as dropdown */}
                    <div className="border-2 border-gray-300 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setContactsOpen((o) => !o)}
                        className="w-full flex items-center justify-between px-4 py-3"
                      >
                        <label
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={form.audience.selectAll}
                            onChange={toggleSelectAll}
                            className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <span className="font-semibold text-gray-700">
                            Select All Contacts ({contacts.length})
                          </span>
                        </label>
                        <ChevronRight
                          className={`w-4 h-4 text-gray-400 transition-transform ${contactsOpen ? "rotate-90" : ""
                            }`}
                        />
                      </button>

                      {contactsOpen && (
                        <div className="border-t border-gray-200 px-4 pb-4 pt-3 space-y-3">
                          <input
                            type="text"
                            value={allContactsSearch}
                            onChange={(e) => setAllContactsSearch(e.target.value)}
                            placeholder="Search contacts by name or phone..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />

                          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                            {filteredContacts.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                No contacts found
                              </div>
                            ) : (
                              filteredContacts.map((contact) => (
                                <label
                                  key={contact.id}
                                  className="flex items-center gap-3 p-3 hover:bg-emerald-50 cursor-pointer border-b last:border-b-0"
                                >
                                  <input
                                    type="checkbox"
                                    checked={form.audience.contacts.includes(contact.id)}
                                    onChange={() => toggleContact(contact.id)}
                                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-800">
                                      {contact.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {contact.phone}
                                    </div>
                                    {contact.tags && (
                                      <div className="text-xs text-emerald-600 mt-1">
                                        Tags: {contact.tags}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              ))
                            )}
                          </div>

                          <div className="text-sm font-medium text-emerald-700">
                            {form.audience.contacts.length} contact(s) selected
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Group and Tag filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SearchableDropdown
                        labelIcon={Users}
                        label="Group"
                        placeholder="Search and select group..."
                        options={groups.map((g) => ({ value: g.name, label: g.name }))}
                        selectedValues={form.audience.groups}
                        onSelect={(value) =>
                          updateField("audience", {
                            ...form.audience,
                            groups: form.audience.groups.includes(value)
                              ? form.audience.groups
                              : [...form.audience.groups, value],
                          })
                        }
                        onRemove={(value) =>
                          updateField("audience", {
                            ...form.audience,
                            groups: form.audience.groups.filter((g) => g !== value),
                          })
                        }
                        pills={form.audience.groups}
                        pillColor="bg-emerald-100 text-emerald-700"
                        loading={false}
                      />

                      <SearchableDropdown
                        labelIcon={TagIcon}
                        label="Tag"
                        placeholder="Search and select tag..."
                        options={tags.map((t) => ({ value: t.name, label: t.name }))}
                        selectedValues={form.audience.tags}
                        onSelect={(value) =>
                          updateField("audience", {
                            ...form.audience,
                            tags: form.audience.tags.includes(value)
                              ? form.audience.tags
                              : [...form.audience.tags, value],
                          })
                        }
                        onRemove={(value) =>
                          updateField("audience", {
                            ...form.audience,
                            tags: form.audience.tags.filter((t) => t !== value),
                          })
                        }
                        pills={form.audience.tags}
                        pillColor="bg-teal-100 text-teal-700"
                        loading={loadingTags}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Schedule */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Schedule Campaign</h2>

                {scheduleError && (
                  <div className="p-4 md:p-5 bg-red-500/15 border border-red-500 text-red-100 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-300" />
                    <div className="space-y-1">
                      <p className="text-sm md:text-base font-semibold text-red-100">
                        Validation Error
                      </p>
                      <p className="text-xs md:text-sm text-red-100">{scheduleError}</p>
                    </div>
                  </div>
                )}

                {/* Scheduling Mode Toggle */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => updateField("schedulingMode", "now")}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${form.schedulingMode === "now"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-md transform scale-[1.02]"
                      : "border-gray-200 text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/30"
                      }`}
                  >
                    <div className={`p-2 rounded-full ${form.schedulingMode === "now" ? "bg-emerald-200" : "bg-gray-100"}`}>
                      <div className="w-5 h-5 flex items-center justify-center font-bold">⚡</div>
                    </div>
                    <span className="font-semibold">Run Immediately</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateField("schedulingMode", "later")}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${form.schedulingMode === "later"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-md transform scale-[1.02]"
                      : "border-gray-200 text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/30"
                      }`}
                  >
                    <div className={`p-2 rounded-full ${form.schedulingMode === "later" ? "bg-emerald-200" : "bg-gray-100"}`}>
                      <div className="w-5 h-5 flex items-center justify-center font-bold">📅</div>
                    </div>
                    <span className="font-semibold">Schedule for Later</span>
                  </button>
                </div>

                {form.schedulingMode === "later" && (
                  <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => updateField("startDate", e.target.value)}
                        className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 ${scheduleError && !form.startDate
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                          }`}
                        required
                      />
                      {!form.startDate && (
                        <p className="mt-1 text-xs text-red-500">Start date is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={(e) => updateField("startTime", e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => updateField("endDate", e.target.value)}
                        className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 ${scheduleError && form.endDate
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                          }`}
                        min={form.startDate}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        End Time (Optional)
                      </label>
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={(e) => updateField("endTime", e.target.value)}
                        className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 ${scheduleError && form.endDate
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                          }`}
                        disabled={!form.endDate}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Review & Launch</h2>

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 space-y-4">
                  <ReviewItem label="Campaign Name" value={form.name || "N/A"} />
                  <ReviewItem label="Type" value={form.type} />
                  <ReviewItem label="Message Template" value={form.messageTemplate || "N/A"} />
                  <ReviewItem
                    label="Selected Contacts"
                    value={`${form.audience.contacts.length} contact(s)`}
                  />
                  <ReviewItem
                    label="Groups"
                    value={
                      form.audience.groups.length > 0
                        ? form.audience.groups.join(", ")
                        : "None"
                    }
                  />
                  <ReviewItem
                    label="Tags"
                    value={
                      form.audience.tags.length > 0
                        ? form.audience.tags.join(", ")
                        : "None"
                    }
                  />

                  {form.schedulingMode === "now" ? (
                    <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                      <span className="font-semibold text-gray-700">Schedule:</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        ⚡ Run Immediately
                      </span>
                    </div>
                  ) : (
                    <>
                      <ReviewItem label="Start Date" value={form.startDate || "N/A"} />
                      <ReviewItem label="Start Time" value={form.startTime} />
                      <ReviewItem label="End Date" value={form.endDate || "No end date"} />
                      <ReviewItem label="End Time" value={form.endTime} />
                    </>
                  )}
                </div>

                {error && (
                  <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="pt-6 mt-8 border-t border-gray-200 flex justify-between">
            <button
              onClick={handlePrev}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
              Prev
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg transition"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Campaign"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ReviewItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-emerald-200">
    <span className="font-semibold text-gray-700">{label}:</span>
    <span className="text-gray-900">{value}</span>
  </div>
);

type SearchableDropdownProps = {
  label: string;
  labelIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  placeholder: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onSelect: (value: string) => void;
  onRemove?: (value: string) => void;
  pills: string[];
  pillColor: string;
  loading?: boolean;
};

const SearchableDropdown = ({
  label,
  labelIcon: LabelIcon,
  placeholder,
  options,
  selectedValues,
  onSelect,
  onRemove,
  pills,
  pillColor,
  loading = false,
}: SearchableDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleRemovePill = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(value);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        {LabelIcon && <LabelIcon className="w-5 h-5 text-emerald-600" />}
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 flex justify-between items-center text-left focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
      >
        <span className="text-gray-700 text-sm">
          {loading
            ? "Loading..."
            : selectedValues.length > 0
              ? `${selectedValues.length} selected`
              : placeholder}
        </span>
        <ChevronRight
          className={`w-4 h-4 text-gray-400 transform transition-transform ${open ? "rotate-90" : ""
            }`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 && (
                <div className="px-4 py-2 text-xs text-gray-400">
                  {options.length === 0 ? "No options available" : "No options found"}
                </div>
              )}
              {filtered.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelect(opt.value)}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-emerald-50 ${isSelected ? "bg-emerald-50" : ""
                      }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <span className="text-emerald-600 text-xs font-semibold">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {pills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {pills.map((p, idx) => (
            <span
              key={idx}
              className={`px-3 py-1 rounded-full text-sm font-medium ${pillColor} flex items-center gap-2`}
            >
              {p}
              {onRemove && (
                <button
                  type="button"
                  onClick={(e) => handleRemovePill(p, e)}
                  className="hover:bg-black/10 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};