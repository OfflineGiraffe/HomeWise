import { Client } from "@googlemaps/google-maps-services-js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({});
const GOOGLE_API_KEY = process.env.GMAPS_API_KEY as string;

export interface Amenity {
  name: string;
  type: string;
  address: string;
  distance_meters: number;
}

export const propertyTypeOptions = [
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

export interface Property {
  _id: string;
  streetNumber: string;
  street: string;
  suburb: string;
  postcode: string;
  state: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // lng, lat
  };
  capGrowthPct: number; // projected capital growth integer % in 1 year
  rentalYieldPct: number; // projected 1-year rental income as integer % of property value
  // objective scores (between [0,1], 1 = perfect, 0 = worst)
  growthScore: number;
  yieldScore: number;
  schoolScore: number;
  transportScore: number;
  agent: Agent;
  description: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  carSpaces: number;
  landSizeM2: number;
  price: number;
  type: string;
  sold: boolean;
}

export interface UploadedProperty {
  // only the attributes needed for upload
  streetNumber: string;
  street: string;
  suburb: string;
  postcode: string;
  state: string;
  capGrowthPct: number;
  rentalYieldPct: number;
  agent: string; // id
  description: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  carSpaces: number;
  landSizeM2: number;
  price: number;
  type: string;
  sold?: boolean;
}

import {
  PropertyData,
  User,
  findId,
  update,
  savedProperty,
  add,
} from "../data";
import { Agent, agentInfo } from "./agent";
import { findLatLong, haversineDistance } from "./helper";
import { getObjectivePropertyRating } from "./recommender";

/**
 * Retrieves property info for the property with the given ID in the database.
 * To be used asynchronously with `await`.
 * @param id - unique id of the property
 * @returns `Property` object containing name, address, suburb, postcode, state, Agent object and description
 * @throws `Error` if property not found or error occurs calling `findId()`
 */
