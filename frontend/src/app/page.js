
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 text-gray-800">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center text-green-600 mb-4">
          🌱 EcoSync Dashboard
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Platform Manajemen Bank Sampah Digital & Komunitas Hijau
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/login"
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
            Login Warga / Admin
          </a>
        </div>
      </div>
    </main>
  );
}