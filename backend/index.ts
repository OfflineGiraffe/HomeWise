/* eslint-disable @typescript-eslint/no-require-imports */
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

import { Request, Response, NextFunction } from "express";
import HTTPError from "http-errors";
import { filteredPropertySearch } from "./routes/search";
import {
  register,
  emailInUse,
  getUserProfile,
  login,
  resetPasswordRequest,
  resetPassword,
  resetCodeCheck,
  viewSaved,
  editPropertyNote,
  editPreferences,
  editAccountInfo,
  changePassword,
  deleteAccount,
} from "./routes/accounts";
import {
  propertyInfo,
  bookmarkProperty,
  removeBookmark,
  getGeneralAmenities,
  getRequestedNearbyAmenity,
  uploadProperties,
  userHistory,
  markPropertyAsSold,
} from "./routes/property";
import { agentInfo } from "./routes/agent";
import {
  getComparedProperties,
  addCompare,
  removeCompare,
} from "./routes/compare";
import { agencyInfo } from "./routes/agency";
import { findLatLong } from "./routes/helper";
import {
  getAndSetUserTopProperties,
  getIndividualPropertyRating,
} from "./routes/recommender";

app.listen(port, () => {
  console.log(`HomeWise backend server listening on port ${port}`);
});

mongoose
  .connect(
    "mongodb+srv://homewiseh16a:T2_Software@cluster0.snpll2b.mongodb.net/homewiseData?retryWrites=true&w=majority&appName=Cluster0",
  )
  .then(() => {
    // PropertyData.createIndexes(); <- this will have to be uncommented in production build
    console.log("HomeWise Database online");
  });

app.get("/", (req: Request, res: Response) => {
  res.send("<h1>HOMEWISE BACKEND SERVER</h1>");
});

/**
 * request body in the form `SearchParameters` (interface in `search.ts`)
 * response in the form `{properties : [Property]}`
 */
app.get("/search", async (req: Request, res: Response) => {
  try {
    const propertyArray = await filteredPropertySearch(req.query);
    res.json({ properties: propertyArray });
  } catch (err) {
    if (err instanceof Error) {
      res.status(404).send(err.message);
      return;
    }
  }
});

/**
 * uses url query parameter `email`
 * e.g. homewise.com.au/accounts/resetPasswordRequest?email=email@email.com
 * response in the form of `String`
 */
app.get(
  "/accounts/resetPasswordRequest",
  async (req: Request, res: Response) => {
    try {
      const email = req.query.email as string;
      res.send(await resetPasswordRequest(email));
    } catch (err) {
      res
        .status((err as HTTPError.HttpError).status || 500)
        .json({ error: (err as HTTPError.HttpError).message });
    }
  },
);

/**
 * uses url query parameter `code`
 * e.g. homewise.com.au/accounts/resetCodeVerify?code=1234
 * response in the form of `Boolean`
 */
app.get("/accounts/resetCodeVerify", async (req: Request, res: Response) => {
  try {
    const resetCode = req.query.code as string;
    res.send(await resetCodeCheck(resetCode));
  } catch (err) {
    res
      .status((err as HTTPError.HttpError).status || 500)
      .json({ error: (err as HTTPError.HttpError).message });
  }
});

/**
 * uses url query parameter `email` and `password`
 * e.g. homewise.com.au/accounts/resetPassword?email=a@email.com&?password=Password123
 */
app.get("/accounts/resetPassword", async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    const newPassword = req.query.password as string;
    await resetPassword(email, newPassword);
    res.sendStatus(201);
  } catch (err) {
    res
      .status((err as HTTPError.HttpError).status || 500)
      .json({ error: (err as HTTPError.HttpError).message });
  }
});

/**
 * requires request body fields `firstName`, `lastName`, `email`, `password`, `suburb`, `postcode`, `priceLowest`, `priceHighest`, `capitalGrowth`, `rentalYield`, `proximityScore`, `schoolProximity`, `transportProximity`
 * e.g. homewise.com.au/accounts/register
 * response in the form of json { token: string }
 */