export async function propertyInfo(id: string): Promise<Property> {
  try {
    let property = await findId(PropertyData, id); // not Property but the propertyDataSchema in data.ts
    if (!property) {
      throw Error();
    } else {
      const agent = await agentInfo(property.agent);
      property = {
        // This was the only way that worked. Don't ask me why.
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
        description: property.description,
        images: property.images,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        carSpaces: property.carSpaces,
        landSizeM2: property.landSizeM2,
        price: property.price,
        type: property.type,
        sold: property.sold,
      };
      return property;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    throw Error("property not found");
  }
}

/**
   Save Property.
   @param userId of user with saved proerties
   @param propId property to be saved
 * @returns A string which outlines the status of the process
 */
export async function bookmarkProperty(
  propId: string,
  userId: string,
): Promise<string> {
  try {
    const user = await findId(User, userId);
    const savedProps: Array<savedProperty> = user.savedProperties;

    if (savedProps.findIndex((a) => a.id === propId) != -1) {
      return "Property has already been saved.";
    }

    const newSaved: savedProperty = { id: propId, note: "" };
    savedProps.push(newSaved);

    user.savedProperties = savedProps;
    await update(user);

    return "Succesfully added property to user";
  } catch (_) {
    return "Error:" + _;
  }
}

/**
   Remove Saved Property.
   @param userId of user with saved proerties
   @param propId property to be un-saved
 * @returns A string which outlines the status of the process
 */
export async function removeBookmark(
  propId: string,
  userId: string,
): Promise<string> {
  try {
    const user = await findId(User, userId);
    const savedProps: Array<savedProperty> = user.savedProperties;
    const loc = savedProps.findIndex((a) => a.id === propId);

    if (loc == -1) {
      return "Property doesn't exist.";
    }

    savedProps.splice(loc, 1);

    user.savedProperties = savedProps;
    await update(user);

    return "Succesfully removed property from user";
  } catch (_) {
    return "Error:" + _;
  }
}
/**
 * Finds nearby amenities for a given property
 * @param property - the full property object
 * @param limit - max number of amenities per category
 * @returns list of amenities with type, name, address, and distance
 */
export async function getGeneralAmenities(
  property: Property,
  limit = 1,
  radius = 10000,
): Promise<Amenity[]> {
  try {
    const address = `${property.streetNumber} ${property.street}, ${property.suburb}, ${property.state} ${property.postcode}`;
    const location = await findLatLong(address);

    const placeTypes = [
      "school",
      "bus_station",
      "train_station",
      "park",
      "convenience_store",
    ];
    const allResults: Amenity[] = [];

    for (const type of placeTypes) {
      const amenities = await getRequestedNearbyAmenity(
        location,
        type,
        limit,
        radius,
      );
      allResults.push(...amenities);
    }

    allResults.sort((a, b) => a.distance_meters - b.distance_meters);
    return allResults;
  } catch (err) {
    console.error("Amenity fetch error:", err);
    return [];
  }
}
/**
 * Finds nearby specific amenity for a given location
 * @param location - Lat-long object to search in the vicinity of
 * @param type - max number of amenities per category
 * @returns Array of one object: the amenity, the type of amenity, the address of the amenity and the distance from the latlong provided
 */
export async function getRequestedNearbyAmenity(
  location: { lat: number; lng: number },
  type: string,
  limit = 1,
  radius = 10000,
): Promise<Amenity[]> {
  try {
    const nearbyRes = await client.placesNearby({
      params: {
        location,
        radius: radius,
        type,
        key: GOOGLE_API_KEY,
      },
    });

    const places = nearbyRes.data.results.slice(0, limit);
    const results: Amenity[] = [];

    for (const place of places) {
      if (!place.geometry || !place.geometry.location) continue;

      results.push({
        name: place.name || "Unnamed",
        type,
        address: place.vicinity || "Unknown",
        distance_meters: haversineDistance(location, place.geometry.location),
      });
    }

    return results;
  } catch (err) {
    console.error(`Error fetching amenities of type "${type}":`, err);
    return [];
  }
}

/**
 * Uploads the given properties to the database,
 * after calculating and setting coordinates and objective scores.
 * (THIS IS A PLACEHOLDER UNTIL EXTERNAL API DATA FOR PROPERTIES CAN BE USED)
 * @param properties - array of properties to upload to db
 */
export async function uploadProperties(properties: UploadedProperty[]) {
  for (const property of properties) {
    // calculate coordinates
    const coordinates = await findLatLong(
      `${property.streetNumber} ${property.street}, ${property.suburb}, ${property.state} ${property.postcode}`,
    );

    // calculate objective scores
    const scores = await getObjectivePropertyRating({
      capGrowthPct: property.capGrowthPct,
      rentalYieldPct: property.rentalYieldPct,
      postcode: property.postcode,
      suburb: property.suburb,
      location: coordinates,
    });

    if (property.sold === undefined) {
      property.sold = false;
    }

    // add to db
    add(PropertyData, {
      ...property,
      growthScore: scores.growthScore,
      yieldScore: scores.yieldScore,
      schoolScore: scores.schoolScore,
      transportScore: scores.transportScore,
      location: {
        type: "Point",
        coordinates: [coordinates.lng, coordinates.lat],
      },
    });
  }
}

/**
   User History function.
   @param userId of user viewing properties
   @param propId property being viewed
 * @returns A string which outlines the status of the process
 */
export async function userHistory(
  userId: string,
  propId: string,
): Promise<string> {
  try {
    const user = await findId(User, userId);
    const history: Array<string> = user.history;
    history.splice(0, 0, propId);

    user.history = [...new Set(history)];
    update(user);

    return "Success";
  } catch (_) {
    return "Error:" + _;
  }
}

export async function markPropertyAsSold(id: string) {
  await PropertyData.findByIdAndUpdate(id, {
    $set: {
      sold: true,
    },
  });
}
