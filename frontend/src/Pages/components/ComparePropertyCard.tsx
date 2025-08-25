import { BedDouble, Bath, Car, LandPlot } from "lucide-react";
import { ImageSrc, addViewToHistory } from "../../helpers";
import type { Property } from "../../helpers";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../helpers";

type Props = {
  property: Property;
  comparison: Property | null;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onRemove: () => void;
  isLeft?: boolean;
  getComparisonClass: (a: number, b: number, reverse?: boolean) => string;
};

// Functionality for a compare property card
export default function ComparePropertyCard({
  property,
  comparison,
  isBookmarked,
  onToggleBookmark,
  onRemove,
  isLeft = false,
  getComparisonClass,
}: Props) {
  const [propertyRating, setPropertyRating] = useState(0);
  const token = localStorage.getItem("user_token");
  const navigate = useNavigate();

  useEffect(() => {
    const getRating = async () => {
      if (!token) return;
      try {
        const response = await axios.get(
          `${BACKEND_URL}/recommender/property?propertyId=${property._id}`,
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
  }, [token, property._id]);

  const goToProperty = () => {
    if (token) {
      addViewToHistory(token, property._id);
    }
    navigate(`/PropertyPage?id=${property._id}`);
  };

  return (
    <div className="flex flex-col">
      <div className="relative w-[80vh] h-[50vh]">
        {token && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-sm px-2 py-1 rounded-md z-10">
            ⭐ {propertyRating.toFixed(1)}
          </div>
        )}
        {/* Check if property is sold */}
        {property.sold && (
          <div className="absolute top-2 right-2 bg-red-700 bg-opacity-70 text-white text-sm font-bold px-2 py-1 rounded-md z-10">
            SOLD
          </div>
        )}
        <img
          src={ImageSrc(property.images[0])}
          onClick={goToProperty}
          alt="Image of a house"
          className={`w-full h-full object-cover ${isLeft ? "rounded-tl-2xl" : "rounded-tr-2xl"}`}
        />
      </div>

      <div
        className={`w-[80vh] border ${isLeft ? "rounded-bl-2xl" : "rounded-br-2xl"} p-4 shadow bg-white relative`}
      >
        <div
          className={`${getComparisonClass(
            property.price,
            comparison?.price || 0,
            true,
          )} text-xl font-semibold`}
        >
          ${property.price.toLocaleString()}
        </div>
        <div className="text-sm text-gray-800 font-medium">
          {property.streetNumber} {property.street}, {property.suburb}
        </div>
        <p className="text-sm mt-2 text-gray-600">{property.description}</p>
        <ul className="mt-4 text-sm space-y-1">
          <li
            className={`flex items-center ${getComparisonClass(property.bedrooms, comparison?.bedrooms || 0)}`}
          >
            {/* Compare Bedrooms */}
            <span className="mr-2">
              <BedDouble />
            </span>{" "}
            Bedrooms: {property.bedrooms}
          </li>
          <li
            className={`flex items-center ${getComparisonClass(property.bathrooms, comparison?.bathrooms || 0)}`}
          >
            {/* Compare Bathrooms */}
            <span className="mr-2">
              <Bath />
            </span>{" "}
            Bathrooms: {property.bathrooms}
          </li>
          <li
            className={`flex items-center ${getComparisonClass(property.carSpaces, comparison?.carSpaces || 0)}`}
          >
            {/* Compare Car spaces */}
            <span className="mr-2">
              <Car />
            </span>{" "}
            Car Spaces: {property.carSpaces}
          </li>
          <li
            className={`flex items-center ${getComparisonClass(property.landSizeM2, comparison?.landSizeM2 || 0)}`}
          >
            {/* Compare Land Size */}
            <span className="mr-2">
              <LandPlot />
            </span>{" "}
            Land Space: {property.landSizeM2}m²
          </li>
        </ul>
        <div className="flex justify-end">
          {/* Remove Buttom */}
          <button
            className="mt-4 text-sm px-3 py-1 border rounded shadow hover:bg-gray-100"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
        <div className="absolute top-4 right-4 text-black text-xl">
          {/* Book mark Button */}
          <button
            onClick={onToggleBookmark}
            className="focus:outline-none hover:scale-110"
          >
            {isBookmarked ? (
              <svg
                className="w-6 h-6 fill-blue-900 drop-shadow-[0_0_6px_rgba(30,64,175,0.9)]"
                viewBox="0 0 24 24"
              >
                <path d="M17 3H7a2 2 0 0 0-2 2v16l7-4 7 4V5a2 2 0 0 0-2-2z" />
              </svg>
            ) : (
              <svg
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
      </div>
    </div>
  );
}
