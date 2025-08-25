import { useNavigate } from "react-router-dom";
import { UserCircle } from "lucide-react";
import axios from "axios";
import { useState, useEffect } from "react";
import ChangeActInfo from "./components/ChangeActInfo";
import ChangePassword from "./components/ChangePassword";
import ChangePreferences from "./components/ChangePreferences";
import HistoryCard from "./components/HistoryCard";
import type { Property } from "../helpers";
import { ImageSrc, BACKEND_URL } from "../helpers";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  preferences: {
    suburb: string;
    postcode: number;
    priceRange: [number, number];
    recommendationScoring: [number, number, number, number, number];
  };
  savedProperties: [string];
  history: string[];
  dateJoined: string;
}

// Elements and functions for the user profile page
function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("user_token");
  const [userData, setUserData] = useState<User | null>(null);
  const [lastViewed, setLastViewed] = useState<Property | null>(null);
  const [userDataFound, setUserDataFound] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const propertiesPerPage = 8;

  // User history pagination
  const totalHistoryPages = userData?.history
    ? Math.ceil(userData.history.length / propertiesPerPage)
    : 0;

  const indexOfLast = historyPage * propertiesPerPage;
  const indexOfFirst = indexOfLast - propertiesPerPage;
  const currentHistory =
    userData?.history.slice(indexOfFirst, indexOfLast) || [];

  // Logs the user out of their account
  const logout = () => {
    localStorage.removeItem("user_token");
    navigate("/dashboard");
  };

  // Deletes the users account and logs them out
  const deleteAccount = async () => {
    try {
      await axios.delete(`${BACKEND_URL}/user/delete`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
    logout();
  };

  // Gets all the user data
  const fetchUsers = async () => {
    if (!token) {
      console.error("No token found");
      return;
    }
    try {
      const response = await axios.get(`${BACKEND_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserData(response.data);
      if (response.data.history.length > 0) {
        try {
          const res = await axios.get(
            `${BACKEND_URL}/property?id=${response.data.history[0]}`,
          );
          setLastViewed(res.data);
        } catch (error) {
          console.error("Failed to fetch last viewed property:", error);
        }
      }
      setUserDataFound(true);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  // Shows the price as a shortened text version
  function formatPrice(value: number): string {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}k`;
    } else {
      return `$${value}`;
    }
  }

  // Calculates the amount of days since the user has joined
  function daysSinceJoined(joinDateStr?: string): number | null {
    if (!joinDateStr) return null;

    const [day, month, year] = joinDateStr.split("/").map(Number);
    const joinDate = new Date(year, month - 1, day);
    const today = new Date();
    const diffMs = today.getTime() - joinDate.getTime();

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays >= 0 ? diffDays : 0;
  }

  // Exits the modal to edit account info
  const infoCancelClicked = () => {
    const dialog = document.getElementById(
      "account_info",
    ) as HTMLDialogElement | null;
    if (dialog) {
      dialog.close();
    }
    fetchUsers();
  };

  // Exits the modal to edit account password
  const passwordCancelClicked = () => {
    const dialog = document.getElementById(
      "change_password",
    ) as HTMLDialogElement | null;
    if (dialog) {
      dialog.close();
    }
  };

  // Exits the modal to edit account preferences
  const preferenceCancelClicked = () => {
    const dialog = document.getElementById(
      "change_preferences",
    ) as HTMLDialogElement | null;
    if (dialog) {
      dialog.close();
    }
    fetchUsers();
  };

  // Opens the password modal and closes account info modal
  const changePasswordClicked = () => {
    let dialog = document.getElementById(
      "account_info",
    ) as HTMLDialogElement | null;
    if (dialog) {
      dialog.close();
    }
    dialog = document.getElementById(
      "change_password",
    ) as HTMLDialogElement | null;
    if (dialog) {
      dialog.showModal();
    }
  };

  return (
    <>
      <div className="border-b border-black text-5xl font-bold ml-8 mt-5 pb-3 mb-5 w-38">
        Profile
      </div>
      <div className="join mt-2">
        <div className="ml-8">
          <div className="stats stats-vertical bg-base-100 border-base-300 border">
            <div className="stat flex justify-center">
              <UserCircle className="w-80 h-80 text-blue-900" />
            </div>
            {/* Shows user information */}
            <div className="stat">
              <div className="stat-title">User Account</div>
              <div className="stat-value">
                {userData?.firstName} {userData?.lastName}
              </div>
              <div className="stat-desc">{userData?.email}</div>
              <button
                className="btn btn-md mt-4 rounded-lg"
                onClick={() => {
                  const dialog = document.getElementById(
                    "account_info",
                  ) as HTMLDialogElement;
                  dialog?.showModal();
                }}
              >
                Edit Account Info
              </button>
            </div>
          </div>
        </div>
        <div>
          {/* Shows user preferences */}
          <div className="stats bg-base-100 border-base-300 border ml-8">
            <div className="stat">
              <div className="stat-title">Preferred Suburb</div>
              <div className="stat-value">{userData?.preferences.suburb}</div>
            </div>

            <div className="stat">
              <div className="stat-title">Preferred Price Range</div>
              <div className="stat-value">
                {userData && formatPrice(userData?.preferences.priceRange[0])} -{" "}
                {userData && formatPrice(userData.preferences.priceRange[1])}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title mb-3">Recommendation Scoring</div>
              <div className="join">
                <div
                  className="radial-progress text-red-900 text-xs"
                  style={
                    {
                      "--value": userData?.preferences.recommendationScoring[0],
                      "--size": "3rem",
                    } as React.CSSProperties
                  }
                  aria-valuenow={70}
                  role="progressbar"
                >
                  {userData?.preferences.recommendationScoring[0]}%
                </div>
                <div className="stat-value text-lg ml-3 mt-2 text-red-900">
                  Capital Growth Potential
                </div>
              </div>
              <div className="join mt-2">
                <div
                  className="radial-progress text-green-900 text-xs"
                  style={
                    {
                      "--value": userData?.preferences.recommendationScoring[1],
                      "--size": "3rem",
                    } as React.CSSProperties
                  }
                  aria-valuenow={70}
                  role="progressbar"
                >
                  {userData?.preferences.recommendationScoring[1]}%
                </div>
                <div className="stat-value text-lg ml-3 mt-2 text-green-900">
                  Rental Yield
                </div>
              </div>
              <div className="join mt-2">
                <div
                  className="radial-progress text-blue-950 text-xs"
                  style={
                    {
                      "--value": userData?.preferences.recommendationScoring[2],
                      "--size": "3rem",
                    } as React.CSSProperties
                  }
                  aria-valuenow={70}
                  role="progressbar"
                >
                  {userData?.preferences.recommendationScoring[2]}%
                </div>
                <div className="stat-value text-lg ml-3 mt-2 text-blue-950">
                  Proximity to Schools/Transport
                </div>
              </div>
              <div className="join mt-2 ml-10">
                <div
                  className="radial-progress text-amber-800 text-xs"
                  style={
                    {
                      "--value": userData?.preferences.recommendationScoring[2],
                      "--size": "2rem",
                    } as React.CSSProperties
                  }
                  aria-valuenow={70}
                  role="progressbar"
                >
                  {userData?.preferences.recommendationScoring[3]}%
                </div>
                <div className="stat-value text-sm ml-3 mt-2 text-amber-800">
                  School Proximity
                </div>
              </div>
              <div className="join mt-2 ml-10">
                <div
                  className="radial-progress text-black text-xs"
                  style={
                    {
                      "--value": userData?.preferences.recommendationScoring[2],
                      "--size": "2rem",
                    } as React.CSSProperties
                  }
                  aria-valuenow={70}
                  role="progressbar"
                >
                  {userData?.preferences.recommendationScoring[4]}%
                </div>
                <div className="stat-value text-sm ml-3 mt-2 text-black">
                  Transport Proximity
                </div>
              </div>
            </div>
            <div className="stat">
              <button
                className="btn btn-lg rounded-lg h-[100%]"
                onClick={() => {
                  const dialog = document.getElementById(
                    "change_preferences",
                  ) as HTMLDialogElement;
                  dialog?.showModal();
                }}
              >
                Edit Preferences
              </button>
            </div>
          </div>
          {/* User statistics */}
          <div className="join">
            <div className="stats bg-base-100 border-base-300 border ml-8 mt-5">
              <div className="stat place-items-center">
                <div className="stat-title">You've Viewed</div>
                <div className="stat-value">{userData?.history.length}</div>
                <div className="stat-desc">Properties</div>
              </div>

              <div className="stat place-items-center">
                <div className="stat-title">You've Saved</div>
                <div className="stat-value text-secondary">
                  {userData?.savedProperties.length}
                </div>
                <div className="stat-desc">Properties</div>
              </div>

              <div className="stat place-items-center">
                <div className="stat-title">Member for</div>
                <div className="stat-value">
                  {daysSinceJoined(userData?.dateJoined) ?? "0"} Days
                </div>
                <div className="stat-desc">Since {userData?.dateJoined}</div>
              </div>
            </div>
            {!userDataFound && (
              <div className="stats bg-base-100 border-base-300 border ml-8 mt-5">
                <div className="stat">
                  <div className="stat-title">Last Viewed Property</div>
                  <div className="flex justify-center w-full mb-4 !w-100">
                    <span className="loading loading-spinner loading-xl"></span>
                  </div>
                </div>

                <div className="stat p-0"></div>
              </div>
            )}
            {/* User view history */}
            {userDataFound &&
              userData?.history &&
              userData.history.length > 0 &&
              lastViewed && (
                <div className="stats bg-base-100 border-base-300 border ml-8 mt-5">
                  <div className="stat mr-10">
                    <div className="stat-title">Last Viewed Property</div>
                    <div className="stat-value">
                      {lastViewed.streetNumber} {lastViewed.street}
                    </div>
                    <div className="stat-desc">
                      ${lastViewed.price.toLocaleString()}
                    </div>
                    <button
                      className="btn btn-md mt-11 rounded-lg"
                      onClick={() => {
                        const dialog = document.getElementById(
                          `user_history`,
                        ) as HTMLDialogElement | null;
                        if (dialog) {
                          dialog.showModal();
                        }
                      }}
                    >
                      View History
                    </button>
                  </div>

                  <div className="stat p-0">
                    <img
                      src={ImageSrc(lastViewed.images[0])}
                      className="w-55 h-50"
                    />
                    {lastViewed.sold && (
                      <div className="absolute top-2 right-2 bg-red-700 bg-opacity-70 text-white text-sm font-bold px-2 py-1 rounded-md z-10">
                        SOLD
                      </div>
                    )}
                  </div>
                </div>
              )}
            {/* If no user history is found */}
            {userDataFound &&
              userData?.history &&
              Number(userData.history.length) === 0 &&
              !lastViewed && (
                <div className="stats bg-base-100 border-base-300 border ml-8 mt-5">
                  <div className="stat">
                    <div className="stat-title">Last Viewed Property</div>
                    <div className="stat-value">No Properties Viewed</div>
                  </div>

                  <div className="stat p-0"></div>
                </div>
              )}
          </div>
        </div>
      </div>
      <div className="ml-8 mt-8">
        <button
          className="btn btn-soft btn-error"
          onClick={logout}
          id="logout_user"
        >
          Logout
        </button>
        <button
          className="btn btn-error ml-5"
          onClick={() => {
            const dialog = document.getElementById(
              `confirm_delete`,
            ) as HTMLDialogElement | null;
            if (dialog) {
              dialog.showModal();
            }
          }}
        >
          Delete Account
        </button>
      </div>
      {/* Edit account information modal */}
      {userData && (
        <dialog id="account_info" className="modal">
          <div className="modal-box bg-base-200 max-h-none overflow-visible flex items-center justify-center">
            <ChangeActInfo
              firstName={userData.firstName}
              lastName={userData.lastName}
              email={userData.email}
              onCancel={infoCancelClicked}
              onPassword={changePasswordClicked}
            />
          </div>
        </dialog>
      )}

      {/* Edit account password modal */}
      {userData && (
        <dialog id="change_password" className="modal">
          <div className="modal-box bg-base-200 max-h-none overflow-visible flex items-center justify-center">
            <ChangePassword
              onCancel={passwordCancelClicked}
              email={userData.email}
            />
          </div>
        </dialog>
      )}

      {/* Edit account preferences modal */}
      {userData && (
        <dialog id="change_preferences" className="modal">
          <div className="modal-box bg-base-200 max-h-none overflow-visible flex items-center justify-center">
            <ChangePreferences
              suburb={userData.preferences.suburb}
              priceLowest={String(userData.preferences.priceRange[0])}
              priceHighest={String(userData.preferences.priceRange[1])}
              capitalGrowth={userData.preferences.recommendationScoring[0]}
              rentalYield={userData.preferences.recommendationScoring[1]}
              schoolProximity={userData.preferences.recommendationScoring[3]}
              transportProximity={userData.preferences.recommendationScoring[4]}
              onCancel={preferenceCancelClicked}
            />
          </div>
        </dialog>
      )}

      {/* Confirm delete account modal*/}
      <dialog id={`confirm_delete`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Confirm Account Deletion</h3>
          <p className="py-4">
            Clicking confirm will delete your account and all saved data. This
            process cannot be reversed once completed.
          </p>
          <div className="modal-action">
            <button
              className="btn btn-error"
              onClick={deleteAccount}
              id="delete_account_confirm"
            >
              Confirm
            </button>
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>

      {/* Modal to show user viewed property history */}
      <dialog id="user_history" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg mb-4">User Viewing History</h3>

          {userData && userData.history.length > 0 && (
            <>
              <div className="space-y-4">
                {currentHistory.map((propertyId: string, index: number) => (
                  <HistoryCard key={index} propertyId={propertyId} />
                ))}
              </div>
              {totalHistoryPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="join">
                    {Array.from({ length: totalHistoryPages }, (_, i) => (
                      <button
                        key={i}
                        className={`join-item btn ${historyPage === i + 1 ? "btn-active" : ""}`}
                        onClick={() => setHistoryPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </dialog>
    </>
  );
}

export default Profile;
