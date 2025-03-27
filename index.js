import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import ejs from "ejs";
import bodyParser from "body-parser";

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

const supabase = createClient(url, key);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

let currentUser = null;
let error = null;

async function initialiseApp() {
        currentUser = await checkCurrentUser();
}


initialiseApp().then(() => {
    app.get("/", async (req, res) => {
        const fetchedUsers = await getUsersList();
        const countries = await checkedCountries();
        res.render("index.ejs", {
            users:fetchedUsers,
            error: error,
            color: currentUser.color,
            countries: countries,
            total: countries.length
        })
    })

    app.post("/user", async (req, res) => {
        if(req.body.user) {
            currentUser = await checkCurrentUser(req.body.user);
            res.redirect("/")
        }
        if(req.body.add) {
            res.render("new.ejs")
        }
    })

    app.post("/add", async (req, res) => {
        const country = req.body.country;
        console.log(currentUser)
        console.log(country)
        try {
            const {data, error} = await supabase.from('countries').select('country_code').ilike('country_name', "%" + country.toLowerCase() + "%");
            if(!data || data.length === 0) {
                return res.status(400).json({error: "Country not found"});
            }else{
                const {country_code} =  data[0];
                try {
                    console.log("Line 62" + " " + country_code + currentUser.id);
                    await supabase.from('visited_countries').insert([{country_code: country_code, user_id: currentUser.id}]);
                    res.redirect("/")
                }catch(error) {
                    console.log(error)
                }
            }
        }catch(error) {
            console.log(error)
        }
    })
})



app.listen(port, () => {
  console.log("Listening on port " + port);
});

async function checkedCountries() {
    const { data, error } = await supabase
      .from("visited_countries")
      .select("country_code")
      .eq("user_id", currentUser.id);
  
    return data;
  }

async function checkCurrentUser(userId) {
    if (currentUser === null) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .order("id", { ascending: true })
        .limit(1);
      if (data && data.length > 0) {
        return data[0];
      }
    }else{
        const {data} = await supabase.from('users').select('*').eq('id', userId);
        return data[0];
    }
  }

  async function getUsersList() {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }
    return data;
  }



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

