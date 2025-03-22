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

let users = [
  { id: 1, name: "Tom Jones", color: "red" },
  { id: 2, name: "Henry Smith", color: "green" },
];

let currentUserId = 1;

async function getUsersList() {
  const { data, error } = await supabase.from("users").select("*");
  console.log("Line 32" + data[0]);
  users = data;
}

async function getCurrentUser() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", currentUserId);
  if (error) {
    console.log("Error fetching user");
    return;
  }

  if (data.length === 0) {
    console.log("No user found");
    return;
  }

  // return data[0];
  console.log("LINE 51" + data[0]);
}

async function checkedCountries() {
  const { data, error } = await supabase
    .from("visited_countries")
    .select("country_code")
    .eq("user_id", currentUserId);
  data.forEach((d) => {
    console.log(d.country_code);
  });
}

app.post("/user", (req, res) => {
    currentUserId = req.body.user;
    console.log("LINE 66 " + currentUserId)
    res.redirect("/")
})

app.get("/", async (req, res) => {
  try {
    const userList = await getUsersList();
    const currentUser = await getCurrentUser();
    const countries = await checkedCountries();
    const { data, error } = await supabase.from("countries").select("*");

    if (error) {
      console.log("Error", error);
    } else {
      res.render("index.ejs", {
        users: users,
        error: error,
        color: users.color,
        total: 2,
        countries: countries,
      });
    }
  } catch (error) {
    console.error("Unexpected error", error);
  }
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

app.post("/new", (req, res) => {
  const newUser = req.body.name;
  const color = req.body.color;

  if (!newUser || !color) {
    return res.status(400).json({ error: "Name and colour required" });
  }

  supabase
    .from("users")
    .insert([
      {
        name: newUser,
        color: color,
      },
    ])
    .then(({ data, error }) => {
      if (error) {
        console.error("Error inserting data", error);
        return res.status(400).json({ error: error.message });
      }

      console.log("Data inserted succesfully!", data);
      getUsersList();
      res.status(200).redirect("/");
    })
    .catch((err) => {
      console.error("Unexpected Error", err);
      res.status(500).json({ error: "Something went wrong" });
    });
});

// app.post("/new", (req, res) => {
//     const newUser = req.body.name;

app.listen(port, () => {
  console.log("Listening on port " + port);
});
