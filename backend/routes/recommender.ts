import { findId, forEachDoc, PropertyData, User } from "../data";
import { UserType } from "./accounts";
import { getUser, haversineDistance, is24HoursAgo } from "./helper";
import { getRequestedNearbyAmenity, Property, propertyInfo } from "./property";

// DEFINITIONS
// capital growth: % property is projected to grow in value in 1 year
// rental yield: % of the property price earned from a year's worth of rental income

// yes these ideal values are arbitrary but i think they are reasonable
const IDEAL_CAP_GROWTH = 6;
const IDEAL_RENT_YIELD = 4;
const IDEAL_SCHOOL_DIST = 5000;
const IDEAL_TRANSPORT_DIST = 2000;

const LOC_SCORE_FLOOR = 0.75;
const PRICE_SCORE_FLOOR = 0.5;

const PRICE_PENALTY_STEP = 50000;
const PRICE_PENALTY = 0.1;

const DIST_PENALTY_STEP = 3000;
const DIST_PENALTY = 0.1;

// for calculating personalised recommendations
const INITIAL_SEARCH_RADIUS_KM = 6;
const RADIUS_STEP_KM = 4;
const MAX_SEARCH_RADIUS_KM = 22;
const PRICE_CEIL_MAX_PCT = 0.1;

export interface UserPreferences {
  wGrowth: number;
  wYield: number;
  wSchools: number;
  wTransport: number;
  priceMin: number;
  priceMax: number;
  suburb: string;
  postcode: string;
  location: {
    lng: number;
    lat: number;
  };
}

export interface PropertyStatistics {
  capGrowthPct: number;
  rentalYieldPct: number;
  postcode: string;
  suburb: string;
  location: {
    lng: number;
    lat: number;
  };
}

export interface ObjectivePropertyRatings {
  growthScore: number;
  yieldScore: number;
  schoolScore: number;
  transportScore: number;
}

interface Rating {
  rating: number;
  description?: string;
}

/**
 * calculate and return the objective ratings for the given property
 * for capital growth, rental yield and proximity to schools and transport
 * @param {PropertyStatistics} propertyStatistics - object containing the relevant statistics for the property being rated
 */
export async function getObjectivePropertyRating(
  propertyStatistics: PropertyStatistics,
): Promise<ObjectivePropertyRatings> {
  // normalise parameters into scores [0,1]

  const propertyRatings: ObjectivePropertyRatings = {
    growthScore: 0,
    yieldScore: 0,
    schoolScore: 0,
    transportScore: 0,
  };

  propertyRatings.growthScore = clamp(
    propertyStatistics.capGrowthPct / IDEAL_CAP_GROWTH,
  ); // growth >= IDEAL = perfect score (1)
  propertyRatings.yieldScore = clamp(
    propertyStatistics.rentalYieldPct / IDEAL_RENT_YIELD,
  ); // rental yield >= IDEAL = perfect score (1)

  const propCoords = propertyStatistics.location;

  const nearestSchools = await getRequestedNearbyAmenity(
    propCoords,
    "school",
    1,
    IDEAL_SCHOOL_DIST,
  );
  const distToNearestSchool =
    nearestSchools.length > 0
      ? nearestSchools[0].distance_meters
      : IDEAL_SCHOOL_DIST;
  propertyRatings.schoolScore = clamp(
    1 - distToNearestSchool / IDEAL_SCHOOL_DIST,
  ); // geq ideal = worst score (0), exactly ideal = perfect score (1)

  const nearestBuses = await getRequestedNearbyAmenity(
    propCoords,
    "bus_station",
    1,
    IDEAL_TRANSPORT_DIST,
  );
  const distToNearestBus =
    nearestBuses.length > 0
      ? nearestBuses[0].distance_meters
      : IDEAL_TRANSPORT_DIST;
  const nearestTrains = await getRequestedNearbyAmenity(
    propCoords,
    "train_station",
    1,
    IDEAL_TRANSPORT_DIST,
  );
  const distToNearestTrain =
    nearestTrains.length > 0
      ? nearestTrains[0].distance_meters
      : IDEAL_TRANSPORT_DIST;

  const distToNearestTransport = Math.min(distToNearestBus, distToNearestTrain); // base rating on closest mode

  propertyRatings.transportScore = clamp(
    1 - distToNearestTransport / IDEAL_TRANSPORT_DIST,
  ); // geq ideal = worst score (0), exactly ideal = perfect score (1)

  return propertyRatings;
}

