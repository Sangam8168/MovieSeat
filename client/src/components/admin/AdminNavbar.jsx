import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";

const AdminNavbar = () => {
  return (
    <div className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-gray-300/30">
          <Link to='/' className='max-md:flex-1'>
        <div className="flex items-center space-x-3 group">
          {/* Movie clapper with animation */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-cyan-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative w-10 h-12 bg-gradient-to-br from-gray-900 to-black rounded-lg border border-gray-800 p-2">
              {/* Film strip */}
              <div className="space-y-1">
                <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
                <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              </div>
              {/* Clapper handle */}
              <div className="absolute top-2 -right-1 w-2 h-8 bg-gradient-to-b from-gray-700 to-gray-900 rounded transform group-hover:rotate-12 transition-transform"></div>
            </div>
          </div>
          
          {/* Text */}
          <div>
            <h1 className="text-2xl font-bold tracking-wide">
              <span className="text-red-400 group-hover:text-red-300 transition-colors">Movie</span>
              <span className="text-cyan-400 group-hover:text-cyan-300 transition-colors">Seat</span>
            </h1>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-px bg-gradient-to-r from-red-500 to-transparent"></div>
              <span className="text-xs text-gray-400 font-medium tracking-widest">MOVIES</span>
              <div className="w-6 h-px bg-gradient-to-l from-cyan-500 to-transparent"></div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default AdminNavbar;
