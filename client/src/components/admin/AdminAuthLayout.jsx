// client/src/components/admin/AdminAuthLayout.jsx
export default function AdminAuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-[#e8f3ed] flex items-center justify-center px-4 py-10">
      {children}
    </main>
  );
}