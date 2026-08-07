"use client"

import React, { useEffect, useState, useMemo } from "react"
import { Plus, Eye, Edit, Trash2, Filter, X, Search, ChevronDown, MapPin, Users, Phone, Calendar, ArrowUpDown, FileSpreadsheet, RefreshCw } from "lucide-react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { toast } from "sonner"

import Loader from "@/components/utils/Spinner"
import { PageHeader } from "@/components/Header"
import CampEditModal from "./CampEditModal"
import { campApi } from "../api"
import ReasonForChangeModal from "@/components/shared/ReasonForChangeModal"
import { useCamp } from "@/hooks/useCamp"
import { useAuth } from "@/store/auth"
import { useEditWithReason } from "@/hooks/useEditWithReason"
import { exportCampsExcel } from "@/features/camp/campExcelExport"

const CampList = () => {
  const { camps, loading, fetchCamps, updateCamp, deleteCamp } = useCamp()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Camp-Registration lands here first (so the list is one back-step away),
  // then we immediately forward into the just-created camp's detail view.
  useEffect(() => {
    const openCampId = location.state?.openCampId
    if (openCampId) {
      // Scrub the state off this history entry first, so pressing Back later
      // from the detail page lands here without re-triggering the redirect.
      navigate(location.pathname, { replace: true, state: null })
      navigate(`/camp-details?id=${openCampId}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sortBy, setSortBy] = useState("dateFrom")
  const [order, setOrder] = useState("desc")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const toggleOrder = () => setOrder((o) => (o === "desc" ? "asc" : "desc"))

  const handleExportExcel = () => {
    const generatedBy = user?.name ? [user.name.first, user.name.last].filter(Boolean).join(' ') : (user?.username || 'System User')
    exportCampsExcel(filteredCamps, generatedBy)
    toast.success('Camp report downloaded successfully!')
  }

  const [staffList, setStaffList] = useState([])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingCamp, setEditingCamp] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editErrors, setEditErrors] = useState({})
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    dateFrom: "",
    dateTo: "",
  })

  React.useEffect(() => {
    fetchCamps()
    getStaffNames()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getStaffNames = async () => {
    try {
      const list = await campApi.staffList()
      setStaffList(list || [])
    } catch (error) {
      console.error("Error fetching staff list:", error)
    }
  }

  const getProgressStatus = (camp) => {
    if (!camp.dateFrom || !camp.dateTo) return "N/A"
    const now = new Date()
    const start = new Date(camp.dateFrom)
    const end = new Date(camp.dateTo)
    if (now < start) return "Upcoming"
    if (now >= start && now <= end) return "Ongoing"
    return "Completed"
  }

  const filteredCamps = useMemo(() => {
    const filtered = camps.filter((camp) => {
      const matchesSearch =
        (camp.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (camp.campId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (camp.description || "").toLowerCase().includes(searchTerm.toLowerCase())

      const status = getProgressStatus(camp)
      const matchesStatus = statusFilter === "all" || status === statusFilter

      const matchesFrom = !fromDate || (camp.dateFrom && new Date(camp.dateFrom) >= new Date(fromDate))
      const matchesTo = !toDate || (camp.dateFrom && new Date(camp.dateFrom) <= new Date(`${toDate}T23:59:59`))

      return matchesSearch && matchesStatus && matchesFrom && matchesTo
    })

    filtered.sort((a, b) => {
      let cmp = 0
      if (sortBy === "dateFrom") cmp = new Date(a.dateFrom || 0) - new Date(b.dateFrom || 0)
      else if (sortBy === "name") cmp = (a.name || "").localeCompare(b.name || "")
      return order === "asc" ? cmp : -cmp
    })

    return filtered
  }, [camps, searchTerm, statusFilter, fromDate, toDate, sortBy, order])

  const handleDelete = (camp) => {
    setDeleteTarget(camp)
    setShowDeleteModal(true)
  }

  // Soft-delete only — the camp moves off this list into the Recycle Bin,
  // where it can be restored or permanently deleted.
  const handleDeleteConfirm = async (reason) => {
    if (!deleteTarget) return
    await deleteCamp(deleteTarget._id, reason)
    setShowDeleteModal(false)
    setDeleteTarget(null)
  }

  const getStatusBadge = (status) => {
    const styles = {
      Upcoming: "bg-blue-100 text-blue-800 border border-blue-300",
      Ongoing: "bg-green-100 text-green-800 border border-green-300",
      Completed: "bg-gray-100 text-gray-800 border border-gray-300",
      "N/A": "bg-slate-100 text-slate-800 border border-slate-300",
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles["N/A"]}`}>
        {status}
      </span>
    )
  }

  const openEdit = (camp) => {
    setEditingCamp(camp)
    setEditForm({
      name: camp.name || "",
      description: camp.description || "",
      address: camp.address || "",
      phone: camp.contactInfo?.phone || "",
      email: camp.contactInfo?.email || "",
      dateFrom: camp.dateFrom ? new Date(new Date(camp.dateFrom).getTime() - new Date(camp.dateFrom).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
      dateTo: camp.dateTo ? new Date(new Date(camp.dateTo).getTime() - new Date(camp.dateTo).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
      volunteers: camp.volunteers || [],
    })
    setEditErrors({})
    setEditModalOpen(true)
  }

  const closeEdit = () => {
    if (editSaving) return
    setEditModalOpen(false)
    setEditingCamp(null)
    setEditErrors({})
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddVolunteerInEdit = (name) => {
    if (!name) return
    setEditForm((prev) => ({
      ...prev,
      volunteers: prev.volunteers?.includes(name) ? prev.volunteers : [...(prev.volunteers || []), name],
    }))
  }

  const handleRemoveVolunteerInEdit = (idxToRemove) => {
    setEditForm((prev) => ({
      ...prev,
      volunteers: (prev.volunteers || []).filter((_, idx) => idx !== idxToRemove),
    }))
  }

  const validateEditForm = () => {
    const errs = {}

    if (!editForm.name.trim()) errs.name = "Camp name is required"
    if (!editForm.address.trim()) errs.address = "Address is required"
    if (!editForm.phone.trim()) errs.phone = "Phone is required"
    if (!editForm.dateFrom) errs.dateFrom = "Start date is required"
    if (!editForm.dateTo) errs.dateTo = "End date is required"

    if (editForm.email && !/\S+@\S+\.\S+/.test(editForm.email)) {
      errs.email = "Email format is invalid"
    }

    const phoneRegex = /^\d{10}$/
    if (editForm.phone && !phoneRegex.test(editForm.phone)) {
      errs.phone = "Phone format should be 10 digits"
    }

    if (editForm.dateFrom && editForm.dateTo && new Date(editForm.dateTo) < new Date(editForm.dateFrom)) {
      errs.dateTo = "End date cannot be earlier than start date"
    }

    setEditErrors(errs)
    return Object.keys(errs).length === 0
  }

  const { wrappedSave: wrappedSaveCamp, EditReasonDialog: campEditReasonDialog } = useEditWithReason({
    onSave: async (payload, editReason) => {
      setEditSaving(true)
      try {
        const { success } = await updateCamp(editingCamp._id, payload, editReason)
        if (success) {
          setEditModalOpen(false)
          setEditingCamp(null)
        }
      } finally {
        setEditSaving(false)
      }
    },
    title: "Confirm Camp Changes",
  })

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingCamp) return
    if (!validateEditForm()) return

    const payload = {
      name: editForm.name.trim(),
      description: editForm.description,
      address: editForm.address.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      volunteers: editForm.volunteers,
      dateFrom: editForm.dateFrom,
      dateTo: editForm.dateTo,
    }
    wrappedSaveCamp(payload)
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className="min-h-screen">
      {/* <PageHeader
        onBack={OnBack}
        icon={Plus}
        title="Blood Donation Camps"
        description="Manage and monitor all your blood donation camps"
        iconBgColor="bg-red-600"
        rightSection={
          <Link to={"/master-register/donor-creation"}>
            <button className="bg-orange-800 cursor-pointer hover:bg-red-900 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              New Camp
            </button>
          </Link>
        }
      /> */}
      <div className="py-8 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
            <MapPin className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blood Donation Camps</h1>
            <p className="text-gray-500 text-sm">All registered blood donation camps</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchCamps()}
            disabled={loading}
            title="Refresh"
            aria-label="Refresh"
            className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-white cursor-pointer hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-700" />
            Export to Excel
          </button>
          <Link to={"/camp-registration"}>
            <button className="bg-orange-800 cursor-pointer hover:bg-red-900 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              New Camp
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border cursor-pointer border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              <Filter className="w-4 h-4 text-orange-800" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700"
                >
                  <option value="dateFrom">Start Date</option>
                  <option value="name">Name</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={toggleOrder}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {order === "desc" ? "Newest First" : "Oldest First"}
                </button>
              </div>

              {(searchTerm || statusFilter !== "all" || fromDate || toDate) && (
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                    setFromDate("")
                    setToDate("")
                    setSortBy("dateFrom")
                    setOrder("desc")
                  }}
                  className="sm:col-span-2 lg:col-span-5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {filteredCamps.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 text-center py-16">
            <div className="text-slate-400 mb-2">
              <Filter className="w-12 h-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No camps found</h3>
            <p className="text-slate-600">Try adjusting your filters or create a new camp.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCamps.map((camp) => (
              <div
                key={camp._id}
                className="rounded-xl shadow-md border border-slate-200 transition-shadow overflow-hidden bg-white hover:shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-b border-slate-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-50 text-orange-700 border border-red-200">
                        {camp.campId || "N/A"}
                      </span>
                      {getStatusBadge(getProgressStatus(camp))}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{camp.name}</h3>
                    <p className="text-slate-600 text-sm mt-1">{camp.description}</p>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-orange-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Duration</p>
                      <p className="text-sm font-medium text-slate-900 mt-1">
                        {camp.dateFrom && camp.dateTo
                          ? `${new Date(camp.dateFrom).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} - ${new Date(camp.dateTo).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-orange-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</p>
                      <p className="text-sm font-medium text-slate-900 mt-1">{camp.contactInfo?.phone || "N/A"}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{camp.contactInfo?.email || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-orange-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff</p>
                      {camp.staff && camp.staff.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {camp.staff.slice(0, 3).map((member, index) => (
                            <span
                              key={member._id || index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200"
                            >
                              {member.name?.first || (typeof member.name === 'string' ? member.name : "Staff")}
                            </span>
                          ))}
                          {camp.staff.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">
                              +{camp.staff.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic mt-1">No staff assigned</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-orange-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Site</p>
                      <p className="text-sm font-medium text-slate-900 mt-1">{camp.campId || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                  <Link to={`/camp-details?id=${camp._id}`}>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors border border-blue-200"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEdit(camp)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg font-medium transition-colors border border-green-200"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(camp)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors border border-red-200"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}

            <div className="px-6 py-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-600 text-center">
              Showing <span className="font-semibold text-slate-900">{filteredCamps.length}</span> of{" "}
              <span className="font-semibold text-slate-900">{camps.length}</span> camps
            </div>
          </div>
        )}
      </div>
      <CampEditModal
        open={editModalOpen}
        camp={editingCamp}
        staffList={staffList}
        form={editForm}
        errors={editErrors}
        saving={editSaving}
        onChange={handleEditChange}
        onAddVolunteer={handleAddVolunteerInEdit}
        onRemoveVolunteer={handleRemoveVolunteerInEdit}
        onClose={closeEdit}
        onSubmit={handleEditSubmit}
      />

      {/* Delete confirmation — soft delete, moves the camp to the Recycle Bin */}
      <ReasonForChangeModal
        isOpen={showDeleteModal && !!deleteTarget}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTarget(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Camp"
        actionLabel="Delete"
        message={`Delete camp "${deleteTarget?.name || ""}"? It will be moved to the Recycle Bin, where it can be restored or permanently deleted.`}
        fieldLabel="Reason for Deletion"
      />
      {campEditReasonDialog}
    </div>
  )
}

export default CampList
