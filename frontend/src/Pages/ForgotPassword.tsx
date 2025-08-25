import { useNavigate, Link } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "../helpers";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: reset password
  const [passwordCapital, setPasswordCapital] = useState(false);
  const [passwordNumber, setPasswordNumber] = useState(false);
  const [passwordSpecial, setPasswordSpecial] = useState(false);
  const [passwordLength, setPasswordLength] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [allValid, setAllValid] = useState(false);
  const navigate = useNavigate();

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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordCapital(/[A-Z]/.test(value));
    setPasswordNumber(/\d/.test(value));
    setPasswordSpecial(/[!@#$%^&*_.]/.test(value));
    setPasswordLength(value.length >= 8 && value.length <= 20);
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);

    setPasswordsMatch(value === newPassword);
  };

  function checkEmailValidity(email: string): boolean {
    const emailRegex = /^.+@.+\..+$/;
    return emailRegex.test(email);
  }

  const sendPassReq = async () => {
    if (email.trim() === "") {
      setError("Email is required.");
      return;
    }
    if (!checkEmailValidity(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      await axios.get(`${BACKEND_URL}/accounts/resetPasswordRequest`, {
        params: {
          email: email,
        },
      });
    } catch {
      // ignored on purpose
    } finally {
      setStep(2); // Continue regardless of success/failure
      setError("");
    }
  };

  const verifyCode = async () => {
    const response = await axios.get(
      `${BACKEND_URL}/accounts/resetCodeVerify`,
      {
        params: {
          code: code,
        },
      },
    );

    if (response.data === true) {
      setError("");

      // Move to password reset step
      setStep(3);
    } else {
      setError("Incorrect verification code");
    }
  };

  const resetPassword = async () => {
    if (confirmPassword !== newPassword) {
      setError("Passwords must match");
      return;
    }
    if (!/(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_.])/.test(newPassword)) {
      setError("Invalid Password");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (newPassword.length > 20) {
      setError("Password must be lower than 20 characters long");
      return;
    }

    try {
      await axios.get(`${BACKEND_URL}/accounts/resetPassword`, {
        params: {
          email: email,
          password: newPassword,
        },
      });

      setError(""); // Sets error to nothing
      navigate("/login"); // Navigate to success page or login
    } catch {
      // does all the checks before, only error could be from the new password being the same as the old
      setError("Password cannot be the same as before");
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Forgot Password";
      case 2:
        return "Verify Code";
      case 3:
        return "Reset Password";
      default:
        return "Forgot Password";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <fieldset className="fieldset w-sm bg-base-100 border border-base-300 rounded-box p-4">
        <h1 className="text-3xl font-bold text-center">{getStepTitle()}</h1>
        <hr className="w-full border border-gray-300 my-4 mb-2" />

        {/* Step 1: Email Input */}
        {step === 1 && (
          <>
            <label className="fieldset-label text-slate-900">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="input w-90"
              placeholder="Email"
            />

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
              onClick={sendPassReq}
              className="btn bg-blue-900 md:btn-md flex-1 mt-2 text-white hover:!bg-blue-700"
              name="send-reset-button"
            >
              Send verification code
            </button>

            <div className="w-full mt-3 flex justify-between">
              <span>
                Already have an account?{" "}
                <Link to="/login" className="underline text-secondary">
                  Login
                </Link>
              </span>
            </div>
          </>
        )}

        {/* Step 2: Code Verification */}
        {step === 2 && (
          <>
            <div role="alert" className="alert alert-info mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-6 w-6 shrink-0 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>We've sent a verification code to {email}</span>
            </div>

            <label className="fieldset-label text-slate-900">
              Verification Code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              type="text"
              className="input w-90"
              placeholder="Enter verification code"
              maxLength={6}
            />

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
              onClick={verifyCode}
              className="btn bg-blue-900 md:btn-md flex-1 mt-2 text-white hover:!bg-blue-700"
              name="verify-code-button"
            >
              Verify Code
            </button>

            <div className="w-full mt-3 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="underline text-secondary cursor-pointer"
              >
                ← Back to email
              </button>
              <button
                onClick={() => {
                  setError("");
                  setStep(2);
                  sendPassReq();
                }}
                className="underline text-secondary cursor-pointer"
              >
                Resend code
              </button>
            </div>
          </>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <>
            <div role="alert" className="alert alert-success mb-4">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Code verified! Create your new password.</span>
            </div>

            <label className="fieldset-label text-slate-900">
              New Password
            </label>
            <input
              value={newPassword}
              onChange={handlePasswordChange}
              type="password"
              className="input w-90 mb-2"
              placeholder="Enter new password"
            />

            <label className="fieldset-label text-slate-900">
              Confirm Password
            </label>
            <input
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              type="password"
              className="input w-90"
              placeholder="Confirm new password"
            />
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
              onClick={resetPassword}
              className="btn bg-blue-900 md:btn-md flex-1 mt-2 text-white hover:!bg-blue-700"
              name="reset-password-button"
            >
              Reset Password
            </button>
          </>
        )}
      </fieldset>
    </div>
  );
}

export default ForgotPassword;
