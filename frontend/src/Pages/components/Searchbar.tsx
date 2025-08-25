import { useState, useRef, useEffect, type ChangeEvent } from "react";
import Fuse from "fuse.js";
import suburbList from "../../assets/suburbs-nsw.json";
import Filterpage from "../Filterpage";
import { useNavigate } from "react-router-dom";
import settingIcon from "../../assets/setting.png";
import searchIcon from "../../assets/search.png";
import axios from "axios";
import { BACKEND_URL } from "../../helpers";

interface Suburb {
  suburb_name: string;
  postcode: string;
}

function Searchbar({
  filters,
  setFilters,
  onApply,
  setPage,
}: {
  filters: {
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
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
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
    }>
  >;
  onApply: () => void;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  const navigate = useNavigate();
  const suburb = filters?.suburb ?? "";
  const postcode = filters?.postcode ?? "";

  // eslint-disable-next-line
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [results, setResults] = useState<Suburb[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);

  const fuseOptions = {
    keys: ["suburb_name", "postcode"],
    threshold: 0.3,
  };

  const fuse = new Fuse(suburbList, fuseOptions);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    setFilters((prev) => ({
      ...prev,
      suburb: val,
    }));

    if (val.trim() === "") {
      setShowDropdown(false);
      setResults([]);
      return;
    }

    const searchResults = fuse
      .search(val)
      .slice(0, 5)
      .map((r) => r.item);
    setResults(searchResults);
    setShowDropdown(true);
  };

  const handleApplyFilters = () => {
    setPage(0); // reset to first page
    handleSearch(); // re-perform search with updated filters
    onApply(); // notify parent component
  };

  const handleSelect = ({ suburb_name, postcode }: Suburb) => {
    setFilters((prev) => ({
      ...prev,
      suburb: suburb_name,
      postcode: postcode.toString(),
    }));
    setShowDropdown(false);
  };

  useEffect(() => {
    const onClickOutside = (e: globalThis.MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleSearch = async () => {
    const trimmedInput = suburb.trim().toLowerCase();

    // Check if input is a postcode (all digits)
    const isPostcode = /^\d{4}$/.test(trimmedInput);

    // Find match based on user input
    const match = suburbList.find((item) =>
      isPostcode
        ? item.postcode === trimmedInput
        : item.suburb_name.toLowerCase() === trimmedInput,
    );

    if (!match) {
      console.warn("Invalid suburb selected.");
      return;
    }

    const searchSuburb = isPostcode ? undefined : match.suburb_name;
    const searchPostcode = match.postcode;

    try {
      const params = {
        suburb: suburb,
        postcode: postcode,
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
        sortBy: "", // should be nothing if im not sorting
      };

      const response = await axios.get(`${BACKEND_URL}/search`, { params });
      let query = `?postcode=${searchPostcode}`;
      if (searchSuburb !== undefined) {
        query = `?suburb=${encodeURIComponent(searchSuburb)}&postcode=${searchPostcode}`;
      }
      setPage(0);
      navigate(`/search${query}`, {
        state: {
          listings: response.data.properties,
          // pass the exact filters used for the request
          filters,
        },
      });
    } catch (err) {
      console.error("Error fetching search results:", err);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="mt-[5vh] w-[83vh] h-[7vh] shadow rounded-4xl flex flex-row items-center"
        style={{ backgroundColor: "#D9D9D9" }}
      >
        {/* for the background */}
        <div
          className="ml-[0.5vh] w-[50vh] h-[6vh] rounded-4xl bg-white flex flex-col relative"
          ref={inputRef}
        >
          {" "}
          {/* The white search bar */}
          <input
            className="w-full h-full text-left pl-3 rounded-4xl placeholder-[#111827] font-thin outline-none"
            placeholder="Suburb or Postcode..."
            value={suburb}
            id="search_bar"
            onChange={handleInputChange}
            onFocus={() => {
              if (suburb.trim() !== "") setShowDropdown(true);
            }}
            autoComplete="off"
          />
          {showDropdown && results.length > 0 && (
            <ul className="absolute top-full left-0 z-50 w-full bg-white border border-gray-300 max-h-48 overflow-auto rounded-md shadow-md mt-1">
              {results.map(({ suburb_name, postcode }) => (
                <li
                  key={`${suburb_name}-${postcode}`}
                  onClick={() => handleSelect({ suburb_name, postcode })}
                  className="cursor-pointer px-3 py-2 hover:bg-gray-200"
                >
                  {suburb_name} ({postcode})
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className=" ml-[3vh] mr-[3vh] w-[0.1vh] h-[5vh] rounded-4xl bg-black"></div>{" "}
        {/* divide bar */}
        <div
          className="w-[12vh] h-[6vh] bg-white rounded-4xl flex flex-row justify-center items-center font-thin hover:bg-gray-300 transition cursor-pointer"
          onClick={() => setShowFilterModal(true)}
        >
          {" "}
          {/* filter button */}
          <img src={settingIcon} alt="filter icon" width={"25"} height={"25"} />
          <p className="ml-2">Filters</p>
        </div>
        <div
          className=" ml-[2vh] w-[12vh] h-[6vh] bg-white rounded-4xl flex flex-row justify-center items-center font-thin hover:bg-gray-300 transition cursor-pointer"
          onClick={handleSearch}
        >
          {" "}
          {/* Search button */}
          <img src={searchIcon} alt="filter icon" width={"25"} height={"25"} />
          <p className="ml-2">Search</p>
        </div>
      </div>

      {showFilterModal && (
        <Filterpage
          filters={filters}
          setFilters={setFilters}
          onClose={() => setShowFilterModal(false)}
          onApply={handleApplyFilters}
          setPage={setPage}
        />
      )}
    </div>
  );
}

export default Searchbar;