app.post("/accounts/register", async (req: Request, res: Response) => {
  try {
    const name: string[] = [req.body.firstName, req.body.lastName];
    const email: string = req.body.email;
    const password: string = req.body.password;
    const suburb: string = req.body.suburb;
    const postcode: string = req.body.postcode;
    const priceRange: number[] = [
      parseInt(req.body.priceLowest),
      parseInt(req.body.priceHighest),
    ];
    const criteria: number[] = [
      req.body.capitalGrowth,
      req.body.rentalYield,
      req.body.proximityScore,
      req.body.schoolProximity,
      req.body.transportProximity,
    ];

    const ret = await register(
      name,
      email,
      password,
      suburb,
      postcode,
      priceRange,
      criteria,
    );
    res.status(201).json({ token: ret });
  } catch (err) {
    res
      .status((err as HTTPError.HttpError).status || 500)
      .json({ error: (err as HTTPError.HttpError).message });
  }
});

/**
 * uses url query parameter `email`
 * e.g. homewise.com.au/accounts/register/check_email?email=a@email.com
 * response in the form of json { response: boolean }
 */
app.get(
  "/accounts/register/check_email",
  async (req: Request, res: Response) => {
    try {
      const email: string = req.query.email as string;
      const ret = await emailInUse(email);
      res.json({ response: ret });
    } catch (err) {
      res
        .status((err as HTTPError.HttpError).status || 500)
        .json({ error: (err as HTTPError.HttpError).message });
    }
  },
);

/**
 * uses url query parameter `id`
 * e.g. homewise.com.au/property?id=1c2d3e4g5
 * response in the form of `Property` object (interface in `property.ts`)
 */
app.get("/property", async (req: Request, res: Response) => {
  try {
    const property = await propertyInfo(req.query.id as string);
    res.send(property);
    return;
  } catch (err) {
    if (err instanceof Error) {
      res.status(404).send(err.message);
      return;
    }
  }
});

/**
 * uses url query parameter `id`
 * e.g. homewise.com.au/agency?id=1c2d3e4g5
 * response in the form of `Agency` object (interface in `agency.ts`)
 */
app.get("/agency", async (req: Request, res: Response) => {
  try {
    const agent = await agencyInfo(req.query.id as string);
    res.send(agent);
    return;
  } catch (err) {
    if (err instanceof Error) {
      res.status(404).send(err.message);
      return;
    }
  }
});

/**
 * uses url query parameter `id`
 * e.g. homewise.com.au/agent?id=1c2d3e4g5
 * response in the form of `Agent` object (interface in `agent.ts`)
 */
app.get("/agent", async (req: Request, res: Response) => {
  try {
    const agent = await agentInfo(req.query.id as string);
    res.send(agent);
    return;
  } catch (err) {
    if (err instanceof Error) {
      res.status(404).send(err.message);
      return;
    }
  }
});

/**
 * requires the header Authorization: Bearer <token>
 * e.g. homewise.com.au/user/profile
 * response in the form of json `UserProfile` object (interface in `accounts.ts`)
 */
app.get(
  "/user/profile",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const ret = await getUserProfile(req.user.userId as string);
      res.json(ret);
    } catch (err) {
      res
        .status((err as HTTPError.HttpError).status || 500)
        .json({ error: (err as HTTPError.HttpError).message });
    }
  },
);

/**
 * requires request body fields `email`, `password`
 * e.g. homewise.com.au/accounts/login
 * response in the form of json { token: string }
 */
app.post("/accounts/login", async (req: Request, res: Response) => {
  try {
    const email = req.body.email as string;
    const password = req.body.password as string;
    const ret = await login(email, password);
    res.status(201).json({ token: ret });
  } catch (err) {
    res
      .status((err as HTTPError.HttpError).status || 500)
      .json({ error: (err as HTTPError.HttpError).message });
  }
});

/**
 * requires the header Authorization: Bearer <token>
 * requires request body fields `firstName`, `lastName`, `email`
 * e.g. homewise.com.au/user/edit/account_info
 */
