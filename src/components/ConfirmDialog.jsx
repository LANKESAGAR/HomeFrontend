export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = "Delete" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 my-auto max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-clay-900">{title}</h3>
        <p className="mt-2 text-sm text-clay-600 break-words">{message}</p>
        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium rounded-lg text-clay-700 hover:bg-sand-100 w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
