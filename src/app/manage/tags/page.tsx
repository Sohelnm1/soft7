"use client";

import { useEffect, useState } from "react";
import {
  Trash2,
  PlusCircle,
  Tag as TagIcon,
  X,
  CheckCircle,
  XCircle,
  Save,
  Loader2,
} from "lucide-react";

/* --------------------- INTERFACES --------------------- */
interface Tag {
  id: number;
  name: string;
  group?: string | null;
}

interface Notification {
  message: string;
  type: "error" | "success";
}

/* --------------------- DELETE CONFIRM MODAL --------------------- */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  tagName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tagName: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-red-700 flex items-center">
            <Trash2 className="w-5 h-5 mr-2" /> Confirm Deletion
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-800">"{tagName}"</span>?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* --------------------- MAIN MANAGE TAGS PAGE --------------------- */
export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const showNotification = (message: string, type: "error" | "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags/list");
      if (!res.ok) throw new Error("Failed to fetch tags");
      setTags(await res.json());
    } catch {
      showNotification("Failed to load tags.", "error");
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleDeleteClick = (tag: Tag) => {
    setTagToDelete(tag);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return;
    const name = tagToDelete.name;
    try {
      const res = await fetch(`/api/tags/delete/${tagToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Unable to delete");
      showNotification(`"${name}" deleted successfully.`, "success");
      fetchTags();
    } catch {
      showNotification("Failed to delete tag.", "error");
    }
    setIsModalOpen(false);
    setTagToDelete(null);
  };

  /* --------------------- CREATE TAG MODAL --------------------- */
  const CreateTagModal = () => {
    const [tagName, setTagName] = useState("");
    const [tagGroup, setTagGroup] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; group?: string }>({});

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: { name?: string; group?: string } = {};

      // ✅ Inline validation
      if (!tagName.trim()) newErrors.name = "Tag name is required.";

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) return;

      setLoading(true);
      try {
        const res = await fetch("/api/tags/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: tagName.trim(), group: tagGroup.trim() || null }),
        });

        if (res.ok) {
          showNotification(`Tag '${tagName}' created successfully!`, "success");
          setTagName("");
          setTagGroup("");
          setShowCreateModal(false);
          fetchTags();
        } else {
          showNotification("Failed to create tag.", "error");
        }
      } catch {
        showNotification("Network error. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="absolute inset-0 z-[70] flex items-center justify-center">
        <div className="absolute inset-0 backdrop-blur-md bg-transparent" />

        <div className="relative bg-white rounded-2xl shadow-2xl w-[400px] max-w-full p-6 z-[80]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TagIcon className="w-6 h-6 text-orange-500" />
              Create New Tag
            </h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tag Name <span className="text-red-500">*</span>
              </label>
              <input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="e.g. Important"
                className={`w-full border rounded-lg p-2 focus:ring-2 ${
                  errors.name ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-orange-500"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tag Group (Optional)
              </label>
              <input
                value={tagGroup}
                onChange={(e) => setTagGroup(e.target.value)}
                placeholder="e.g. Priority"
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* 🟧 Orange Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 font-semibold transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {loading ? "Saving..." : "Save Tag"}
            </button>
          </form>
        </div>
      </div>
    );
  };

  /* --------------------- RENDER --------------------- */
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white to-gray-100 p-6 md:p-10 overflow-hidden">
      {notification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg flex items-center gap-3 z-[100] ${
            notification.type === "success"
              ? "bg-teal-50 text-teal-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {notification.type === "success" ? <CheckCircle /> : <XCircle />}
          <p>{notification.message}</p>
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        tagName={tagToDelete?.name || ""}
      />

      <div
        className={`relative transition-all duration-300 ${
          showCreateModal ? "blur-md scale-[0.98]" : ""
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-xl font-semibold text-orange-600 flex items-center gap-3">
            <TagIcon className="w-7 h-7 text-orange-500" /> Manage Tags
          </h1>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 shadow-lg"
          >
            <PlusCircle className="w-5 h-5" /> Create Tag
          </button>
        </div>

        <div className="
  overflow-x-auto
  rounded-2xl
  border-2 border-orange-500
  shadow-lg
  bg-white
  dark:bg-slate-900
">


          <table className="min-w-full text-sm font-medium text-gray-700">
          <thead className="bg-orange-500 text-white uppercase text-xs dark:bg-slate-900">

              <tr>
                <th className="px-6 py-4 text-left text-sm">Tag Name</th>
                <th className="px-6 py-4 text-left hidden sm:table-cell text-sm">Group</th>
                <th className="px-6 py-4 text-center text-sm">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {tags.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-500">
                    <TagIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    No tags found.
                  </td>
                </tr>
              )}

              {tags.map((tag) => (
           <tr
           key={tag.id}
           className="
             bg-white
             
             dark:bg-slate-900
             dark:hover:bg-slate-800
             transition
           "
         >
          <td className="px-6 py-4 font-semibold text-gray-900">{tag.name}</td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    {tag.group ? (
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                        {tag.group}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteClick(tag)}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 flex items-center gap-2 justify-center mx-auto"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && <CreateTagModal />}
    </div>
  );
}