app.post(
  "/user/edit/account_info",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId as string;
      const firstName = req.body.firstName as string;
      const lastName = req.body.lastName as string;
      const email = req.body.email as string;
      await editAccountInfo(userId, firstName, lastName, email);
      res.sendStatus(201);
    } catch (err) {
      res
        .status((err as HTTPError.HttpError).status || 500)
        .json({ error: (err as HTTPError.HttpError).message });
    }
  },
);

/**
 * requires the header Authorization: Bearer <token>
 * requires request body field `password`
 * e.g. homewise.com.au/user/edit/password
 */
app.post(
  "/user/edit/password",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId as string;
      const password = req.body.password as string;
      await changePassword(userId, password);
      res.sendStatus(201);
    } catch (err) {
      res
        .status((err as HTTPError.HttpError).status || 500)
        .json({ error: (err as HTTPError.HttpError).message });
    }
  },
);

/**
 * requires the header Authorization: Bearer <token>
 * requires request body fields `suburb`, `postcode`, `priceLowest`, `priceHighest`, `capitalGrowth`, `rentalYield`, `proximityScore`, `schoolProximity`, `transportProximity`
 * e.g. homewise.com.au/user/edit/preferences
 */
app.post(
  "/user/edit/preferences",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId as string;
      const suburb = req.body.suburb as string;
      const postcode = req.body.postcode;
      const priceRange: number[] = [
        req.body.priceLowest,
        req.body.priceHighest,
      ];
      const scoring: number[] = [
        req.body.capitalGrowth,
        req.body.rentalYield,
        req.body.proximityScore,
        req.body.schoolProximity,
        req.body.transportProximity,
      ];

      await editPreferences(userId, suburb, postcode, priceRange, scoring);
      res.sendStatus(201);
    } catch (err) {
      res
        .status((err as HTTPError.HttpError).status || 500)
        .json({ error: (err as HTTPError.HttpError).message });
    }
  },
);

/**
 * requires the header Authorization: Bearer <token>
 * e.g. homewise.com.au/user/delete
 */
app.delete(
  "/user/delete",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId as string;
      await deleteAccount(userId);
      res.sendStatus(204);
    } catch (err) {
      res
        .status((err as HTTPError.HttpError).status || 500)
        .json({ error: (err as HTTPError.HttpError).message });
    }
  },
);

/**
 * requires the header Authorization: Bearer <token>
 * e.g. homewise.com.au/compare
 */
app.get("/compare", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId as string;
    const ret = await getComparedProperties(userId);
    res.json(ret);
  } catch (err) {
    res
      .status((err as HTTPError.HttpError).status || 500)
      .json({ error: (err as HTTPError.HttpError).message });
  }
});

/**
 * uses url query parameter `propertyId`
 * requires the header Authorization: Bearer <token>
 * e.g. homewise.com.au/compare/add?propertyId=1234
 */
app.post(
  "/compare/add",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId as string;
      const propertyid = req.query.propertyId as string;
      const ret = await addCompare(userId, propertyid);
      res.json(ret);
    } catch (err) {
      res
        .status((err as HTTPError.HttpError).status || 500)
        .json({ error: (err as HTTPError.HttpError).message });
    }
  },
);

/**
 * uses url query parameter `propertyId`
 * requires the header Authorization: Bearer <token>
 * e.g. homewise.com.au/compare/remove?propertyId=1234
 */
app.delete(
  "/compare/remove",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId as string;
      const propertyid = req.query.propertyId as string;
      const ret = await removeCompare(userId, propertyid);
      res.json(ret);
    } catch (err) {
      res
        .status((err as HTTPError.HttpError).status || 500)
        .json({ error: (err as HTTPError.HttpError).message });
    }
  },
);

/**
 * uses url query parameter `propId`
 * requires the header Authorization: Bearer <token>
 * e.g. homewise.com.au/property/bookmark?propId=1234
 * response in the form of `String` which is a simple status statement
 */
app.get(
  "/property/bookmark",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const propId = req.query.propId as string;
      const userId = req.user.userId as string;
      const returnObj = await bookmarkProperty(propId, userId);
      res.send(returnObj);
      return;
    } catch (err) {
      if (err instanceof Error) {
        res.status(404).send(err.message);
        return;
      }
    }
  },
);

