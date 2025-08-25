import { useNavigate, Link } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { BACKEND_URL } from "../helpers";

// Elements and functions for the first section of the register pages
function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [conPassword, setConPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordCapital, setPasswordCapital] = useState(false);
  const [passwordNumber, setPasswordNumber] = useState(false);
  const [passwordSpecial, setPasswordSpecial] = useState(false);
  const [passwordLength, setPasswordLength] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [allValid, setAllValid] = useState(false);
  const navigate = useNavigate();

  // Runs error checks for user input and if passed, moves to the next page
  const register = async () => {
    if (
      firstName === "" ||
      lastName === "" ||
      email === "" ||
      password === "" ||
      conPassword === ""
    ) {
      setError("Input fields cannot be empty");
      return;
    }
    if (!/^[A-Za-z]+$/.test(firstName) || !/^[A-Za-z]+$/.test(lastName)) {
      setError("Name must contain only letters");
      return;
    }
    if (!checkEmailValidity(email)) {
      setError("Invalid email entered");
      return;
    }
    if (conPassword !== password) {
      setError("Passwords must match");
      return;
    }
    if (!/(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_.])/.test(password)) {
      setError("Invalid Password");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (password.length > 20) {
      setError("Password must be lower than 20 characters long");
      return;
    }

    try {
      const response = await axios.get(
        `${BACKEND_URL}/accounts/register/check_email?email=${encodeURIComponent(email)}`,
      );
      if (response.data.response == true) {
        setError("Email is already taken");
        return;
      }
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error: string }>;
      if (axiosErr.response) {
        setError(axiosErr.response.data.error);
      } else {
        setError("An unexpected error occurred");
      }
    }

    // Moves to the second register page
    navigate("/register2", {
      state: {
        firstName,
        lastName,
        email,
        password,
      },
    });
  };

  // Checks user password flags
  useEffect(() => {
    if (
      passwordCapital &&
      passwordNumber &&
      passwordSpecial &&
      passwordLength &&
      passwordsMatch
    ) {
      setAllValid(true);
    } else {
      setAllValid(false);
    }
  }, [
    passwordCapital,
    passwordNumber,
    passwordSpecial,
    passwordLength,
    passwordsMatch,
  ]);

  function checkEmailValidity(email: string): boolean {
    const emailRegex = /^.+@.+\..+$/;
    return emailRegex.test(email);
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      register();
    }
  };

  // Checks for valid passwords after each change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    setPasswordCapital(/[A-Z]/.test(value));
    setPasswordNumber(/\d/.test(value));
    setPasswordSpecial(/[!@#$%^&*_.]/.test(value));
    setPasswordLength(value.length >= 8 && value.length <= 20);
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setConPassword(value);

    setPasswordsMatch(value === password);
  };

  return (
    <>
      <div className="flex items-center bg-base-200 justify-center min-h-screen">
        <fieldset className="fieldset w-sm bg-base-100 border border-base-300 rounded-box p-4">
          <h1 className="text-3xl font-bold text-center">Register</h1>
          <hr className="w-full border border-gray-300 my-4 mb-2" />
          <div className="join join-vertical">
            <label className="fieldset-label text-slate-900 mb-2">
              First Name
            </label>
            {/* First name input */}
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onKeyDown={handleKeyPress}
              type="text"
              id="first_name"
              className="input rounded-md w-90"
              placeholder="First Name"
            />
          </div>
          <div className="join join-vertical">
            <label className="fieldset-label text-slate-900 mb-2">
              Last Name
            </label>
            {/* Last name input */}
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onKeyDown={handleKeyPress}
              type="text"
              id="last_name"
              className="input rounded-md w-90"
              placeholder="Last Name"
            />
          </div>

          <label className="fieldset-label text-slate-900">Email</label>
          {/* Email input */}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyPress}
            type="email"
            className="input w-90"
            placeholder="Email"
          />

          <label className="fieldset-label text-slate-900">Password</label>
          {/* Password input */}
          <input
            value={password}
            onChange={handlePasswordChange}
            onKeyDown={handleKeyPress}
            type="password"
            className="input w-90"
            placeholder="Password"
            autoComplete="new-password"
          />

          <label className="fieldset-label text-slate-900">
            Confirm Password
          </label>
          {/* Confirm password input */}
          <input
            value={conPassword}
            onChange={handleConfirmPasswordChange}
            onKeyDown={handleKeyPress}
            type="password"
            className="input w-90"
            placeholder="Confirm Password"
            autoComplete="new-password"
          />
          {/* Password validation visual element */}
          <div className="join mt-2">
            <div className="join">
              <div className="inline-grid *:[grid-area:1/1] mt-1">
                {allValid && (
                  <>
                    <div className="status status-primary animate-ping"></div>
                    <div className="status status-primary"></div>
                  </>
                )}
                {!allValid && (
                  <>
                    <div className="status status-error animate-ping"></div>
                    <div className="status status-error"></div>
                  </>
                )}
              </div>{" "}
              <p className="xs ml-2 text-black">
                Passwords are {allValid ? "valid" : "invalid"}
              </p>
            </div>
            <div className="tooltip tooltip-bottom ml-1">
              <div className="tooltip-content bg-white border border-black text-left items-start p-2">
                <div className="join">
                  <div className="inline-grid *:[grid-area:1/1] mt-1">
                    {passwordCapital && (
                      <>
                        <div className="status status-primary animate-ping"></div>
                        <div className="status status-primary"></div>
                      </>
                    )}
                    {!passwordCapital && (
                      <>
                        <div className="status status-error animate-ping"></div>
                        <div className="status status-error"></div>
                      </>
                    )}
                  </div>{" "}
                  <p className="xs ml-2 text-black">
                    Password has at least one capital letter
                  </p>
                </div>
                <div className="join">
                  <div className="inline-grid *:[grid-area:1/1] mt-1">
                    {passwordNumber && (
                      <>
                        <div className="status status-primary animate-ping"></div>
                        <div className="status status-primary"></div>
                      </>
                    )}
                    {!passwordNumber && (
                      <>
                        <div className="status status-error animate-ping"></div>
                        <div className="status status-error"></div>
                      </>
                    )}
                  </div>{" "}
                  <p className="xs ml-2 text-black">
                    Password has at least one number
                  </p>
                </div>
                <div className="join">
                  <div className="inline-grid *:[grid-area:1/1] mt-1">
                    {passwordSpecial && (
                      <>
                        <div className="status status-primary animate-ping"></div>
                        <div className="status status-primary"></div>
                      </>
                    )}
                    {!passwordSpecial && (
                      <>
                        <div className="status status-error animate-ping"></div>
                        <div className="status status-error"></div>
                      </>
                    )}
                  </div>{" "}
                  <p className="xs ml-2 text-black">
                    Password has at least one special character (!@#$%^&*_.)
                  </p>
                </div>
                <div className="join">
                  <div className="inline-grid *:[grid-area:1/1] mt-1">
                    {passwordLength && (
                      <>
                        <div className="status status-primary animate-ping"></div>
                        <div className="status status-primary"></div>
                      </>
                    )}
                    {!passwordLength && (
                      <>
                        <div className="status status-error animate-ping"></div>
                        <div className="status status-error"></div>
                      </>
                    )}
                  </div>{" "}
                  <p className="xs ml-2 text-black">
                    Password is between 8 and 20 characters (inclusive)
                  </p>
                </div>
                <div className="join">
                  <div className="inline-grid *:[grid-area:1/1] mt-1">
                    {passwordsMatch && (
                      <>
                        <div className="status status-primary animate-ping"></div>
                        <div className="status status-primary"></div>
                      </>
                    )}
                    {!passwordsMatch && (
                      <>
                        <div className="status status-error animate-ping"></div>
                        <div className="status status-error"></div>
                      </>
                    )}
                  </div>{" "}
                  <p className="xs ml-2 text-black">Passwords Match</p>
                </div>
              </div>
              <HelpCircle className="w-4 h-4 text-gray-500 cursor-pointer hover:text-blue-600 ml-1" />
            </div>
          </div>

          {/* Error found with inputs */}
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

          <button
            onClick={register}
            className="btn bg-blue-900 md:btn-md flex-1 mt-2 text-white hover:!bg-blue-700"
            name="login-button"
          >
            Next Page
          </button>
          <div className="flex gap-x-1 w-full mt-3">
            Already have an account?{" "}
            <Link to="/login" className="underline text-secondary">
              Login
            </Link>
          </div>
        </fieldset>
      </div>
    </>
  );
}

export default Register;
