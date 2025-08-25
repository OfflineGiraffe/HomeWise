import type { AgentState } from "../PropertyPage";
import { ImageSrc } from "../../helpers";

interface AgentCardProps {
  agent: AgentState;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className="basis-1/5">
      <div className="card bg-base-100 border border-sky-900 rounded-xl p-0 h-full flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-4">
            {/* Agent Profile Photo */}
            <img
              src={ImageSrc(agent.photo)}
              alt="Agent"
              className="w-14 h-14 rounded-full object-cover"
            />
            {/* Agent Name and Contact Details */}
            <div className="flex flex-col">
              <p className="text-lg font-semibold text-gray-800">
                {agent.name}
              </p>
              <div className="flex items-center text-yellow-500 text-sm">
                <span className="text-gray-700 font-medium">{agent.email}</span>
              </div>
              <p className="text-gray-600 mt-1">{agent.phoneNumber}</p>
            </div>
          </div>

          <hr className="my-4" />

          {/* Office */}
          <div className="mt-2">
            <p className="text-blue-800 font-semibold">{agent.agency.name}</p>
            <p className="text-sm text-gray-700">{agent.agency.address}</p>
            <p className="text-sm text-gray-700">{agent.agency.phoneNumber}</p>
          </div>
        </div>

        {/* Footer*/}
        <div
          className="text-white text-sm px-4 py-3 rounded-b-xl flex items-center justify-between"
          style={{ backgroundColor: agent.agency.primaryColor || "#1E3A8A" }} //dynamic colour change for agency
        >
          <img
            src={agent.agency.rectangularLogo}
            alt={agent.agency.name + " Logo"}
            className="h-7 ml-2"
          />
        </div>
      </div>
    </div>
  );
}