/**
 * requires the header Authorization: Bearer <token>
 * e.g. homewise.com.au/user/viewBookmarks
 * response in the form of an array of `savedProperty` Object
 */
app.get(
  "/user/viewBookmarks",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId as string;
      const returnObj = await viewSaved(userId);
      res.send(returnObj);
      return;
    } catch (err) {
      res
        .status((err as HTTPError.HttpError).status || 500)
        .json({ error: (err as HTTPError.HttpError).message });
    }
  },
);

/**
 * requires the header Authorization: Bearer <token>
 * uses url query parameter `propId` and `note`
 * e.g. homewise.com.au/user/editPropertyNote?propId=1234&?note=hello
 */
app.get(
  "/user/editPropertyNote",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const propId = req.query.propId as string;
      const userId = req.user.userId as string;
      const note = req.query.note as string;
      await editPropertyNote(propId, userId, note);
      res.sendStatus(201);
      return;
    } catch (err) {
      res
        .status((err as HTTPError.HttpError).status || 500)
        .json({ error: (err as HTTPError.HttpError).message });
    }
  },
);

/**
 * requires the header Authorization: Bearer <token>
 * uses url query parameter `propId`
 * response in the form of `String` which is a simple status statement
 */
app.get(
  "/property/removebookmark",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const propId = req.query.propId as string;
      const userId = req.user.userId as string;
      const returnObj = await removeBookmark(propId, userId);
      res.send(returnObj);
      return;
    } catch (err) {
      if (err instanceof Error) {
        res.status(404).send(err.message);
        return;
      }
    }
  },
);

/**
 * uploads array of properties,
 * see `UploadedProperty` in `property.ts` for property structure
 * body takes the form `{ properties : [UploadedProperty] }
 */
app.post("/property/upload", async (req: Request, res: Response) => {
  try {
    await uploadProperties(req.body.properties);
    res.status(201).send();
    return;
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).send({ error: (err as Error).message });
      return;
    }
  }
});

/**
 * marks the property with the given id as sold
 * uses query parameter `properties`
 */
app.post("/property/marksold", async (req: Request, res: Response) => {
  try {
    await markPropertyAsSold(req.query.properties as string);
    res.status(201).send();
    return;
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).send({ error: (err as Error).message });
      return;
    }
  }
});

/**
 * request query in the form `{ id: string }` where the string is the propertyId
 * response in the form `Amenity[]`
 */
app.get("/amenities", async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.id as string;
    const property = await propertyInfo(propertyId);
    const amenities = await getGeneralAmenities(property);
    res.send(amenities);
    return;
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * request query in the form `{ id: string }` where the string is the propertyId
 * response in the form `Amenity[]`
 */
app.get("/amenities/type", async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.id as string;
    const type = req.query.type as string;

    if (!propertyId || !type) {
      return res.status(400).json({ error: "Missing id or type" });
    }

    const property = await propertyInfo(propertyId);
    const address = `${property.streetNumber} ${property.street}, ${property.suburb}, ${property.state} ${property.postcode}`;
    const location = await findLatLong(address);

    const amenities = await getRequestedNearbyAmenity(location, type);
    res.send(amenities);
    return;
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * requires the header Authorization: Bearer <token>
 * uses url query parameter `propertyId` and `description`
 * returns user's tailored rating for the given property (number between [0,5])
 * response : `{ rating : number, description: string }`
 */
app.get(
  "/recommender/property",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const propertyId = req.query.propertyId as string;
      const userId = req.user.userId as string;
      const includeDescription =
        "description" in req.query ? req.query.description === "true" : false;
      const rating = await getIndividualPropertyRating(
        userId,
        propertyId,
        includeDescription,
      );
      res.send(rating);
      return;
    } catch (err) {
      if (err instanceof Error) {
        res.status(500).send(err.message);
        return;
      }
    }
  },
);

/**
 * uses url query parameter `userId`
 * returns user's top 5 properties based on rating (rating = number between [0,5])
 * in the form `{ propertiesAndRatings: [{ property : Property, rating: number }] }`
 */
