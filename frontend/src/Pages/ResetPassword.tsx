// import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // const navigate = useNavigate();

  const sendPassReq = () => {
    setError("");
    setSuccess(false);

    if (
      password !== confirmPassword ||
      password === "" ||
      confirmPassword === ""
    ) {
      setError("Passwords do not match.");
    } else {
      setSuccess(true);
      console.log("Resetting password to:", password);
      // Optionally: navigate('/resetPasswordLinkSent');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      console.log("Sending password reset to:", password);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <fieldset className="fieldset w-sm bg-base-100 border border-base-300 rounded-box p-4">
        <h1 className="text-3xl font-bold text-center">Reset Password</h1>
        <hr className="w-full border border-gray-300 my-4 mb-2" />

        {success ? (
          <div role="alert" className="alert alert-success mt-4">
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
            <span>Password has been successfully reset.</span>
          </div>
        ) : (
          <>
            <label className="fieldset-label text-slate-900">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyPress}
              type="password"
              className="input w-90"
              placeholder="*********"
            />

            <label className="fieldset-label text-slate-900">
              Confirm Password
            </label>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyPress}
              type="password"
              className="input w-90"
              placeholder="*********"
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
              name="reset-button"
            >
              Send password reset
            </button>
          </>
        )}
      </fieldset>
    </div>
  );
}

export default ResetPassword;
