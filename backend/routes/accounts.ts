import { User, add, findBy, update, savedProperty, deleteOne } from "../data";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import {
  getUser,
  generateToken,
  getAusPostcodeSuburbCoordinates,
  checkName,
  checkPassword,
  checkPreferences,
} from "./helper";
import HTTPError from "http-errors";

// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config();

export interface UserType {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  resetToken: string;
  preferences: {
    updatedAt: Date;
    suburb: string;
    postcode: string;
    location: {
      type: "Point";
      coordinates: [number, number]; // lng, lat
    };
    priceRange: number[]; // [min, max]
    distance: number;
    recommendationScoring: number[]; // [growthPotential, rentalYield, proximityScore, schoolProximity, transportProximity]
  };
  savedProperties: savedProperty[];
  history: string[];
  comparedProperties: string[];
  dateJoined: Date;
  top5Properties: {
    updatedAt: Date;
    propertiesWithRatings: Array<{ id: string; rating: number }>; // 5 with highest indvidual score
  };
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  preferences: {
    updatedAt: Date;
    suburb: string;
    postcode: string;
    priceRange: number[];
    recommendationScoring: number[];
  };
  savedProperties: savedProperty[];
  history: string[];
  dateJoined: string;
}

/**
 * Adds new user to the database.
 * @param name - Name of the user given as [first, last].
 * @param email - Email for the user's account.
 * @param password - Password for the user's account.
 * @param suburb - User's preferred suburb.
 * @param postcode - User's preferred suburb postcode.
 * @param priceRange - User's preferred price range given as [min, max]
 * @param criteria - User's weighting of the recommendation system criteria
 * @returns Token of the new registered user. Otherwise throw error.
 */
export async function register(
  name: string[],
  email: string,
  password: string,
  suburb: string,
  postcode: string,
  priceRange: number[],
  criteria: number[],
): Promise<string> {
  if (
    name.length != 2 ||
    name[0] == "" ||
    name[1] == "" ||
    email == "" ||
    password == ""
  ) {
    throw HTTPError(400, "Input fields cannot be empty.");
  }
  checkName(name[0], name[1]);
  checkPassword(password);
  if (await emailInUse(email)) {
    throw HTTPError(400, "Email already taken.");
  }
  checkPreferences(suburb, postcode, priceRange, criteria);

  const hashedPassword: string = await hash(password);

  const preferenceCoords = await getAusPostcodeSuburbCoordinates(
    suburb + " " + postcode,
  );

  const user = await add(User, {
    email: email,
    password: hashedPassword,
    firstName: name[0],
    lastName: name[1],
    preferences: {
      updatedAt: new Date(),
      suburb: suburb,
      postcode: postcode,
      location: {
        type: "Point",
        coordinates: [preferenceCoords.lng, preferenceCoords.lat],
      },
      priceRange: priceRange,
      recommendationScoring: criteria,
    },
    history: [],
    savedProperties: [],
    dateJoined: new Date(),
    resetToken: -1,
    comparedProperties: [],
  });

  return generateToken(user._id.toString());
}

/**
 * Login to an existing user account.
 * @param email - Email given by the user.
 * @param password - Password given by the user.
 * @returns Token of the user account (after successful login). Otherwise throw error.
 */
export async function login(email: string, password: string): Promise<string> {
  const query = await findBy(User, { email: email });
  if (query.length != 1) {
    throw HTTPError(400, "Incorrect email/password.");
  }

  const user = query[0];
  if (await bcrypt.compare(password, user.password)) {
    user.comparedProperties = [];
    await update(user);
    return generateToken(user._id.toString());
  } else {
    throw HTTPError(400, "Incorrect email/password.");
  }
}

/**
 * Checks if the given email already has an associated user account.
 * @param email - Email given by the user.
 * @returns True if the email is in use, otherwise false.
 */
export async function emailInUse(email: string): Promise<boolean> {
  const ret = await findBy(User, { email: email });
  return ret.length > 0;
}

/**
 * Returns user profile information.
 * @param id - User ID of the user.
 * @returns Object containing user profile information.
 */
export async function getUserProfile(id: string): Promise<UserProfile> {
  const user = await getUser(id);

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    preferences: user.preferences,
    savedProperties: user.savedProperties,
    history: user.history,
    dateJoined: user.dateJoined.toLocaleDateString("en-AU"),
  };
}

/**
 * Hashes the given string.
 * @param toHash - The string to be hashed.
 * @returns Hashed string.
 */
async function hash(toHash: string): Promise<string> {
  const hashedValued = await bcrypt.hash(toHash, 10);
  return hashedValued;
}

/**
   Reset Password Request function.
   @param Email of user trying to reset their password
 * @returns A string resetCode for the frontend to use for later step, or an error if email fails to send
 */