app.get(
  "/recommender/top",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId as string;
      const propertiesAndRatings = await getAndSetUserTopProperties(userId);
      res.send({ propertiesAndRatings });
      return;
    } catch (err) {
      if (err instanceof Error) {
        res.status(500).send(err.message);
        return;
      }
    }
  },
);

/**
 * requires the header Authorization: Bearer <token>
 * uses url query parameter`propId`
 * response in the form of `String` which is a simple status statement
 */
app.get(
  "/property/userView",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId as string;
      const propId = req.query.propId as string;
      const returnObj = await userHistory(userId, propId);
      res.send(returnObj);
      return;
    } catch (err) {
      if (err instanceof Error) {
        res.status(404).send(err.message);
        return;
      }
    }
  },
);

/**
 * uses request body parameter, `suburb` and `postcode`
 * response in the form of a JSON object, containing an arrray
 * that has 20 entries under the key 'median_house_price_quarterly'
 */
app.post("/suburb/price-history", async (req: Request, res: Response) => {
  const suburb = req.body.suburb as string;
  const postcode = req.body.postcode as string;

  try {
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
            content: `Provide a JSON response containing estimated median house prices for the specified Australian suburb and postcode over the past 5 years, separated by quarters. Each entry must be a key-value pair where the key is in the format "YYYY QX" (e.g., "2020 Q1") and the value is a number representing the median house price in AUD.

If exact data is unavailable, make a reasonable estimate using similar nearby suburbs.

Only return the following JSON structure. Do not include any explanation or text outside the JSON:

{
  "median_house_price_quarterly": [
    { "2020 Q1": number },
    { "2020 Q2": number },
    { "2020 Q3": number },
    { "2020 Q4": number },
    { "2021 Q1": number },
    { "2021 Q2": number },
    { "2021 Q3": number },
    { "2021 Q4": number },
    { "2022 Q1": number },
    { "2022 Q2": number },
    { "2022 Q3": number },
    { "2022 Q4": number },
    { "2023 Q1": number },
    { "2023 Q2": number },
    { "2023 Q3": number },
    { "2023 Q4": number },
    { "2024 Q1": number },
    { "2024 Q2": number },
    { "2024 Q3": number },
    { "2024 Q4": number }
  ]
}`,
          },
          {
            role: "user",
            content: `${suburb}, ${postcode}`,
          },
        ],
        temperature: 0,
      }),
    });

    const data = await response.json();
    res.send(data.choices[0].message.content);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
  }
});

/**
 * uses request body parameter, `suburb` and `postcode`
 * response in the form of a string, containing a number value
 * that indicates the population of the inputted suburb'
 */
app.post("/suburb/population", async (req: Request, res: Response) => {
  const suburb = req.body.suburb as string;
  const postcode = req.body.postcode as string;

  try {
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
            content: `You are a helpful assistant. Return only a number.`,
          },
          {
            role: "user",
            content: `What is the 2021 ABS Census population of the suburb of "${suburb}" in Australia, whose postcode is ${postcode}? Return only the population number, with no words or explanation.`,
          },
        ],
        temperature: 0,
      }),
    });

    const data = await response.json();
    const population = data.choices?.[0]?.message?.content?.trim();

    res.send(population);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    res.status(500).json({ error: "Failed to retrieve population." });
  }
});

/**
 * uses request body parameters, `suburb` and `postcode`
 * response is a JSON object with two keys: `primary` and `high`
 * Each contains a list of 5 schools with `name` and `rank`
 */
app.post("/suburb/schools", async (req: Request, res: Response) => {
  const suburb = req.body.suburb as string;
  const postcode = req.body.postcode as string;

  try {
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
            content: `You are a helpful assistant that provides structured school rankings.

Return a JSON object with the following format, listing the **top 5 primary** and **top 5 high** schools in or near the given Australian suburb. Do not include any university campuses.

Each school should be listed with:
- "name": the school's full name
- "rank": an integer representing its state academic rank (lower = better)

Use real data if known. If not, estimate reasonably using nearby schools.
Only list schools known for academic performance based on well-known, publicly available reputation. Do NOT guess rankings if unsure. Use data consistent with what might be found on the Australian 'My School' website.

Respond **only** with JSON and no extra text.

Format:

{
  "primary": [
    { "name": "Example Primary School", "rank": 45 },
    ...
  ],
  "high": [
    { "name": "Example High School", "rank": 23 },
    ...
  ]
}
`,
          },
          {
            role: "user",
            content: `${suburb}, ${postcode}`,
          },
        ],
        temperature: 0,
      }),
    });

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch (error) {
    console.error("Error fetching school rankings:", error);
    res.status(500).json({ error: "Failed to retrieve school rankings." });
  }
});

