import SavedPropertyCard from "./components/SavedPropertyCard";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import type { Property } from "../helpers";
import { BACKEND_URL } from "../helpers";

interface BookmarkItem {
  id: string;
  note: string;
}

// Elements and functions for the saved properties page
function Bookmark() {
  const [currentPage, setCurrentPage] = useState(1);
  const token = localStorage.getItem("user_token");
  const [parsedPropertyData, setParsedPropertyData] = useState<Property[]>([]);
  const [dataFetched, setDataFetched] = useState(false);

  // Gets the users bookmarked properties
  const fetchUsers = useCallback(async () => {
    if (!token) {
      console.error("No token found");
      return;
    }
    try {
      const response = await axios.get(`${BACKEND_URL}/user/viewBookmarks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const bookmarkList: BookmarkItem[] = response.data;

      const propertyPromises = bookmarkList.map(async (item) => {
        const res = await axios.get(`${BACKEND_URL}/property?id=${item.id}`);
        return {
          ...res.data,
          postcode: Number(res.data.postcode),
          note: item.note,
        };
      });

      const propertyData = await Promise.all(propertyPromises);
      setParsedPropertyData(propertyData);
      setDataFetched(true);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Calculates total needed pages
  const propertiesPerPage = 10;
  const totalPages = Math.ceil(parsedPropertyData.length / propertiesPerPage);
  const indexOfLast = currentPage * propertiesPerPage;
  const indexOfFirst = indexOfLast - propertiesPerPage;
  const currentProperties = parsedPropertyData.slice(indexOfFirst, indexOfLast);

  return (
    <>
      <div className="w-full px-20 mt-8">
        <div className="border-b border-black text-5xl font-bold ml-2 mt-8 pb-3 mb-5 w-96">
          Saved Properties
        </div>
        {/* Loading animation */}
        {!dataFetched && (
          <span className="loading loading-spinner loading-xl"></span>
        )}
        {/* Alert that no properties were found */}
        {dataFetched && parsedPropertyData.length === 0 && (
          <div role="alert" className="alert alert-warning">
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
            <span>No Properties Saved</span>
          </div>
        )}
        {/* Pagination element */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="join">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`join-item btn ${currentPage === i + 1 ? "btn-active" : ""}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Bookmarked property cards */}
        <div className="bg-base-100 w-full">
          <div
            className={`flex flex-wrap gap-6 ${
              currentProperties.length < 5 ? "justify-start" : "justify-center"
            } items-start px-4 mt-2`}
          >
            {currentProperties.map((property, index) => (
              <SavedPropertyCard
                key={index}
                property={property}
                onRefresh={fetchUsers}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Bookmark;
