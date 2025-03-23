import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import ejs from "ejs";
import bodyParser from "body-parser";

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

const supabase = createClient(url, key);

console.log(url, key);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

let currentUserId = null;

let users = [
  { id: 1, name: "Tom Jones", color: "red" },
  { id: 2, name: "Henry Smith", color: "green" },
];

async function getUsersList() {
  const { data, error } = await supabase.from("users").select("*");
  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return data;
}

async function checkCurrentUser() {
  if (currentUserId === null) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .order("id", { ascending: true })
      .limit(1);
    if (data && data.length > 0) {
      currentUserId = data[0].id;
    }
  }
}

async function checkedCountries() {   
  const { data, error } = await supabase
    .from("visited_countries")
    .select("country_code")
    .eq("user_id", currentUserId);

    return data
}

app.post("/user", async (req, res) => {
  // res.render("new.ejs");
  const userId = req.body.user;
  const addNew = req.body.add;

  if (addNew === "new") {
    res.render("new.ejs");
  } else {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId);
      if (error) {
        console.error("Error checking user exists ", error);
        res.status(500).json({ error: "Error checking user exists" });
      }

      if (data.length > 0) {
        currentUserId = data[0].id;
        console.log("User exists. Current user id ", currentUserId + " " + data[0].color);
        res.redirect("/");
      }
    } catch (err) {
      console.error("Unexpected error: ", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
});

app.post("/new", (req, res) => {
  const userName = req.body.name;
  const color = req.body.color;

  supabase
    .from("users")
    .insert([{ name: userName, color: color }])
    .then(({ error, data }) => {
      if (error) {
        console.log("Error inserting record ", error);
        return res.status(400).json({ error: error.message });
      }
      console.log("Record inserted succesfully ", data);
      res.redirect("/");
    })
    .catch((err) => {
      console.log("Unexpected error " + err);
      res.status(500).json({ error: "Something went wrong" });
    });
});

app.get("/", async (req, res) => {
  await checkCurrentUser();
  const fetchedUsers = await getUsersList();
  const countries = await checkedCountries();
  let countryCodes = [];


  countries.forEach(country => {
    countryCodes.push(country.country_code)
  })  

  res.render("index.ejs", {
    users: fetchedUsers,
    error: "Populate error here",
    color: 'red',
    total: countryCodes.length,
    countries: countryCodes
  })
});

app.post("/add", async (req, res) => {
  const country = req.body.country;

  const { data, error } = await supabase
    .from("countries")
    .select("country_code")
    .filter("country_name", "ilike", country.toLowerCase());

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Data:", data);
  }

  const { country_code } = data[0];

  console.log(country_code);

  try {
    await supabase.from("visited_countries").insert([
      {
        country_code: country_code,
        user_id: currentUserId,
      },
    ]);
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.post("/new", (req, res) => {});

app.listen(port, () => {
  console.log("Listening on port " + port);
});
