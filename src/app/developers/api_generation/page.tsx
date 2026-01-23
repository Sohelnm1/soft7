"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Key, Copy, Check, Phone, ArrowLeft, Trash2, Edit, Eye, EyeOff } from "lucide-react";

export default function ApiGenerationPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [apiSaved, setApiSaved] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  const phoneNumbers = [
    { number: "15557634672", id: "69845027747878223" },
    { number: "+84947048403", id: "69915526668785" },
  ];

  const generateApiKey = () => {
    const randomKey = `wapi_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`;
    setApiKey(randomKey);
    setApiSaved(false);
    setSelectedPhones([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePhoneSelection = (number: string) => {
    setSelectedPhones(prev => 
      prev.includes(number) 
        ? prev.filter(n => n !== number)
        : [...prev, number]
    );
  };

  const maskApiKey = (key: string) => {
    if (!key) return "";
    const visibleChars = 4;
    const lastChars = key.slice(-visibleChars);
    const maskedPart = "*".repeat(Math.max(0, key.length - visibleChars));
    return maskedPart + lastChars;
  };

  const saveApiKey = () => {
    if (selectedPhones.length > 0) {
      setApiSaved(true);
      setIsEditing(false);
      setShowApiKey(false);
      // Here you would typically make an API call to save the configuration
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset selections to saved state if needed
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    setApiKey("");
    setApiSaved(false);
    setSelectedPhones([]);
    setIsEditing(false);
    setShowApiKey(false);
  };

  const saveChanges = () => {
    setApiSaved(true);
    setIsEditing(false);
    setShowApiKey(false);
    // Here you would typically make an API call to update the configuration
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/developers")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Developer Resources</span>
          </button>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            WhatsApp Messaging API
          </h1>
          <p className="text-gray-600">
            Generate and manage your API key for WhatsApp messaging integration (Only one API key allowed per account)
          </p>
        </div>

        {/* Alert for existing API key */}
        {apiSaved && !isEditing && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">i</span>
            </div>
            <p className="text-blue-800 text-sm">
              You already have an active API key. To generate a new one, you must first delete the existing key.
            </p>
          </div>
        )}

        {/* Generate API Key Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Generate API Key</h2>
          </div>
          <p className="text-gray-600 mb-6">
            {apiSaved && !isEditing
              ? "You can only have one API key at a time. Delete your existing key to generate a new one."
              : "Create a new API key for WhatsApp messaging services"}
          </p>
          
          <button
            onClick={generateApiKey}
            disabled={apiSaved && !isEditing}
            className={`px-6 py-3 font-medium rounded-xl shadow-md transition-all duration-300 flex items-center gap-2 ${
              apiSaved && !isEditing
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-xl hover:from-orange-600 hover:to-orange-700"
            }`}
          >
            <Key className="w-5 h-5" />
            {apiSaved && !isEditing ? "API Key Already Exists" : "Generate New API Key"}
          </button>

          {apiKey && !apiSaved && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Generated API Key</span>
                <span className="text-xs text-green-600">Please save it securely as you won't be able to see it again</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-green-300">
                <code className="flex-1 text-sm font-mono text-gray-800 break-all">
                  {apiKey}
                </code>
                <button
                  onClick={() => copyToClipboard(apiKey)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Associate Phone Numbers Section */}
        {apiKey && (!apiSaved || isEditing) && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Phone className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Associate Phone Numbers</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Select which phone numbers to associate with this API key
            </p>

            <div className="space-y-4 mb-6">
              {phoneNumbers.map((phone, idx) => (
                <div
                  key={idx}
                  onClick={() => togglePhoneSelection(phone.number)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    selectedPhones.includes(phone.number)
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      selectedPhones.includes(phone.number)
                        ? "border-orange-500 bg-orange-500"
                        : "border-gray-300"
                    }`}>
                      {selectedPhones.includes(phone.number) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">
                        {phone.number}
                      </div>
                      <div className="text-sm text-gray-500">
                        Phone ID: {phone.id}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedPhones.length} of {phoneNumbers.length} phone numbers selected
              </p>
              <div className="flex gap-3">
                {isEditing && (
                  <button
                    onClick={handleCancelEdit}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={isEditing ? saveChanges : saveApiKey}
                  disabled={selectedPhones.length === 0}
                  className={`px-6 py-3 font-medium rounded-xl shadow-md transition-all duration-300 flex items-center gap-2 ${
                    selectedPhones.length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-xl hover:from-orange-600 hover:to-orange-700"
                  }`}
                >
                  <Check className="w-5 h-5" />
                  {isEditing ? "Save Changes" : "Save API Key"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Your API Key Section */}
        {apiSaved && !isEditing && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Key className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Your API Key</h2>
                </div>
                <p className="text-gray-600">
                  Manage your current API key and associated phone numbers
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Phone Numbers
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete API Key
                </button>
              </div>
            </div>

            <div className="bg-gray-50 border-l-4 border-orange-500 rounded-lg p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-gray-700" />
                    <span className="font-semibold text-gray-900">Your API Key:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Active
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title={showApiKey ? "Hide API Key" : "Show API Key"}
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4 text-gray-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(apiKey)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Copy API Key"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg text-sm font-mono break-all">
                  {showApiKey ? apiKey : maskApiKey(apiKey)}
                </code>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-gray-700" />
                    <span className="font-semibold text-gray-900">Associated Phone Numbers:</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {phoneNumbers
                    .filter(phone => selectedPhones.includes(phone.number))
                    .map((phone, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="font-semibold text-gray-900 text-lg mb-1">
                          {phone.number}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>Phone ID:</span>
                          <span className="font-mono">{phone.id}</span>
                          <button
                            onClick={() => copyToClipboard(phone.id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Created: {new Date().toLocaleString('en-US', { 
                  month: '2-digit', 
                  day: '2-digit', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Delete API Key</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this API key? This action cannot be undone and will immediately revoke access for all associated phone numbers.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}