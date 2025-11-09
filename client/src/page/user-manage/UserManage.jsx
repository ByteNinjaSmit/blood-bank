import React, { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Filters from "./components/Filters";
import ActionMenu from "./components/ActionMenu";
import { checkAccess } from "./utils/access";
import { statusChipClass } from "./utils/ui";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { ModuleArray, RoleArray } from "@/atoms/static";
import { 
  Search as SearchIcon,
  Plus,
  Eye,
  Edit as EditIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  RefreshCcw,
  Filter as FilterIcon,
  Check,
  XCircle,
  Ban,
  PauseCircle,
  MoreHorizontal,
  ChevronDown
} from "lucide-react";

const emptyPerm = () => (
  ModuleArray.map((m) => ({ moduleName: m, view: false, create: false, update: false, delete: false }))
);

const initialForm = {
  publicId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "viewer",
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

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/users`, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });
      setUsers(res.data.data || []);
    } catch (e) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (id, action, confirmText) => {
    if (!confirm(confirmText)) return;
    try {
      await axios.post(`${API}/api/admin/users/${id}/${action}` , {}, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });
      toast.success(`User ${action}d`);
      loadUsers();
    } catch (e) {
      toast.error(e?.response?.data?.message || `Failed to ${action}`);
    }
  };

  const statusChipClass = (status) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'pending': return 'bg-amber-500';
      case 'blocked': return 'bg-red-600';
      case 'rejected': return 'bg-rose-600';
      case 'inactive': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

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

  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, total);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => {
    // reset to first page when filters change
    setPage(1);
  }, [search, roleFilter, statusFilter, rowsPerPage]);

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
      role: u.role || "viewer",
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

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    try {
      setLoading(true);
      const payload = {
        publicId: form.publicId,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        role: form.role,
        password: form.password,
        status: form.status,
        permissions: form.permissions,
      };
      if (editingId) {
        await axios.patch(`${API}/api/admin/users/${editingId}`, payload, {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        });
        toast.success("User updated");
      } else {
        await axios.post(`${API}/api/admin/users`, payload, {
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

  const onDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await axios.delete(`${API}/api/admin/users/${id}`, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });
      toast.success("User deleted");
      loadUsers();
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <Header onRefresh={loadUsers} onNew={openCreate} canCreate={canCreate} />

      <Filters
        search={search}
        onSearch={setSearch}
        roleFilter={roleFilter}
        onRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        rowsPerPage={rowsPerPage}
        onRowsPerPage={setRowsPerPage}
        total={total}
        startIndex={startIndex}
        endIndex={endIndex}
        RoleArray={RoleArray}
      />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto overflow-y-visible relative">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left">Public ID</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedUsers.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2">{u.publicId}</td>
                  <td className="px-3 py-2">{u?.name?.first} {u?.name?.last}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.phone}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-white capitalize ${statusChipClass(u.status)}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <ActionMenu
                      row={u}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      canView={canView}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      onView={(row)=>setViewUser(row)}
                      onEdit={(row)=>openEdit(row)}
                      onApprove={(row)=>setStatus(row._id,'approve','Approve this user?')}
                      onReject={(row)=>setStatus(row._id,'reject','Reject this user?')}
                      onBlock={(row)=>setStatus(row._id,'block','Block this user? They will be unable to login.')}
                      onDeactivate={(row)=>setStatus(row._id,'deactivate','Deactivate this user?')}
                      onDelete={(row)=>onDelete(row._id)}
                    />
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">{loading ? 'Loading...' : 'No users found'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="mt-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-sm text-slate-600">Page {currentPage} of {totalPages}</div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <button
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50/60">
              <div className="font-semibold text-slate-800">{editingId ? 'Edit User' : 'Create User'}</div>
              <button onClick={() => setShowModal(false)} className="px-2 py-1 rounded-md border hover:bg-slate-50">Close</button>
            </div>
            <form onSubmit={onSubmit} className="p-4 md:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-600">Public ID</label>
                  <input className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={form.publicId} onChange={(e)=>setForm(v=>({...v, publicId:e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-slate-600">First Name</label>
                  <input required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={form.firstName} onChange={(e)=>setForm(v=>({...v, firstName:e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-slate-600">Last Name</label>
                  <input required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={form.lastName} onChange={(e)=>setForm(v=>({...v, lastName:e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-slate-600">Email</label>
                  <input type="email" required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={form.email} onChange={(e)=>setForm(v=>({...v, email:e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-slate-600">Phone</label>
                  <input className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={form.phone} onChange={(e)=>setForm(v=>({...v, phone:e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-slate-600">Role</label>
                  <select className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={form.role} onChange={(e)=>setForm(v=>({...v, role:e.target.value}))}>
                    {RoleArray.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600">Status</label>
                  <select className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300 capitalize" value={form.status} onChange={(e)=>setForm(v=>({...v, status:e.target.value}))}>
                    <option value="pending">pending</option>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="blocked">blocked</option>
                    <option value="rejected">rejected</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600">Password {editingId ? '(leave blank to keep unchanged)' : ''}</label>
                  <input type="password" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={form.password} onChange={(e)=>setForm(v=>({...v, password:e.target.value}))} />
                </div>
              </div>

              <div className="mt-2">
                <div className="font-medium mb-2 text-slate-800">Permissions</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border rounded-lg overflow-hidden">
                    <thead className="bg-slate-50/80">
                      <tr>
                        <th className="px-3 py-2 text-left">Module</th>
                        <th className="px-3 py-2 text-center">All</th>
                        <th className="px-3 py-2 text-center">View</th>
                        <th className="px-3 py-2 text-center">Create</th>
                        <th className="px-3 py-2 text-center">Update</th>
                        <th className="px-3 py-2 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {form.permissions.map((p) => (
                        <tr key={p.moduleName} className="hover:bg-slate-50/60">
                          <td className="px-3 py-2">{p.moduleName}</td>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={p.view && p.create && p.update && p.delete} onChange={(e)=>setAllForModule(p.moduleName, e.target.checked)} />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={p.view} onChange={(e)=>setPerm(p.moduleName, 'view', e.target.checked)} />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={p.create} onChange={(e)=>setPerm(p.moduleName, 'create', e.target.checked)} />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={p.update} onChange={(e)=>setPerm(p.moduleName, 'update', e.target.checked)} />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={p.delete} onChange={(e)=>setPerm(p.moduleName, 'delete', e.target.checked)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className="px-3 py-2 rounded-md border hover:bg-slate-50">Cancel</button>
                <button disabled={loading} type="submit" className="px-3 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 disabled:opacity-50 shadow-sm">{editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50/60">
              <div className="font-semibold text-slate-800">User Details</div>
              <button onClick={() => setViewUser(null)} className="px-2 py-1 rounded-md border hover:bg-slate-50">Close</button>
            </div>
            <div className="p-4 md:p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Public ID:</span> <span className="font-medium">{viewUser.publicId}</span></div>
                <div><span className="text-slate-500">Name:</span> <span className="font-medium">{viewUser?.name?.first} {viewUser?.name?.last}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="font-medium">{viewUser.email}</span></div>
                <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{viewUser.phone}</span></div>
                <div className="capitalize"><span className="text-slate-500">Role:</span> <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 ml-1">{viewUser.role}</span></div>
                <div className="capitalize"><span className="text-slate-500">Status:</span> <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-white ml-1 ${viewUser.status === 'active' ? 'bg-green-600' : 'bg-slate-500'}`}>{viewUser.status}</span></div>
                <div><span className="text-slate-500">Last Login:</span> <span className="font-medium">{viewUser.lastLoginAt ? new Date(viewUser.lastLoginAt).toLocaleString() : '-'}</span></div>
              </div>
              <div>
                <div className="font-medium mb-2 text-slate-800">Permissions</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border rounded-lg overflow-hidden">
                    <thead className="bg-slate-50/80">
                      <tr>
                        <th className="px-2 py-1 text-left">Module</th>
                        <th className="px-2 py-1 text-center">View</th>
                        <th className="px-2 py-1 text-center">Create</th>
                        <th className="px-2 py-1 text-center">Update</th>
                        <th className="px-2 py-1 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(viewUser.permissions || []).map(p => (
                        <tr key={p.moduleName} className="hover:bg-slate-50/60">
                          <td className="px-2 py-1">{p.moduleName}</td>
                          <td className="px-2 py-1 text-center">{p.view ? '✔' : '—'}</td>
                          <td className="px-2 py-1 text-center">{p.create ? '✔' : '—'}</td>
                          <td className="px-2 py-1 text-center">{p.update ? '✔' : '—'}</td>
                          <td className="px-2 py-1 text-center">{p.delete ? '✔' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