/**
 * Expects `suburb` and `postcode` in the request body.
 * Responds with an integer representing the suburb's average rental rate.
 */
app.post("/suburb/average-rent", async (req: Request, res: Response) => {
  const suburb = req.body.suburb as string;
  const postcode = req.body.postcode as string;

  try {
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
            content: `You are a helpful assistant. Return only a number representing the average weekly rent in AUD.`,
          },
          {
            role: "user",
            content: `What is the average weekly rent for a 2-3 bedroom house/apartment in the suburb of "${suburb}", postcode ${postcode} in Australia? Return only the weekly rent amount as a number, no dollar sign, no words or explanation.`,
          },
        ],
        temperature: 0,
      }),
    });

    const data = await response.json();
    const rent = data.choices?.[0]?.message?.content?.trim();
    res.send(rent);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    res.status(500).json({ error: "Failed to retrieve average rent." });
  }
});

/**
 * Expects `suburb` and `postcode` in the request body.
 * Responds with a string label: "Very Low", "Low", "Average", "High", or "Very High", indicating the suburb's crime safety level.
 */
app.post("/suburb/crime-index", async (req: Request, res: Response) => {
  const suburb = req.body.suburb as string;
  const postcode = req.body.postcode as string;

  try {
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
            content: `You are a helpful assistant. Based on crime rates, police presence, and safety reports, classify the safety level of the Australian suburb into exactly one of the following categories:

"Very Low", "Low", "Average", "High", or "Very High".

Respond with only one of these labels and nothing else. Do not include a number, percentage, or explanation.`,
          },
          {
            role: "user",
            content: `What would be the crime safety level ("Very Low", "Low", "Average", "High", or "Very High") for the suburb of "${suburb}", postcode ${postcode} in Australia? Return only the label.`,
          },
        ],
        temperature: 0,
      }),
    });

    const data = await response.json();
    const safetyIndex = data.choices?.[0]?.message?.content?.trim();
    res.send(safetyIndex);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    res.status(500).json({ error: "Failed to retrieve safety index." });
  }
});

/**
 * Expects `suburb` and `postcode` in the request body.
 * Responds with a string label: "Very Low", "Low", "Average", "High", or "Very High", indicating the suburb's walkability level.
 */
app.post("/suburb/walkability", async (req: Request, res: Response) => {
  const suburb = req.body.suburb as string;
  const postcode = req.body.postcode as string;

  try {
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
            content: `You are a helpful assistant. Based on walkability data in Australian suburbs (including pedestrian infrastructure, access to public transport, and local amenities), classify the walkability of the suburb into exactly one of the following categories:

"Very Low", "Low", "Average", "High", or "Very High".

Respond with only one of these labels and nothing else. Do not add explanation, units, scores, or punctuation.`,
          },
          {
            role: "user",
            content: `What would be the walkability level ("Very Low", "Low", "Average", "High", or "Very High") for the suburb of "${suburb}", postcode ${postcode} in Australia? Return only the label.`,
          },
        ],
        temperature: 0,
      }),
    });

    const data = await response.json();
    const walkabilityScore = data.choices?.[0]?.message?.content?.trim();
    res.send(walkabilityScore);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    res.status(500).json({ error: "Failed to retrieve walkability score." });
  }
});

/**
 * uses request body parameters, `suburb` and `postcode`
 * response is a JSON array containing transport infrastructure
 * Each entry has `name`, `description`, and `type`
 */
