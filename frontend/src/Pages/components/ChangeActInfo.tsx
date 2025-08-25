import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../helpers";

interface ChangeActInfoProps {
  firstName: string;
  lastName: string;
  email: string;
  onCancel: () => void;
  onPassword: () => void;
}

// Elements and functions for the change accont info modal
function ChangeActInfo({
  firstName: initialFirst,
  lastName: initialLast,
  email: initialEmail,
  onCancel,
  onPassword,
}: ChangeActInfoProps) {
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const token = localStorage.getItem("user_token");

  // Runs error checks and if passed, changes the users stored account info
  const confirmClicked = async () => {
    if (
      firstName === "" ||
      lastName === "" ||
      email === "" ||
      password === ""
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

    //check email already exists
    if (email !== initialEmail) {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/accounts/register/check_email`,
          {
            params: { email },
          },
        );
        if (response.data.response === true) {
          setError("Email is Already Taken");
          return;
        }
      } catch {
        setError("Email is Already Taken");
        return;
      }
    }

    // Changes the account info
    try {
      const response = await axios.post(`${BACKEND_URL}/accounts/login`, {
        email: initialEmail,
        password: password,
      });
      if (response.data.token) {
        try {
          await axios.post(
            `${BACKEND_URL}/user/edit/account_info`,
            {
              firstName: firstName,
              lastName: lastName,
              email: email,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          onCancel();
          setPassword("");
          setError("");
        } catch {
          setError("Unable to Update Info");
          return;
        }
      }
    } catch {
      setError("Incorrect Password Entered");
      return;
    }
  };

  // Ensures valid email text
  function checkEmailValidity(email: string): boolean {
    const emailRegex = /^.+@.+\..+$/;
    return emailRegex.test(email);
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      confirmClicked();
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  // Resets the modal
  const cancelClicked = () => {
    setFirstName(initialFirst);
    setLastName(initialLast);
    setEmail(initialEmail);
    setError("");
    onCancel();
  };

  // Moves to the change password modal
  const passwordClicked = () => {
    setFirstName(initialFirst);
    setLastName(initialLast);
    setEmail(initialEmail);
    setError("");
    onPassword();
  };

  return (
    <>
      <fieldset className="fieldset w-sm bg-base-100 border border-base-300 rounded-box p-4">
        <h1 className="text-3xl font-bold text-center">Edit Account Info</h1>
        <hr className="w-full border border-gray-300 my-4 mb-2" />
        <div className="join join-vertical">
          <label className="fieldset-label text-slate-900 mb-2">
            First Name
          </label>
          {/* First Name Input */}
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
          {/* Last Name Input */}
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
        {/* Email Input */}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyPress}
          type="email"
          className="input w-90"
          placeholder="Email"
        />

        <label className="fieldset-label text-slate-900">
          Confirm Password
        </label>
        {/* Confirm Password Input */}
        <input
          value={password}
          onChange={handlePasswordChange}
          onKeyDown={handleKeyPress}
          type="password"
          className="input w-90"
          placeholder="Confirm Password"
          autoComplete="password"
        />

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
        <div className="flex gap-x-1 w-full mt-3">
          {" "}
          <button
            onClick={passwordClicked}
            className="underline text-secondary text-left"
          >
            Change Password
          </button>
        </div>
      </fieldset>
    </>
  );
}

export default ChangeActInfo;
