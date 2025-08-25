import { useState, useEffect, useMemo } from "react";
import { BedDouble, Bath, Car, LandPlot, ArrowRightLeft } from "lucide-react";
import { addComparedProperty, removeComparedProperty } from "../../helpers";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ImageSrc, addViewToHistory } from "../../helpers";
import type { Property } from "../../helpers";
import ChooseReplaceModal from "./ChooseReplaceModal";
import { BACKEND_URL } from "../../helpers";

type Props = Property & {
  comparedProperties: Property[];
  setComparedProperties: React.Dispatch<React.SetStateAction<Property[]>>;
};

function SearchPropertyCard({
  comparedProperties,
  setComparedProperties,
  ...property
}: Props) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [propertyRating, setPropertyRating] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const token = String(localStorage.getItem("user_token"));
  const navigate = useNavigate();

  const {
    streetNumber,
    street,
    suburb,
    postcode,
    images,
    bedrooms,
    bathrooms,
    carSpaces,
    landSizeM2,
    _id,
  } = property;

  const swapped = useMemo(() => {
    return comparedProperties.some((p) => p._id === _id);
  }, [comparedProperties, _id]);

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
        console.error("Error fetching property rating:", err);
      }
    };

    getRating();
  }, [token, _id]);

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
        setIsBookmarked(saved);
      } catch (err) {
        console.error("Error checking bookmarks:", err);
      }
    };

    checkIfBookmarked();
  }, [_id]);

  const toggleBookmark = async () => {
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      if (!isBookmarked) {
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
      setIsBookmarked((prev) => !prev);
    } catch (error) {
      console.error("Bookmark toggle failed:", error);
    }
  };

  const toggleSwap = async () => {
    if (!token) return;

    try {
      if (swapped) {
        await removeComparedProperty(token, _id);
        setComparedProperties((prev) => prev.filter((p) => p._id !== _id));
      } else {
        if (comparedProperties.length < 2) {
          await addComparedProperty(token, _id);
          setComparedProperties((prev) => [...prev, property]);
        } else {
          setShowModal(true);
        }
      }
    } catch (error) {
      console.error("Error toggling compare:", error);
    }
  };

  const handleClick = () => {
    if (token) {
      addViewToHistory(token, property._id);
    }
    navigate(`/propertypage?id=${property._id}`);
  };

  return (
    <div className="flex bg-white shadow-md rounded-2xl overflow-hidden mb-5 w-[90vw] max-w-[1000px]">
      <ChooseReplaceModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        properties={comparedProperties}
        pendingProperty={property}
        onReplace={async (oldId, newProperty) => {
          try {
            const userId = localStorage.getItem("user_token");
            if (!userId) return;

            setShowModal(false);
            await addComparedProperty(token, newProperty._id);
            await removeComparedProperty(token, oldId);

            // Optimistically update the state
            setComparedProperties((prev) =>
              prev.filter((p) => p._id !== oldId).concat(newProperty),
            );
          } catch (error) {
            console.error("Error replacing compared property:", error);
          }
        }}
      />

      {/* Image Section */}
      <div className="relative w-[55vh] h-[220px]">
        <figure
          className="relative cursor-pointer"
          onClick={() => handleClick()}
        >
          <img
            src={ImageSrc(images[0])}
            className="w-full h-full object-cover cursor-pointer"
          />
          {token != "null" && (
            <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-sm px-2 py-1 rounded-md z-10">
              ⭐ {propertyRating.toFixed(1)}
            </div>
          )}
          {property.sold && (
            <div className="absolute top-2 right-2 bg-red-700 bg-opacity-70 text-white text-sm font-bold px-2 py-1 rounded-md z-10">
              SOLD
            </div>
          )}
        </figure>
      </div>

      {/* Info Section */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-2">
            {streetNumber} {street}, {suburb} {postcode}
          </h2>

          <div className="grid grid-cols-2 gap-2 text-gray-700 text-sm">
            <div className="flex items-center gap-2">
              <BedDouble className="w-6 h-6 text-black" />
              Bedrooms: <span className="font-medium">{bedrooms}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="w-6 h-6 text-black" />
              Bathrooms: <span className="font-medium">{bathrooms}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-6 h-6 text-black" />
              Car Spaces: <span className="font-medium">{carSpaces}</span>
            </div>
            <div className="flex items-center gap-2">
              <LandPlot className="w-6 h-6 text-black" />
              Land Size: <span className="font-medium">{landSizeM2}m²</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="mt-2 text-xl italic text-black">
          ${property.price.toLocaleString()}
        </div>

        {/* Footer section */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-gray-500 text-sm italic">
            Listed by {property.agent.name} | {property.agent.agency.name}
          </span>
          {token != "null" && (
            <div className="flex gap-3 items-center">
              <ArrowRightLeft
                onClick={toggleSwap}
                className={`w-6 h-6 cursor-pointer hover:scale-120 transition-transform ${
                  swapped
                    ? "text-blue-800 drop-shadow-[0_0_8px_rgba(59,130,246,1)]"
                    : "text-black"
                }`}
              />
              <button
                onClick={toggleBookmark}
                className="focus:outline-none hover:scale-120"
              >
                {isBookmarked ? (
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
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchPropertyCard;
