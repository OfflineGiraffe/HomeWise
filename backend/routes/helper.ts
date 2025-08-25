import { Client } from "@googlemaps/google-maps-services-js";
import dotenv from "dotenv";
dotenv.config();
import { findId, PropertyData, User } from "../data";
import { UserType } from "./accounts";
import { Property } from "./property";
import jwt, { Secret } from "jsonwebtoken";
import HTTPError from "http-errors";

const GOOGLE_API_KEY = process.env.GMAPS_API_KEY as string;
const helperClient = new Client({});

/**
 * Returns the `UserType` object with the given userid.
 * @param userid - User ID of the user.
 * @returns `UserType` object
 */
export async function getUser(userid: string): Promise<UserType> {
  const user: UserType | null = await findId(User, userid);
  if (!user) {
    throw HTTPError(404, "Couldn't find user.");
  }
  return user;
}

/**
 * Checks if the given name only contains letters. Otherwise throw `HTTPError`.
 * @param firstName
 * @param lastName
 */
export function checkName(firstName: string, lastName: string): void {
  if (!/^[A-Za-z]+$/.test(firstName) || !/^[A-Za-z]+$/.test(lastName)) {
    throw HTTPError(400, "Name must only contain letters.");
  }
}

/**
 * Checks if the given password is valid (contains upper/lowercase & numbers & special characters & 8-20 characters). Otherwise throw `HTTPError`.
 * @param password
 */
export function checkPassword(password: string): void {
  if (
    !/(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_.])/.test(password) ||
    password.length < 8 ||
    password.length > 20
  ) {
    throw HTTPError(400, "Invalid password.");
  }
}

/**
 * Checks if the preferences are valid. Otherwise throw `HTTPError`.
 * @param suburb - Preferred suburb.
 * @param postcode - Preferred suburb postcode.
 * @param priceRange - Preferred price range given as [min, max]
 * @param scoring - Scores for the recommendation system criteria
 */
export function checkPreferences(
  suburb: string,
  postcode: string,
  priceRange: number[],
  scoring: number[],
): void {
  if (!/^[A-Za-z -]+$/.test(suburb)) {
    throw HTTPError(400, "Invalid suburb.");
  }
  if (!/^[0-9]{4}$/.test(postcode)) {
    throw HTTPError(400, "Invalid postcode.");
  }
  if (
    priceRange.length != 2 ||
    priceRange[0] > priceRange[1] ||
    priceRange[0] < 0 ||
    priceRange[1] < 0
  ) {
    throw HTTPError(400, "Invalid price range.");
  }

  // check growth potential, rental yield and proximity scores add to 100
  // check transport proximity and school proximity scores add to 100
  let recSum = 0,
    proxSum = 0;
  scoring.slice(0, 3).forEach((score) => (recSum += score));
  scoring.slice(3).forEach((score) => (proxSum += score));
  if (
    scoring.filter((score) => score < 0).length > 0 ||
    recSum != 100 ||
    proxSum != 100
  ) {
    throw HTTPError(400, "Invalid recommendation score.");
  }
}

/**
 * Generates JWT token with the given User ID as payload.
 * @param userId - To be stored inside payload.
 * @returns JWT token string.
 */
export function generateToken(userId: string): string {
  const payload = {
    userId: userId,
  };
  const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as Secret);
  return token;
}

/**
 * Checks whether property with the given propertyid exists.
 * @param propertyid - Property ID of the property.
 * @returns True if property with the given propertyid exists, otherwise false.
 */
export async function propertyExists(propertyid: string): Promise<boolean> {
  const property: Property | null = await findId(PropertyData, propertyid);
  if (property) {
    return true;
  } else {
    return false;
  }
}

/**
 * Calculates distance between two lat/lng points using Haversine formula
 */
export function haversineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number },
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMeters = 6371e3; // Radius of Earth in meters

  const lat1 = toRadians(point1.lat);
  const lat2 = toRadians(point2.lat);
  const deltaLat = toRadians(point2.lat - point1.lat);
  const deltaLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  const centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadiusMeters * centralAngle;

  return distance;
}

export async function findLatLong(
  address: string,
): Promise<{ lat: number; lng: number }> {
  try {
    const geoRes = await helperClient.geocode({
      params: {
        address,
        key: GOOGLE_API_KEY,
      },
    });

    if (!geoRes.data.results || geoRes.data.results.length === 0) {
      throw new Error(`No results found for address: ${address}`);
    }

    return geoRes.data.results[0].geometry.location;
  } catch (err) {
    console.error(`Geocoding failed for address "${address}":`, err);
    throw err; // or: return null if you want silent skipping
  }
}

/**
 * helper to get coordinates of the centre of the provided Australian postcode and suburb
 * @param postcodeSuburb string in the form `'<suburb> <postcode>'`
 * @returns
 */
export async function getAusPostcodeSuburbCoordinates(
  postcodeSuburb: string,
): Promise<{ lat: number; lng: number }> {
  return findLatLong(postcodeSuburb + " Australia");
}

export function is24HoursAgo(dateToCheck: Date): boolean {
  const MS_24H = 24 * 60 * 60 * 1000;
  return Date.now() - dateToCheck.getTime() >= MS_24H;
}

// from https://stackoverflow.com/questions/25734092/query-locations-within-a-radius-in-mongodb
export const kmToRadian = function (km: number): number {
  const earthRadiusInKm = 6378;
  return km / earthRadiusInKm;
};
