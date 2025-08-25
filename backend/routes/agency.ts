export interface Agency {
  _id: string;
  name: string;
  phoneNumber: string;
  address: string;
  email: string;
  primaryColor: string; // hex string e.g. '#FF0000'
  rectangularLogo: string;
}

import { AgencyData, findId } from "../data";

/**
 * Retrieves agency info for the property with the given ID in the database.
 * To be used asynchronously with `await`.
 * (THIS IS A PLACEHOLDER UNTIL EXTERNAL API DATA FOR AGENTS CAN BE USED)
 * @param id - unique id of the agent
 * @returns `Agency` object containing name, phone #, address, email, color and logo
 * @throws `Error` if agency not found or error occurs calling `findId()`
 */
export async function agencyInfo(id: string): Promise<Agency> {
  try {
    const agency: Agency | null = await findId(AgencyData, id);
    if (!agency) {
      throw Error();
    } else {
      return agency;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    throw Error("agency not found");
  }
}
