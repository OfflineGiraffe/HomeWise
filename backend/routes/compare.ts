import { getUser, propertyExists } from "./helper";
import { UserType } from "./accounts";
import { propertyInfo, Property } from "./property";
import { update } from "../data";
import HTTPError from "http-errors";

/**
 * Adds propertyid to the user's compared properties.
 * @param {string} userid - User ID of the user.
 * @param {string} propertyid - Property ID of the property.
 * @returns The number of compared properties the user has selected to compare.
 */
export async function addCompare(
  userid: string,
  propertyid: string,
): Promise<number> {
  const user: UserType = await getUser(userid);
  if (!propertyExists(propertyid)) {
    throw HTTPError(404, "Couldn't find property with the given property ID.");
  }

  if (!user.comparedProperties.includes(propertyid)) {
    user.comparedProperties.push(propertyid);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await update(user as any);
  }
  return user.comparedProperties.length;
}

/**
 * Removes propertyid from the user's compared properties.
 * @param {string} userid - User ID of the user.
 * @param {string} propertyid - Property ID of the property.
 * @returns The number of compared properties the user has selected to compare.
 */
export async function removeCompare(
  userid: string,
  propertyid: string,
): Promise<number> {
  const user: UserType = await getUser(userid);
  if (!propertyExists(propertyid)) {
    throw HTTPError(404, "Couldn't find property with the given property ID.");
  }

  const index = user.comparedProperties.indexOf(propertyid);
  if (index != -1) {
    user.comparedProperties.splice(index, 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await update(user as any);
  }
  return user.comparedProperties.length;
}

/**
 * Returns the properties selected to be compared.
 * @param {string} userid - User ID of the user.
 * @returns The properties in the user's compared properties.
 */
export async function getComparedProperties(
  userid: string,
): Promise<Property[]> {
  const properties: Property[] = [];
  const user: UserType = await getUser(userid);
  for (const propertyid of user.comparedProperties) {
    const property = await propertyInfo(propertyid);
    properties.push(property);
  }
  return properties;
}
