"use client";

import { Upload, X, AlertCircle, ArrowRight } from 'lucide-react';
import { parsePhoneNumberWithError } from 'libphonenumber-js';
import React, { useState, useRef } from 'react';

const normalize = (value: string) =>
  value.toLowerCase().replace(/\s+/g, "").trim();

interface ImportContactsProps {
  onImportSuccess: () => void;
  onClose: () => void;
}

interface ValidationError {
  rowIndex: number;
  field: string;
  error: string;
  level?: "error" | "warning";
}
const parseLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
};

const ImportContacts: React.FC<ImportContactsProps> = ({ onImportSuccess, onClose }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string | null>>({});

  const [validationResults, setValidationResults] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [skipValidation, setSkipValidation] = useState(false);
  const handleMappingChange = (dbField: string, csvHeader: string) => {
    setFieldMappings((prev) => ({
      ...prev,
      [dbField]: csvHeader || null,
    }));
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
  
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload a valid CSV file");
      return;
    }
  
    setFile(selectedFile);
  
    const reader = new FileReader();
  
    reader.onload = () => {
      const text = reader.result as string;
  
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) return;
  
      const headers = parseLine(lines[0]);
      setCsvHeaders(headers);
  
      const data = lines.slice(1).map((line) => {
        const values = parseLine(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => (row[h] = values[i] || ""));
        return row;
      });
  
      setCsvData(data);
  
      // 🔗 AUTO-MAP HEADERS → DB FIELDS
      const normalize = (v: string) =>
        v.toLowerCase().replace(/\s+/g, "").trim();
  
      const autoMappings: Record<string, string | null> = {};
  
      dbFields.forEach((field) => {
        autoMappings[field.value] = null;
  
        const matchedHeader = headers.find(
          (h) =>
            normalize(h) === normalize(field.label) ||
            normalize(h) === normalize(field.value)
        );
  
        if (matchedHeader) {
          autoMappings[field.value] = matchedHeader;
        }
      });
  
      setFieldMappings(autoMappings);
      setStep(2); // move to mapping step
    };
  
    reader.readAsText(selectedFile);
  };
  
  const emailVerificationCache = useRef<
  Record<string, { isValid: boolean; error?: string }>
>({});
const dbFields = [
  { value: 'phone', label: 'Phone', type: 'PHONE', required: true },
  { value: 'name', label: 'Name', type: 'TEXT', required: true },
  { value: 'email', label: 'Email', type: 'EMAIL', required: false },
  { value: 'status', label: 'Status', type: 'SELECT', required: false },
  { value: 'source', label: 'Source', type: 'TEXT', required: false },
  { value: 'tags', label: 'Tags', type: 'TEXT', required: false },
  { value: 'assignedTo', label: 'Assigned To', type: 'TEXT', required: false },
  { value: 'wabaPhone', label: 'WABA Phone Number', type: 'TEXT', required: false },
  { value: 'interiorDesign', label: 'Interior Design', type: 'TEXT', required: false },
  { value: 'name1', label: 'Name 1', type: 'TEXT', required: false },
  { value: 'test', label: 'Test', type: 'TEXT', required: false },
  { value: 'allowDuplicate', label: 'Allow Duplicate', type: 'BOOLEAN', required: false }
];

