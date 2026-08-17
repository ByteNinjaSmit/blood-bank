import React, { useState } from "react"
import { Edit, Plus, X, UserPlus } from "lucide-react"
import { createFormEnterNavHandlers } from "@/hooks/useFormEnterNav"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const CampEditModal = ({
  open,
  camp,
  form,
  errors,
  saving,
  onChange,
  onAddVolunteer,
  onRemoveVolunteer,
  onClose,
  onSubmit,
}) => {
  const [volInput, setVolInput] = useState("")

  if (!open || !camp) return null

  const handleAddVol = (e) => {
    if (e) e.preventDefault()
    const trimmed = volInput.trim()
    if (!trimmed) return
    if (onAddVolunteer) {
      onAddVolunteer(trimmed)
    }
    setVolInput("")
  }

  const volunteersList = form?.volunteers || []

  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers()

  return (
    <Dialog open={open && !!camp} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="flex-row items-center gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50 space-y-0">
          <div className="w-10 h-10 rounded-xl bg-orange-800 flex items-center justify-center shrink-0">
            <Edit className="w-5 h-5 text-white" />
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold text-slate-900">Edit Camp</DialogTitle>
            <p className="text-xs text-slate-500">Update camp details and assigned staff</p>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Camp Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-700 ${
                  errors.name ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="Enter camp name"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Address *</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-700 ${
                  errors.address ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="Full address"
              />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-700 min-h-[80px]"
              placeholder="Brief description of the camp"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Phone *</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-700 ${
                  errors.phone ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="10-digit phone number"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-700 ${
                  errors.email ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="contact@example.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Start Date *</label>
              <input
                type="datetime-local"
                name="dateFrom"
                value={form.dateFrom}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-700 ${
                  errors.dateFrom ? "border-red-500" : "border-slate-300"
                }`}
              />
              {errors.dateFrom && <p className="text-xs text-red-500 mt-1">{errors.dateFrom}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">End Date *</label>
              <input
                type="datetime-local"
                name="dateTo"
                value={form.dateTo}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-700 ${
                  errors.dateTo ? "border-red-500" : "border-slate-300"
                }`}
              />
              {errors.dateTo && <p className="text-xs text-red-500 mt-1">{errors.dateTo}</p>}
            </div>
          </div>

          {/* Camp Staff — fully manual entry */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <label className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-orange-800" />
              Staff Names
            </label>
            <p className="text-[11px] text-slate-400 -mt-2">Type in the names of everyone assigned to this camp.</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={volInput}
                onChange={(e) => setVolInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddVol()
                  }
                }}
                placeholder="Enter name (e.g. Priya Patel - NGO)"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-700"
              />
              <button
                type="button"
                onClick={handleAddVol}
                className="px-4 py-2 bg-orange-800 hover:bg-orange-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {volunteersList.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {volunteersList.map((vol, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-50 border border-orange-200 text-orange-900 text-xs font-medium"
                  >
                    <span>{vol}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveVolunteer && onRemoveVolunteer(idx)}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-orange-700 hover:bg-orange-200 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No staff added yet.</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg text-white bg-orange-800 hover:bg-orange-900 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? "Saving changes..." : "Save changes"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CampEditModal