export async function resetPasswordRequest(email: string): Promise<string> {
  const query = { email: email };
  const users = await findBy(User, query);
  const user = users[0] as UserType;

  if (user === undefined) {
    throw HTTPError(400, `No registered user with the email ${email}`);
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "homewiseh16a@gmail.com",
      pass: "gbig drsi jnca vqhe",
    },
  });

  const resetCode = Math.random().toString().substring(2, 6);
  const mailOptions = {
    from: "homewiseh16a@gmail.com",
    to: email,
    subject: "Password Reset Code - Homewise",
    text: `Here is your requested reset code, ${resetCode}`,
  };

  user.resetToken = resetCode;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await update(user as any);

  try {
    transporter.sendMail(mailOptions);
  } catch {
    throw HTTPError(500, "Issue with sending email.");
  }

  return resetCode;
}

/**
   Reset Password function.
   @param email Email of user trying to reset their password
   @param newPassword
 */
export async function resetPassword(
  email: string,
  newPassword: string,
): Promise<void> {
  const query = { email: email };
  const user = (await findBy(User, query))[0] as UserType;

  const match = await bcrypt.compare(newPassword, user.password);

  if (match) {
    throw HTTPError(
      400,
      "The new password is the same as the current password, try again.",
    );
  }
  checkPassword(newPassword);

  const hashedPassword: string = await hash(newPassword);

  user.resetToken = "";
  user.password = hashedPassword;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await update(user as any);
}

/**
 * Checks if the reset code given by the user is correct.
 * @param resetCode - Reset code given by the user.
 * @returns True if the reset code is correct, otherwise false.
 */
export async function resetCodeCheck(resetCode: string): Promise<boolean> {
  const query = { resetToken: resetCode };
  const user = (await findBy(User, query))[0] as UserType;

  if (user === undefined || resetCode == "") {
    return false;
  }

  return true;
}

/**
 * Updates the user's personal information.
 * @param userId - User ID of the user.
 * @param firstName - New first name given by the user.
 * @param lastName - New last name given by the user.
 * @param email - New email given by the user.
 */
export async function editAccountInfo(
  userId: string,
  firstName: string,
  lastName: string,
  email: string,
): Promise<void> {
  const user: UserType = await getUser(userId);
  if (firstName == "" || lastName == "" || email == "") {
    throw HTTPError(400, "Input fields cannot be empty.");
  }
  checkName(firstName, lastName);
  if (email != user.email && (await emailInUse(email))) {
    throw HTTPError(400, "Email already taken.");
  }
  user.firstName = firstName;
  user.lastName = lastName;
  user.email = email;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await update(user as any);
}

/**
   Changes password associated to the user's account.
   @param userId - User ID of the user.
   @param password - New password given by the user.
 */
export async function changePassword(
  userId: string,
  password: string,
): Promise<void> {
  const user: UserType = await getUser(userId);
  checkPassword(password);
  const hashedPassword: string = await hash(password);
  user.password = hashedPassword;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await update(user as any);
}

/**
 * Updates the user's preferences.
 * @param userId - User ID of the user.
 * @param suburb - New preferred suburb given by the user.
 * @param postcode - New preferred suburb postcode given by the user.
 * @param priceRange - New preferred price range given as [min, max].
 * @param scoring - New weighting of recommendation scoring criteria.
 */
export async function editPreferences(
  userId: string,
  suburb: string,
  postcode: string,
  priceRange: number[],
  scoring: number[],
): Promise<void> {
  const user: UserType = await getUser(userId);
  checkPreferences(suburb, postcode, priceRange, scoring);

  const preferenceCoords = await getAusPostcodeSuburbCoordinates(
    suburb + " " + postcode,
  );

  user.preferences.updatedAt = new Date();
  user.preferences.suburb = suburb;
  user.preferences.postcode = postcode;
  user.preferences.location = {
    type: "Point",
    coordinates: [preferenceCoords.lng, preferenceCoords.lat],
  };
  user.preferences.priceRange = priceRange;
  user.preferences.recommendationScoring = scoring;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await update(user as any);
}

/**
   View Saved Properties function.
   @param userId Unique id of the user, who wants to view their saved properties
 * @returns Array<savedProperty> : An array of savedProperties where each element is the property and an associated note
 */
export async function viewSaved(userId: string): Promise<Array<savedProperty>> {
  const user = await getUser(userId);
  const savedProps: Array<savedProperty> = user.savedProperties;

  return savedProps;
}

/**
   View Saved Properties function.
   @param userId Saved Property which user wants to edit
   @param userId Unique id of the user
   @param updatedNote New note to be saved on the property
 * @returns String : A simple string outlining whether the process was a success or failure 
 */
export async function editPropertyNote(
  propId: string,
  userId: string,
  updatedNote: string,
): Promise<void> {
  const user = await getUser(userId);
  const savedProps: Array<savedProperty> = user.savedProperties;
  const loc = savedProps.findIndex((a) => a.id === propId);

  if (loc == -1) {
    throw HTTPError(400, "Property is not saved.");
  }

  savedProps[loc].note = updatedNote;

  user.savedProperties = savedProps;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await update(user as any);
}

/**
 * Deletes the account associated with the given User ID.
 * @param userId - User ID of the account to be deleted.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const ret = await deleteOne(User, userId);
  if (!ret) {
    throw HTTPError(404, "Couldn't find user.");
  }
}
