import React from "react";
import type { Property } from "../../helpers";

interface ChooseReplaceModalProps {
  visible: boolean;
  onClose: () => void;
  properties: Property[];
  pendingProperty: Property | null;
  onReplace: (oldPropertyId: string, newProperty: Property) => Promise<void>;
}

const ChooseReplaceModal: React.FC<ChooseReplaceModalProps> = ({
  visible,
  onClose,
  properties,
  pendingProperty,
  onReplace,
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl w-[45vw] relative overflow-auto max-h-[80vh]">
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-xl font-bold cursor-pointer"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4">Choose a Property to Replace</h2>
        <ul className="space-y-4">
          {properties.map((property) => (
            <li
              key={property._id}
              className="flex justify-between items-center bg-gray-100 p-3 rounded"
            >
              <span>
                Property: {property.streetNumber} {property.street},{" "}
                {property.suburb}
              </span>
              <button
                className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                id="replacement_id"
                onClick={() => {
                  if (pendingProperty) {
                    onReplace(property._id, pendingProperty);
                  }
                }}
              >
                Replace
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChooseReplaceModal;
