import { useState } from "react";
import axios from "axios";
import type { Property } from "../helpers";
import { BACKEND_URL } from "../helpers";

interface SortpageProps {
  onClose: () => void;
  filters: PropertyFilters;
  setFilters: React.Dispatch<React.SetStateAction<PropertyFilters>>;
  onApply: (
    newListings: Property[],
    sortBy: "date" | "price",
    ascending: boolean,
  ) => void;
  page: number;
  pageSize: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

interface PropertyFilters {
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

function Sortpage({
  onClose,
  filters,
  onApply,
  page,
  pageSize,
  setPage,
}: SortpageProps) {
  const [selectedSort, setSelectedSort] = useState("");

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSort(event.target.value);
  };

  {
    /* Handle the apply sort */
  }
  const handleApply = async () => {
    try {
      let sortBy: "date" | "price" | undefined;
      let ascending: boolean | undefined;

      {
        /* Check whether it is by price or date or ascending or descending */
      }
      switch (selectedSort) {
        case "dateAsc":
          sortBy = "date";
          ascending = true;
          break;
        case "dateDesc":
          sortBy = "date";
          ascending = false;
          break;
        case "priceAsce":
          sortBy = "price";
          ascending = true;
          break;
        case "priceDesc":
          sortBy = "price";
          ascending = false;
          break;
        default:
          sortBy = "date";
          ascending = false;
          break;
      }

      {
        /* Use filters from main page */
      }
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
        sortBy,
        ascending,
        start: page * pageSize,
        end: (page + 1) * pageSize - 1,
      };

      const response = await axios.get(`${BACKEND_URL}/search`, { params });
      const newListings = response.data.properties;
      setPage(0);
      onApply(newListings, sortBy, ascending);
      onClose();
    } catch (error) {
      console.error("Failed to fetch sorted listings:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl w-[45vw] h-[25vh] relative overflow-auto flex flex-col gap-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-xl font-bold cursor-pointer"
        >
          ×
        </button>

        <h2 className="text-2xl font-semibold">Sort Listings</h2>

        <label className="flex flex-col gap-2">
          <span className="font-medium">Sort by:</span>
          {/* Give selection of options */}
          <select
            value={selectedSort}
            onChange={handleSortChange}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Select an option</option>
            <option value="dateDesc">Date: Newest to Oldest</option>
            <option value="dateAsc">Date: Oldest to Newest</option>
            <option value="priceAsce">Price: Lowest to Highest</option>
            <option value="priceDesc">Price: Highest to Lowest</option>
          </select>
        </label>

        <div className="mt-auto self-end">
          {/* Apply buttom */}
          <button
            onClick={handleApply}
            disabled={!selectedSort}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sortpage;
