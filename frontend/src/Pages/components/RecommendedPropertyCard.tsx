import { BedDouble, Bath, Car, ArrowRightLeft } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  addComparedProperty,
  removeComparedProperty,
  addViewToHistory,
  BACKEND_URL,
} from "../../helpers";
import axios from "axios";
import type { Property } from "../../helpers";
import { useNavigate } from "react-router-dom";

// Defines the functions and elements for each recommended property shown on the dashboard page
function RecommendedPropertyCard({
  property,
  rating,
  comparedProperties,
  setComparedProperties,
  setPendingCompareProperty,
  setShowModal,
}: {
  property: Property;
  rating: number;
  comparedProperties: Property[];
  setComparedProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  setPendingCompareProperty: (p: Property) => void;
  setShowModal: (b: boolean) => void;
}) {
  const {
    streetNumber,
    street,
    suburb,
    postcode,
    price,
    images,
    bedrooms,
    bathrooms,
    carSpaces,
    _id,
  } = property;

  const [bookmarked, setBookmarked] = useState(false);
  const navigate = useNavigate();
  const token = String(localStorage.getItem("user_token"));

  const swapped = useMemo(() => {
    return comparedProperties.some((p) => p._id === _id);
  }, [comparedProperties, _id]);

  // Checks if the property has been bookmarked
  useEffect(() => {
    const checkIfBookmarked = async () => {
      if (!token) return;
      try {
        const response = await axios.get(`${BACKEND_URL}/user/viewBookmarks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const saved = response.data.some((p: { id: string }) => p.id === _id);
        setBookmarked(saved);
      } catch (err) {
        console.error("Error checking bookmarks:", err);
      }
    };

    checkIfBookmarked();
  }, [token, _id]);

  // Bookmarks or Unbookmarks the property
  const toggleBookmark = async () => {
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      if (!bookmarked) {
        await axios.get(`${BACKEND_URL}/property/bookmark?propId=${_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await axios.get(
          `${BACKEND_URL}/property/removebookmark?propId=${_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }
      setBookmarked((prev) => !prev);
    } catch (error) {
      console.error("Bookmark toggle failed:", error);
    }
  };

  // Changes the compare status of the property
  const toggleSwap = async () => {
    const userId = localStorage.getItem("user_token");
    if (!userId) return;

    try {
      if (swapped) {
        await removeComparedProperty(token, _id);
        setComparedProperties((prev) => prev.filter((p) => p._id !== _id));
      } else {
        if (comparedProperties.length < 2) {
          await addComparedProperty(token, _id);
          setComparedProperties((prev) => [...prev, property]);
        } else {
          setPendingCompareProperty(property);
          setShowModal(true);
        }
      }
    } catch (error) {
      console.error("Error toggling compare:", error);
    }
  };

  // Navigate to the property page
  const goToProperty = () => {
    if (token) {
      addViewToHistory(token, _id);
    }
    navigate(`/PropertyPage?id=${_id}`);
  };

  return (
    <div className="card bg-base-100 !w-[18%] 2xl:w-80 shadow-lg mt-3 mb-5">
      <figure className="relative cursor-pointer" onClick={goToProperty}>
        <img src={images[0]} className="h-[200px] w-full object-cover" />
        {/* Property star rating */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-sm px-2 py-1 rounded-md z-10">
          ⭐ {rating.toFixed(1)}
        </div>
      </figure>
      <div className="card-body relative">
        {/* Property street address */}
        <h2
          className="text-lg font-bold w-[150px] 2xl:w-[220px] truncate overflow-hidden whitespace-nowrap"
          title={`${streetNumber} ${street}`}
        >
          {`${streetNumber} ${street}`}
        </h2>
        {/* Property suburb */}
        <p className="w-50">{`${suburb}, ${postcode}`}</p>
        {/* Property price */}
        <p className="italic text-xl">{`$${price.toLocaleString()}`}</p>
        {/* Property features */}
        <div className="join mt-2 w-40 mb-5 2xl:mb-0">
          <BedDouble className="w-5 h-5 text-black" />
          <p className="ml-2 font-bold">{bedrooms}</p>
          <Bath className="w-5 h-5 text-black" />
          <p className="ml-2 font-bold">{bathrooms}</p>
          <Car className="w-5 h-5 text-black" />
          <p className="ml-2 font-bold">{carSpaces}</p>
        </div>
        {/* Compare and bookmark icons */}
        <div className="join absolute bottom-4 right-4">
          <ArrowRightLeft
            onClick={toggleSwap}
            id="recommended_compare_icon"
            className={`w-6 h-6 mr-2 cursor-pointer hover:scale-120 transition-transform ${
              swapped
                ? "text-blue-800 drop-shadow-[0_0_8px_rgba(59,130,246,1)]"
                : "text-black"
            }`}
          />

          <button
            onClick={toggleBookmark}
            className="focus:outline-none hover:scale-120"
            id="recommended_bookmark_icon"
          >
            {bookmarked ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 fill-blue-900 drop-shadow-[0_0_6px_rgba(30,64,175,0.9)]"
                viewBox="0 0 24 24"
              >
                <path d="M17 3H7a2 2 0 0 0-2 2v16l7-4 7 4V5a2 2 0 0 0-2-2z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2v16z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
        <div className="card-actions justify-end"></div>
      </div>
    </div>
  );
}

export default RecommendedPropertyCard;
