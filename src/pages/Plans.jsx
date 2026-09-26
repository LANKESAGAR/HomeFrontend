import { useEffect, useState, useCallback, useMemo } from "react";
import { getDocuments, uploadDocument, deleteDocument } from "../api/documents";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { formatFileSize, formatDateTime } from "../utils/format";
import { colorForIndex } from "../utils/categoryColors";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.webp";

const CATEGORIES = [
  { value: "BUILDING_PLAN", label: "Building Plan" },
  { value: "STRUCTURAL_PLAN", label: "Structural Plan" },
  { value: "INTERIOR_DESIGN", label: "Interior Design" },
  { value: "LAYOUT_PLAN", label: "Layout Plan" },
  { value: "OTHER", label: "Other" },
];

const CATEGORY_COLOR_MAP = CATEGORIES.reduce((map, cat, idx) => {
  map[cat.value] = colorForIndex(idx);
  return map;
}, {});

function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

const emptyForm = {
  file: null,
  title: "",
  category: CATEGORIES[0].value,
  notes: "",
};

function isImageType(fileType) {
  return typeof fileType === "string" && fileType.startsWith("image/");
}

function PdfIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" {...props}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 17v-4h1.2a1 1 0 0 1 0 2H8.5m4-2v4m0-4h1.3a1 1 0 0 1 1.2 1v.5a1 1 0 0 1-1.2 1H12.5m4-2v4m0-2.2h1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" {...props}>
      <path d="M12 16V4m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Plans() {
  const { name } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDocuments(filterCategory || undefined);
      setDocuments(data);
    } catch (err) {
      setError("Could not load plans. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFileChange(e) {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, file }));
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateFile(file) {
    if (!file) return "Please choose a file to upload.";
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Only PDF, PNG, JPEG, and WEBP files are supported.";
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return "File is too large. Maximum size is 20MB.";
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Please enter a title.");
      return;
    }
    const fileError = validateFile(form.file);
    if (fileError) {
      setFormError(fileError);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      await uploadDocument(
        {
          file: form.file,
          title: form.title.trim(),
          category: form.category,
          uploadedBy: name || "Unknown",
          notes: form.notes.trim(),
        },
        (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
          }
        }
      );
      setForm(emptyForm);
      const fileInput = document.getElementById("plan-file-input");
      if (fileInput) fileInput.value = "";
      load();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Could not upload the file. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteTarget(null);
      setError("Could not delete the document. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  const filterTabs = useMemo(() => [{ value: "", label: "All" }, ...CATEGORIES], []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-clay-900">Plans</h1>
        <p className="text-sm text-clay-500 mt-0.5">
          Building, structural, interior design, and layout plans in one place
        </p>
      </div>

      {/* Upload card */}
      <div className="bg-white rounded-xl border border-sand-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-clay-900">Upload a plan</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-clay-600 mb-1">File (PDF, PNG, JPEG, WEBP, max 20MB)</label>
            <input
              id="plan-file-input"
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileChange}
              className="w-full text-sm text-clay-700 file:mr-3 file:rounded-lg file:border-0 file:bg-terracotta-600 file:text-white file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-terracotta-700 file:cursor-pointer cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g. Ground Floor Layout - Rev 2"
                className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-clay-600 mb-1">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={2}
              placeholder="e.g. Approved by architect on site visit"
              className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          {uploading && uploadProgress > 0 && (
            <div className="w-full h-2 bg-sand-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-terracotta-600 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-medium px-4 py-2.5 transition-colors shadow-sm disabled:opacity-60"
            >
              <UploadIcon className="w-4 h-4" />
              {uploading ? `Uploading${uploadProgress ? ` ${uploadProgress}%` : "..."}` : "Upload Plan"}
            </button>
          </div>
        </form>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterCategory(tab.value)}
            className={`text-sm font-medium rounded-lg px-3.5 py-2 transition-colors ${
              filterCategory === tab.value
                ? "bg-terracotta-600 text-white"
                : "bg-white border border-sand-200 text-clay-700 hover:bg-sand-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Documents grid */}
      {loading ? (
        <div className="text-center py-16 text-clay-500">Loading plans...</div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-sand-200 p-10 text-center text-clay-400 text-sm">
          No plans uploaded yet. Add your first one above.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden flex flex-col">
              <div className="h-40 bg-sand-100 flex items-center justify-center overflow-hidden">
                {isImageType(doc.fileType) ? (
                  <img src={doc.fileUrl} alt={doc.title} className="w-full h-full object-cover" />
                ) : (
                  <PdfIcon className="w-12 h-12 text-clay-400" />
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-clay-900 truncate" title={doc.title}>{doc.title}</h3>
                </div>
                <span
                  className="mt-2 inline-flex self-start items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
                  style={{ backgroundColor: CATEGORY_COLOR_MAP[doc.category] || "#8a7965" }}
                >
                  {categoryLabel(doc.category)}
                </span>
                <p className="mt-2 text-xs text-clay-500">Uploaded by {doc.uploadedBy}</p>
                <p className="text-xs text-clay-500">{formatDateTime(doc.uploadedAt)}</p>
                <p className="text-xs text-clay-400 mt-0.5">{formatFileSize(doc.fileSizeBytes)}</p>
                {doc.notes && <p className="mt-2 text-xs text-clay-500 line-clamp-2" title={doc.notes}>{doc.notes}</p>}

                <div className="mt-auto pt-3 flex items-center gap-3">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-terracotta-600 hover:underline"
                  >
                    View
                  </a>
                  <button
                    onClick={() => setDeleteTarget(doc)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this plan?"
        message={deleteTarget ? `This will permanently remove "${deleteTarget.title}".` : ""}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
      />
    </div>
  );
}
