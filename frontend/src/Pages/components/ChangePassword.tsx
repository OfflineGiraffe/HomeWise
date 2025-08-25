import { HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../helpers";

interface ChangePasswordProps {
  onCancel: () => void;
  email: string;
}

// Elements and functions for the change password modal
function ChangePassword({
  onCancel,
  email: initialEmail,
}: ChangePasswordProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [conPassword, setConPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordCapital, setPasswordCapital] = useState(false);
  const [passwordNumber, setPasswordNumber] = useState(false);
  const [passwordSpecial, setPasswordSpecial] = useState(false);
  const [passwordLength, setPasswordLength] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [allValid, setAllValid] = useState(false);
  const token = localStorage.getItem("user_token");

  // Runs error checks and if passed, changes the users stored password
  const confirmClicked = async () => {
    if (password === "" || conPassword === "") {
      setError("Input fields cannot be empty");
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

    // Changes stored password
    try {
      const response = await axios.post(`${BACKEND_URL}/accounts/login`, {
        email: initialEmail,
        password: oldPassword,
      });
      if (response.data.token) {
        try {
          await axios.post(
            `${BACKEND_URL}/user/edit/password`,
            {
              password: password,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          onCancel();
          setPassword("");
          setConPassword("");
          setOldPassword("");
          setPasswordCapital(false);
          setPasswordNumber(false);
          setPasswordSpecial(false);
          setPasswordLength(false);
          setPasswordsMatch(false);
          setError("");
        } catch {
          setError("Unable to Update Info");
          return;
        }
      }
    } catch {
      setError("Incorrect Current Password Entered");
      return;
    }
  };

  // Updates visual elements for password checks
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      confirmClicked();
    }
  };

  // Changes password check visual elements on each change to input
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

  // Resets the modal
  const cancelClicked = () => {
    setPassword("");
    setConPassword("");
    setError("");
    setOldPassword("");
    setPasswordCapital(false);
    setPasswordNumber(false);
    setPasswordSpecial(false);
    setPasswordLength(false);
    setPasswordsMatch(false);
    onCancel();
  };

  return (
    <>
      <fieldset className="fieldset w-sm bg-base-100 border border-base-300 rounded-box p-4">
        <h1 className="text-3xl font-bold text-center">Change Password</h1>
        <hr className="w-full border border-gray-300 my-4 mb-2" />

        <label className="fieldset-label text-slate-900">
          Current Password
        </label>
        {/* Current Password Input */}
        <input
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          onKeyDown={handleKeyPress}
          type="password"
          className="input w-90"
          placeholder="Current Password"
          autoComplete="password"
        />

        <label className="fieldset-label text-slate-900">New Password</label>
        {/* New Password Input */}
        <input
          value={password}
          onChange={handlePasswordChange}
          onKeyDown={handleKeyPress}
          type="password"
          className="input w-90"
          placeholder="New Password"
          autoComplete="new-password"
        />

        <label className="fieldset-label text-slate-900">
          Confirm New Password
        </label>
        {/* Confirm New Password Input */}
        <input
          value={conPassword}
          onChange={handleConfirmPasswordChange}
          onKeyDown={handleKeyPress}
          type="password"
          className="input w-90"
          placeholder="Confirm New Password"
          autoComplete="new-password"
        />

        {/* Visual element for password checkers */}
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

        {/* Error encountered with submitting inputs */}
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

        {/* Confirm/Cancel Buttons */}
        <div className="join">
          <button
            onClick={confirmClicked}
            id="change_password_confirm"
            className="btn bg-blue-900 md:btn-md flex-1 mt-2 text-white hover:!bg-blue-700 rounded-l-lg rounded-r-none"
            name="login-button"
          >
            Confirm
          </button>
          <button
            onClick={cancelClicked}
            className="btn md:btn-md flex-1 mt-2 rounded-r-lg rounded-l-none"
            name="login-button"
          >
            Cancel
          </button>
        </div>
      </fieldset>
    </>
  );
}

export default ChangePassword;
