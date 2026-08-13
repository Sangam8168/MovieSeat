import React from 'react'
import Navbar from './components/Navbar';
import { Route ,Routes, useLocation} from 'react-router-dom';
import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';

import MyBookings from './pages/MyBookings';
import Favorite from './pages/Favorite';
import {Toaster} from 'react-hot-toast';
import Footer from './components/Footer';
import SeatLayout from './pages/SearLayout';
import Layout from './pages/admin/Layout';
import Dashboard from './pages/admin/Dashboard';
import AddShows from './pages/admin/AddShows';
import ListShows from './pages/admin/ListShows';
import ListBookings from './pages/admin/ListBookings';
import { useAppContext } from './context/AppContext';
import Login from './pages/Login';
import Loading from './components/Loading';

const App = () => {
  
  const isAdminRoute = useLocation().pathname.startsWith('/admin');
  const { user} = useAppContext();

  return (
    <>
      <Toaster/>
      {!isAdminRoute && <Navbar/> }
      
      <Routes>
          <Route path='/' element={<Home/>} > </Route>
          <Route path='/movies' element={<Movies/>} > </Route>
          <Route path='/movie/:id' element={<MovieDetails/>} > </Route>
          <Route path='/movie/:id/:date' element={<SeatLayout/>} > </Route>
          <Route path='/my-bookings' element={<MyBookings/>} > </Route>
          <Route path='/my-bookings' element={<MyBookings/>} > </Route>
          <Route path='/loading/:nextUrl' element={<Loading/>} > </Route>
          <Route path='/login' element={<Login/>} > </Route>
          

          <Route path="/favorite" element={<Favorite />} />
          <Route path='/admin/*' element={ user ? <Layout/> : <Login/> }>
              <Route index element={<Dashboard/>} /> 
              <Route path='add-shows' element={<AddShows/>} /> 
              <Route path='list-shows' element={<ListShows/>} /> 
              <Route path='list-bookings' element={<ListBookings/>} /> 
          </Route>
      </Routes>

      {!isAdminRoute && <Footer/> }
     
    </>
  )
}

export default App