/**
 * calculates and returns custom property rating out of 5 based on user preferences
 * @param property - the `Property` object
 * @param prefs - object containing user prefs for growth, yield, schools, transport, location and price
 * @returns - rating out of 5
 */
async function getUserPropertyScore(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  property: any,
  prefs: UserPreferences,
  generateDescription: boolean = false,
): Promise<Rating> {
  // total scores weighted by preferenced importance
  const core =
    (prefs.wGrowth / 100) * property.growthScore +
    (prefs.wYield / 100) * property.yieldScore +
    (prefs.wSchools / 100) * property.schoolScore +
    (prefs.wTransport / 100) * property.transportScore;

  // price fit score [0,1]
  let priceScore: number;
  if (property.price <= prefs.priceMax && property.price >= prefs.priceMin) {
    priceScore = 1; // perfect score if inside range
  } else {
    let overshoot = 0; // amount the price deviates from min/max
    if (property.price > prefs.priceMax) {
      overshoot = property.price - prefs.priceMax;
    } else if (property.price < prefs.priceMin) {
      overshoot = prefs.priceMin - property.price;
    }
    const penalty = (overshoot / PRICE_PENALTY_STEP) * PRICE_PENALTY; // score gets deduction for every step outside range
    priceScore = 1 - penalty;
    priceScore = clamp(Math.max(priceScore, PRICE_SCORE_FLOOR));
  }

  // location fit score [0,1]
  let locScore: number;
  if (
    prefs.suburb === property.suburb &&
    prefs.postcode === property.postcode
  ) {
    locScore = 1; // perfect score for being inside suburb
  } else {
    const suburbCoordinates = prefs.location;
    const distFromSuburb = haversineDistance(
      {
        lng: property.location.coordinates[0],
        lat: property.location.coordinates[1],
      },
      suburbCoordinates,
    );

    const overshoot = distFromSuburb - 3000; // grace distance of 3000m because coordinates are in middle of suburb

    const penalty = (overshoot / DIST_PENALTY_STEP) * DIST_PENALTY; // score gets deduction for every step outside range
    locScore = 1 - penalty;
    locScore = clamp(Math.max(locScore, LOC_SCORE_FLOOR));
  }

  // final score & stars
  const final0to1 = core * priceScore * locScore; // core parameters weighted by price and location
  const stars = final0to1 * 5; // out of 5

  const ratingObj = {
    rating: stars,
    description: "",
  };

  if (generateDescription) {
    ratingObj.description = await getRatingDescription(
      property,
      prefs,
      core,
      priceScore,
      locScore,
      final0to1,
      stars,
    );
    return ratingObj;
  }

  return ratingObj;
}

/**
 * Generates a description of the user-specific rating for the given property,
 * based on all the separate criteria scores and the final score.
 *
 * @param property
 * @param prefs
 * @param core
 * @param priceScore
 * @param locScore
 * @param final0to1
 * @param stars
 * @returns String containing the AI-generated rating description.
 */
