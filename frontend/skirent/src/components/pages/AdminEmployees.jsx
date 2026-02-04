import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ShieldOff,
  ShieldCheck,
  ShieldAlert, // אייקון חדש עבור הקידום
  Eye,
  RefreshCw,
  Search,
  Filter,
  X,
} from "lucide-react";

import {
  getAdminUsers,
  blockUser,
  unblockUser,
  getUserActions,
} from "../../api/adminUsersApi";

export default function AdminEmployees() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // ✅ search & filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | blocked
  const [showFilters, setShowFilters] = useState(false);

  // actions modal
  const [actionsUser, setActionsUser] = useState(null);
  const [actions, setActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const s = search.trim().toLowerCase();

    return users.filter((u) => {
      const matchesSearch =
        !s || (u.username || "").toLowerCase().includes(s);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? u.is_active === true
          : u.is_active === false;

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const handlePromote = async (u) => {
    const ok = window.confirm(`Promote ${u.username} to ADMIN?`);
    if (!ok) return;

    try {
      setBusyId(u.id);
        const response = await fetch(`http://127.0.0.1:8000/admin/users/${u.id}/make-admin`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to promote");
      }

      toast.success("User promoted to Admin!");
      await loadUsers(); 
    } catch (e) {
      console.error("Error promoting:", e);
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleBlock = async (u) => {
    if (u.role === "admin") return;

    const ok = window.confirm(
      `Block ${u.username}? They won't be able to login.`
    );
    if (!ok) return;

    try {
      setBusyId(u.id);
      await blockUser(u.id);
      toast.success("User blocked");
      await loadUsers();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.detail || "Block failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleUnblock = async (u) => {
    if (u.role === "admin") return;

    try {
      setBusyId(u.id);
      await unblockUser(u.id);
      toast.success("User unblocked");
      await loadUsers();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.detail || "Unblock failed");
    } finally {
      setBusyId(null);
    }
  };

  const openActions = async (u) => {
    setActionsUser(u);
    setActions([]);
    setLoadingActions(true);

    try {
      const data = await getUserActions(u.id);
      setActions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load actions");
      setActions([]);
    } finally {
      setLoadingActions(false);
    }
  };

  const closeActions = () => {
    setActionsUser(null);
    setActions([]);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Employee Management
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Search employees, promote to admin, block/unblock, and view their actions.
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black transition"
          type="button"
        >
          <RefreshCw className="w-4 h-4 inline -mt-0.5 mr-2" />
          Refresh
        </button>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`px-4 py-2.5 rounded-lg border transition flex items-center gap-2 ${
              showFilters
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
            type="button"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "blocked", label: "Blocked" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
                  statusFilter === s.key
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
                type="button"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading users…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No users found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">Username</th>
                <th className="p-4 text-left">Role</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-semibold text-gray-900">
                    {u.username}
                  </td>

                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>

                  <td className="p-4">
                    {u.is_active ? (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        Blocked
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-gray-600">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="p-4 text-right space-x-2">
                    {/* 👁 view actions */}
                    <button
                      onClick={() => openActions(u)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold inline-flex items-center"
                      type="button"
                      title="View actions"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>

                  {u.role === "employee" && (
                    <button
                      disabled={busyId === u.id}
                      onClick={() => handlePromote(u)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-xs font-bold disabled:opacity-50 inline-flex items-center transition-colors"
                      type="button"
                      title="Promote to Admin"
                    >
                      <ShieldAlert className="w-4 h-4 mr-1" />
                      Promote
                    </button>
                  )}

                  {/* מציג כפתור חסימה/שחרור לכל מי שאינו אדמין (גם עובד וגם לקוח) */}
                  {u.role !== "admin" && (
                    <>
                      {u.is_active ? (
                        <button
                          disabled={busyId === u.id}
                          onClick={() => handleBlock(u)}
                          className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-bold disabled:opacity-50 inline-flex items-center"
                          type="button"
                          title="Block user"
                        >
                          <ShieldOff className="w-4 h-4 mr-1" />
                          Block
                        </button>
                      ) : (
                        <button
                          disabled={busyId === u.id}
                          onClick={() => handleUnblock(u)}
                          className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 text-xs font-bold disabled:opacity-50 inline-flex items-center"
                          type="button"
                          title="Unblock user"
                        >
                          <ShieldCheck className="w-4 h-4 mr-1" />
                          Unblock
                        </button>
                      )}
                    </>
                  )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Actions Modal */}
      {actionsUser && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && closeActions()}
        >
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div className="font-bold text-gray-900">
                Actions – {actionsUser.username}
              </div>
              <button
                onClick={closeActions}
                className="w-9 h-9 rounded-lg hover:bg-gray-200 flex items-center justify-center"
                type="button"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {loadingActions ? (
                <div className="text-gray-500 italic">Loading actions…</div>
              ) : actions.length === 0 ? (
                <div className="text-gray-500">No actions recorded for this user.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 font-medium">
                    <tr>
                      <th className="p-3">Action</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {actions.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-800">{a.action}</td>
                        <td className="p-3 text-gray-600">{a.qty ?? 0}</td>
                        <td className="p-3 text-gray-600">
                          {a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t text-right bg-gray-50">
              <button
                onClick={closeActions}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition font-medium"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}