app.post("/suburb/transport", async (req: Request, res: Response) => {
  const suburb = req.body.suburb as string;
  const postcode = req.body.postcode as string;

  try {
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
            content: `You are a helpful assistant that provides structured transport infrastructure information for Australian suburbs.

Return a JSON array containing the **major transport infrastructure** in or near the given Australian suburb and postcode. 

Each transport hub should include:
- "name": the official name of the transport hub/station/stop
- "description": a brief one-sentence description of what it connects to or serves
- "type": Examples could be transport type such as Train, Bus, Light Rail, Metro, Airport, Tram.

Focus on major transport infrastructure that residents would commonly use. Limit to 5 most significant transport options.

Use real data if known. If exact data is unavailable, provide reasonable estimates based on typical Australian transport infrastructure for similar areas.

Respond **only** with JSON array and no extra text.

Format:
[
  {
    "name": "Central Station",
    "description": "Major railway hub connecting suburban, intercity and interstate services",
    "type": "Train"
  },
  {
    "name": "George Street Bus Interchange",
    "description": "Central bus terminal serving multiple city and suburban routes",
    "type": "Bus"
  }
]`,
          },
          {
            role: "user",
            content: `${suburb}, ${postcode}`,
          },
        ],
        temperature: 0,
      }),
    });

    const data = await response.json();

    // OpenAI returns the result as a stringified JSON in content
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch (error) {
    console.error("Error fetching transport infrastructure:", error);
    res
      .status(500)
      .json({ error: "Failed to retrieve transport infrastructure." });
  }
});

/**
 * uses request body parameters, `suburb` and `postcode`
 * response is a JSON array containing major suburb features
 * Each entry has `name`, `description`, and `category`
 */
app.post("/suburb/features", async (req: Request, res: Response) => {
  const suburb = req.body.suburb as string;
  const postcode = req.body.postcode as string;

  try {
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
            content: `You are a helpful assistant that provides structured information about major features and amenities in Australian suburbs.

Return a JSON array containing the **major features, amenities, and points of interest** in or near the given Australian suburb and postcode.

Some options for significant features can be from these categories:
- Parks & Recreation: Major parks, reserves, beaches, walking trails, sports complexes
- Shopping: Shopping centers, malls, major retail strips, markets
- Healthcare: Hospitals, medical centers, major clinics
- Education: Universities, TAFE campuses, major libraries
- Entertainment: Cinemas, theaters, museums, galleries, entertainment venues
- Dining: Major restaurant precincts, food courts, popular dining areas
- Sports & Leisure: Stadiums, aquatic centers, leisure centers, golf courses
- Services: Government offices, major community centers
- Religious: Significant places of worship
- Other: Any other notable landmarks or features

Each feature should include:
- "name": the official name of the feature/venue/location
- "description": a brief one-sentence description of what it offers or why it's significant
- "category": the primary category e.g., "Recreation", "Shopping", "Healthcare", "Entertainment", "Dining", "Sports", "Education", "Services", "Religious", "Landmark" (Do not create features that do not exist in that region)

Focus on features that are genuinely significant to residents and visitors. Limit to 10-12 most important features.

Use real data if known.

Respond **only** with JSON array and no extra text.

Format:
[
  {
    "name": "Centennial Park",
    "description": "Large public park featuring gardens, ponds, sports facilities and cycling paths",
    "category": "Recreation"
  },
  {
    "name": "Westfield Bondi Junction",
    "description": "Major shopping center with 400+ stores, dining and entertainment options",
    "category": "Shopping"
  }
]`,
          },
          {
            role: "user",
            content: `${suburb}, ${postcode}`,
          },
        ],
        temperature: 0,
      }),
    });

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch (error) {
    console.error("Error fetching suburb features:", error);
    res.status(500).json({ error: "Failed to retrieve suburb features." });
  }
});

/**
 * Middleware function to authenticate jwt token sent via header.
 * @param req - `Request` Object
 * @param res - `Response` Object
 * @param next - `next()` function
 */
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  // didn't send token
  if (token == null)
    return res.status(401).json({ error: "Unauthorized request." });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err: any, user: any) => {
    // token not valid
    if (err) return res.status(403).json({ error: "Invalid token." });
    req.user = user;
    next();
  });
}
