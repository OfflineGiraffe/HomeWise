export interface Agent {
  _id: string;
  name: string;
  phoneNumber: string;
  email: string;
  agency: Agency;
  photo: string;
}

import { AgentData, findId } from "../data";
import { Agency, agencyInfo } from "./agency";

/**
 * Retrieves agent info for the property with the given ID in the database.
 * To be used asynchronously with `await`.
 * (THIS IS A PLACEHOLDER UNTIL EXTERNAL API DATA FOR AGENTS CAN BE USED)
 * @param id - unique id of the agent
 * @returns `Agent` object containing name, phone num, email, photo and Agency object
 * @throws `Error` if agent not found or error occurs calling `findId()`
 */
export async function agentInfo(id: string): Promise<Agent> {
  try {
    let agent = await findId(AgentData, id); // not Agent but the agencyDataSchema in data.ts
    if (!agent) {
      throw Error();
    } else {
      const agency = await agencyInfo(agent.agency);
      agent = {
        _id: agent._id,
        name: agent.name,
        phoneNumber: agent.phoneNumber,
        email: agent.email,
        agency: agency,
        photo: agent.photo,
      };
      return agent;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    throw Error("agent not found");
  }
}
