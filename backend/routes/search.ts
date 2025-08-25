export interface SearchParameters {
  suburb?: string;
  postcode?: string;
  state?: string;
  minPrice?: string;
  maxPrice?: string;
  minBedrooms?: string;
  maxBedrooms?: string;
  minLandSize?: string;
  maxLandSize?: string;
  minCarSpaces?: string;
  maxCarSpaces?: string;
  propertyTypes?: string[];
  sortBy?: "date" | "price";
  ascending?: "true" | "false"; // true if oldest properties wanted first
  start?: number; // 0-based start index of results (for pagination)
  end?: number; // 0-based end index of results
  sold?: boolean;
}

// to make constructing the mongodb query object easier
interface LooseObject {
  // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
  [key: string]: Object;
}

interface RangeType {
  $gte?: number;
  $lte?: number;
}

import { Property } from "./property";
import { PropertyData, findBy } from "../data";
import { agentInfo } from "./agent";

/**
 * Searches the database for properties that meet the given search criteria and
 * returns them in an array.
 *
 * @param {SearchParameters} searchParams - object with search filters
 * @returns {Property[]} array of Properties that meet the search criteria
 */
export async function filteredPropertySearch(
  searchParams: SearchParameters,
): Promise<Property[]> {
  // MongoDB query object
  const queryObject: LooseObject = {};

  if (searchParams.suburb !== undefined) {
    queryObject.suburb = searchParams.suburb;
  }
  if (searchParams.postcode !== undefined) {
    queryObject.postcode = searchParams.postcode;
  }
  if (searchParams.state !== undefined) {
    queryObject.state = searchParams.state;
  }
  if (searchParams.sold !== undefined) {
    queryObject.state = searchParams.sold;
  }

  // PRICE RANGE
  const priceFilter: RangeType = {};
  if (searchParams.minPrice !== undefined) {
    priceFilter.$gte = parseInt(searchParams.minPrice);
  }
  if (searchParams.maxPrice !== undefined) {
    priceFilter.$lte = parseInt(searchParams.maxPrice);
  }
  if (Object.keys(priceFilter).length > 0) {
    queryObject.price = priceFilter;
  }

  // BEDROOM RANGE
  const bedFilter: RangeType = {};
  if (searchParams.minBedrooms !== undefined) {
    bedFilter.$gte = parseInt(searchParams.minBedrooms);
  }
  if (searchParams.maxBedrooms !== undefined) {
    bedFilter.$lte = parseInt(searchParams.maxBedrooms);
  }
  if (Object.keys(bedFilter).length > 0) {
    queryObject.bedrooms = bedFilter;
  }

  // LAND SIZE RANGE
  const landFilter: RangeType = {};
  if (searchParams.minLandSize !== undefined) {
    landFilter.$gte = parseInt(searchParams.minLandSize);
  }
  if (searchParams.maxLandSize !== undefined) {
    landFilter.$lte = parseInt(searchParams.maxLandSize);
  }
  if (Object.keys(landFilter).length > 0) {
    queryObject.landSizeM2 = landFilter;
  }

  // CAR SPOTS RANGE
  const carSpacesFilter: RangeType = {};
  if (searchParams.minCarSpaces !== undefined) {
    carSpacesFilter.$gte = parseInt(searchParams.minCarSpaces, 10);
  }
  if (searchParams.maxCarSpaces !== undefined) {
    carSpacesFilter.$lte = parseInt(searchParams.maxCarSpaces, 10);
  }
  if (Object.keys(carSpacesFilter).length > 0) {
    queryObject.carSpaces = carSpacesFilter;
  }

  if (
    searchParams.propertyTypes !== undefined &&
    searchParams.propertyTypes[0] !== "All"
  ) {
    queryObject.type = { $in: searchParams.propertyTypes };
  }

  const sortField = searchParams.sortBy === "price" ? "price" : "createdAt";
  const sortOrder: 1 | -1 = searchParams.ascending === "true" ? 1 : -1;

  const hasFilters = Object.keys(searchParams).length > 0;
  const effectiveStart = searchParams.start ?? 0; // [0..4] so it returns first 5 by default
  const effectiveEnd =
    searchParams.end !== undefined ? searchParams.end : hasFilters ? -1 : 4;

  let properties = await findBy(
    PropertyData,
    queryObject,
    {
      sort: { [sortField]: sortOrder },
    },
    effectiveStart,
    effectiveEnd,
  );

  properties = await Promise.all(
    properties.map(async (property) => {
      const agent = await agentInfo(property.agent);
      return {
        _id: property._id,
        streetNumber: property.streetNumber,
        street: property.street,
        suburb: property.suburb,
        postcode: property.postcode,
        state: property.state,
        location: property.location,
        capGrowthPct: property.capGrowthPct,
        rentalYieldPct: property.rentalYieldPct,
        growthScore: property.growthScore,
        yieldScore: property.yieldScore,
        schoolScore: property.schoolScore,
        transportScore: property.transportScore,
        agent: agent,
        description: property.string,
        images: property.images,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        carSpaces: property.carSpaces,
        landSizeM2: property.landSizeM2,
        price: property.price,
        type: property.type,
        sold: property.sold,
      };
    }),
  );

  return properties;
}
