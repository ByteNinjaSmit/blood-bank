"use client"

import React from "react"
import { Edit, X } from "lucide-react"
import { createFormEnterNavHandlers } from "@/hooks/useFormEnterNav"

const CampEditModal = ({
  open,
  camp,
  staffList,
  form,
  errors,
  saving,
  onChange,
  onToggleStaff,
  onClose,
  onSubmit,
}) => {
  if (!open || !camp) return null

  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers()

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-3xl mx-4 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-800 flex items-center justify-center">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Edit Camp</h2>
              <p className="text-xs text-slate-500">Update camp details and staff assignment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Close edit"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange} className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
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
              <label className="block text-sm font-medium text-slate-700">Email *</label>
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Assign Staff</label>
            {staffList && staffList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {staffList.map((staff) => {
                  if (!staff || !staff._id || !staff.name) return null
                  const staffName = `${String(staff?.name?.first || "")} ${String(staff?.name?.last || "")}`
                  const isSelected = form.staff.includes(staff._id)

                  return (
                    <button
                      key={staff._id}
                      type="button"
                      onClick={() => onToggleStaff(staff._id)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-orange-100 text-orange-800 border-orange-400 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {staffName}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No staff members available to assign.</p>
            )}
            <p className="text-[11px] text-slate-400">Click on staff chips to toggle assignment for this camp.</p>
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
      </div>
    </div>
  )
}

export default CampEditModal
