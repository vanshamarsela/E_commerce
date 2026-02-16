import Navbar from "../components/navbar";

function MainLayout({ children }) {
  return (
    <div className="min-h-screen relative selection:bg-blue-500/30">
      {/* Background elements */}
      <div className="lux-bg" />
      
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="glass-card p-1 sm:p-8 min-h-[70vh]">
          {children}
        </div>
      </main>

      {/* Decorative Blur Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] pointer-events-none" />
    </div>
  );
}

export default MainLayout;
