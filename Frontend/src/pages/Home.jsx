import { Link } from "wouter";

const Home = () => {
  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-400 to-indigo-500">
              SHDPIXEL
            </span>
            <br />
            Digital Masterpieces.
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Experience the pinnacle of digital craftsmanship. Our collection blends cutting-edge technology with timeless design.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/products">
              <button className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-blue-400 hover:text-white transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl shadow-white/5">
                Explore Collection
              </button>
            </Link>
            <Link to="/about">
              <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-all duration-300 transform hover:scale-105 active:scale-95">
                Our Story
              </button>
            </Link>
          </div>
        </div>

        {/* Featured Preview */}
        <div className="mt-32 relative group">
          <div className="absolute inset-0 bg-blue-600/20 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="glass-card p-2 rounded-3xl overflow-hidden border border-white/10 relative">
            <img 
              src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2000" 
              alt="Technology Preview" 
              className="w-full h-auto rounded-2xl object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
