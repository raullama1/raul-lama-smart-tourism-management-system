// client/src/pages/admin/AdminDashboardPage.jsx
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function AdminDashboardPage() {
  const { admin, logout } = useAdminAuth();

  return (
    <main className="min-h-screen bg-[#f6faf7] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome, {admin?.name || "Admin"}.
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Logout
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
            Admin side started successfully. You can now continue with the next admin screens.
          </div>
        </div>
      </div>
    </main>
  );
}