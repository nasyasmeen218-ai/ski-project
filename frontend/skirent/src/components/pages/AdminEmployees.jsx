import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldOff, ShieldCheck, Eye } from "lucide-react";

import {
  getAdminUsers,
  blockUser,
  unblockUser,
} from "../../api/adminUsersApi";

export default function AdminEmployees() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      setUsers(data);
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

  const handleBlock = async (id) => {
    try {
      await blockUser(id);
      toast.success("User blocked");
      loadUsers();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.detail || "Block failed");
    }
  };

  const handleUnblock = async (id) => {
    try {
      await unblockUser(id);
      toast.success("User unblocked");
      loadUsers();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.detail || "Unblock failed");
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-600">Loading employees…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-1">View employees, block/unblock, and review actions</p>
        </div>
        <button
          onClick={loadUsers}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black transition"
          type="button"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-4">Username</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-4 font-medium text-gray-900">{u.username}</td>
                <td className="p-4 capitalize text-gray-700">{u.role}</td>
                <td className="p-4">
                  {u.is_active ? (
                    <span className="text-green-600 font-semibold">Active</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Blocked</span>
                  )}
                </td>

                <td className="p-4">
                  <div className="flex gap-2 justify-end">
                    {u.role !== "admin" && (
                      <>
                        {u.is_active ? (
                          <button
                            onClick={() => handleBlock(u.id)}
                            className="px-3 py-2 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                            type="button"
                          >
                            <ShieldOff className="w-4 h-4 inline -mt-0.5 mr-1" />
                            Block
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnblock(u.id)}
                            className="px-3 py-2 text-sm rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition"
                            type="button"
                          >
                            <ShieldCheck className="w-4 h-4 inline -mt-0.5 mr-1" />
                            Unblock
                          </button>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => toast.message(`Actions for ${u.username} (next step)`)}
                      className="px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
                      type="button"
                    >
                      <Eye className="w-4 h-4 inline -mt-0.5 mr-1" />
                      Actions
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={4}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
