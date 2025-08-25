import React from "react";
import axios from "axios";
import PropertyImageCarousel from "./components/PropertyImageCarousel";
import RecommendationCard from "./components/RecommendationCard";
import PropertyFinancialCard from "./components/PropertyFinancialCard";
import { BedDouble, Bath, Car, LandPlot, ArrowRightLeft } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  addComparedProperty,
  removeComparedProperty,
  BACKEND_URL,
} from "../helpers";
import type { Property } from "../helpers";
import ChooseReplaceModal from "./components/ChooseReplaceModal";

interface Amenity {
  name: string;
  type: string;
  address: string;
  distance_meters: number;
  distance_text?: string;
}

interface Rating {
  rating: number;
  description: string;
}

import { useSearchParams } from "react-router-dom";
import { AgentCard } from "./components/AgentCard";

const googleMapsAPIkey = import.meta.env.VITE_GMAPS_API_KEY;

function placeholderCarouselImages(): string[] {
  return [
    "https://www.bhg.com/thmb/FcKK-L23QiqiDVjrjLgfa1uFZU8=/4000x0/filters:no_upscale():strip_icc()/101495134_preview-b192d3b7d4b04188a014754b9ffa6f79.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKpvCqGI4-FgKWCPAxdF_RW3t7fvfoJksAww&s",
    "https://images.wondershare.com/edrawmax/article2023/simple-two-story-house-plans/double-floor-home-escape-plan.jpg",
    "https://editorial.rottentomatoes.com/wp-content/uploads/2019/11/House-hugh-laurie-600x314.jpg?w=600",
  ];
}

