import React, { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Filters from "./components/Filters";
import UsersTable from "./components/UsersTable";
import CreateUserForm from "./components/CreateUserForm";
import ViewUserModal from "./components/ViewUserModal";
import Pagination from "./components/Pagination";
import CustomModal from "@/components/CustomModal";
import ReasonForChangeModal from "@/components/shared/ReasonForChangeModal";
import { useEditWithReason } from "@/hooks/useEditWithReason";
import { checkAccess } from "./utils/access";
import { statusChipClass } from "./utils/ui";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { ModuleArray, RoleArray } from "@/atoms/static";

const emptyPerm = () => (
  ModuleArray.map((m) => ({ moduleName: m, view: false, create: false, update: false, delete: false }))
);

const initialForm = {
  publicId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "auditor",
  password: "",
  status: "active",
  permissions: emptyPerm(),
};

export default function UserManage() {
  const { API, authorizationToken, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmModal, setConfirmModal] = useState({ open: false });
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/v2/user?limit=1000`, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });
      setUsers((res.data.data || []).map(u => ({ ...u, _id: u.id || u._id })));
      setSelectedIds(new Set());
    } catch (e) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (id, action) => {
    const actionMap = {
      approve: 'active',
      reject: 'rejected',
      block: 'blocked',
      deactivate: 'inactive',
    };
    const mappedStatus = actionMap[action] || action;
    try {
      await axios.put(`${API}/api/v2/user/${id}`, { status: mappedStatus }, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });
      toast.success(`User status updated to ${mappedStatus}`);
      loadUsers();
    } catch (e) {
      toast.error(e?.response?.data?.message || `Failed to update status`);
    }
  };

  // using imported statusChipClass from utils/ui

  useEffect(() => { loadUsers(); }, [API, authorizationToken]);

  // Derived filtered & paginated data
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      const matchesQuery = !q ||
        (u.publicId || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        (`${u?.name?.first || ""} ${u?.name?.last || ""}`.trim().toLowerCase().includes(q));
      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesStatus = !statusFilter || u.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") {
        cmp = `${a?.name?.first || ""} ${a?.name?.last || ""}`.localeCompare(`${b?.name?.first || ""} ${b?.name?.last || ""}`);
      } else if (sortBy === "createdAt") {
        cmp = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      } else if (sortBy === "role") {
        cmp = (a.role || "").localeCompare(b.role || "");
      }
      return order === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filteredUsers, sortBy, order]);

  const total = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, total);
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  useEffect(() => {
    // reset to first page when filters change
    setPage(1);
    setSelectedIds(new Set());
  }, [search, roleFilter, statusFilter, sortBy, order, rowsPerPage]);

  const { isAdmin, canView, canCreate, canUpdate, canDelete } = checkAccess(user);

  const openCreate = () => {
    if (!canCreate) { toast.error('You do not have permission to create users'); return; }
    setEditingId(null);
    setForm({ ...initialForm, publicId: generatePublicId() });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingId(u._id);
    const f = {
      publicId: u.publicId || "",
      firstName: u?.name?.first || "",
      lastName: u?.name?.last || "",
      email: u.email || "",
      phone: u.phone || "",
      role: u.role || "auditor",
      password: "",
      status: u.status || "active",
      permissions: mergePermissions(u.permissions || []),
    };
    setForm(f);
    setShowModal(true);
  };

  const mergePermissions = (existing) => {
    const map = new Map(existing.map(p => [String(p.moduleName).toLowerCase(), p]));
    return ModuleArray.map(m => {
      const k = m.toLowerCase();
      const p = map.get(k);
      return p ? { moduleName: m, view: !!p.view, create: !!p.create, update: !!p.update, delete: !!p.delete } : { moduleName: m, view: false, create: false, update: false, delete: false };
    });
  };

  const generatePublicId = () => {
    const now = new Date();
    const y = now.getFullYear();
    const rnd = Math.floor(Math.random() * 9000) + 1000;
    return `USR-${y}-${rnd}`;
  };

  const setPerm = (moduleName, key, val) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) =>
        p.moduleName === moduleName ? { ...p, [key]: val } : p
      ),
    }));
  };

  const setAllForModule = (moduleName, val) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) =>
        p.moduleName === moduleName ? { ...p, view: val, create: val, update: val, delete: val } : p
      ),
    }));
  };

  const saveUser = async (payload, editReason) => {
    try {
      setLoading(true);
      if (editingId) {
        await axios.put(`${API}/api/v2/user/${editingId}`, { ...payload, _editReason: editReason }, {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        });
        toast.success("User updated");
      } else {
        await axios.post(`${API}/api/v2/user`, { ...payload, password: payload.password || "default123" }, {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        });
        toast.success("User created");
      }
      setShowModal(false);
      setForm(initialForm);
      setEditingId(null);
      loadUsers();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  // Edit-Reason is mandatory when editing an existing user; creating a
  // brand-new user has nothing to justify a "change" for, so it skips
  // the dialog entirely.
  const { wrappedSave: wrappedSaveUser, EditReasonDialog: userEditReasonDialog } = useEditWithReason({
    onSave: saveUser,
    skip: !editingId,
    title: "Confirm User Changes",
  });

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      role: form.role,
      password: form.password || undefined,
      status: form.status,
      permissions: form.permissions,
    };
    wrappedSaveUser(payload);
  };

  const onDelete = async (id, reason) => {
    try {
      await axios.delete(`${API}/api/v2/user/${id}`, {
        data: { reason },
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });
      toast.success("User deactivated");
      loadUsers();
    } catch (e) {
      toast.error("Deactivation failed");
    }
  };

  const confirmDeactivate = async (reason) => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await onDelete(deactivateTarget, reason);
    } finally {
      setDeactivating(false);
      setDeactivateTarget(null);
    }
  };

  const bulkSetStatus = async (action) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) { toast.error('No users selected'); return; }
    const actionMap = {
      approve: 'active',
      reject: 'rejected',
      block: 'blocked',
      deactivate: 'inactive',
    };
    const mappedStatus = actionMap[action] || action;
    let ok = 0, fail = 0;
    for (const id of ids) {
      try {
        await axios.put(`${API}/api/v2/user/${id}`, { status: mappedStatus }, {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        });
        ok++;
      } catch (_) {
        fail++;
      }
    }
    if (ok) toast.success(`Status updated for ${ok} user(s)`);
    if (fail) toast.error(`Failed to update status for ${fail} user(s)`);
    loadUsers();
  };

  const openConfirm = ({ title, description, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'primary', confirmVariant, onConfirm }) => {
    const v = confirmVariant || variant || 'primary';
    setConfirmModal({ open: true, title, description, confirmText, cancelText, variant: v, onConfirm });
  };
  const closeConfirm = () => setConfirmModal({ open: false });

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <Header onRefresh={loadUsers} onNew={openCreate} canCreate={canCreate} isRefreshing={loading} />

      <Filters
        search={search}
        onSearch={setSearch}
        roleFilter={roleFilter}
        onRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        sortBy={sortBy}
        onSortBy={setSortBy}
        order={order}
        onOrder={setOrder}
        rowsPerPage={rowsPerPage}
        onRowsPerPage={setRowsPerPage}
        total={total}
        startIndex={startIndex}
        endIndex={endIndex}
        RoleArray={RoleArray}
      />

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="px-2.5 py-1.5 rounded-md border disabled:opacity-50"
          disabled={selectedIds.size===0}
          onClick={()=>openConfirm({
            title: 'Approve Users',
            description: `Approve ${selectedIds.size} selected user(s)?`,
            confirmText: 'Approve',
            onConfirm: () => { closeConfirm(); bulkSetStatus('approve'); }
          })}
        >Approve</button>
        <button
          className="px-2.5 py-1.5 rounded-md border disabled:opacity-50"
          disabled={selectedIds.size===0}
          onClick={()=>openConfirm({
            title: 'Reject Users',
            description: `Reject ${selectedIds.size} selected user(s)?`,
            confirmText: 'Reject',
            variant: 'danger',
            onConfirm: () => { closeConfirm(); bulkSetStatus('reject'); }
          })}
        >Reject</button>
        <button
          className="px-2.5 py-1.5 rounded-md border disabled:opacity-50"
          disabled={selectedIds.size===0}
          onClick={()=>openConfirm({
            title: 'Block Users',
            description: `Block ${selectedIds.size} selected user(s)? They will be unable to login.`,
            confirmText: 'Block',
            variant: 'danger',
            onConfirm: () => { closeConfirm(); bulkSetStatus('block'); }
          })}
        >Block</button>
        <button
          className="px-2.5 py-1.5 rounded-md border disabled:opacity-50"
          disabled={selectedIds.size===0}
          onClick={()=>openConfirm({
            title: 'Deactivate Users',
            description: `Deactivate ${selectedIds.size} selected user(s)?`,
            confirmText: 'Deactivate',
            onConfirm: () => { closeConfirm(); bulkSetStatus('deactivate'); }
          })}
        >Deactivate</button>
        {selectedIds.size > 0 && <span className="text-sm text-slate-500">Selected: {selectedIds.size}</span>}
      </div>

      <UsersTable
        users={paginatedUsers}
        canView={canView}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onView={(row)=>setViewUser(row)}
        onEdit={(row)=>openEdit(row)}
        onApprove={(row)=>openConfirm({ title:'Approve User', description:'Approve this user?', confirmText:'Approve', onConfirm:()=>{ closeConfirm(); setStatus(row._id,'approve'); }})}
        onReject={(row)=>openConfirm({ title:'Reject User', description:'Reject this user?', confirmText:'Reject', confirmVariant:'danger', onConfirm:()=>{ closeConfirm(); setStatus(row._id,'reject'); }})}
        onBlock={(row)=>openConfirm({ title:'Block User', description:'Block this user? They will be unable to login.', confirmText:'Block', confirmVariant:'danger', onConfirm:()=>{ closeConfirm(); setStatus(row._id,'block'); }})}
        onDeactivate={(row)=>openConfirm({ title:'Deactivate User', description:'Deactivate this user?', confirmText:'Deactivate', onConfirm:()=>{ closeConfirm(); setStatus(row._id,'deactivate'); }})}
        onDelete={(row)=>setDeactivateTarget(row._id)}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        statusChipClass={statusChipClass}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={() => setPage(p => Math.max(1, p - 1))}
        onNext={() => setPage(p => Math.min(totalPages, p + 1))}
      />

      {showModal && (
        <CreateUserForm
          form={form}
          setForm={setForm}
          editingId={editingId}
          RoleArray={RoleArray}
          loading={loading}
          onSubmit={onSubmit}
          onCancel={() => setShowModal(false)}
          setPerm={setPerm}
          setAllForModule={setAllForModule}
        />
      )}

      {/* View Modal */}
      {viewUser && (
        <ViewUserModal user={viewUser} onClose={() => setViewUser(null)} />
      )}

      <CustomModal
        open={!!confirmModal.open}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        confirmVariant={confirmModal.variant}
        onCancel={closeConfirm}
        onConfirm={confirmModal.onConfirm}
      />

      <ReasonForChangeModal
        isOpen={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={confirmDeactivate}
        title="Deactivate User"
        actionLabel="Deactivate"
        message="This user will no longer be able to log in. This action is logged to the audit trail."
        fieldLabel="Reason for Deactivation"
        submitting={deactivating}
      />
      {userEditReasonDialog}
    </div>
  );
}
