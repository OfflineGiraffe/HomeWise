import mongoose, { Document, Mongoose, Schema } from "mongoose";

export interface savedProperty {
  id: string;
  note: string;
}

interface FindOptions {
  sort?: Record<string, 1 | -1>;
}

// Feel free to edit as required
const userSchema = new Schema({
  email: String,
  firstName: String,
  lastName: String,
  password: String,
  resetToken: String,
  preferences: {
    updatedAt: Date,
    suburb: String,
    postcode: String,
    location: {
      // geoJSON point
      type: {
        type: String,
        enum: ["Point"], // must be 'Point'
        required: true,
      },
      coordinates: {
        type: [Number, Number], // [ longitude, latitude ]
        required: true,
      },
    },
    priceRange: [Number, Number],
    recommendationScoring: [Number, Number, Number, Number, Number],
  },
  savedProperties: [{ id: String, note: String, _id: false }], // Change to match the property id
  dateJoined: Date,
  history: [String], // Change to match the property id
  comparedProperties: [String],
  top5Properties: {
    updatedAt: Date,
    propertiesWithRatings: [{ id: String, rating: Number, _id: false }], // 5 with highest indvidual score
  },
});

const amenitiesDataSchema = new Schema({
  name: String,
  address: String,
  suburb: String,
  postcode: Number,
  state: String,
  type: String, // School/Transport/Shopping Centre/Hospital...
});

// Incomplete: Add fields as required.
const propertyDataSchema = new Schema(
  {
    streetNumber: String,
    street: String,
    suburb: String,
    postcode: String,
    state: String,
    agent: String,
    location: {
      // geoJSON point
      type: {
        type: String,
        enum: ["Point"], // must be 'Point'
        required: true,
      },
      coordinates: {
        type: [Number, Number], // [ longitude, latitude ]
        required: true,
      },
    },
    capGrowthPct: Number, // projected capital growth integer % in 1 year
    rentalYieldPct: Number, // projected 1-year rental income as integer % of property value
    // objective scores (between [0,1], 1 = perfect, 0 = worst)
    growthScore: Number,
    yieldScore: Number,
    schoolScore: Number,
    transportScore: Number,
    description: String,
    images: [String],
    bedrooms: Number,
    bathrooms: Number,
    carSpaces: Number,
    landSizeM2: Number,
    price: Number,
    type: String,
    sold: Boolean,
  },
  {
    timestamps: true,
  },
);

const agentDataSchema = new Schema({
  name: String,
  phoneNumber: String,
  email: String,
  agency: String,
  photo: String,
});

const agencyDataSchema = new Schema({
  name: String,
  phoneNumber: String,
  address: String,
  email: String,
  primaryColor: String, // hex string e.g. '#FF0000'
  rectangularLogo: String,
});

propertyDataSchema.index({ location: "2dsphere", price: -1, sold: 1 });

const User = mongoose.model("User", userSchema);
const AmenitiesData = mongoose.model("AmenitiesData", amenitiesDataSchema);
const PropertyData = mongoose.model("PropertyData", propertyDataSchema);
const AgentData = mongoose.model("AgentData", agentDataSchema);
const AgencyData = mongoose.model("AgencyData", agencyDataSchema);

export { User, AmenitiesData, PropertyData, AgentData, AgencyData };

// DB Functions:

/**
 * Creates a new entry in the specified collection/database
 * @param {mongoose.Model} db - Mongoose model to perform operation on
 * @param {Object} entry - Entry data to be added
 * @returns {Promise<Document>} The created entry as MongoDB object
 * @throws {MongooseError} If validation fails or database operation errors
 */
export async function add(db: Mongoose["Model"], entry: object) {
  return await db.create(entry);
}

/**
 * Deletes a document by its ID
 * @param {mongoose.Model} db - Mongoose model to perform operation on
 * @param {string} id - MongoDB document ID
 * @returns {Promise<Document|null>} The deleted document or null if not found
 * @throws {CastError} If ID format is invalid
 */
export async function deleteOne(db: Mongoose["Model"], id: string) {
  return await db.findByIdAndDelete(id).exec();
}

/**
 * Finds a single entry by its ID
 * @param {mongoose.Model} db - Mongoose model to query
 * @param {string} id - MongoDB document ID
 * @returns {Promise<Document|null>} The found entry or null
 * @throws {CastError} If ID format is invalid
 */
export async function findId(db: Mongoose["Model"], id: string) {
  return await db.findById(id).exec();
}

/**
 * Finds entries matching query criteria, optionally paginated by index range [start..end].
 *
 * @param {Mongoose["Model"]} db - Mongoose model to query
 * @param {object} query - MongoDB query object
 * @param {FindOptions} options - fields to sort by, and ascending/descending
 * @param {number} start - zero‑based index to start at (default 0)
 * @param {number} end - zero‑based index to end at, inclusive (default -1 == no end)
 */
export async function findBy(
  db: Mongoose["Model"],
  query: object,
  options?: FindOptions,
  start = 0,
  end = -1,
) {
  let cursor = db.find(query).sort(options?.sort ?? { createdAt: -1 });

  if (start > 0) {
    cursor = cursor.skip(start);
  }

  if (end >= start) {
    const pageSize = end - start + 1;
    cursor = cursor.limit(pageSize);
  }

  return cursor.exec();
}

/**
 * Updates an existing entry
 * @param {mongoose.Document} obj - The entry to save
 * @returns {Promise<Document>} The updated entry
 * @throws {ValidationError} If entry validation fails
 */
export async function update(obj: Document) {
  return await obj.save({ w: "majority", j: true });
}

/**
 * Retrieves all entries from a collection - Internal Testing Function
 * @param {mongoose.Model} db - Mongoose model to query
 * @returns {Promise<Document[]>} Array of all entries
 */
export async function viewData(db: Mongoose["Model"]) {
  return await db.find({});
}

/**
 * Removes all entries from a collection - Internal Testing Function
 * @param {mongoose.Model} db - Mongoose model to clear
 * @returns {Promise<Object>} MongoDB deletion result object
 */
export async function clearData(db: Mongoose["Model"]) {
  return await db.deleteMany({});
}

/**
 * Iterates over documents matching `query`, one at a time (streamed cursor).
 * @param {mongoose.Model} db - Mongoose model to query
 * @param {(doc: <T>) => Promise<void>} callback - Async function to call for each document
 * @param {object} query - MongoDB query object
 * @param {FindOptions} options - Options to sort by field ascending/descending (optional)
 */
export async function forEachDoc<T>(
  db: Mongoose["Model"],
  callback: (doc: T) => Promise<void>,
  query: object = {},
  options: FindOptions = {},
): Promise<void> {
  let q = db.find(query);

  if (options.sort) {
    q = q.sort(options.sort);
  }

  const cursor = q.cursor();
  for await (const doc of cursor) {
    await callback(doc);
  }
}
