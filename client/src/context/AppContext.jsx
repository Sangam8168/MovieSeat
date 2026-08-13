import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { buildImageUrl } from "../lib/imageUrl";

axios.defaults.baseURL =  import.meta.env.VITE_BASE_URL

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [shows, setShows] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [authLoading, setAuthLoading] = useState(true);

  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || "";

  // Handles both absolute URLs and bare paths
  const imageUrl = (path) => buildImageUrl(path, image_base_url);

  const location = useLocation();
  const navigate = useNavigate();

  // Async to match the getToken() signature used across the app
  const getToken = async () => token;

  const applyAuth = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await axios.post("/api/auth/register", {
        name,
        email,
        password,
      });

      if (data.success) {
        applyAuth(data.token, data.user);
        toast.success("Account created");
        return true;
      }

      toast.error(data.message);
      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await axios.post("/api/auth/login", {
        email,
        password,
      });

      if (data.success) {
        applyAuth(data.token, data.user);
        toast.success("Welcome back!");
        return true;
      }

      toast.error(data.message);
      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      return false;
    }
  };

  const googleLogin = async (credential) => {
    try {
      const { data } = await axios.post("/api/auth/google", { credential });

      if (data.success) {
        applyAuth(data.token, data.user);
        toast.success(`Welcome, ${data.user.name}!`);
        return true;
      }

      toast.error(data.message);
      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsAdmin(false);
    setFavoriteMovies([]);
    window.google?.accounts?.id?.disableAutoSelect?.();
    navigate("/");
  };

  const fetchMe = async (currentToken) => {
    try {
      const { data } = await axios.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (data.success) {
        setUser(data.user);
      } else {
        localStorage.removeItem("token");
        setToken(null);
      }
    } catch (error) {
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchIsAdmin = async () => {
    try {
      const { data } = await axios.get("/api/admin/is-admin", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      setIsAdmin(Boolean(data.isAdmin));

      if (!data.isAdmin && location.pathname.startsWith("/admin")) {
        navigate("/");
        toast.error("You are not authorized to access admin dashboard");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchShows = async () => {
    try {
      const { data } = await axios.get("/api/show/all");

      if (data.success) {
        setShows(data.shows);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFavoriteMovies = async () => {
    try {
      const { data } = await axios.get("/api/user/favorites", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setFavoriteMovies(data.movies);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setAuthLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    // Role travels with the user object, so the Admin link appears immediately
    setIsAdmin(user.role === "admin");

    fetchIsAdmin();
    fetchFavoriteMovies();
  }, [user]);

  const value = {
    axios,
    fetchIsAdmin,
    user,
    getToken,
    login,
    register,
    googleLogin,
    logout,
    authLoading,
    navigate,
    isAdmin,
    shows,
    fetchShows,
    favoriteMovies,
    fetchFavoriteMovies,
    image_base_url,
    imageUrl
    
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
