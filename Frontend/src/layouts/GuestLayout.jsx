import Navbar from "../components/navbar";

function GuestLayout({ children }) {
  return (
    <div className="min-h-screen w-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-amber-50">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default GuestLayout;
