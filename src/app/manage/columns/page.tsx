"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Plus, Trash2, Search, Edit } from "lucide-react"; // Added Edit icon for better UX
import Link from "next/link";

// Define a type for columns for better clarity and type safety
interface Column {
  id: number;
  label: string;
  type: string;
  visible: boolean;
}

export default function ManageColumns() {
  const [columns, setColumns] = useState<Column[]>([]); // Using the defined interface
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true); // State for loading

  // Fetch columns from backend
  async function fetchColumns() {
    setIsLoading(true);
    try {
      // Simulating a slight delay for better UX on refresh
      await new Promise(resolve => setTimeout(resolve, 300));
      const res = await fetch("/api/columns");
      const data: Column[] = await res.json();
      setColumns(data);
    } catch (error) {
      console.error("Failed to fetch columns:", error);
      // Optionally set an error state here
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchColumns();
  }, []);

  // Delete
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this column?")) return;
    try {
      await fetch(`/api/columns/${id}`, { method: "DELETE" });
      // Optimistic UI update or re-fetch
      setColumns(columns.filter(col => col.id !== id));
      // Fallback re-fetch to ensure sync
      // fetchColumns();
    } catch (error) {
      console.error("Failed to delete column:", error);
    }
  };

  // Toggle visibility
  const toggleVisibility = async (id: number, current: boolean) => {
    try {
      // Optimistic UI update
      setColumns(
        columns.map(col =>
          col.id === id ? { ...col, visible: !current } : col
        )
      );

      await fetch(`/api/columns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !current }),
      });
      // A re-fetch might be safer but the optimistic update is smoother
      // fetchColumns();
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
      // Revert optimistic update on failure, or just re-fetch
      fetchColumns();
    }
  };

  const filteredColumns = columns.filter((col) =>
    col.label.toLowerCase().includes(search.toLowerCase())
  );
  
  // A helper function for a more stylish column type badge
  const getTypeBadge = (type: string) => {
      let colorClass = 'bg-gray-100 text-gray-700';
      switch (type.toLowerCase()) {
          case 'string':
          case 'text':
              colorClass = 'bg-blue-100 text-blue-700';
              break;
          case 'number':
          case 'integer':
          case 'float':
              colorClass = 'bg-green-100 text-green-700';
              break;
          case 'boolean':
              colorClass = 'bg-yellow-100 text-yellow-700';
              break;
          case 'date':
          case 'datetime':
              colorClass = 'bg-purple-100 text-purple-700';
              break;
          default:
              // Fallback is 'bg-gray-100 text-gray-700'
              break;
      }
      return (
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
              {type}
          </span>
      );
  };


  return (
    <div className="max-w-6xl mx-auto my-10 p-8 bg-white rounded-3xl shadow-xl border border-gray-50/70">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-gray-100">
        <div>
         <h2 className="flex items-center text-3xl font-extrabold text-gray-900 mb-1 gap-2">
  <span>Column Management</span>
  <span className="text-2xl">⚙️</span>
</h2>

          <p className="text-gray-600 text-sm">View, search, and configure your data table columns.</p>
        </div>
       <Link
  href="/manage/columns/create"
  className="flex items-center mt-4 md:mt-0 
             bg-orange-500 text-white px-5 py-2.5 rounded-xl 
             text-base font-semibold shadow-md transition-all duration-300 
             hover:bg-green-500 hover:shadow-green-400/50
             transform hover:scale-[1.03]"
>
  <Plus size={20} className="mr-2" /> Add New Column
</Link>


      </div>

     {/* Search and Filters (Enhanced Styling) */}
<div className="flex justify-start mb-6">
  <div className="relative w-full md:w-96">

    {/* Icon – always visible (Google-style) */}
    <Search
      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
    />

    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search column by name..."
      
      /* 🔥 Force spacing so placeholder & typed text never touch icon */
      style={{ paddingLeft: "3.2rem" }}   
      
      className={`
        w-full 
        pr-4
        h-12
        rounded-full
        border border-gray-300 
        shadow-sm 
        focus:ring-2 focus:ring-indigo-500/40 
        focus:border-indigo-500 
        text-sm 
        placeholder-gray-400
        outline-none 
        transition
      `}
    />
  </div>
</div>




      {/* Table Container (Enhanced Shadow and Border) */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
  <tr>
    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
      Column Name
    </th>
    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
      Data Type
    </th>
    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
      Visibility
    </th>
    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
      Actions
    </th>
  </tr>
</thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-lg text-indigo-500 font-medium">
                  Loading columns...
                </td>
              </tr>
            ) : filteredColumns.length > 0 ? (
              filteredColumns.map((col) => (
                <tr key={col.id} className="hover:bg-indigo-50/50 transition duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap text-center font-medium text-gray-900">
                    {col.label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getTypeBadge(col.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => toggleVisibility(col.id, col.visible)}
                      className={`p-2 rounded-full transition duration-200 ${
                        col.visible
                          ? "text-[var(--theme-color)] hover:bg-indigo-100"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      }`}
                      aria-label={col.visible ? "Hide column" : "Show column"}
                    >
                      {col.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center space-x-3">
                    {/* Placeholder for Edit functionality - better UX */}
                    <Link
                      href={`/manage/columns/edit/${col.id}`}
                      className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition duration-200"
                      aria-label="Edit column"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(col.id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition duration-200"
                      aria-label="Delete column"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-gray-600 py-10 text-sm font-medium"
                >
               {search ? (
  <div className="flex flex-col items-center justify-center py-6">
    <p className="text-gray-700 font-semibold">
      No results found for&nbsp;
      <span className="text-indigo-600">&quot;{search}&quot;</span>
    </p>
    <p className="text-gray-500 text-sm mt-1">
      Try a different name or reset the search.
    </p>
  </div>
) : (
  <div className="text-gray-600 text-sm font-medium py-6">
    No columns defined yet.
    <span className="text-indigo-600 font-semibold ml-1">
      Click &quot;Add New Column&quot;
    </span>
    to get started! 🚀
  </div>
)}

                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}