import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { HelpCircle } from "lucide-react";
import Fuse from "fuse.js";
import suburbList from "../../assets/suburbs-nsw.json";
import axios from "axios";
import { BACKEND_URL } from "../../helpers";

interface ChangePreferencesProps {
  suburb: string;
  priceLowest: string;
  priceHighest: string;
  capitalGrowth: number;
  rentalYield: number;
  schoolProximity: number;
  transportProximity: number;
  onCancel: () => void;
}

// Elements and functions for the change preferences modal
function ChangePreferences({
  suburb: initialSuburb,
  priceLowest: initialPriceLowest,
  priceHighest: initialPriceHighest,
  capitalGrowth: initialCapitalGrowth,
  rentalYield: initialRentalYield,
  schoolProximity: initialSchoolProximity,
  transportProximity: initialTransportProximity,
  onCancel,
}: ChangePreferencesProps) {
  interface Suburb {
    suburb_name: string;
    postcode: string | number;
  }
  const [suburb, setSuburb] = useState(initialSuburb);
  const [showDropdown, setShowDropdown] = useState(false);
  const [results, setResults] = useState<Suburb[]>([]);
  const [priceLowest, setPriceLowest] = useState(initialPriceLowest);
  const [priceHighest, setPriceHighest] = useState(initialPriceHighest);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const token = localStorage.getItem("user_token");

  // Settings for fuzzy search of suburb
  const fuseOptions = {
    keys: ["suburb_name", "postcode"],
    threshold: 0.3,
  };

  // Opens the information modal
  const openModal = () => {
    if (modalRef.current) {
      modalRef.current.showModal();
    }
  };

  // Handles changes to suburb input and runs fuzzy search
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

  const handleSelect = (suburbName: string) => {
    setSuburb(suburbName);
    setShowDropdown(false);
  };

  // Handles clicking off the suburb input
  useEffect(() => {
    const onClickOutside = (e: globalThis.MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Runs error checks for user input and if passed, changes the users preferences
  const confirmClicked = async () => {
    if (suburb === "" || priceLowest === "" || priceHighest === "") {
      setError("Input fields cannot be empty");
      return;
    }

    const matchedSuburb = suburbList.find((s) => s.suburb_name === suburb);

    if (!matchedSuburb) {
      setError("Invalid suburb selected");
      return;
    }

    const selectedPostcode = matchedSuburb.postcode;

    if (Number(priceLowest) < 0) {
      setError("Lowest price cannot be negative");
      return;
    }
    if (Number(priceHighest) < 0) {
      setError("Lowest price cannot be negative");
      return;
    }
    if (Number(priceLowest) > Number(priceHighest)) {
      setError("Invalid price range");
      return;
    }

    // Changes stored preferences
    try {
      await axios.post(
        `${BACKEND_URL}/user/edit/preferences`,
        {
          suburb: suburb,
          postcode: selectedPostcode,
          priceLowest: priceLowest,
          priceHighest: priceHighest,
          capitalGrowth: capitalGrowth,
          rentalYield: rentalYield,
          proximityScore: proximityScore,
          schoolProximity: schoolProximity,
          transportProximity: transportProximity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      onCancel();
      setError("");
    } catch {
      setError("Unable to Update Preferences");
      return;
    }
  };

  // Sets slider data for preference inputs
  const [thumb1, setThumb1] = useState(initialCapitalGrowth);
  const [thumb2, setThumb2] = useState(
    initialCapitalGrowth + initialRentalYield,
  );
  const [schoolProximity, setSchoolProximity] = useState(
    initialSchoolProximity,
  );
  const [transportProximity, setTransportProximity] = useState(
    initialTransportProximity,
  );

  const capitalGrowth = thumb1;
  const rentalYield = thumb2 - thumb1;
  const proximityScore = 100 - thumb2;

  // Handles left slider thumb change
  const handleThumb1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Math.min(Number(e.target.value), thumb2);
    setThumb1(newVal);
  };

  // Handles right slider thumb change
  const handleThumb2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Math.max(Number(e.target.value), thumb1);
    setThumb2(newVal);
  };

  // Handles reset button for sliders
  const resetValues = () => {
    setThumb1(33);
    setThumb2(66);
    setSchoolProximity(50);
    setTransportProximity(50);
  };

  // Ensures values always add to 100 as a total
  const setProximityValues = (e: number) => {
    setSchoolProximity(e);
    setTransportProximity(100 - e);
  };

  // Resets the modal
  const cancelClicked = () => {
    setSuburb(initialSuburb);
    setPriceLowest(initialPriceLowest);
    setPriceHighest(initialPriceHighest);
    setThumb1(initialCapitalGrowth);
    setThumb2(initialCapitalGrowth + initialRentalYield);
    setSchoolProximity(initialSchoolProximity);
    setTransportProximity(initialTransportProximity);
    setError("");
    onCancel();
  };

  const fuse = new Fuse(suburbList, fuseOptions);

  return (
    <>
      <fieldset className="fieldset w-sm bg-base-100 border border-base-300 rounded-box p-4">
        <h1 className="text-3xl font-bold text-center">Edit Preferences</h1>
        <hr className="w-full border border-gray-300 my-4" />

        <div className="relative" ref={inputRef}>
          <label className="fieldset-label text-slate-900 mb-2">Suburb</label>
          {/* Suburb input */}
          <input
            type="text"
            value={suburb}
            onChange={handleInputChange}
            onFocus={() => {
              if (suburb.trim() !== "") setShowDropdown(true);
            }}
            placeholder="Select Suburb"
            className="input rounded-md w-90"
            autoComplete="off"
            readOnly={false}
          />
          {showDropdown && results.length > 0 && (
            <ul className="absolute z-50 w-full bg-white border border-gray-300 max-h-48 overflow-auto rounded-md shadow-md mt-1">
              {results.map(({ suburb_name, postcode }) => (
                <li
                  key={`${suburb_name}-${postcode}`}
                  onClick={() => handleSelect(suburb_name)}
                  className="cursor-pointer px-3 py-2 hover:bg-gray-200"
                >
                  {suburb_name} ({postcode})
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="join join-vertical">
          <label className="fieldset-label text-slate-900 mb-2">
            Price Range
          </label>
          {/* Price range input */}
          <div className="join">
            <label className="input rounded-md w-41 mr-2">
              <span className="label">$</span>
              <input
                type="number"
                placeholder="Lowest"
                value={priceLowest}
                onChange={(e) => setPriceLowest(e.target.value)}
              />
            </label>
            <label className="fieldset-label text-slate-900 text-2xl">-</label>
            <label className="input rounded-md w-42 ml-2">
              <span className="label">$</span>
              <input
                type="number"
                placeholder="Highest"
                value={priceHighest}
                onChange={(e) => setPriceHighest(e.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="join">
            <label className="fieldset-label text-slate-900 mt-2">
              Recommendation Scoring
            </label>
            <HelpCircle
              className="w-4 h-4 text-gray-500 cursor-pointer hover:text-blue-600 ml-1 mt-2"
              onClick={openModal}
            />
          </div>
          <button
            className="btn btn-active rounded-md btn-xs mt-2"
            onClick={resetValues}
          >
            Reset
          </button>
        </div>
        {/* Preference information modal */}
        <dialog ref={modalRef} className="modal">
          <div className="modal-box">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                ✕
              </button>
            </form>
            <h3 className="font-bold text-lg">Recommendation Scoring</h3>
            <p className="py-4">
              This website personalises your experience by running a cutting
              edge algorithm to find the best properties for you. To do this, we
              first need to guage your property buying priorities.
            </p>
            <p className="py-4">
              To do this, you simply need to input your level of importance for
              three factors, which are capital growth potential, rental yield
              and proximity to schools/transport. The percentage indicates their
              importance, with higher percentages meaning that factor is more
              important for you.
            </p>
            <p>
              You can also set the importance of prximity to schools and
              transport individually, ensuring that our recommendation system
              takes your most important needs into account.
            </p>
          </div>
        </dialog>
        <div className="w-full max-w-xl mx-auto mt-2 px-4">
          <div className="relative h-6 rounded-full border border-black overflow-hidden">
            <div
              className="absolute h-full bg-red-900"
              style={{ width: `${capitalGrowth}%` }}
            />
            <div
              className="absolute h-full bg-green-900"
              style={{ left: `${capitalGrowth}%`, width: `${rentalYield}%` }}
            />
            <div
              className="absolute h-full bg-blue-950"
              style={{
                left: `${capitalGrowth + rentalYield}%`,
                width: `${proximityScore + 1}%`,
              }}
            />

            {/* User preference sliders */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-black rounded-full z-20"
              style={{ left: `calc(${thumb1}% - 12px)` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-black rounded-full z-20"
              style={{ left: `calc(${thumb2}% - 12px)` }}
            />
          </div>

          <div className="relative -mt-6 h-6">
            <input
              type="range"
              min={0}
              max={thumb2}
              value={thumb1}
              onChange={handleThumb1Change}
              className="absolute cursor-ew-resize opacity-0"
              style={{
                left: 0,
                width: `${thumb2}%`,
                zIndex: 30,
              }}
            />

            <input
              type="range"
              min={thumb1}
              max={100}
              onChange={handleThumb2Change}
              className="absolute cursor-ew-resize opacity-0"
              style={{
                left: `${thumb1}%`,
                width: `${100 - thumb1}%`,
                zIndex: 40,
              }}
            />
          </div>

          {/* Values display */}
          <div className="join w-80">
            <div className="w-4 h-4 bg-red-900 rounded-full mt-4 mr-2"></div>
            <label className="fieldset-label text-slate-900 mt-4 !text-red-900">
              Capital Growth Potential: {capitalGrowth}%
            </label>
          </div>
          <div className="join w-80">
            <div className="w-4 h-4 bg-green-900 rounded-full mt-2 mr-2"></div>
            <label className="fieldset-label text-slate-900 mt-2 !text-green-900">
              Rental Yield: {rentalYield}%
            </label>
          </div>
          <div className="join w-80">
            <div className="w-4 h-4 bg-blue-950 rounded-full mt-2 mr-2"></div>
            <label className="fieldset-label text-slate-900 mt-2 !text-blue-950">
              Proximity to Schools/Transport: {proximityScore}%
            </label>
          </div>
        </div>

        {/* School/transport slider */}
        {proximityScore !== 0 && (
          <div className="flex justify-center mt-4 join-vertical px-4 mb-2">
            <input
              type="range"
              min={0}
              max={100}
              value={schoolProximity}
              onChange={(e) => setProximityValues(Number(e.target.value))}
              className="range range-warning range-md w-80"
            />
            <div className="join w-80">
              <div className="w-4 h-4 bg-amber-400 rounded-full mt-2 mr-2"></div>
              <label className="fieldset-label text-slate-900 mt-2 !text-amber-900">
                School Proximity: {schoolProximity}%
              </label>
            </div>
            <div className="join w-80">
              <div className="w-4 h-4 bg-black rounded-full mt-2 mr-2"></div>
              <label className="fieldset-label text-slate-900 mt-2 !text-black">
                Transport Proximity: {transportProximity}%
              </label>
            </div>
          </div>
        )}
        {/* Error encountered with submitting inputs */}
        {error && (
          <div role="alert" className="alert alert-warning mt-2 mb-0">
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
            <span>{error}</span>
          </div>
        )}

        {/* Confirm/Cancel Buttons */}
        <div className="join">
          <button
            onClick={confirmClicked}
            id="change_preferences_confirm"
            className="btn bg-blue-900 md:btn-md flex-1 mt-2 text-white hover:!bg-blue-700 rounded-l-lg rounded-r-none"
            name="login-button"
          >
            Confirm
          </button>
          <button
            onClick={cancelClicked}
            className="btn md:btn-md flex-1 mt-2 rounded-r-lg rounded-l-none"
            name="login-button"
          >
            Cancel
          </button>
        </div>
      </fieldset>
    </>
  );
}

export default ChangePreferences;
