import Navbar from "../components/navbar";

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 min-h-[600px]">
          {children}
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
