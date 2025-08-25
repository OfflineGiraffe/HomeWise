import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../helpers";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    if (email === "") {
      setError("Email cannot be empty");
      return;
    }

    if (password === "") {
      setError("Password cannot be empty");
      return;
    }

    if (!checkEmailValidity(email)) {
      setError("Invalid email entered");
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/accounts/login`, {
        email: email,
        password: password,
      });
      localStorage.setItem("user_token", response.data.token);
      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  function checkEmailValidity(email: string): boolean {
    const emailRegex = /^.+@.+\..+$/;
    return emailRegex.test(email);
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      login();
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <fieldset className="fieldset w-sm bg-base-100 border border-base-300 rounded-box p-4">
          {/* Login Page */}
          <h1 className="text-3xl font-bold text-center">Login</h1>
          <hr className="w-full border border-gray-300 my-4 mb-2" />

          <label className="fieldset-label text-slate-900">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyPress}
            type="email"
            className="input w-90"
            placeholder="Email"
          />

          <label className="fieldset-label text-slate-900">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyPress}
            type="password"
            className="input w-90"
            placeholder="Password"
            autoComplete="new-password"
          />

          {/* Show error */}
          {error && (
            <div role="alert" className="alert alert-warning mt-2 mb-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Login button */}
          <button
            onClick={login}
            className="btn bg-blue-900 md:btn-md flex-1 mt-2 text-white hover:!bg-blue-700"
            name="login-button"
          >
            Login
          </button>
          <div className="w-full mt-3 flex justify-between">
            {/* Register for an account */}
            <span>
              Don't have an account?{" "}
              <Link to="/register" className="underline text-secondary">
                Register
              </Link>
            </span>
            {/* Forgot password button */}
            <Link to="/resetPasswordLink" className="underline text-secondary">
              Forgot password?
            </Link>
          </div>
        </fieldset>
      </div>
    </>
  );
}

export default Login;
