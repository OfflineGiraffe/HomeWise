import { BedDouble, Bath, Car, ArrowRightLeft } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  addComparedProperty,
  removeComparedProperty,
  addViewToHistory,
  BACKEND_URL,
} from "../../helpers";
import type { Property } from "../../helpers";

// Defines the functions and elements for each slider property shown on the dashboard page
function SliderPropertyView({
  property,
  comparedProperties,
  setComparedProperties,
  setShowModal,
  setPendingCompareProperty,
}: {
  property: Property;
  comparedProperties: Property[];
  setComparedProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  setPendingCompareProperty: React.Dispatch<
    React.SetStateAction<Property | null>
  >;
}) {
  const {
    _id,
    streetNumber,
    street,
    suburb,
    postcode,
    price,
    description,
    images,
    bedrooms,
    bathrooms,
    carSpaces,
  } = property;

  const [bookmarked, setBookmarked] = useState(false);
  const [propertyRating, setPropertyRating] = useState(0);
  const swapped = useMemo(() => {
    return comparedProperties.some((p) => p._id === _id);
  }, [comparedProperties, _id]);

  const token = String(localStorage.getItem("user_token"));
  const navigate = useNavigate();

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

  // Gets the rating of the property
  useEffect(() => {
    const getRating = async () => {
      if (!token) return;
      try {
        const response = await axios.get(
          `${BACKEND_URL}/recommender/property?propertyId=${_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setPropertyRating(response.data.rating);
      } catch (err) {
        console.error("Error checking bookmarks:", err);
      }
    };

    getRating();
  }, [token, _id]);

  // Bookmarks or Unbookmarks the property
  const toggleBookmark = async () => {
    if (!token) {
      console.error("No token found");
      return;
    }

    if (!bookmarked) {
      try {
        await axios.get(`${BACKEND_URL}/property/bookmark?propId=${_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Failed to bookmark property:", error);
        return;
      }
    } else {
      try {
        await axios.get(
          `${BACKEND_URL}/property/removebookmark?propId=${_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      } catch (error) {
        console.error("Failed to remove bookmark:", error);
        return;
      }
    }

    setBookmarked((prev) => !prev);
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
    <div className=" h-100 w-full flex items-center justify-center rounded-lg">
      <div className="join w-full h-full">
        <div className="bg-white w-[40%] h-full border-black border rounded-tl-lg rounded-bl-lg relative flex flex-col">
          {/* Property street address */}
          <h1 className="text-4xl ml-4 mt-4 w-[95%]">{`${streetNumber} ${street}`}</h1>
          {/* Property suburb */}
          <h1 className="text-xl ml-4 mt-2 w-[95%]">{`${suburb}, ${postcode}`}</h1>
          {/* Property price */}
          <h1 className="text-3xl ml-4 mt-4 italic w-[95%]">
            ${price.toLocaleString()}
          </h1>
          {/* Property description */}
          <h1 className="text-lg ml-4 mt-8 w-[95%]">{description}</h1>
          {/* Property features */}
          <div className="join mt-4 w-full">
            <BedDouble className="w-6 h-6 text-black ml-4" />
            <p className="ml-2 mr-4 font-bold">{bedrooms}</p>
            <Bath className="w-6 h-6 text-black" />
            <p className="ml-2 mr-4 font-bold">{bathrooms}</p>
            <Car className="w-6 h-6 text-black" />
            <p className="ml-2 mr-4 font-bold">{carSpaces}</p>
          </div>
          {/* Compare and bookmark icons */}
          {token != "null" && (
            <div className="join absolute bottom-4 right-4">
              <ArrowRightLeft
                onClick={toggleSwap}
                id="slider_property_compare"
                className={`w-10 h-10 mr-2 cursor-pointer hover:scale-120 transition-transform ${
                  swapped
                    ? "text-blue-800 drop-shadow-[0_0_8px_rgba(59,130,246,1)]"
                    : "text-black"
                }`}
              />
              <button
                onClick={toggleBookmark}
                className="focus:outline-none hover:scale-120"
              >
                {bookmarked ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 fill-blue-900 drop-shadow-[0_0_6px_rgba(30,64,175,0.9)]"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17 3H7a2 2 0 0 0-2 2v16l7-4 7 4V5a2 2 0 0 0-2-2z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-black"
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
          )}
          <div className="ml-4 w-full mt-2">
            {/* Property agency */}
            <span className="text-gray-500 text-lg italic">
              Listed by {property.agent.name} | {property.agent.agency.name}
            </span>
          </div>
          {/* Navigate to property */}
          <div className="mt-auto ml-4 mb-4 ">
            <button
              onClick={goToProperty}
              className="btn btn-lg bg-blue-900 hover:!bg-blue-700 text-white rounded-lg w-fit"
            >
              View Property
            </button>
          </div>
        </div>
        <div className="relative w-[60%] h-full">
          {/* Property star rating */}
          {token != "null" && (
            <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-2xl px-2 py-1 rounded-md z-10">
              ⭐ {propertyRating.toFixed(1)}
            </div>
          )}
          {/* Sold tag */}
          {property.sold && (
            <div className="absolute top-2 right-2 bg-red-700 bg-opacity-70 text-white font-bold text-2xl px-4 py-1 rounded-md z-10 border border-white">
              SOLD
            </div>
          )}
          {/* Property image */}
          <img
            src={images[0]}
            alt="property"
            className="w-full h-full object-cover rounded-tr-lg rounded-br-lg"
          />
        </div>
      </div>
    </div>
  );
}

export default SliderPropertyView;
