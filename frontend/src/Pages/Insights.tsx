import InsightsSearchbar from "./components/InsightsSearchbar";
import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import Chart from "chart.js/auto";
import { useRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import CountUp from "react-countup";
import { BACKEND_URL } from "../helpers";

interface PriceHistoryResponse {
  median_house_price_quarterly: Record<string, number>[];
}

const googleMapsAPIkey = import.meta.env.VITE_GMAPS_API_KEY;

// Elements and functions for the suburb insights page
function Insights() {
  const token = localStorage.getItem("user_token");
  const [searched, setSearched] = useState(false);
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  // Median prices chart labels
  const [medianChartLabel, setMedianChartLabel] = useState<string[]>([
    "2024 Q1",
    "2024 Q2",
    "2024 Q3",
    "2024 Q4",
  ]);
  const fiveYearLabel = [
    "2020 Q1",
    "2020 Q4",
    "2021 Q1",
    "2021 Q4",
    "2022 Q1",
    "2022 Q4",
    "2023 Q1",
    "2023 Q4",
    "2024 Q1",
    "2024 Q4",
  ];
  const threeYearLabel = [
    "2022 Q1",
    "2022 Q2",
    "2022 Q3",
    "2022 Q4",
    "2023 Q1",
    "2023 Q2",
    "2023 Q3",
    "2023 Q4",
    "2024 Q1",
    "2024 Q2",
    "2024 Q3",
    "2024 Q4",
  ];
  const oneYearLabel = ["2024 Q1", "2024 Q2", "2024 Q3", "2024 Q4"];
  const [loadingMedian, setLoadingMedian] = useState(true);
  const [totalChartData, setTotalChartData] = useState<number[]>([]);
  const [medianChartData, setMedianChartData] = useState<number[]>([]);
  const [medianChartMin, setMedianChartMin] = useState(500000);
  const [medianChartMax, setMedianChartMax] = useState(1500000);
  const [oneYearSelected, setOneYearSelected] = useState(true);
  const [threeYearSelected, setThreeYearSelected] = useState(false);
  const [fiveYearSelected, setFiveYearSelected] = useState(false);
  const [chartAverage, setChartAverage] = useState(0);
  const [medianPercentage, setMedianPercentage] = useState(0);
  const [population, setPopulation] = useState(0);
  const [averageRent, setAverageRent] = useState<number | null>(null);
  const [crimeIndex, setCrimeIndex] = useState<string | null>(null);
  const [walkability, setWalkability] = useState<string | null>(null);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Draw median price chart
  useEffect(() => {
    if ((token || searched) && chartRef.current) {
      // Destroy old chart instance if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const datapoints = medianChartData;
      const labels = medianChartLabel;
      const data = {
        labels,
        datasets: [
          {
            label: "Median House Price",
            data: datapoints,
            borderColor: "rgb(255, 99, 132)",
            fill: true,
            tension: 0.4,
          },
        ],
      };

      const config = {
        type: "line" as const,
        data,
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
            },
          },
          interaction: {
            intersect: false,
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
              },
            },
            y: {
              display: true,
              title: {
                display: true,
                text: "House Price ($AUD)",
              },
              suggestedMin: medianChartMin,
              suggestedMax: medianChartMax,
            },
          },
        },
      };

      chartInstanceRef.current = new Chart(chartRef.current, config);
    }
  }, [token, searched, medianChartData]);

  // Get user suburb and postcode
  const fetchUserData = useCallback(async () => {
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { suburb, postcode } = response.data.preferences;

      setSuburb(suburb);
      setPostcode(postcode);

      if (totalChartData.length === 0) {
        await fetchOpenAIResponse(suburb, postcode);
      }

      await fetchSuburbPopulation(suburb, postcode);
      await fetchSuburbExtras(suburb, postcode);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Get median price data
  const fetchOpenAIResponse = async (suburb: string, postcode: string) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/suburb/price-history`, {
        suburb,
        postcode,
      });
      const totalData = getOrderedPriceArray(response.data);
      setTotalChartData(totalData);
      const lastFour = totalData.slice(-4);
      setMedianChartData(lastFour);
      const { min, max } = getMinMaxRoundedTo100k(lastFour);
      setMedianChartMin(min);
      setMedianChartMax(max);
      setChartAverage(
        lastFour.reduce((sum, val) => sum + val, 0) / lastFour.length,
      );
      setLoadingMedian(false);
      setMedianChartLabel(oneYearLabel);
      setThreeYearSelected(false);
      setFiveYearSelected(false);
      setOneYearSelected(true);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch suburb price history:", error);
    }
  };

  // Get suburb population data
  const fetchSuburbPopulation = async (suburb: string, postcode: string) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/suburb/population`, {
        suburb,
        postcode,
      });
      const raw = String(response.data);
      const number = Number(raw.replace(/,/g, ""));
      setPopulation(number);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch suburb price history:", error);
    }
  };

  // Get further suburb info on crime, walkability and rent
  const fetchSuburbExtras = async (suburb: string, postcode: string) => {
    setLoadingExtras(true);
    try {
      const [rentRes, crimeRes, walkRes] = await Promise.all([
        axios.post(`${BACKEND_URL}/suburb/average-rent`, { suburb, postcode }),
        axios.post(`${BACKEND_URL}/suburb/crime-index`, { suburb, postcode }),
        axios.post(`${BACKEND_URL}/suburb/walkability`, { suburb, postcode }),
      ]);

      setAverageRent(Number(rentRes.data));
      setCrimeIndex(String(crimeRes.data));
      setWalkability(String(walkRes.data));
    } catch (err) {
      console.error("Failed to fetch suburb extras", err);
    } finally {
      setLoadingExtras(false);
    }
  };
  useEffect(() => {
    if (suburb && postcode) {
      setAverageRent(null);
      setCrimeIndex(null);
      setWalkability(null);
      setLoadingExtras(true);

      fetchSuburbExtras(suburb, postcode);
    }
  }, [suburb, postcode]);

  // Get data as quarters
  function getOrderedPriceArray(priceHistory: PriceHistoryResponse | null) {
    if (!priceHistory) return [];

    const mergedData: Record<string, number> =
      priceHistory.median_house_price_quarterly.reduce(
        (acc, obj) => ({ ...acc, ...obj }),
        {},
      );

    const sortedQuarters = Object.keys(mergedData).sort((a, b) => {
      const [yearA, quarterA] = a.split(" Q").map(Number);
      const [yearB, quarterB] = b.split(" Q").map(Number);

      if (yearA !== yearB) return yearA - yearB;
      return quarterA - quarterB;
    });

    return sortedQuarters.map((q) => mergedData[q]);
  }

  // Get chart minimum and maximum for y axis
  function getMinMaxRoundedTo100k(values: number[]): {
    min: number;
    max: number;
  } {
    if (values.length === 0) return { min: 0, max: 0 };

    const filteredValues = values.filter((v) => v !== null && !isNaN(v));
    if (filteredValues.length === 0) return { min: 0, max: 0 };

    const minValue = Math.min(...filteredValues);
    const maxValue = Math.max(...filteredValues);

    const percentageChange =
      minValue === 0 ? 0 : ((maxValue - minValue) / minValue) * 100;

    setMedianPercentage(percentageChange);

    const minRounded = minValue - 50000;
    const maxRounded = maxValue + 50000;

    return { min: minRounded, max: maxRounded };
  }

  // One year chart
  const oneYearHit = () => {
    setMedianChartLabel(oneYearLabel);
    const lastFour = totalChartData.slice(-4);
    setMedianChartData(lastFour);
    const { min, max } = getMinMaxRoundedTo100k(lastFour);
    setMedianChartMin(min);
    setMedianChartMax(max);
    setChartAverage(
      lastFour.reduce((sum, val) => sum + val, 0) / lastFour.length,
    );
    setThreeYearSelected(false);
    setFiveYearSelected(false);
    setOneYearSelected(true);
  };

  // Three year chart
  const threeYearHit = () => {
    setMedianChartLabel(threeYearLabel);
    const lastTwelve = totalChartData.slice(-12);
    setMedianChartData(lastTwelve);
    const { min, max } = getMinMaxRoundedTo100k(lastTwelve);
    setMedianChartMin(min);
    setMedianChartMax(max);
    setChartAverage(
      lastTwelve.reduce((sum, val) => sum + val, 0) / lastTwelve.length,
    );
    setFiveYearSelected(false);
    setOneYearSelected(false);
    setThreeYearSelected(true);
  };

  // Five year chart
  const fiveYearHit = () => {
    setMedianChartLabel(fiveYearLabel);
    const indices = [0, 3, 4, 7, 8, 11, 12, 15, 16, 19];
    const data = indices.map((i) => totalChartData[i] ?? null);
    setMedianChartData(data);
    const { min, max } = getMinMaxRoundedTo100k(data);
    setMedianChartMin(min);
    setMedianChartMax(max);
    setChartAverage(data.reduce((sum, val) => sum + val, 0) / data.length);
    setOneYearSelected(false);
    setThreeYearSelected(false);
    setFiveYearSelected(true);
  };

  // Tables for Primary and High School rankings
  const [primarySchools, setPrimarySchools] = useState<
    { name: string; rank: number }[]
  >([]);
  const [highSchools, setHighSchools] = useState<
    { name: string; rank: number }[]
  >([]);
  const [loadingSchools, setLoadingSchools] = useState(true);

  const fetchSchoolData = useCallback(async () => {
    setLoadingSchools(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/suburb/schools`, {
        suburb,
        postcode,
      });

      const primaries = response.data.primary.sort(
        (
          a: { name: string; rank: number },
          b: { name: string; rank: number },
        ) => a.rank - b.rank,
      );

      const highs = response.data.high.sort(
        (
          a: { name: string; rank: number },
          b: { name: string; rank: number },
        ) => a.rank - b.rank,
      );

      setPrimarySchools(primaries);
      setHighSchools(highs);
    } catch (err) {
      console.error("Failed to fetch school data", err);
    } finally {
      setLoadingSchools(false);
    }
  }, [suburb, postcode]);

  useEffect(() => {
    if (suburb && postcode) {
      fetchSchoolData();
    }
  }, [fetchSchoolData]);

  // Table for suburb's transport infrastructure
  const [transportInfrastructure, setTransportInfrastructure] = useState<
    { name: string; description: string; type: string }[]
  >([]);
  const [loadingTransport, setLoadingTransport] = useState(true);

  const fetchTransportData = useCallback(async () => {
    setLoadingTransport(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/suburb/transport`, {
        suburb,
        postcode,
      });
      setTransportInfrastructure(response.data);
    } catch (err) {
      console.error("Failed to fetch transport data", err);
    } finally {
      setLoadingTransport(false);
    }
  }, [suburb, postcode]);

  useEffect(() => {
    if (suburb && postcode) {
      fetchTransportData();
    }
  }, [fetchTransportData]);

  // Table for suburb's features and attractions
  const [suburbFeatures, setSuburbFeatures] = useState<
    { name: string; description: string; category: string }[]
  >([]);
  const [loadingFeatures, setLoadingFeatures] = useState(true);

  const fetchSuburbFeatures = useCallback(async () => {
    setLoadingFeatures(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/suburb/features`, {
        suburb,
        postcode,
      });
      setSuburbFeatures(response.data);
    } catch (err) {
      console.error("Failed to fetch suburb features", err);
    } finally {
      setLoadingFeatures(false);
    }
  }, [suburb, postcode]);

  useEffect(() => {
    if (suburb && postcode) {
      fetchSuburbFeatures();
    }
  }, [suburb, postcode]);

  return (
    <>
      <div
        className={`w-full px-20 ${token || searched ? "mt-8" : "mt-35"} flex justify-center transition-all duration-500 ease-in-out`}
      >
        <div className="bg-white w-[80%] border-blue-950 border rounded-lg">
          <div className="flex items-center justify-center w-full mt-6 mb-8 w-full">
            <p className="text-4xl font-bold">Suburb Insights</p>
          </div>
          <div className="join w-full">
            <div className="join join-vertical w-[50%] items-center">
              <p className="text-2xl font-bold mt-10">
                Search for your Suburb to get Insights
              </p>
              <p className="text-lg mt-10 w-[60%] text-center">
                Choosing a suburb can be hard... but we make it easier by
                providing you with some helpful information on each suburb
              </p>
              {/* Suburb searchbar */}
              <InsightsSearchbar
                fetchOpenAIResponse={fetchOpenAIResponse}
                setSearched={setSearched}
                setNewSuburb={setSuburb}
                setNewPostcode={setPostcode}
                setLoadingMedian={setLoadingMedian}
                fetchSuburbPopulation={fetchSuburbPopulation}
              />
            </div>

            <img
              className="rounded rounded-lg w-[45%] mb-5"
              src="https://www.ft.com/__origami/service/image/v2/images/raw/http%3A%2F%2Fcom.ft.imagepublish.upp-prod-eu.s3.amazonaws.com%2F92aa8564-00fb-11e5-a60e-00144feabdc0?source=next-article&fit=scale-down&quality=highest&width=700&dpr=1"
            />
          </div>
        </div>
      </div>
      {/* Suburb insights data */}
      <div className="w-full px-20 mt-8">
        {(token || searched) && (
          <div className="bg-blue-100 w-full border-blue-950 border rounded-lg px-10">
            <p className="text-4xl font-bold mt-6 mb-8 w-full flex items-center justify-center">
              {suburb}
              {" - "} {postcode}
            </p>
            <div className="w-full flex justify-center mb-4">
              <div className="bg-gray-100 text-gray-600 italic text-sm px-4 py-2 rounded-md border border-gray-300">
                Information on this page is AI-generated or estimated.
                Information may be inaccurate. Please review any important
                details.
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 mb-6">
              {/* Population */}
              <div className="bg-base-100 rounded-lg h-[200px] flex flex-col border">
                <p className="text-xl font-bold text-center border-b py-4">
                  Population
                </p>
                {loadingMedian ? (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <CountUp
                      end={population}
                      duration={2}
                      separator=","
                      className="text-4xl font-bold text-center"
                    />
                  </div>
                )}
              </div>

              {/* Average Rent */}
              <div className="bg-base-100 rounded-lg h-[200px] flex flex-col border">
                <p className="text-xl font-bold text-center border-b py-4">
                  Avg. Rent
                </p>
                {loadingExtras ? (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <CountUp
                      end={averageRent || 0}
                      duration={2}
                      separator=","
                      prefix="$"
                      className="text-4xl font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Crime Index */}
              <div className="bg-base-100 rounded-lg h-[200px] flex flex-col border">
                <p className="text-xl font-bold text-center border-b py-4">
                  Crime Index
                </p>
                {loadingExtras ? (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-4xl font-bold">{crimeIndex}</p>
                  </div>
                )}
              </div>

              {/* Walkability */}
              <div className="bg-base-100 rounded-lg h-[200px] flex flex-col border">
                <p className="text-xl font-bold text-center border-b py-4">
                  Walkability
                </p>
                {loadingExtras ? (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-4xl font-bold">{walkability}</p>
                  </div>
                )}
              </div>
            </div>
            {/* Google Maps iframe of suburb */}
            <div className="w-full mt-8">
              <div className="border border-sky-900 rounded-xl shadow-md overflow-hidden w-full h-[300px]">
                <iframe
                  className="w-full h-full"
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps/embed/v1/place?key=${googleMapsAPIkey}&q=${encodeURIComponent(`${suburb}, ${postcode}, Australia`)}`}
                ></iframe>
              </div>
            </div>

            {/* Median house prices */}
            <div
              className={`w-full mt-6 mb-6 bg-base-100 rounded-xl border border-blue-950 shadow-md overflow-hidden transition-all duration-200 ease-in-out ${
                loadingMedian ? "h-[500px]" : "h-auto"
              }`}
            >
              <div className="w-full">
                <p className="text-2xl font-bold text-center rounded-lg pt-8 pb-5">
                  Median House Prices
                </p>
              </div>
              {loadingMedian && (
                <div className="flex items-center justify-center h-full">
                  <span className="loading loading-spinner loading-xl"></span>
                </div>
              )}
              {!loadingMedian && (
                <>
                  <div className="join gap-4 w-full pt-5 pl-10 pr-10">
                    <p className="ml-5">
                      <span className="font-bold text-lg">
                        Median House Price:
                      </span>{" "}
                      $
                      {chartAverage.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="ml-5">
                      <span className="font-bold text-lg">
                        Percentage Change:
                      </span>{" "}
                      <span
                        className={
                          medianPercentage >= 0
                            ? "text-green-800"
                            : "text-red-700"
                        }
                      >
                        (
                        {medianPercentage.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                        %)
                        <span className="inline-block align-middle ml-1">
                          {medianPercentage > 0 && <TrendingUp />}
                          {medianPercentage < 0 && <TrendingDown />}
                        </span>
                      </span>
                    </p>
                    <button
                      className={`btn rounded-lg ml-auto ${oneYearSelected ? "bg-secondary text-white" : ""}`}
                      onClick={oneYearHit}
                    >
                      1-Year
                    </button>
                    <button
                      className={`btn rounded-lg ${threeYearSelected ? "bg-secondary text-white" : ""}`}
                      onClick={threeYearHit}
                    >
                      3-Year
                    </button>
                    <button
                      className={`btn rounded-lg mr-5 ${fiveYearSelected ? "bg-secondary text-white" : ""}`}
                      onClick={fiveYearHit}
                    >
                      5-Year
                    </button>
                  </div>
                  <canvas ref={chartRef} className="pl-10 pr-10"></canvas>
                </>
              )}
            </div>
            <div className="flex justify-between items-center w-full px-4 mt-2"></div>
            <div className="w-full mt-6 mb-6 bg-base-100 rounded-xl p-8 border border-blue-950 shadow-md">
              <p className="text-2xl font-bold text-left rounded-lg pb-5">
                Local School Rankings
              </p>
              <p className="text-sm italic text-gray-600 mb-6">
                School rankings shown here are AI-estimated based on academic
                performance. Please verify with official sources.
              </p>

              {loadingSchools ? (
                <div className="flex items-center justify-center h-40">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row w-full gap-10">
                  {/* Primary Schools Table */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">
                      Primary Schools
                    </h3>
                    <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                      <tbody>
                        {primarySchools.map((school) => (
                          <tr
                            key={school.name}
                            className="border-b border-gray-200 hover:bg-gray-50 transition"
                          >
                            <td className="p-4 text-left text-gray-700">
                              {school.name}
                            </td>
                            <td className="p-4 text-right font-semibold text-gray-900">
                              {school.rank}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* High Schools Table */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">
                      High Schools
                    </h3>
                    <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                      <tbody>
                        {highSchools.map((school) => (
                          <tr
                            key={school.name}
                            className="border-b border-gray-200 hover:bg-gray-50 transition"
                          >
                            <td className="p-4 text-left text-gray-700">
                              {school.name}
                            </td>
                            <td className="p-4 text-right font-semibold text-gray-900">
                              {school.rank}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            {/* Suburb transport options table */}
            <div className="w-full mt-6 mb-6 bg-base-100 rounded-xl p-8 border border-blue-950 shadow-md">
              <p className="text-2xl font-bold text-left rounded-lg pb-5">
                Transport Infrastructure
              </p>
              <p className="text-sm italic text-gray-600 mb-6">
                Transport information shown here is AI-generated and may be
                inaccurate. Please verify schedules and routes with official
                transport authorities.
              </p>

              {loadingTransport ? (
                <div className="flex items-center justify-center h-40">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <div className="w-full">
                  {transportInfrastructure.length > 0 ? (
                    <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-4 text-left font-semibold text-gray-800 border-b border-gray-300">
                            Transport Hub
                          </th>
                          <th className="p-4 text-left font-semibold text-gray-800 border-b border-gray-300">
                            Connections
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {transportInfrastructure.map((transport, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-200 hover:bg-gray-50 transition"
                          >
                            <td className="p-4 text-left text-gray-700">
                              <div className="flex items-center">
                                <span className="font-medium">
                                  {transport.name}
                                </span>
                                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  {transport.type}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-left text-gray-600">
                              {transport.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No transport infrastructure data available for this area.
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Suburb features table */}
            <div className="w-full mt-6 mb-6 bg-base-100 rounded-xl p-8 border border-blue-950 shadow-md">
              <p className="text-2xl font-bold text-left rounded-lg pb-5">
                Major Suburb Features
              </p>
              <p className="text-sm italic text-gray-600 mb-6">
                Features and amenities shown here are AI-generated based on
                available data.
              </p>

              {loadingFeatures ? (
                <div className="flex items-center justify-center h-40">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <div className="w-full">
                  {suburbFeatures.length > 0 ? (
                    <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-4 text-left font-semibold text-gray-800 border-b border-gray-300">
                            Feature / Amenity
                          </th>
                          <th className="p-4 text-left font-semibold text-gray-800 border-b border-gray-300">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {suburbFeatures.map((feature, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-200 hover:bg-gray-50 transition"
                          >
                            <td className="p-4 text-left text-gray-700">
                              <div className="flex items-center">
                                <span className="font-medium">
                                  {feature.name}
                                </span>
                                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  {feature.category}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-left text-gray-600">
                              {feature.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No major features data available for this area.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Insights;
