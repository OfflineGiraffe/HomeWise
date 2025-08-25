function Filterpage({
  filters,
  setFilters,
  onClose,
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
  onClose: () => void;
  onApply: () => void;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  const priceOptions = [
    /* in dollars  */ { label: "Any", value: "Any" },
    { label: "$100k", value: "100000" },
    { label: "$200k", value: "200000" },
    { label: "$300k", value: "300000" },
    { label: "$400k", value: "400000" },
    { label: "$500k", value: "500000" },
    { label: "$600k", value: "600000" },
    { label: "$700k", value: "700000" },
    { label: "$800k", value: "800000" },
    { label: "$900k", value: "900000" },
    { label: "$1M+", value: "1000000" },
  ];

  const landSizeOptions = [
    /* in metres */ { label: "Any", value: "Any" },
    { label: "200m²", value: "200" },
    { label: "300m²", value: "300" },
    { label: "400m²", value: "400" },
    { label: "500m²", value: "500" },
  ];

  const bedroomOptions = ["Any", "1", "2", "3", "4", "5"];

  const carSpacesOptions = ["Any", "1", "2", "3", "4", "5"];

  const propertyTypeOptions = [
    "All",
    "House",
    "Townhouse",
    "Apartment & Unit",
    "Villa",
    "Retirement Living",
    "Land",
    "Acreage",
    "Rural",
    "Blocks of Units",
  ];

  const {
    minPrice,
    maxPrice,
    minBedrooms,
    maxBedrooms,
    minLandSize,
    maxLandSize,
    minCarSpaces,
    maxCarSpaces,
  } = filters;

  const filteredMaxPrice = priceOptions.filter(({ value }) => {
    if (minPrice === "Any") return true;
    return parseInt(minPrice) <= parseInt(value);
  });

  const filteredMaxBedrooms = bedroomOptions.filter((bedroom) => {
    if (minBedrooms === "Any") return true;
    return parseInt(bedroom) >= parseInt(minBedrooms);
  });

  const filteredMaxLandSize = landSizeOptions.filter(({ value }) => {
    if (minLandSize === "Any") return true;
    return parseInt(minLandSize) <= parseInt(value);
  });

  const filteredMaxCarSpaces = carSpacesOptions.filter((value) => {
    if (minCarSpaces === "Any") return true;
    return parseInt(minCarSpaces) <= parseInt(value);
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
        <div className="bg-white p-6 rounded-2xl w-full max-w-[80vh] max-h-[90vh] overflow-auto flex flex-col gap-4 relative items-center">
          <button
            onClick={onClose}
            className="absolute top-2 right-4 text-xl font-bold cursor-pointer"
          >
            ×
          </button>

          <h1 className="text-4xl">Filter</h1>
          <hr className="w-full border-1 border-main-300 my-4 mb-2" />

          <section className="w-full mt-5">
            <h1 className="font-bold mb-5 text-2xl">Property Type</h1>
            {/* Property type section */}
            <section className="grid grid-cols-2 gap-x-10 gap-y-2 w-full mb-2">
              {propertyTypeOptions.map((type) => (
                <li key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    className="checkbox rounded-[3px] border-2 border-main-300 mr-3"
                    checked={
                      filters.propertyTypes.includes("All")
                        ? type === "All"
                        : filters.propertyTypes.includes(type)
                    }
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setFilters((prev) => {
                        let updated: string[];

                        if (type === "All") {
                          // Prevent unchecking "All" if it's the only one selected
                          if (
                            !isChecked &&
                            prev.propertyTypes.length === 1 &&
                            prev.propertyTypes.includes("All")
                          ) {
                            return prev;
                          }
                          updated = isChecked ? ["All"] : [];
                        } else {
                          const withoutAllTypes = prev.propertyTypes.filter(
                            (t) => t !== "All",
                          );
                          if (isChecked) {
                            updated = [...withoutAllTypes, type];
                          } else {
                            updated = withoutAllTypes.filter((t) => t !== type);
                          }
                          if (updated.length === 0) {
                            updated = ["All"];
                          }
                        }
                        return { ...prev, propertyTypes: updated };
                      });
                    }}
                  />
                  <p>{type}</p>
                </li>
              ))}
            </section>

            {/* Price range section */}
            <section className="w-full mt-5">
              <h1 className="font-bold mb-5 text-2xl">Price Range</h1>

              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
                {/* Min */}
                <div className="flex flex-col">
                  <label className="text-sm mb-1">Min</label>
                  <select
                    className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full"
                    value={minPrice}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minPrice: e.target.value,
                      }))
                    }
                  >
                    {priceOptions.map(({ label, value }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hyphen */}
                <div className="pb-2 text-center text-lg font-light">–</div>

                {/* Max */}
                <div className="flex flex-col">
                  <label className="text-sm mb-1">Max</label>
                  <select
                    className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full"
                    value={maxPrice}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxPrice: e.target.value,
                      }))
                    }
                  >
                    {filteredMaxPrice.map(({ label, value }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Bedroom range section */}
            <section className="w-full mt-5">
              <h1 className="font-bold mb-5 text-2xl">Bedrooms</h1>

              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
                {/* Min */}
                <div className="flex flex-col">
                  <label className="text-sm mb-1">Min</label>
                  <select
                    className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full"
                    value={minBedrooms}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minBedrooms: e.target.value,
                      }))
                    }
                  >
                    {bedroomOptions.map((bedroom) => (
                      <option key={bedroom} value={bedroom}>
                        {bedroom}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hyphen */}
                <div className="pb-2 text-center text-lg font-light">–</div>

                {/* Max */}
                <div className="flex flex-col">
                  <label className="text-sm mb-1">Max</label>
                  <select
                    className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full"
                    value={maxBedrooms}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxBedrooms: e.target.value,
                      }))
                    }
                  >
                    {filteredMaxBedrooms.map((bedroom) => (
                      <option key={bedroom} value={bedroom}>
                        {bedroom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* CarSpaces range section */}
            <section className="w-full mt-5">
              <h1 className="font-bold mb-5 text-2xl">Car spaces</h1>

              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
                {/* Min */}
                <div className="flex flex-col">
                  <label className="text-sm mb-1">Min</label>
                  <select
                    className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full"
                    value={minCarSpaces}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minCarSpaces: e.target.value,
                      }))
                    }
                  >
                    {carSpacesOptions.map((CarSpaces) => (
                      <option key={CarSpaces} value={CarSpaces}>
                        {CarSpaces}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hyphen */}
                <div className="pb-2 text-center text-lg font-light">–</div>

                {/* Max */}
                <div className="flex flex-col">
                  <label className="text-sm mb-1">Max</label>
                  <select
                    className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full"
                    value={maxCarSpaces}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxCarSpaces: e.target.value,
                      }))
                    }
                  >
                    {filteredMaxCarSpaces.map((CarSpaces) => (
                      <option key={CarSpaces} value={CarSpaces}>
                        {CarSpaces}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* landsize range section */}
            <section className="w-full mt-5">
              <h1 className="font-bold mb-5 text-2xl">Land Size</h1>

              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
                {/* Min */}
                <div className="flex flex-col">
                  <label className="text-sm mb-1">Min</label>
                  <select
                    className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full"
                    value={minLandSize}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minLandSize: e.target.value,
                      }))
                    }
                  >
                    {landSizeOptions.map(({ label, value }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hyphen */}
                <div className="pb-2 text-center text-lg font-light">–</div>

                {/* Max */}
                <div className="flex flex-col">
                  <label className="text-sm mb-1">Max</label>
                  <select
                    className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full"
                    value={maxLandSize}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxLandSize: e.target.value,
                      }))
                    }
                  >
                    {filteredMaxLandSize.map(({ label, value }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <div className="flex flex-col items-center mt-10">
              <button
                className="btn w-full max-w-xs bg-blue-900 hover:!bg-blue-700 text-white"
                onClick={() => {
                  setPage(0); // reset page
                  onApply(); // trigger fetch
                  onClose(); // close modal
                }}
              >
                Apply
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default Filterpage;
