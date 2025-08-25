import { removeComparedProperty, BACKEND_URL } from "../helpers";
import { useEffect, useState } from "react";
import axios from "axios";
import type { Property } from "../helpers";
import ComparePropertyCard from "./components/ComparePropertyCard";

// Function for the Compare Page
function Compare() {
  const [comparedProperties, setComparedProperties] = useState<Property[]>([]);
  const [isBookmarkedOne, setIsBookmarkedOne] = useState(false);
  const [isBookmarkedTwo, setIsBookmarkedTwo] = useState(false);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("user_token");

  const propertyOne = comparedProperties[0] ?? null;
  const propertyTwo = comparedProperties[1] ?? null;
  const propertyOneAvailable = !!propertyOne;
  const propertyTwoAvailable = !!propertyTwo;

  // Fetch the compared properties
  const fetchComparedProperties = async () => {
    try {
      setLoading(true); // START LOADING
      const response = await axios.get(`${BACKEND_URL}/compare`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setComparedProperties(response.data);
    } catch (error) {
      console.error("Error fetching compared properties:", error);
    } finally {
      setLoading(false); // END LOADING
    }
  };

  // On loadup, get the compared proeprties
  useEffect(() => {
    fetchComparedProperties();
  }, []);

  // Get the tailwind CSS based on the comparison
  const getComparisonClass = (one: number, two: number, reverse = false) => {
    if (one === 0 || two === 0) return "text-gray-500";
    if (reverse) {
      // Smaller is better, e.g., school distance
      if (one < two) return "text-green-600";
      if (one > two) return "text-red-600";
    } else {
      // Bigger is better, e.g., bedrooms
      if (one > two) return "text-green-600";
      if (one < two) return "text-red-600";
    }
    // otherwise, turn grey
    return "text-gray-500";
  };

  // Remove function for remove button
  const handleRemove = async (propertyId: string) => {
    const userId = localStorage.getItem("user_token");
    if (!userId) return;

    try {
      await removeComparedProperty(userId, propertyId);

      await fetchComparedProperties();
    } catch (error) {
      console.error("Failed to remove property or fetch updated list:", error);
    }
  };
  // Load bookmark functionality
  useEffect(() => {
    const checkIfBookmarked = async () => {
      if (!token || comparedProperties.length < 2) return;

      try {
        const response = await axios.get(`${BACKEND_URL}/user/viewBookmarks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const saved1 = response.data.some(
          (p: { id: string }) => p.id === comparedProperties[0]._id,
        );
        const saved2 = response.data.some(
          (p: { id: string }) => p.id === comparedProperties[1]._id,
        );

        setIsBookmarkedOne(saved1);
        setIsBookmarkedTwo(saved2);
      } catch (err) {
        console.error("Error checking bookmarks:", err);
      }
    };

    checkIfBookmarked();
  }, [token, comparedProperties]);

  // Function for clicking a bookmark
  const toggleBookmarkOne = async () => {
    if (!token) {
      console.error("No token found");
      return;
    }

    if (!isBookmarkedOne) {
      try {
        await axios.get(
          `${BACKEND_URL}/property/bookmark?propId=${comparedProperties[0]._id}`,
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
          `${BACKEND_URL}/property/removebookmark?propId=${comparedProperties[0]._id}`,
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

    setIsBookmarkedOne((prev) => !prev);
  };

  // function for toggling a bookmark
  const toggleBookmarkTwo = async () => {
    if (!token) {
      console.error("No token found");
      return;
    }

    if (!isBookmarkedTwo) {
      try {
        await axios.get(
          `${BACKEND_URL}/property/bookmark?propId=${comparedProperties[1]._id}`,
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
          `${BACKEND_URL}/property/removebookmark?propId=${comparedProperties[1]._id}`,
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

    setIsBookmarkedTwo((prev) => !prev);
  };

  return (
    <>
      <div className="border-b border-black text-5xl font-bold ml-2 mt-8 pb-3 mb-5 w-fit ml-20">
        Compare Properties
      </div>

      {/* loading circle */}
      {loading ? (
        <div className="flex justify-center mt-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <section className="flex flex-row items-center justify-center">
          <section className="flex flex-row justify-center gap-2 mt-4 px-4">
            {/* Property One */}
            {propertyOneAvailable && propertyOne && (
              <ComparePropertyCard
                property={propertyOne}
                comparison={propertyTwo}
                isBookmarked={isBookmarkedOne}
                onToggleBookmark={toggleBookmarkOne}
                onRemove={() => handleRemove(propertyOne._id)}
                isLeft={true}
                getComparisonClass={getComparisonClass}
              />
            )}

            {/* Property Two */}
            {propertyTwoAvailable && propertyTwo && (
              <ComparePropertyCard
                property={propertyTwo}
                comparison={propertyOne}
                isBookmarked={isBookmarkedTwo}
                onToggleBookmark={toggleBookmarkTwo}
                onRemove={() => handleRemove(propertyTwo._id)}
                isLeft={false}
                getComparisonClass={getComparisonClass}
              />
            )}
          </section>

          {/* Only show if either property one or two is not avaliable */}
          <div className="flex flex-row items-center justify-center">
            {!propertyOneAvailable && (
              <div className="w-[80vh] border border-dashed rounded-xl p-4 shadow bg-gray-50 flex items-center justify-center text-gray-500 italic">
                Click a compare icon to add a property.
              </div>
            )}
            {!propertyTwoAvailable && (
              <div className="w-[80vh] border border-dashed rounded-xl p-4 shadow bg-gray-50 flex items-center justify-center text-gray-500 italic">
                Click a compare icon to add another property.
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}

export default Compare;
