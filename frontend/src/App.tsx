import { Routes, Route, Link, useLocation } from "react-router-dom";
import Register from "./Pages/Register";
import Register_Page_2 from "./Pages/Register_Page_2";
import Dashboard from "./Pages/Dashboard";
import Login from "./Pages/Login";
import Profile from "./Pages/Profile";
import ForgotPassword from "./Pages/ForgotPassword";
import Contact from "./Pages/Contact";
import { UserCircle } from "lucide-react";
import SearchPage from "./Pages/SearchPage";
import Compare from "./Pages/Compare";
import Bookmark from "./Pages/Bookmark";
import Insights from "./Pages/Insights";

import "./App.css";
import PropertyPage from "./Pages/PropertyPage";

function App() {
  const location = useLocation();
  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/register2";
  const dashboardPage =
    location.pathname === "/" || location.pathname === "/dashboard";
  const comparePage = location.pathname === "/compare";
  const insightsPage = location.pathname === "/insights";
  const savedPage = location.pathname === "/saved";
  const contactPage = location.pathname === "/contact";
  const token = localStorage.getItem("user_token");

  return (
    <>
      <div className="min-h-screen flex flex-col">
        {/* Header element */}
        {!hideNavbar && (
          <>
            <div className="navbar bg-base-200 shadow-sm pl-4 pt-4 pb-4 w-full border-b !border-blue-950">
              <div className="flex-1">
                <Link to="/dashboard">
                  <h1 className="text-4xl font-bold text-blue-950 cursor-pointer">
                    HomeWise
                  </h1>
                </Link>
              </div>
              <div className="flex items-center space-x-5">
                <ul className="menu menu-horizontal px-0">
                  <li>
                    <Link
                      to="/dashboard"
                      className={dashboardPage ? "font-bold" : ""}
                    >
                      Dashboard
                    </Link>
                  </li>
                  {token && (
                    <li className="border-l !border-blue-950 border-gray-300">
                      <Link
                        to="/compare"
                        className={comparePage ? "font-bold" : ""}
                      >
                        Compare
                      </Link>
                    </li>
                  )}
                  <li className="border-l !border-blue-950 border-gray-300">
                    <Link
                      to="/insights"
                      className={insightsPage ? "font-bold" : ""}
                    >
                      Suburb Insights
                    </Link>
                  </li>
                  {token && (
                    <li className="border-l !border-blue-950 border-gray-300">
                      <Link
                        to="/saved"
                        className={savedPage ? "font-bold" : ""}
                      >
                        Saved Properties
                      </Link>
                    </li>
                  )}
                  <li className="border-l border-r !border-blue-950 border-gray-300">
                    <Link
                      to="/contact"
                      className={contactPage ? "font-bold" : ""}
                    >
                      Contact Us
                    </Link>
                  </li>
                </ul>
                {!token && (
                  <button className="btn bg-blue-900 hover:!bg-blue-700 text-white mr-5">
                    <Link to="/login">Login</Link>
                  </button>
                )}
                {token && (
                  <Link to="/profile" className="mr-5">
                    <UserCircle className="w-8 h-8 text-blue-900 hover:text-blue-700 cursor-pointer" />
                  </Link>
                )}
              </div>
            </div>
          </>
        )}

        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/resetPasswordLink" element={<ForgotPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register2" element={<Register_Page_2 />} />
            <Route path="/propertypage" element={<PropertyPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/saved" element={<Bookmark />} />
            <Route path="/insights" element={<Insights />} />
          </Routes>
        </div>

        {/* Footer Element */}
        {!hideNavbar && (
          <footer className="bg-base-200 border-t border-blue-950 text-center text-sm text-gray-600 py-4 mt-10">
            <div className="container mx-auto px-4">
              <p>&copy; 2025 HomeWise. All rights reserved.</p>
              <div className="mt-2 flex justify-center space-x-4">
                <Link to="/dashboard" className="hover:underline">
                  Dashboard
                </Link>
                {token && (
                  <Link to="/compare" className="hover:underline">
                    Compare Properties
                  </Link>
                )}
                <Link to="/insights" className="hover:underline">
                  Suburb Insights
                </Link>
                {token && (
                  <Link to="/saved" className="hover:underline">
                    Saved Properties
                  </Link>
                )}
                {token && (
                  <Link to="/profile" className="hover:underline">
                    Profile
                  </Link>
                )}
                <Link to="/contact" className="hover:underline">
                  Contact Us
                </Link>
              </div>
            </div>
          </footer>
        )}
      </div>
    </>
  );
}

export default App;
