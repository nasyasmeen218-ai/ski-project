import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ShieldOff,
  ShieldCheck,
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

export default function AdminCustomers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | blocked
  const [showFilters, setShowFilters] = useState(false);

  const [actionsUser, setActionsUser] = useState(null);
  const [actions, setActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      // ✅ רק לקוחות
      setUsers((Array.isArray(data) ? data : []).filter(u => u.role === "customer"));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load customers");
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

  const handleBlock = async (u) => {
    const ok = window.confirm(`Block ${u.username}?`);
    if (!ok) return;

    try {
      setBusyId(u.id);
      await blockUser(u.id);
      toast.success("Customer blocked");
      await loadUsers();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Block failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleUnblock = async (u) => {
    try {
      setBusyId(u.id);
      await unblockUser(u.id);
      toast.success("Customer unblocked");
      await loadUsers();
    } catch (e) {
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
    } catch {
      toast.error("Failed to load actions");
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-gray-600 text-sm">
            View, block/unblock customers and inspect activity
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white"
        >
          <RefreshCw className="inline w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow border p-4 mb-6">
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border"
            />
          </div>

          <button
            onClick={() => setShowFilters(v => !v)}
            className="px-4 py-2.5 rounded-lg border flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 flex gap-2">
            {["all", "active", "blocked"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  statusFilter === s
                    ? "bg-gray-900 text-white"
                    : "bg-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No customers found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">Username</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-semibold">{u.username}</td>

                  <td className="p-4">
                    {u.is_active ? "Active" : "Blocked"}
                  </td>

                  <td className="p-4 text-gray-600">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => openActions(u)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs"
                    >
                      <Eye className="inline w-4 h-4 mr-1" />
                      View
                    </button>

                    {u.is_active ? (
                      <button
                        disabled={busyId === u.id}
                        onClick={() => handleBlock(u)}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs"
                      >
                        <ShieldOff className="inline w-4 h-4 mr-1" />
                        Block
                      </button>
                    ) : (
                      <button
                        disabled={busyId === u.id}
                        onClick={() => handleUnblock(u)}
                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs"
                      >
                        <ShieldCheck className="inline w-4 h-4 mr-1" />
                        Unblock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Actions modal */}
      {actionsUser && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onMouseDown={(e) => e.target === e.currentTarget && closeActions()}
        >
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl">
            <div className="p-4 border-b flex justify-between">
              <div className="font-bold">Actions – {actionsUser.username}</div>
              <button onClick={closeActions}>
                <X />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {loadingActions ? (
                "Loading…"
              ) : actions.length === 0 ? (
                "No actions"
              ) : (
                actions.map((a) => (
                  <div key={a.id} className="border-b py-2 text-sm">
                    <b>{a.action}</b> · {a.qty ?? 0} ·{" "}
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
