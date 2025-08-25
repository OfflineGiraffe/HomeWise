import Searchbar from "./components/Searchbar";
import SearchPropertyCard from "./components/SearchPropertyCard";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Sortpage from "./Sortpage";
import axios from "axios";
import type { Property } from "../helpers";
import { useLocation } from "react-router-dom";
import { BACKEND_URL } from "../helpers";

interface Filters {
  suburb: string;
  postcode: string;
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  maxBedrooms: string;
  minLandSize: string;
  maxLandSize: string;
  minCarSpaces: string;
  maxCarSpaces: string;
  propertyTypes: string[];
}

// Functionality for the search page
function SearchPage() {
  const [searchParams] = useSearchParams();
  const suburb = searchParams.get("suburb");
  const postcode = searchParams.get("postcode");
  const [listings, setListings] = useState<Property[]>([]);
  const [showSortModal, setShowSortModal] = useState(false);
  const [comparedProperties, setComparedProperties] = useState<Property[]>([]);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<"date" | "price" | "">("");
  const [ascending, setAscending] = useState<boolean | undefined>(undefined);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const location = useLocation() as {
    state?: { listings?: Property[]; filters?: Filters };
  };
  const pageSize = 4;

  // set the filters given by either the sort page or filter page.
  const [filters, setFilters] = useState({
    suburb: suburb ?? "",
    postcode: postcode ?? "",
    minPrice: location.state?.filters?.minPrice ?? "Any",
    maxPrice: location.state?.filters?.maxPrice ?? "Any",
    minBedrooms: location.state?.filters?.minBedrooms ?? "Any",
    maxBedrooms: location.state?.filters?.maxBedrooms ?? "Any",
    minLandSize: location.state?.filters?.minLandSize ?? "Any",
    maxLandSize: location.state?.filters?.maxLandSize ?? "Any",
    minCarSpaces: location.state?.filters?.minCarSpaces ?? "Any",
    maxCarSpaces: location.state?.filters?.maxCarSpaces ?? "Any",
    propertyTypes: location.state?.filters?.propertyTypes ?? ["All"],
  });

  useEffect(() => {
    if (location.state?.listings) {
      const pre = location.state.listings;
      setListings(pre);
      setHasMoreResults(pre.length === pageSize);
      return; // <-- prevents immediate refetch that would ignore filters
    }
    handleFilterApply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // call search API
  const handleFilterApply = async () => {
    if (!suburb && !postcode) return;

    try {
      const params = {
        suburb,
        postcode,
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
        sortBy: sortBy || undefined,
        ascending,
        start: page * pageSize,
        end: (page + 1) * pageSize - 1,
      };

      const response = await axios.get(`${BACKEND_URL}/search`, { params });
      const newListings = response.data.properties;
      setListings(newListings);
      setHasMoreResults(newListings.length === pageSize);
    } catch (err) {
      console.error("Error fetching filtered search results:", err);
    }
  };

  // function for clicking sort button
  const handleSortClick = () => {
    setShowSortModal(true);
  };

  // Functionality for applying the sort search functionality
  const handleApplySort = (
    newListings: Property[],
    newSortBy: "date" | "price",
    newAscending: boolean,
  ) => {
    setListings(newListings);
    setSortBy(newSortBy);
    setAscending(newAscending);
    setPage(0);
    setHasMoreResults(newListings.length === pageSize);
  };

  // fetch the compare properties
  const fetchComparedProperties = async () => {
    const userId = localStorage.getItem("user_token");
    if (!userId) return;
    try {
      const response = await axios.get(`${BACKEND_URL}/compare`, {
        headers: {
          Authorization: `Bearer ${userId}`,
        },
      });
      setComparedProperties(response.data);
    } catch (err) {
      console.error("Error fetching compared properties:", err);
    }
  };

  // on laod, fetch the compare properties
  useEffect(() => {
    fetchComparedProperties();
  }, []);

  // if the page changes, handle the search functionality
  useEffect(() => {
    handleFilterApply();
  }, [page]);

  // if the search params changes, handle the search functionality
  useEffect(() => {
    handleFilterApply();
  }, [searchParams]);

  return (
    <>
      {/* Search Bar */}
      <Searchbar
        filters={filters}
        setFilters={setFilters}
        onApply={handleFilterApply}
        setPage={setPage}
      />

      {/* Sort button */}
      <div className="flex flex-col items-center mt-5">
        <button
          className="w-[10vh] h-[4vh] bg-gray-300 rounded-4xl flex flex-row justify-center items-center font-thin hover:bg-gray-500 hover:text-white transition cursor-pointer"
          onClick={handleSortClick}
        >
          Sort
        </button>
      </div>

      {/* Heading for Results */}
      <section className="flex flex-col items-center mt-5">
        <h1 className="font-bold text-3xl mb-5">
          Results for {suburb ? `${suburb} (${postcode})` : postcode}...
        </h1>

        {/* Map out each property returned from search */}
        {listings.map((property) => (
          <SearchPropertyCard
            key={property._id}
            {...property}
            comparedProperties={comparedProperties}
            setComparedProperties={setComparedProperties}
          />
        ))}
      </section>

      {/* Previous and next pagination button */}
      <div className="flex justify-center space-x-4 mt-5">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          disabled={page === 0}
          id="previous"
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-400 disabled:opacity-50"
        >
          Previous
        </button>

        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={!hasMoreResults}
          id="next"
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-400 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Show the sort modal */}
      {showSortModal && (
        <Sortpage
          filters={filters}
          setFilters={setFilters}
          onClose={() => setShowSortModal(false)}
          onApply={handleApplySort}
          page={page}
          pageSize={pageSize}
          setPage={setPage}
        />
      )}
    </>
  );
}

export default SearchPage;
