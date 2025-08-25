import {
  BedDouble,
  Bath,
  Car,
  ArrowRightLeft,
  NotepadText,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ImageSrc, BACKEND_URL } from "../../helpers";
import type { Property } from "../../helpers";
import { useNavigate } from "react-router-dom";
import {
  addComparedProperty,
  removeComparedProperty,
  addViewToHistory,
} from "../../helpers";
import ChooseReplaceModal from "./ChooseReplaceModal";

// Defines the functions and elements for each saved property shown on the bookmark page
function SavedPropertyCard({
  property,
  onRefresh,
}: {
  property: Property;
  onRefresh: () => void;
}) {
  const {
    streetNumber,
    street,
    suburb,
    postcode,
    price,
    images,
    bedrooms,
    bathrooms,
    carSpaces,
    note,
    _id,
  } = property;

  const [comparedProperties, setComparedProperties] = useState<Property[]>([]);
  const [propNote, setNote] = useState(note);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const token = String(localStorage.getItem("user_token"));
  const navigate = useNavigate();

  // Checks if the property is being compared
  useEffect(() => {
    const fetchComparedProperties = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/compare`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setComparedProperties(response.data);
      } catch (error) {
        console.error("Error fetching compared properties:", error);
      }
    };

    fetchComparedProperties();
  }, []);

  const swapped = useMemo(() => {
    return comparedProperties.some((p) => p._id === _id);
  }, [comparedProperties, _id]);

  // Changes the compare status of the property
  const toggleSwap = async () => {
    const userId = localStorage.getItem("user_token");
    if (!userId) return;

    try {
      if (swapped) {
        await removeComparedProperty(token, _id);
        setComparedProperties((prev) => prev.filter((p) => p._id !== _id));
      } else {
        if (comparedProperties.length < 2) {
          await addComparedProperty(token, _id);
          setComparedProperties((prev) => [...prev, property]);
        } else {
          setShowModal(true);
        }
      }
    } catch (error) {
      console.error("Error toggling compare:", error);
    }
  };

  // Saves the users note in the database
  const saveNote = async () => {
    if (!token) {
      console.error("No user token found");
      return;
    }

    try {
      await axios.get(
        `${BACKEND_URL}/user/editPropertyNote?propId=${_id}&note=${encodeURIComponent(propNote)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  // Removes the property as saved
  const removeProperty = async () => {
    if (!token) {
      console.error("No user token found");
      return;
    }

    try {
      await axios.get(
        `${BACKEND_URL}/property/removebookmark?propId=${property._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      onRefresh();
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
    }

    // Confirm remove bookmark modal
    const dialog = document.getElementById(
      `confirm_remove_${_id}`,
    ) as HTMLDialogElement | null;
    if (dialog) {
      dialog.close();
    }
  };

  // Closes the note modal without saving
  const cancelClicked = () => {
    setIsEditing(false);
    onRefresh();
    const dialog = document.getElementById(
      `saved_note_${_id}`,
    ) as HTMLDialogElement | null;
    if (dialog) {
      dialog.close();
    }
  };

  // Navigate to property page
  const goToProperty = () => {
    if (token) {
      addViewToHistory(token, _id);
    }
    navigate(`/PropertyPage?id=${_id}`);
  };

  return (
    <>
      {/* Compare properties replacement modal */}
      <ChooseReplaceModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        properties={comparedProperties}
        pendingProperty={property}
        onReplace={async (oldId, newProperty) => {
          try {
            const userId = localStorage.getItem("user_token");
            if (!userId) return;

            await removeComparedProperty(userId, oldId);
            await addComparedProperty(userId, newProperty._id);
            setComparedProperties((prev) =>
              prev.filter((p) => p._id !== oldId).concat(newProperty),
            );
            setShowModal(false);
          } catch (error) {
            console.error("Error replacing compared property:", error);
          }
        }}
      />
      {/* Sold tag */}
      <div className="card bg-base-100 !w-[18%] 2xl:w-80 shadow-2xl mt-3 mb-5">
        <figure onClick={goToProperty} className="cursor-pointer">
          <img src={ImageSrc(images[0])} className="h-[250px] w-full" />
          {property.sold && (
            <div className="absolute top-2 right-2 bg-red-700 bg-opacity-70 text-white text-sm font-bold px-2 py-1 rounded-md z-10">
              SOLD
            </div>
          )}
        </figure>
        <div className="card-body relative pb-3">
          {/* Property street address */}
          <h2
            className="text-lg font-bold w-[150px] 2xl:w-[220px] truncate overflow-hidden whitespace-nowrap"
            title={`${streetNumber} ${street}`}
          >
            {`${streetNumber} ${street}`}
          </h2>
          {/* Property suburb */}
          <p className="w-50">{`${suburb}, ${postcode}`}</p>
          {/* Property price */}
          <p className="italic text-xl">{`$${price.toLocaleString()}`}</p>
          {/* Property features */}
          <div className="join mt-2 w-40 mb-5 2xl:mb-0">
            <BedDouble className="w-5 h-5 text-black" />
            <p className="ml-2 font-bold">{bedrooms}</p>
            <Bath className="w-5 h-5 text-black" />
            <p className="ml-2 font-bold">{bathrooms}</p>
            <Car className="w-5 h-5 text-black" />
            <p className="ml-2 font-bold">{carSpaces}</p>
          </div>
          {/* Compare and note icons */}
          <div className="join absolute bottom-4 right-4">
            <ArrowRightLeft
              onClick={toggleSwap}
              className={`w-6 h-6 mr-2 cursor-pointer hover:scale-120 transition-transform ${
                swapped
                  ? "text-blue-800 drop-shadow-[0_0_8px_rgba(59,130,246,1)]"
                  : "text-black"
              }`}
            />
            <div className="relative inline-block hover:scale-120">
              {note !== "" && (
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-800 rounded-full z-10" />
              )}
              <NotepadText
                className="w-6 h-6 cursor-pointer transition-transform"
                id="saved_note_icon"
                onClick={() => {
                  setNote(note);
                  const dialog = document.getElementById(
                    `saved_note_${_id}`,
                  ) as HTMLDialogElement | null;
                  if (dialog) {
                    dialog.showModal();
                  }
                }}
              />
            </div>
          </div>
        </div>
        {/* Remove bookmark button */}
        <button
          className="btn btn-soft btn-error rounded-none rounded-b-xl"
          onClick={() => {
            const dialog = document.getElementById(
              `confirm_remove_${_id}`,
            ) as HTMLDialogElement | null;
            if (dialog) {
              dialog.showModal();
            }
          }}
        >
          Remove
        </button>
      </div>

      {/* Confirm removal modal */}
      <dialog id={`confirm_remove_${_id}`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Confirmation</h3>
          <p className="py-4">
            Clicking confirm will remove this from your saved properties. It
            will also remove any notes you may have attached to the property.
          </p>
          <div className="modal-action">
            <button
              className="btn btn-error"
              id="saved_delete_confim"
              onClick={removeProperty}
            >
              Confirm
            </button>
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>

      {/* Note modal */}
      <dialog id={`saved_note_${_id}`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Property Note</h3>
          <textarea
            value={propNote}
            onChange={(e) => setNote(e.target.value)}
            disabled={!isEditing}
            className="w-full mt-4 h-50 p-2 rounded-md border disabled:border-transparent disabled:opacity-100 disabled:bg-gray-100 disabled:text-gray-700 disabled:cursor-not-allowed"
          />
          <div className="modal-action">
            <button
              className="btn text-white bg-blue-600 hover:!bg-blue-700"
              onClick={() => {
                if (isEditing) {
                  saveNote();
                } else {
                  setIsEditing(true);
                }
              }}
            >
              {isEditing ? "Save" : "Edit"}
            </button>
            <button
              className="btn"
              onClick={cancelClicked}
              id="note_close_button"
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

export default SavedPropertyCard;
