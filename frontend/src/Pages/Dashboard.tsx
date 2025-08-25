import Searchbar from "./components/Searchbar";
import SliderPropertyView from "./components/SliderPropertyView";
import RecommendedPropertyCard from "./components/RecommendedPropertyCard";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { useState, useEffect } from "react";
import { ImageSrc } from "../helpers";
import axios from "axios";
import {
  addComparedProperty,
  removeComparedProperty,
  BACKEND_URL,
} from "../helpers";
import type { Property } from "../helpers";
import ChooseReplaceModal from "./components/ChooseReplaceModal";
import { Link } from "react-router-dom";

type RecommendedItem = {
  property: Property;
  rating: number;
};

// Elements and functions for the dashboard page
function Dashboard() {
  const token = String(localStorage.getItem("user_token"));
  const [propertyData, setPropertyData] = useState<Property[]>([]);
  const [recommendedData, setRecommendedData] = useState<RecommendedItem[]>([]);
  const [recommendedDataFound, setRecommendedDataFound] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [comparedProperties, setComparedProperties] = useState<Property[]>([]);
  const [pendingCompareProperty, setPendingCompareProperty] =
    useState<Property | null>(null);

  // Gets all currently compared properties
  const fetchComparedProperties = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/compare`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setComparedProperties(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching compared properties:", error);
      return [];
    }
  };

  // Sets the search filters
  const [filters, setFilters] = useState({
    suburb: "",
    postcode: "",
    minPrice: "Any",
    maxPrice: "Any",
    minBedrooms: "Any",
    maxBedrooms: "Any",
    minLandSize: "Any",
    maxLandSize: "Any",
    minCarSpaces: "Any",
    maxCarSpaces: "Any",
    propertyTypes: ["All"],
  });

  // Handles any changes to the filters
  const handleFilterApply = async () => {
    try {
      const params = {
        suburb: filters.suburb,
        postcode: filters.postcode,
        state: "New South Wales",
        minPrice:
          filters.minPrice !== "Any" ? Number(filters.minPrice) : undefined,
        maxPrice:
          filters.maxPrice !== "Any" ? Number(filters.maxPrice) : undefined,
        minBedrooms:
          filters.minBedrooms !== "Any"
            ? Number(filters.minBedrooms)
            : undefined,
        maxBedrooms:
          filters.maxBedrooms !== "Any"
            ? Number(filters.maxBedrooms)
            : undefined,
        minLandSize:
          filters.minLandSize !== "Any"
            ? Number(filters.minLandSize)
            : undefined,
        maxLandSize:
          filters.maxLandSize !== "Any"
            ? Number(filters.maxLandSize)
            : undefined,
        minCarSpaces:
          filters.minCarSpaces !== "Any"
            ? Number(filters.minCarSpaces)
            : undefined,
        maxCarSpaces:
          filters.maxCarSpaces !== "Any"
            ? Number(filters.maxCarSpaces)
            : undefined,
        propertyTypes: filters.propertyTypes?.includes("All")
          ? undefined
          : filters.propertyTypes,
        sortBy: "",
      };

      const response = await axios.get(`${BACKEND_URL}/search`, {
        params,
      });
      setPropertyData(response.data.properties);
    } catch (err) {
      console.error("Dashboard filter search error:", err);
    }
  };

  // Gets the 5 latest properties for the slider
  const fetchProperties = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/search`);
      const topFive = response.data.properties.slice(0, 5);
      setPropertyData(topFive);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    }
    // Gets the top 5 recommended properties
    if (token) {
      try {
        const recommended_response = await axios.get(
          `${BACKEND_URL}/recommender/top`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (recommended_response) {
          setRecommendedData(recommended_response.data.propertiesAndRatings);
          setRecommendedDataFound(true);
        }
      } catch (error) {
        console.error("Failed to fetch recommended properties", error);
      }
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchComparedProperties();
  }, []);

  // Slider settings
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 6000,
    pauseOnHover: true,
  };

  return (
    <>
      {/* Property searchbar */}
      <Searchbar
        filters={filters}
        setFilters={setFilters}
        onApply={handleFilterApply}
        setPage={() => {}}
      />

      <div className="w-full px-20 mt-8">
        {/* Recommended properties */}
        {token != "null" && (
          <div className="bg-blue-100 w-full border-blue-950 border rounded-lg">
            <p className="font-bold text-xl ml-4 mt-3">
              Personalised Recommendations
            </p>
            <div className="flex justify-between items-center w-full px-4 mt-2">
              {/* Loading animation */}
              {!recommendedDataFound && (
                <div className="flex justify-center w-full mb-4">
                  <span className="loading loading-spinner loading-xl"></span>
                </div>
              )}
              {recommendedDataFound &&
                recommendedData.length > 0 &&
                recommendedData.map((item, index) => (
                  <RecommendedPropertyCard
                    key={index}
                    property={{
                      ...item.property,
                      images: [ImageSrc(item.property.images?.[0])],
                    }}
                    rating={item.rating}
                    comparedProperties={comparedProperties}
                    setComparedProperties={setComparedProperties}
                    setPendingCompareProperty={setPendingCompareProperty}
                    setShowModal={setShowModal}
                  />
                ))}
              {/* Alert if no recommended properties were found */}
              {recommendedDataFound && recommendedData.length === 0 && (
                <div
                  role="alert"
                  className="alert w-full mt-2 mb-4 border border-black"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-info h-6 w-6 shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>
                    Sorry, we dont have any properties available that meet your
                    preferred criteria. Please consider changing your
                    preferences.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="w-full px-20 mt-8">
        <p className="text-4xl font-bold text-center border-black border rounded-lg pt-5 pb-5">
          Recently Listed Properties Around Sydney
        </p>
      </div>
      {/* Recent properties slider */}
      <div className="w-full px-20 mt-4">
        <Slider {...settings}>
          {propertyData.map((property, index) => {
            return (
              <SliderPropertyView
                key={index}
                property={{
                  ...property,
                  postcode: property.postcode.toString(),
                  images: [ImageSrc(property.images?.[0])],
                }}
                setPendingCompareProperty={setPendingCompareProperty}
                comparedProperties={comparedProperties}
                setComparedProperties={setComparedProperties}
                setShowModal={setShowModal}
              />
            );
          })}
        </Slider>
      </div>

      {/* Disclaimer for users who are not logged in */}
      <div className="w-full px-20 mt-15 flex items-center justify-center">
        {token == "null" && (
          <div className="bg-red-50 w-full border-blue-950 border rounded-lg flex flex-col items-center justify-center">
            <h4 className="font-bold tracking-wide text-3xl ml-4 mt-4">
              It Looks Like You're Not Logged In!
            </h4>
            <p className="text-xl ml-4 mt-3">
              Some of the features we offer are not accessible without an
              account. See below for the full list.
            </p>

            <div className="my-2 flex flex-col text-xs ml-8 mt-4 bg-base-100 px-4 pt-4 pb-4 border rounded rounded-md">
              <div className="border-b-accent/5 flex items-center gap-2 border-b pb-2 text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="text-success size-5"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z"
                    clip-rule="evenodd"
                  />
                </svg>
                Recent Properties Viewer
              </div>
              <div className="border-b-accent/5 flex items-center gap-2 border-b pb-2 text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="text-success size-5"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z"
                    clip-rule="evenodd"
                  />
                </svg>
                Property Search
              </div>
              <div className="border-b-accent/5 flex items-center gap-2 border-b pb-2 text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="text-success size-5"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z"
                    clip-rule="evenodd"
                  />
                </svg>
                Suburb Insights
              </div>
              <div className="border-b-accent/5 flex items-center gap-2 border-b pb-2 text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="text-success size-5"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z"
                    clip-rule="evenodd"
                  />
                </svg>
                Contact Us
              </div>
              <div className="border-b-accent/5 flex items-center gap-2 border-b pb-2 text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="text-error size-5"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z"
                    clip-rule="evenodd"
                  />
                </svg>
                Recommendation Algorithm
              </div>
              <div className="border-b-accent/5 flex items-center gap-2 border-b pb-2 text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="text-error size-5"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z"
                    clip-rule="evenodd"
                  />
                </svg>
                Compare Properties
              </div>
              <div className="border-b-accent/5 flex items-center gap-2 border-b pb-2 text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="text-error size-5"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z"
                    clip-rule="evenodd"
                  />
                </svg>
                Save Properties
              </div>
              <div className="border-b-accent/5 flex items-center gap-2 border-b pb-2 text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="text-error size-5"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z"
                    clip-rule="evenodd"
                  />
                </svg>
                Property View History
              </div>
              <div className="border-b-accent/5 flex items-center gap-2 border-b text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="text-error size-5"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z"
                    clip-rule="evenodd"
                  />
                </svg>
                Property Notes
              </div>
            </div>
            <p className="text-xl ml-4 mt-3 mb-4">
              To gain access to all these features,{" "}
              <Link
                to="/login"
                className="text-blue-600 underline hover:text-blue-800"
              >
                login
              </Link>{" "}
              or{" "}
              <Link
                to="/register"
                className="text-blue-600 underline hover:text-blue-800"
              >
                register
              </Link>{" "}
              for an account now.
            </p>
          </div>
        )}
      </div>

      {/* Replace compared property modal */}
      <ChooseReplaceModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        properties={comparedProperties}
        pendingProperty={pendingCompareProperty}
        onReplace={async (oldId, newProperty) => {
          try {
            const userId = localStorage.getItem("user_token");
            if (!userId || !newProperty) return;

            await addComparedProperty(token, newProperty._id);
            await removeComparedProperty(token, oldId);

            await fetchComparedProperties();
            setShowModal(false);
          } catch (err) {
            console.error("Error replacing compared property:", err);
          }
        }}
      />
    </>
  );
}

export default Dashboard;