async function getRatingDescription(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  property: any,
  prefs: UserPreferences,
  core: number,
  priceScore: number,
  locScore: number,
  final0to1: number,
  stars: number,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: `I have a rating system for properties (out of 5 stars). This rating is achieved first by taking the objective scores on the property for 4 criteria: the capital growth potential score (capital growth being the % growth in the property's value after 1 year), the rental yield score (rental yield being 1-year rental income as a % of property value), the school proximity score and the transport proximity score. These objective ratings (% in range [0,1]) are higher for more attractive capital growth and rental yield, and also higher for closer proximity to schools and transport. 

These objective ratings are then weighted against the user's stated importance for each of the criteria (measured as % in range [0,100], so the weighted growth score would be  ((prefs.weightedGrowth / 100) * property.growthScore) etc.). These weighted ratings for capital growth, rental yield, school proximity and transport proximity are then added together to create a 'core' score (in range [0,1]). 

A price score (in range [0,1]) is also created which gives a perfect score of 1 if the price is within the desired range, and decreases depending on how far the price is from the user's [minprice, maxprice] range.

A location score (in range [0,1]) is also created which gives a perfect score of 1 if the property is within the desired suburb, and decreases depending on how far the property is from the user's desired suburb.

The core rating is multiplied by the price score and location score to get a final rating between [0,1], then multiplied by 5 to get the final star rating.

When taking about scores, refer to them using percentages only (e.g. price score of 0.75 is referred to as 75%).

Note that the ideal capital growth the rating is based on is ${IDEAL_CAP_GROWTH}%, and the rental yield is ${IDEAL_RENT_YIELD}%. Any percentages above those amounts gave a perfect score.

Also note that price score has a floor of ${PRICE_SCORE_FLOOR}% and the location score has a floor of ${LOC_SCORE_FLOOR}% so the property's other merits don't get fully drowned out.

I want you to generate a description/justification of the rating I just calculated for a user. Do not give me any extra text, everything you say will appear on a webpage. You will be supplied the values for the aforementioned ratings (Please note that this system only uses Australian properties). 

Do not mention any scores other than the final star rating, instead try to keep it abstract as  possible, i.e. a school proximity score of 0.20 shouldn't be explicitly mentioned, instead say that the rating is impacted due to the property being far away from schools. But you can mention figures like the capital growth potential and rental yield.

If the rating is low, try to use language that suits that low rating, instead of trying to make it sound positive.

At the end of the description, encourage the user to look at the 'Nearby Amenities' section of the page (down below), or look at the 'Suburb Insights' page for the property the suburb is in (do not confuse this with the user's preferred suburb, try to mention the suburb by name).
`,
        },
        {
          role: "user",
          content: `Objective capital growth score = ${property.growthScore}
Estimated capital growth % = ${property.capGrowthPct}

Objective rental yield score = ${property.yieldScore}
Estimated rental yield % = ${property.rentalYieldPct}

Objective transport proximity score = ${property.transportScore}
Objective school proximity score = ${property.schoolScore}

User's capital growth importance = ${prefs.wGrowth}
User's rental yield importance = ${prefs.wYield}
User's school proximity importance = ${prefs.wSchools}
User's transport proximity importance = ${property.wTransport}

Calculated 'core' score = ${core}
Calculated price score = ${priceScore}
Calculated location score = ${locScore}
Final 0 to 1 rating (core * price * location) = ${final0to1}
Final 0 to 5 star rating (0to1 * 5) = ${stars}

Suburb and postcode of the property = ${property.suburb} ${property.postcode}
User's desired suburb + postcode = ${prefs.suburb} ${prefs.postcode}
`,
        },
      ],
      temperature: 0,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Sets (if appropriate) and returns the highest rated properties for this user.
 *
 * @param id - user id
 * @param forceUpdate - `true` to force update the user's top properties with this call
 * @param max - maximum number of top properties to set for user and return
 * @returns Array of the `max` highest rated properties for the user paired with the rating.
 */