const validateData = async () => {
  setIsProcessing(true);

  try {
    const response = await fetch("/api/contacts", {
      method: "GET",
      credentials: "include",
    });

    const existingContacts = response.ok ? await response.json() : [];

    const existingPhones = new Set(
      existingContacts
        .map((contact: any) => {
          if (!contact.phone) return null;
          try {
            const phoneNumber = parsePhoneNumberWithError(contact.phone, "IN");
            return phoneNumber.number;
          } catch {
            return contact.phone.replace(/\D/g, "");
          }
        })
        .filter(Boolean)
    );

    let duplicateNumbers = 0;
    let invalidEmails = 0;
    let invalidTextFields = 0;
    const invalidNumbers = 0;

    const errors: ValidationError[] = [];
    const phoneNumbers = new Set<string>();

    // 🔁 VALIDATE ROWS
    for (let index = 0; index < csvData.length; index++) {
      const row = csvData[index];

      // ✅ NAME IS MANDATORY
      const nameHeader = fieldMappings["name"];
      const nameValue = nameHeader ? row[nameHeader]?.trim() : "";

      if (!nameValue) {
        invalidTextFields++;
        errors.push({
          rowIndex: index,
          field: "name",
          error: "Name is required",
          level:"error",
        });
        continue; // ⛔ STOP validating this row
      }
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
  
    // 🔒 HARD BLOCK NON-CSV (extension + MIME)
    if (
      !selectedFile.name.toLowerCase().endsWith(".csv") &&
      selectedFile.type !== "text/csv"
    ) {
      alert("❌ Only CSV files are allowed");
      resetFile(e);
      return;
    }
  
    // 📦 OPTIONAL: size guard (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("❌ CSV file must be less than 10MB");
      resetFile(e);
      return;
    }
  
    console.log("📁 CSV selected:", selectedFile.name);
  
    setFile(selectedFile);
  
    // 🔥 Single responsibility → parsing & binary checks happen inside parseCSV
    parseCSV(selectedFile);
  };
  
  const resetFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = ""; // allows re-selecting same file
    setFile(null);
  };
  
  const parseCSV = (file: File) => {
    // 1️⃣ Final extension guard
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("❌ Only CSV files are allowed");
      return;
    }
  
    const reader = new FileReader();
  
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer.slice(0, 4));
  
      // 🚫 BLOCK PDF
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        alert("❌ PDF files are not allowed");
        return;
      }
  
      // 🚫 BLOCK ZIP / XLSX
      if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
        alert("❌ Excel files are not allowed");
        return;
      }
  
      // ✅ SAFE CSV → decode text
      const text = new TextDecoder("utf-8").decode(buffer);
      const lines = text.split("\n").filter(line => line.trim());
  
      if (!lines.length) {
        alert("❌ CSV file is empty");
        return;
      }
  
      // CSV parser (supports quotes)
      const parseLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
  
        for (const char of line) {
          if (char === '"') inQuotes = !inQuotes;
          else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else current += char;
        }
  
        result.push(current.trim());
        return result;
      };
  
      const headers = parseLine(lines[0]);
      setCsvHeaders(headers);
      
      const data = lines.slice(1).map((line) => {
        const values = parseLine(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => (row[h] = values[i] || ""));
        return row;
      });
      
      setCsvData(data);
      
      // 🔗 Auto-map headers (FIXED VERSION)
      const normalize = (v: string) =>
        v.toLowerCase().replace(/\s+/g, "").trim();
      
      // ✅ initialize ALL db fields as null
      const autoMappings: Record<string, string | null> = {};
      
      dbFields.forEach((field) => {
        autoMappings[field.value] = null;
      
        const matchedHeader = headers.find(
          (h) =>
            normalize(h) === normalize(field.label) ||
            normalize(h) === normalize(field.value)
        );
      
        if (matchedHeader) {
          autoMappings[field.value] = matchedHeader;
        }
      });
      
      // ✅ apply mappings
      setFieldMappings(autoMappings);
      
      // ✅ always move to mapping step
      setStep(2);
      
    };
    reader.onerror = () => {
      alert("❌ Failed to read CSV file");
    };
  
    reader.readAsArrayBuffer(file);
  };
  
  
  
      
    

  const handleMappingChange = (dbField: string, csvHeader: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [dbField]: csvHeader
    }));
  };

  const validateEmail = (email: string): boolean => {
    // Comprehensive email validation regex
    
    const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    return emailRegex.test(email);
  };

  const verifyEmailWithAPI = async (
  email: string
): Promise<{ isValid: boolean; error?: string }> => {
  try {
    const response = await fetch(`/api/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        isValid: false,
        error: data.error || "Email verification failed",
      };
    }

    // Full verification result
    return {
      isValid: data.isValid,
      error: data.raw?.reason,
    };
  } catch (error) {
    console.error("Email verification failed:", error);
    return { isValid: true }; // fail-open for safety
  }
};

      // 📞 PHONE (OPTIONAL)
      const phoneHeader = fieldMappings["phone"];
      if (phoneHeader) {
        const phoneValue = row[phoneHeader]?.trim();

        if (phoneValue) {
          try {
            const phoneNumber = parsePhoneNumberWithError(phoneValue, "IN");
            const internationalNumber = phoneNumber.number;

            if (existingPhones.has(internationalNumber)) {
              duplicateNumbers++;
              errors.push({
                rowIndex: index,
                field: "phone",
                error: "Phone number already exists in database",
                
              });
            } else if (phoneNumbers.has(internationalNumber)) {
              duplicateNumbers++;
              errors.push({
                rowIndex: index,
                field: "phone",
                error: "Duplicate phone number in CSV",
              });
            } else {
              phoneNumbers.add(internationalNumber);
            }
          } catch {
            let phoneWarnings=0;
            phoneWarnings++;
            errors.push({
              rowIndex: index,
              field: "phone",
              error: "Invalid phone number format",
              level: "warning", // 👈 IMPORTANT
            });
             
          }
        }
      }

      // 📧 EMAIL (OPTIONAL)
      const emailHeader = fieldMappings["email"];
      if (emailHeader) {
        const emailValue = row[emailHeader]?.trim();
        if (emailValue) {
          const isValidEmailFormat = validateEmail(emailValue);
          if (!isValidEmailFormat) {
            invalidEmails++;
            errors.push({
              rowIndex: index,
              field: "email",
              error: "Invalid email format",
              level:"warning",
            });
          } else {
            let apiVerification = emailVerificationCache.current[emailValue];

            if (!apiVerification) {
              apiVerification = await verifyEmailWithAPI(emailValue);
              emailVerificationCache.current[emailValue] = apiVerification;
            }
            
          }
        }
      }
    }

  // ✅ only NAME errors should make a row invalid
const nameErrorRowIndexes = new Set(
  errors
    .filter((e) => e.field === "name")
    .map((e) => e.rowIndex)
);

const validEntries = csvData.length - nameErrorRowIndexes.size;

setValidationErrors(errors);

setValidationResults({
  duplicateNumbers,          // warnings
  invalidEmails,             // warnings
  invalidTextFields,         // name-related
  invalidNumbers,            // warnings (can rename later)
  validEntries,
  totalEntries: csvData.length,
  hasErrors: nameErrorRowIndexes.size > 0, // 🔥 ONLY NAME BLOCKS
});


    setIsProcessing(false);
    setStep(3);
  } catch (error) {
    console.error("Validation failed:", error);
    setIsProcessing(false);
    setStep(3);
  }
};

      
    const handleImport = async () => {
      console.log("🔥 IMPORT BUTTON CLICKED");
    
      if (!file) {
        alert("Please select a CSV file before importing.");
        return;
      }
    
      if (!file.name.toLowerCase().endsWith(".csv")) {
        alert("Only CSV files are accepted.");
        return;
      }
    
      if (validationResults.hasErrors && !skipValidation) {
        alert("Please fix validation errors or skip validation to proceed");
        return;
      }
    
      setIsProcessing(true);
    
      try {
        const errorRowIndices = new Set(
          validationErrors.map(e => e.rowIndex)
        );
    
        const dataToImport = skipValidation
          ? csvData.filter((_, index) => !errorRowIndices.has(index))
          : csvData;
    
        // ✅ NEW STEP: detect at least one DB field mapped
        const hasAtLeastOneDbFieldMapped = Object.values(fieldMappings)
          .some((csvHeader) => Boolean(csvHeader));
    
        if (!hasAtLeastOneDbFieldMapped) {
          setIsProcessing(false);
          alert(
            "No database fields matched in the uploaded CSV. Please upload a valid contacts CSV."
          );
          return;
        }
    
        // ✅ EXISTING LOGIC (KEEP AS-IS)
        const contacts = dataToImport.map(row => {
          const mapped: any = {};
    
          // ONLY iterate DB fields
          Object.entries(fieldMappings).forEach(([dbField, csvHeader]) => {
            if (!csvHeader) {
              mapped[dbField] = null; // unmapped → NULL
              return;
            }
    
            let value = row[csvHeader]?.trim();
    
            if (dbField === "phone" && value) {
              value = value.replace(/\D/g, "");
            }
    
            mapped[dbField] = value || null;
          });
    
          return mapped;
        });
    
        console.log("📤 Sending contacts to backend:", contacts.length);
        console.log("📦 Payload preview:", contacts);

        const res = await fetch("/api/contacts/import", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contacts,
            allowDuplicate: skipValidation,
            countryCode: "+91"
          })
        });
    
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Import failed");
        }
    
        
await res.json();

// ✅ simple & clear success message
alert("Contact imported successfully");

// optional UX improvements
setStep(1);          // reset wizard
setFile(null);       // clear file
setCsvData([]);      // clear data
onClose?.(); 
    
        onImportSuccess();
        onClose();
    
      } catch (error) {
        console.error("❌ Import failed:", error);
        setIsProcessing(false);
      }
    };
    
  
  const resetAndClose = () => {
    setStep(1);
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setFieldMappings({});
    setValidationResults(null);
    setValidationErrors([]);
    setSkipValidation(false);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Import Contacts</h1>
              <div className="flex items-center gap-4 sm:gap-8 text-xs sm:text-sm">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-orange-500' : 'text-gray-500'}`}>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm ${step >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-700'}`}>
                    {step > 1 ? '✓' : '1'}
                  </div>
                  <span className="hidden sm:inline">Upload CSV</span>
                  <span className="sm:hidden">Upload</span>
                </div>
                <div className="w-12 sm:w-24 h-0.5 bg-gray-700"></div>
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-orange-500' : 'text-gray-500'}`}>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm ${step >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-700'}`}>
                    {step > 2 ? '✓' : '2'}
                  </div>
                  <span className="hidden sm:inline">Map Headers</span>
                  <span className="sm:hidden">Map</span>
                </div>
                <div className="w-12 sm:w-24 h-0.5 bg-gray-700"></div>
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-orange-500' : 'text-gray-500'}`}>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm ${step >= 3 ? 'bg-orange-500 text-white' : 'bg-gray-700'}`}>
                    3
                  </div>
                  <span>Verify</span>
                </div>
              </div>
            </div>
            <button onClick={resetAndClose} className="text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition">
              <X size={24} />
            </button>
          </div>

          {/* Step 1: Upload CSV */}
          {step === 1 && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 sm:p-8">
 <div
  className="
    flex items-start gap-4 mb-6 p-4
    rounded-xl border
    bg-white text-gray-900 border-yellow-200
    dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700
  "
>
  <AlertCircle
    className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1"
    size={20}
  />

  <div className="text-sm">
    <p className="font-semibold mb-2">
      Import Instructions 💡
    </p>
    <p className="leading-relaxed">
      Maximum file size allowed 10MB. Headers must match existing contact fields.
    </p>
  </div>
</div>



              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 sm:p-12 text-center hover:border-orange-500 dark:hover:border-orange-500 transition-colors cursor-pointer"
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Upload size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Drag & Drop CSV file</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">Maximum file size allowed 10MB</p>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">OR</p>
                    <button className="px-6 py-2 bg-gray-700 dark:bg-gray-600 rounded-xl hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors text-white font-medium">
                      Click anywhere inside the dashed box to browse files
                    </button>
                  </div>
                </div>
  
                <input
  id="fileInput"
  type="file"
  accept=".csv"
  className="hidden"
  onClick={(e) => {
    // 🔥 allows re-selecting same file
    (e.target as HTMLInputElement).value = "";
  }}
  onChange={(e) => {
    console.log("🔥 INPUT onChange FIRED");
    handleFileUpload(e);
  }}
/>



              </div>


              {file && (
                <div className="mt-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-between">
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{file.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Map Headers */}
          {step === 2 && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Map CSV Headers to Database Fields</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Match your CSV columns with the corresponding database fields</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 font-semibold text-sm text-gray-600 dark:text-gray-400 pb-2 border-b border-gray-300 dark:border-gray-700">
                  <div>Column</div>
                  <div>CSV Headers</div>
                  <div>Type</div>
                </div>

                {dbFields.map((field, index) => {
                  return (
                    <div key={index} className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </div>
                      <div>
                        <select
                          value={fieldMappings[field.value] || ''}
                          onChange={(e) => handleMappingChange(field.value, e.target.value)}
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Select Header</option>
                          {csvHeaders.map(header => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{field.type}</div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={validateData}
                  disabled={!fieldMappings['name'] || isProcessing}

                  className="px-6 py-2 bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white font-medium shadow-lg"
                >
                  {isProcessing ? 'Validating...' : 'Verify Data'}
                  {!isProcessing && <ArrowRight size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Verify */}
          {step === 3 && validationResults && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Validation Summary</h2>
                <p className="text-sm">
                  <span className="text-green-600 dark:text-green-500 font-semibold">{validationResults.validEntries} contacts validated successfully</span>
                  {validationResults.totalEntries - validationResults.validEntries > 0 && (
                    <>, <span className="text-red-600 dark:text-red-500 font-semibold">{validationResults.totalEntries - validationResults.validEntries} require attention</span></>
                  )}
                </p>
              </div>

              {validationResults.hasErrors && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Please review and correct the validation issues or skip them to import only valid contacts.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className={`rounded-xl p-6 ${
                  validationResults.duplicateNumbers > 0 
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700' 
                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Duplicate Contact Numbers</h3>
                    <AlertCircle size={20} className={validationResults.duplicateNumbers > 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{validationResults.duplicateNumbers}</p>
                </div>

                <div className={`rounded-xl p-6 ${
                  validationResults.invalidEmails > 0 
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700' 
                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Invalid Email Addresses</h3>
                    <AlertCircle size={20} className={validationResults.invalidEmails > 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{validationResults.invalidEmails}</p>
                </div>

                <div className={`rounded-xl p-6 ${
                  validationResults.invalidTextFields > 0 
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700' 
                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Invalid Text Fields</h3>
                    <AlertCircle size={20} className={validationResults.invalidTextFields > 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{validationResults.invalidTextFields}</p>
                </div>

                <div className={`rounded-xl p-6 ${
                  validationResults.invalidNumbers > 0 
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700' 
                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Invalid Contact Numbers</h3>
                    <AlertCircle size={20} className={validationResults.invalidNumbers > 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{validationResults.invalidNumbers}</p>
                </div>
              </div>

              {validationResults.hasErrors && (
                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl p-4 mb-6">
                  <button 
                    onClick={() => setSkipValidation(!skipValidation)}
                    className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 font-medium"
                  >
                    <input 
                      type="checkbox" 
                      checked={skipValidation}
                      onChange={() => setSkipValidation(!skipValidation)}
                      className="rounded"
                    />
                    Skip Validation Issues (Import only {validationResults.validEntries} valid contacts)
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-green-600 dark:text-green-500 font-medium">Valid Entries: {validationResults.validEntries}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-red-600 dark:text-red-500 font-medium">Validation Issues: {validationResults.totalEntries - validationResults.validEntries}</span>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 sm:flex-none px-6 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 font-medium"
                  >
                    Back
                  </button>
                  <button
  type="button"   // 🔥 THIS LINE FIXES THE ISSUE
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleImport();
  }}
  disabled={isProcessing || (validationResults.hasErrors && !skipValidation)}
  className="flex-1 sm:flex-none px-6 py-2 bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white font-medium shadow-lg"
>

                    {isProcessing ? 'Importing...' : `Import ${skipValidation ? validationResults.validEntries : validationResults.totalEntries} Contacts`}
                    {!isProcessing && <ArrowRight size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ImportContacts;

