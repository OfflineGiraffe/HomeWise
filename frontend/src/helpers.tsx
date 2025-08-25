export function ImageSrc(img: string): string {
  if (img.startsWith("http")) return img; // Link
  if (img.startsWith("iVBOR")) return "data:image/png;base64," + img; // PNG
  if (img.startsWith("/9j/")) return "data:image/jpeg;base64," + img; // JPG

  return "data:image/jpeg;base64," + img;
}

// Interfaces

export interface Property {
  _id: string;
  streetNumber: string;
  street: string;
  suburb: string;
  postcode: string;
  state: string;
  agent: Agent;
  description: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  carSpaces: number;
  landSizeM2: number;
  price: number;
  type: string;
  capGrowthPct: number;
  rentalYieldPct: number;
  note: string;
  __v: number;
  sold: boolean;
}

export interface Agent {
  _id: string;
  name: string;
  phoneNumber: string;
  email: string;
  agency: Agency;
  photo: string;
}

export interface Agency {
  _id: string;
  name: string;
  phoneNumber: string;
  address: string;
  email: string;
  primaryColor: string; // hex string e.g. '#FF0000'
  rectangularLogo: string;
}

// src/helpers/compareHelpers.ts
import axios from "axios";

export const BACKEND_URL = "http://localhost:3000";

export const addComparedProperty = async (
  userToken: string,
  propertyId: string,
) => {
  try {
    await axios.post(
      `${BACKEND_URL}/compare/add?propertyId=${propertyId}`,
      {}, // body must be second param
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      },
    );
  } catch (error) {
    console.error("Error adding property to compare list:", error);
    throw error;
  }
};

export const removeComparedProperty = async (
  userToken: string,
  propertyId: string,
) => {
  try {
    await axios.delete(
      `${BACKEND_URL}/compare/remove?propertyId=${propertyId}`,
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      },
    );
  } catch (error) {
    console.error("Error removing property from compare list:", error);
    throw error;
  }
};

export const addViewToHistory = async (userId: string, propertyId: string) => {
  try {
    await axios.get(`${BACKEND_URL}/property/userView?propId=${propertyId}`, {
      headers: {
        Authorization: `Bearer ${userId}`,
      },
    });
  } catch (error) {
    console.error("Error adding property to user history", error);
    throw error;
  }
};