export async function getAndSetUserTopProperties(
  id: string,
  forceUpdate = false,
  max = 5,
): Promise<{ property: Property; rating: number }[]> {
  // if users top properties empty OR modified >= 24h ago, run full algo, set in db and return in correct format
  const user: UserType = await getUser(id);
  if (
    !("top5Properties" in user) ||
    user.top5Properties.propertiesWithRatings.length === 0 ||
    is24HoursAgo(user.top5Properties.updatedAt) ||
    user.top5Properties.updatedAt < user.preferences.updatedAt ||
    forceUpdate
  ) {
    const properties: { id: string; rating: number }[] = [];
    const userPreferences: UserPreferences = getUserPreferencesObject(user);

    // this loop keeps expanding the search radius (starting from preferred location)
    // until at least `max` properties are found and rated or meax radius reached
    let searchRadiusKm = INITIAL_SEARCH_RADIUS_KM;
    let innerKm = 0;
    while (properties.length < max && searchRadiusKm <= MAX_SEARCH_RADIUS_KM) {
      await forEachDoc<{ _id: string }>(
        PropertyData,
        async (property) => {
          const rating = (await getUserPropertyScore(property, userPreferences))
            .rating;
          properties.push({
            id: property._id,
            rating: rating,
          });
        },
        {
          sold: {
            $eq: false,
          },
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [
                  userPreferences.location.lng,
                  userPreferences.location.lat,
                ],
              },
              $minDistance: innerKm * 1000, // minDistance: prevents fetching properties more than once
              $maxDistance: searchRadiusKm * 1000,
            },
          },
          price: {
            // don't consider properties that exceed desired price by too much
            $lte:
              userPreferences.priceMax +
              userPreferences.priceMax * PRICE_CEIL_MAX_PCT,
          },
        },
      );

      innerKm = searchRadiusKm;
      searchRadiusKm += RADIUS_STEP_KM;
    }

    properties.sort((a, b) => b.rating - a.rating);
    properties.length = properties.length > max ? max : properties.length;

    await User.findByIdAndUpdate(id, {
      $set: {
        "top5Properties.updatedAt": new Date(),
        "top5Properties.propertiesWithRatings": properties,
      },
    });

    return Promise.all(
      properties.map(async (object) => {
        return {
          property: await propertyInfo(object.id),
          rating: object.rating,
        };
      }),
    );
  } else {
    // else just fetch the properties and return in correct format
    return Promise.all(
      user.top5Properties.propertiesWithRatings.map(async (object) => {
        return {
          property: await propertyInfo(object.id),
          rating: object.rating,
        };
      }),
    );
  }
}

/**
 * Returns the user-specific rating with description (if desired) for the given property and user.
 *
 * @param userId user id
 * @param propertyId
 * @param generateDescription `true` if description wanted.
 * @returns Rating object with score + description
 */
export async function getIndividualPropertyRating(
  userId: string,
  propertyId: string,
  generateDescription: boolean = false,
): Promise<Rating> {
  const user = await findId(User, userId);
  const userPreferences: UserPreferences = getUserPreferencesObject(user);

  const property = await findId(PropertyData, propertyId);

  return getUserPropertyScore(property, userPreferences, generateDescription);
}

/**
 * Returns a `UserPreferences` object containing the preferences
 * from the given `UserType` object.
 *
 * @param user the `UserType` object for the user
 * @returns `UserPreferences` object
 */
function getUserPreferencesObject(user: UserType): UserPreferences {
  const proximityToST = user.preferences.recommendationScoring[2];
  return {
    suburb: user.preferences.suburb,
    postcode: user.preferences.postcode,
    priceMin: user.preferences.priceRange[0],
    priceMax: user.preferences.priceRange[1],
    location: {
      lng: user.preferences.location.coordinates[0],
      lat: user.preferences.location.coordinates[1],
    },
    wGrowth: user.preferences.recommendationScoring[0],
    wYield: user.preferences.recommendationScoring[1],
    // each are a percentage of the "proximity to schools/transport" percentage
    wSchools: (user.preferences.recommendationScoring[3] / 100) * proximityToST,
    wTransport:
      (user.preferences.recommendationScoring[4] / 100) * proximityToST,
  };
}

function clamp(x: number): number {
  return Math.max(0, Math.min(1, x));
}