function PropertyPage({ id }: { id?: string }) {
  // once property data is set, page rerenders
  const [property, setProperty] = React.useState<Property>({
    _id: "", // dummy data before real data loads in
    streetNumber: "",
    street: "",
    suburb: "",
    postcode: "",
    state: "",
    sold: false,
    agent: {
      _id: "",
      name: "",
      phoneNumber: "",
      email: "",
      agency: {
        _id: "",
        name: "",
        phoneNumber: "",
        address: "",
        email: "",
        primaryColor: "",
        rectangularLogo: "",
      },
      photo: "",
    },
    description: "",
    images: [""],
    bedrooms: 0,
    bathrooms: 0,
    carSpaces: 0,
    landSizeM2: 0,
    price: 0,
    type: "",
    capGrowthPct: 0,
    rentalYieldPct: 0,
    note: "",
    __v: 0,
  });
  const token = String(localStorage.getItem("user_token"));

  const [amenities, setAmenities] = React.useState<Amenity[]>([]);
  const [rating, setRating] = React.useState<Rating>({
    rating: 0,
    description: "",
  });
  const [bookmarked, setBookmarked] = useState(false);
  const [comparedProperties, setComparedProperties] = useState<Property[]>([]);
  const [showModal, setShowModal] = useState(false);

  // to get query parameters
  const searchParams = useSearchParams()[0];

  // fetching property data
  React.useEffect(() => {
    let propertyId;
    if (!id) {
      propertyId = searchParams.get("id");
    } else {
      propertyId = id; // TODO: what if there is no id in prop or query params?
    }

    axios
      .get(`${BACKEND_URL}/property?id=${propertyId}`)
      .then((res) => {
        const prop = res.data;
        setProperty(prop);

        return axios.get(`${BACKEND_URL}/amenities?id=${prop._id}`);
      })
      .then((res) => {
        setAmenities(res.data);

        // fetching star rating
        return axios.get(
          `${BACKEND_URL}/recommender/property?propertyId=${property._id}&description=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      })
      .then((res) => {
        setRating(res.data);
      })
      .catch((err) =>
        console.error("Property, amenities or rating fetch error:", err),
      );
  }, [id, property._id, searchParams, token]);

  useEffect(() => {
    const checkIfBookmarked = async () => {
      if (!token) return;
      try {
        const response = await axios.get(`${BACKEND_URL}/user/viewBookmarks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const saved = response.data.some(
          (p: { id: string }) => p.id === property._id,
        );
        setBookmarked(saved);
      } catch (err) {
        console.error("Error checking bookmarks:", err);
      }
    };

    checkIfBookmarked();
  }, [token, property._id]);

  const toggleBookmark = async () => {
    if (!token) {
      console.error("No token found");
      return;
    }

    if (!bookmarked) {
      try {
        await axios.get(
          `${BACKEND_URL}/property/bookmark?propId=${property._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      } catch (error) {
        console.error("Failed to bookmark property:", error);
        return;
      }
    } else {
      try {
        await axios.get(
          `${BACKEND_URL}/property/removebookmark?propId=${property._id}`,
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

  useEffect(() => {
    const fetchComparedProperties = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/compare`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setComparedProperties(response.data);
      } catch (error) {
        console.error("Error fetching compared properties:", error);
      }
    };

    fetchComparedProperties();
  }, []);

  const swapped = useMemo(() => {
    return comparedProperties.some((p) => p._id === property._id);
  }, [comparedProperties, property._id]);

  const toggleSwap = async () => {
    const userId = localStorage.getItem("user_token");
    if (!userId) return;

    try {
      if (swapped) {
        await removeComparedProperty(token, property._id);
        setComparedProperties((prev) =>
          prev.filter((p) => p._id !== property._id),
        );
      } else {
        if (comparedProperties.length < 2) {
          await addComparedProperty(token, property._id);
          setComparedProperties((prev) => [...prev, property]);
        } else {
          setShowModal(true);
        }
      }
    } catch (error) {
      console.error("Error toggling compare:", error);
    }
  };

  return (
    <div className="max-w-8xl mx-auto p-6">
      <ChooseReplaceModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        properties={comparedProperties}
        pendingProperty={property}
        onReplace={async (oldId, newProperty) => {
          try {
            const userId = localStorage.getItem("user_token");
            if (!userId) return;

            await removeComparedProperty(token, oldId);
            await addComparedProperty(token, newProperty._id);
            setComparedProperties((prev) =>
              prev.filter((p) => p._id !== oldId).concat(newProperty),
            );
            setShowModal(false);
          } catch (error) {
            console.error("Error replacing compared property:", error);
          }
        }}
      />

      <div className="flex flex-row items-stretch bg-white rounded-2xl border-1 border-sky-900 border-solid p-16 gap-16">
        {/* Left Content */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-5xl font-bold mb-4">
            {property.streetNumber} {property.street}, {property.suburb}
            {", "}
            {property.postcode}
          </h2>

          <div>
            <div className="text-lg mt-4 join">
              <div className="flex items-center gap-2 mt-2">
                <BedDouble className="w-8 h-8 text-black text-lg" />
                Bedrooms:{" "}
                <span className="font-medium">{property.bedrooms}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 ml-6">
                <Bath className="w-8 h-8 text-black" />
                Bathrooms:{" "}
                <span className="font-medium">{property.bathrooms}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 ml-6">
                <Car className="w-8 h-8 text-black" />
                Car Spaces:{" "}
                <span className="font-medium">{property.carSpaces}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 ml-6">
                <LandPlot className="w-8 h-8 text-black" />
                Land Size:{" "}
                <span className="font-medium">{property.landSizeM2}m²</span>
              </div>
            </div>
          </div>

          <h1 className="text-4xl text-black mb-20 italic mt-6">
            ${property.price.toLocaleString()}
          </h1>
          <p className="text-xl text-black mb-6 italic">
            {property.description}
          </p>

          <div className="mt-auto pt-6 gap-3 flex flex-row items-center">
            {/* Bookmark Icon (SVG Toggle) */}
            {token && (
              <ArrowRightLeft
                onClick={toggleSwap}
                className={`w-15 h-15 cursor-pointer hover:scale-120 transition-transform ${
                  swapped
                    ? "text-blue-800 drop-shadow-[0_0_8px_rgba(59,130,246,1)]"
                    : "text-black"
                }`}
              />
            )}

            {token && (
              <button
                onClick={toggleBookmark}
                className="focus:outline-none hover:scale-120"
              >
                {bookmarked ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-15 h-15 fill-blue-900 drop-shadow-[0_0_6px_rgba(30,64,175,0.9)]"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17 3H7a2 2 0 0 0-2 2v16l7-4 7 4V5a2 2 0 0 0-2-2z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-15 h-15 text-black"
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
            )}
          </div>
        </div>

        {/* Right Image */}
        <div className="flex-shrink-0 w-1/2">
          <div className="relative rounded-xl overflow-hidden">
            {property.sold && (
              <div
                className="absolute top-2 right-2 z-20 bg-red-700 text-white font-bold 
               text-xs md:text-sm px-2.5 py-1 rounded-md tracking-wide shadow-md"
                style={{ fontSize: "1.5rem" }}
                aria-label="Sold"
              >
                SOLD
              </div>
            )}

            <PropertyImageCarousel
              images={
                property.images.length > 0
                  ? property.images
                  : placeholderCarouselImages()
              }
            />
          </div>
        </div>
      </div>

      <div className="w-full mt-8">
        <RecommendationCard
          score={rating.rating}
          description={rating.description}
          loggedIn={token != null}
        />
      </div>

      <div className="flex flex-wrap md:flex-nowrap gap-6 mt-8">
        {/* Agent Card */}

        {property.agent._id && <AgentCard agent={property.agent} />}

        {/* Google Map */}
        <div className="flex-1 min-w-0">
          <div className="border border-sky-900 rounded-xl shadow-md overflow-hidden w-full h-full min-h-[300px]">
            <iframe
              className="w-full h-full"
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps/embed/v1/place?key=${googleMapsAPIkey}&q=${encodeURIComponent(`${property.streetNumber} ${property.street}, ${property.suburb}, ${property.state} ${property.postcode}`)}`}
            ></iframe>
          </div>
        </div>
      </div>

      {amenities.length > 0 && (
        <div className="card w-full border border-sky-900 rounded-xl p-6 mt-8">
          <div className="card-body p-0">
            <h2 className="text-lg font-semibold mb-4">Nearby Amenities</h2>

            <div className="flex flex-col gap-2">
              {amenities.map((amenity, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
                >
                  <span>
                    {amenity.name}{" "}
                    <span className="text-sm text-gray-600">
                      ({amenity.type.replace("_", " ")})
                    </span>
                  </span>
                  <span className="font-medium">
                    {amenity.distance_text ||
                      `${(amenity.distance_meters / 1000).toFixed(2)} km`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="w-full mt-8">
        <PropertyFinancialCard
          capitalGrowthPct={property.capGrowthPct}
          rentalYieldPct={property.rentalYieldPct}
        />
      </div>
    </div>
  );
}

export default PropertyPage;
