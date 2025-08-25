import { useState, useEffect } from "react";
import axios from "axios";
import { ImageSrc, addViewToHistory } from "../../helpers";
import type { Property } from "../../helpers";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../helpers";

// Defines the functions and elements for each card in the view history modal
function HistoryCard({ propertyId }: { propertyId: string }) {
  const [viewed, setViewed] = useState<Property | null>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("user_token");

  // Fetches last viewed property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/property?id=${propertyId}`);
        setViewed(res.data);
      } catch (error) {
        console.error("Failed to fetch last viewed property:", error);
      }
    };

    fetchProperty();
  }, [propertyId]);

  const goToProperty = () => {
    if (token) {
      addViewToHistory(token, propertyId);
    }
    navigate(`/PropertyPage?id=${propertyId}`);
  };

  return (
    <>
      <ul className="list bg-base-100 rounded-box shadow-md">
        <li className="list-row">
          <div>
            {/* Property Image */}
            <img
              className="size-10 rounded-box"
              src={ImageSrc(viewed?.images?.[0] ?? "")}
            />
          </div>
          <div>
            <div className="join join flex items-center">
              {/* Property Address */}
              <div>
                {viewed?.streetNumber} {viewed?.street}
              </div>
              {/* Sold Tag */}
              {viewed?.sold && (
                <p className="ml-3 text-xs border-red-700 border px-2 text-red-700">
                  SOLD
                </p>
              )}
            </div>
            {/* Property Price */}
            <div className="text-xs font-semibold opacity-60">
              ${viewed?.price.toLocaleString()}
            </div>
          </div>
          {/* Navigate to property page */}
          <button className="btn btn-square btn-ghost" onClick={goToProperty}>
            View
          </button>
        </li>
      </ul>
    </>
  );
}

export default HistoryCard;
