import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
    return (
        <footer className="px-6 md:px-16 mt-40 lg:px-36 w-full text-gray-300">
            <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-500 pb-14">
                <div className="md:max-w-96">
                    {/* Logo - Option 2 style */}
                    <div className="flex items-center space-x-3">
                        {/* Movie clapper icon */}
                        <div className="relative">
                            <div className="w-10 h-12 bg-gradient-to-br from-gray-900 to-black rounded-lg border border-gray-800 p-2">
                                {/* Film strip */}
                                <div className="space-y-1">
                                    <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
                                    <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                                    <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                                </div>
                                {/* Clapper handle */}
                                <div className="absolute top-2 -right-1 w-2 h-8 bg-gradient-to-b from-gray-700 to-gray-900 rounded"></div>
                            </div>
                        </div>
                        
                        {/* Text */}
                        <div>
                            <h1 className="text-2xl font-bold tracking-wide">
                                <span className="text-red-400">Movie</span>
                                <span className="text-cyan-400">Seat</span>
                            </h1>
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-px bg-gradient-to-r from-red-500 to-transparent"></div>
                                <span className="text-xs text-gray-400 font-medium tracking-widest">MOVIES</span>
                                <div className="w-6 h-px bg-gradient-to-l from-cyan-500 to-transparent"></div>
                            </div>
                        </div>
                    </div>
                    
                    <p className="mt-6 text-sm">
                        Experience the magic of cinema like never before. MovieSeat is your ultimate destination for seamless movie ticket bookings, offering real-time updates on the latest blockbusters and exclusive premieres. Your seat is just a click away
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                        <img src={assets.googlePlay} alt="google play" className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity" />
                        <img src={assets.appStore} alt="app store" className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity" />
                    </div>
                </div>
                <div className="flex-1 flex items-start md:justify-end gap-20 md:gap-40">
                    <div>
                        <h2 className="font-semibold mb-5 text-white">Company</h2>
                        <ul className="text-sm space-y-2">
                            <li><a href="#" className="hover:text-red-400 transition-colors">Home</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">About us</a></li>
                            <li><a href="#" className="hover:text-red-400 transition-colors">Contact us</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="font-semibold mb-5 text-white">Get in touch</h2>
                        <div className="text-sm space-y-2">
                            <p className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                +1-234-567-890
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                                movieseat@gmail.com
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <p className="pt-4 text-center text-sm pb-5 text-gray-400">
                Copyright {new Date().getFullYear()} © 
                <span className="text-red-400">Movie</span>
                <span className="text-cyan-400">Seat</span>
                . All Right Reserved.
            </p>
        </footer>
    )
}

export default Footer