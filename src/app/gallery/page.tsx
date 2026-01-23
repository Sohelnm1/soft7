"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaTrash, FaPlus, FaCamera, FaUpload, FaTimes, FaTh, FaList, FaSpinner, FaFile } from "react-icons/fa"; // Added FaSpinner and FaFile

interface Media {
  id: number;
  name: string;
  fileName: string;
  type: string;
  size: string;
  url: string;
  createdAt: string;
}

// --- Component Start ---
export default function GalleryPage() {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Use "grid" as default, it's more visual for a gallery
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Fetch media (Logic kept intact)
  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/gallery/list");
      const data = await res.json();
      setMediaList(data);
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    // Clean name for input
    setPhotoName(selectedFile.name.split(".")[0].replace(/[^a-zA-Z0-9\s]/g, ""));
  };

  const handleUpload = async () => {
    if (!file || photoName.trim() === "") return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", photoName);

    setIsLoading(true);
    try {
      const res = await fetch("/api/gallery/upload", { method: "POST", body: formData });
      if (res.ok) {
        setFile(null);
        setPhotoName("");
        setShowModal(false);
        await fetchMedia();
      } else {
        console.error("Upload failed", await res.text());
        alert("Upload Failed. Please check the console.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) return;
    try {
      // Optimistic update for better UX
      setMediaList((prev) => prev.filter((m) => m.id !== id));

      const res = await fetch(`/api/gallery/delete/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // Re-fetch or revert if delete fails
        console.error("Failed to delete", await res.text());
        fetchMedia();
      }
    } catch (error) {
      console.error("Delete error:", error);
      fetchMedia();
    }
  };
  
  const closeModal = () => {
    setFile(null);
    setPhotoName("");
    setShowModal(false);
  };

  // --- Grid Item Component ---
  const GridMediaItem = ({ media }: { media: Media }) => {
    const isImage = media.type.startsWith("image");

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-black/30 hover:shadow-2xl hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/10 transition-all duration-300 overflow-hidden group border border-emerald-100 dark:border-emerald-800">
        <div className="relative h-32 w-full cursor-pointer overflow-hidden" onClick={() => window.open(media.url, "_blank")}>
          {isImage ? (
            <Image
              src={media.url}
              alt={media.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            // Unique design for non-image/video files
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 text-emerald-600 dark:text-emerald-300 text-4xl border-b border-emerald-200 dark:border-emerald-700">
              <FaFile className="drop-shadow-sm" />
            </div>
          )}
          {/* Enhanced Action Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/80 via-transparent to-transparent flex items-end justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 p-4">
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(media.id); }}
              className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 hover:rotate-12"
              title="Delete File"
            >
              <FaTrash className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-r from-white to-emerald-50/30 dark:from-gray-800 dark:to-emerald-900/10">
          <p className="font-semibold text-gray-800 dark:text-gray-100 truncate mb-2" title={media.name}>{media.name}</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">{media.size}</span>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full font-medium">
              {isImage ? 'Image' : 'File'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // --- Main Render ---
  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12 bg-gradient-to-br from-emerald-100 via-emerald-50 to-green-100 dark:from-emerald-900 dark:via-emerald-800 dark:to-green-900">
      <div className="max-w-7xl mx-auto">
        {/* Header with View Toggle and Add Button */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b-2 border-emerald-100 dark:border-emerald-900/40 pb-4">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-3 mb-4 sm:mb-0">
            <FaCamera className="text-emerald-600 dark:text-emerald-300" /> Gallery
          </h1>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-full shadow-inner">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-full transition ${viewMode === "grid" ? "bg-emerald-600 text-white shadow" : "text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"}`}
                title="Grid View"
              >
                <FaTh />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-full transition ${viewMode === "table" ? "bg-emerald-600 text-white shadow" : "text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"}`}
                title="List View"
              >
                <FaList />
              </button>
            </div>
            {/* Add File Button */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center bg-emerald-600 text-white px-5 py-2.5 rounded-lg shadow-lg hover:bg-emerald-700 transition transform hover:scale-[1.02] font-semibold"
            >
              <FaPlus className="mr-2" /> Add File
            </button>
          </div>
        </header>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="animate-spin w-8 h-8 text-emerald-600 dark:text-emerald-300" />
            <p className="ml-3 text-lg text-emerald-600 dark:text-emerald-300 font-medium">Loading media...</p>
          </div>
        )}

        {/* Content Area */}
        {!isLoading && (
          <>
            {/* Grid View Implementation */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {mediaList.map((media) => (
                  <GridMediaItem key={media.id} media={media} />
                ))}
                {mediaList.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 px-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800 dark:to-emerald-700 flex items-center justify-center shadow-xl mb-6">
                      <FaCamera className="w-10 h-10 text-emerald-600 dark:text-emerald-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Welcome to Your Gallery</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8 leading-relaxed">
                      Start building your media collection by uploading images and files. Your gallery will showcase all your content beautifully.
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-emerald-500/50"
                    >
                      <FaPlus className="mr-3 text-lg" />
                      Upload Your First Media
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Table View Implementation (More Detail-Oriented) */}
            {viewMode === "table" && (
              <div className="overflow-x-auto bg-gradient-to-br from-white via-emerald-50/30 to-white dark:from-gray-800 dark:via-emerald-900/10 dark:to-gray-800 shadow-2xl dark:shadow-black/50 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50 backdrop-blur-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 text-white uppercase text-xs font-bold shadow-lg">
                    <tr className="border-b border-emerald-500/30">
                      <th className="px-6 py-4 w-[80px] text-center">
                        <div className="flex items-center justify-center">
                          <FaCamera className="w-4 h-4 mr-2" />
                          Preview
                        </div>
                      </th>
                      <th className="px-6 py-4">
                        <div className="flex items-center">
                          <FaFile className="w-4 h-4 mr-2" />
                          File Name
                        </div>
                      </th>
                      <th className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-emerald-300 rounded-full mr-2"></span>
                          Type
                        </div>
                      </th>
                      <th className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex items-center">
                          <span className="text-xs">📏</span>
                          <span className="ml-2">Size</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex items-center">
                          <span className="text-xs">📅</span>
                          <span className="ml-2">Upload Date</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 w-[80px] text-center">
                        <div className="flex items-center justify-center">
                          <span className="text-xs">⚡</span>
                          <span className="ml-2">Action</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100 dark:divide-emerald-800/30">
                    {mediaList.map((media, index) => (
                      <tr key={media.id} className={`group hover:bg-transparent transition-all duration-300 ${index % 2 === 0 ? 'bg-white/50 dark:bg-gray-800/30' : 'bg-emerald-25/30 dark:bg-emerald-900/5'}`}>
                        <td className="px-6 py-4 text-center">
                          <div className="relative w-16 h-16 mx-auto rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 shadow-md group-hover:shadow-lg transition-all duration-300 border-2 border-white dark:border-gray-500 ring-2 ring-emerald-100 dark:ring-emerald-800">
                            {media.type && media.type.startsWith("image") ? (
                              <Image
                                src={media.url}
                                alt={media.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  // Fallback to file icon if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'flex items-center justify-center w-full h-full text-emerald-600 dark:text-emerald-300 text-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/50 dark:to-emerald-800/50';
                                    fallback.innerHTML = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg>';
                                    parent.innerHTML = '';
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : media.url && (media.url.includes('.jpg') || media.url.includes('.jpeg') || media.url.includes('.png') || media.url.includes('.gif') || media.url.includes('.webp') || media.url.includes('.bmp') || media.url.includes('.svg')) ? (
                              <Image
                                src={media.url}
                                alt={media.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  const parent = (e.target as HTMLImageElement).parentElement;
                                  if (parent) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'flex items-center justify-center w-full h-full text-emerald-600 dark:text-emerald-300 text-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/50 dark:to-emerald-800/50';
                                    fallback.innerHTML = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg>';
                                    parent.innerHTML = '';
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full text-emerald-600 dark:text-emerald-300 text-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/50 dark:to-emerald-800/50">
                                <FaFile className="drop-shadow-sm" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-200 truncate max-w-xs" title={media.name}>{media.name}</span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">#{media.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-600">
                            {media.type.split('/')[0].toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                            <span className="mr-1">💾</span>
                            {media.size}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                              {new Date(media.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: '2-digit'
                              })}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(media.createdAt).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDelete(media.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-110 hover:rotate-12 group-hover:shadow-red-500/50"
                            title="Delete File"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {mediaList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-20">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800 dark:to-emerald-700 flex items-center justify-center shadow-lg">
                              <FaCamera className="w-8 h-8 text-emerald-600 dark:text-emerald-300" />
                            </div>
                            <div className="text-center">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Media Files Yet</h3>
                              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                Your gallery is empty. Upload some images or files to get started with your media collection.
                              </p>
                            </div>
                            <button
                              onClick={() => setShowModal(true)}
                              className="mt-4 inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                              <FaPlus className="mr-2" />
                              Upload Your First File
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal (Refined) */}
      {showModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-900/80 via-gray-900/70 to-emerald-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl dark:shadow-black/50 w-full max-w-md transform scale-100 transition-all duration-300 border border-emerald-200 dark:border-emerald-700">
            <div className="flex justify-between items-center mb-6 border-b border-emerald-200 dark:border-emerald-700 pb-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <FaUpload className="mr-3 text-emerald-600 dark:text-emerald-300" /> Upload New File
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors p-1 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">File Name</label>
            <input
              type="text"
              value={photoName}
              onChange={(e) => setPhotoName(e.target.value)}
              placeholder="Enter a descriptive file name"
              className="w-full border border-gray-300 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 px-4 py-3 rounded-lg mb-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition"
            />

            <label className="block mb-4 font-medium text-gray-700 dark:text-gray-200">
              Select File
              <input type="file" onChange={handleFileChange} className="mt-2 block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 dark:file:bg-emerald-900/30 file:text-emerald-700 dark:file:text-emerald-300 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-800/40 cursor-pointer" />
            </label>
            
            {file && (
              <div className="text-sm text-emerald-700 dark:text-emerald-300 mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700 flex items-center shadow-sm">
                <FaFile className="mr-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium block">Selected:</span>
                  <span className="text-emerald-800 dark:text-emerald-200 truncate block" title={file.name}>{file.name}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-emerald-100 dark:border-emerald-700">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || photoName.trim() === "" || isLoading}
                className="flex items-center bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin w-4 h-4 mr-2" />
                ) : (
                  <FaUpload className="mr-2" />
                )}
                {isLoading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}