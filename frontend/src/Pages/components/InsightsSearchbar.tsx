import { useState, useRef, useEffect, type ChangeEvent } from "react";
import Fuse from "fuse.js";
import suburbList from "../../assets/suburbs-nsw.json";
import searchIcon from "../../assets/search.png";

interface Suburb {
  suburb_name: string;
  postcode: string;
}

interface PriceHistoryResponse {
  median_house_price_quarterly: Record<string, number>[];
}

function InsightsSearchbar({
  setSearched,
  setNewSuburb,
  setNewPostcode,
  fetchOpenAIResponse,
  setLoadingMedian,
  fetchSuburbPopulation,
}: {
  setSearched: React.Dispatch<React.SetStateAction<boolean>>;
  setNewSuburb: React.Dispatch<React.SetStateAction<string>>;
  setNewPostcode: React.Dispatch<React.SetStateAction<string>>;
  fetchOpenAIResponse: (
    suburb: string,
    postcode: string,
  ) => Promise<PriceHistoryResponse>;
  fetchSuburbPopulation: (
    suburb: string,
    postcode: string,
  ) => Promise<PriceHistoryResponse>;
  setLoadingMedian: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [results, setResults] = useState<Suburb[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);

  const fuseOptions = {
    keys: ["suburb_name", "postcode"],
    threshold: 0.3,
  };

  const fuse = new Fuse(suburbList, fuseOptions);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSuburb(val);
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

  const handleSelect = ({ suburb_name, postcode }: Suburb) => {
    setSuburb(suburb_name);
    setPostcode(postcode.toString());
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
    setNewSuburb(suburb);
    setNewPostcode(postcode);
    setSearched(true);
    setLoadingMedian(true);
    await fetchOpenAIResponse(suburb, postcode);
    await fetchSuburbPopulation(suburb, postcode);
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="mt-[5vh] w-[59vh] h-[7vh] shadow rounded-4xl flex flex-row items-center"
        style={{ backgroundColor: "#D9D9D9" }}
      >
        {/* for the background */}
        <div
          className="ml-[0.5vh] w-[40vh] h-[6vh] rounded-4xl bg-white flex flex-col relative"
          ref={inputRef}
        >
          {" "}
          {/* The white search bar */}
          <input
            className="w-full h-full text-left pl-3 rounded-4xl placeholder-[#111827] font-thin outline-none"
            placeholder="Suburb or Postcode..."
            value={suburb}
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
          onClick={handleSearch}
        >
          {" "}
          {/* Search button */}
          <img
            src={searchIcon}
            alt="filter icon"
            id="insight_search_button"
            width={"25"}
            height={"25"}
          />
          <p className="ml-2">Search</p>
        </div>
      </div>
    </div>
  );
}

export default InsightsSearchbar;
