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
            console.log(req.body.user)
            const user = await checkCurrentUser(req.body.user);
            const {data, error} = await supabase.from('visited_countries').select('*').eq('user_id', user.id);
            console.log("This is the data" + data[0].country_code);
            // const {data, error} = await supabase.from('visited_countries').select('*').eq('id', currentUser.id);
            // console.log(data)
        }
        if(req.body.add) {
            res.render("new.ejs")
        }
    })
})

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

  async function checkedCountries() {
    const { data, error } = await supabase
      .from("visited_countries")
      .select("country_code")
      .eq("user_id", currentUser.id);
  
    return data;
  }









































// app.post("/user", async (req, res) => {
//   // res.render("new.ejs");
//   const userId = req.body.user;
//   const addNew = req.body.add;

//   if (addNew === "new") {
//     res.render("new.ejs");
//   } else {
//     try {
//       const { data, error } = await supabase
//         .from("users")
//         .select("*")
//         .eq("id", userId);
//       if (error) {
//         console.error("Error checking user exists ", error);
//         res.status(500).json({ error: "Error checking user exists" });
//       }

//       if (data.length > 0) {
//         currentUserId = data[0].id;
//         console.log(
//           "User exists. Current user id ",
//           currentUserId + " " + data[0].color
//         );
//         res.redirect("/");
//       }
//     } catch (err) {
//       console.error("Unexpected error: ", err);
//       res.status(500).json({ error: "Something went wrong" });
//     }
//   }
// });

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

// app.get("/", async (req, res) => {
//   await checkCurrentUser();
//   const fetchedUsers = await getUsersList();
//   const countries = await checkedCountries();
//   let countryCodes = [];
  
//   countries.forEach((country) => {
//     countryCodes.push(country.country_code);
//   });

//   res.render("index.ejs", {
//     users: fetchedUsers,
//     error: "Populate error here",
//     color: currentUser.color,
//     total: countryCodes.length,
//     countries: countryCodes,
//   });
// });

app.post("/add", async (req, res) => {
    console.log("LINE 135 ", currentUserId);
    const country = req.body.country;
    try {
        const {data, error} = await supabase.from('countries')
        .select('country_code')
        .ilike('country_name', "%" + country.toLowerCase() + "%");

        if(!data || data.length === 0) {
            return res.status(400).json({error: "Country not found"})
        }else{
            const {country_code} = data[0];
            console.log(country_code);
            try {
                await supabase.from('visited_countries').insert([
                    {country_code: country_code, user_id: currentUserId}
                ]);
            }catch(error) {
                console.log("ERROR " + error);
            }
        }
    }catch(error) {

    }
    res.render("index.ejs")


});




app.post("/new", (req, res) => {});

app.listen(port, () => {
  console.log("Listening on port " + port);
});

//   if(error) {
//     console.log("Error " + error);
//   }else{
//     const {country_code} = data[0];
//     try {
//         await supabase.from('visited_countries').insert([
//             {country_code: country_code, user_id: currentUserId}
//         ]);
//     }catch(error){
//         console.log(error);
//     }
//     res.redirect("/")
//   }

//   const { data, error } = await supabase
//     .from("countries")
//     .select("country_code")
//     .filter("country_name", "ilike", country.toLowerCase());

//   if (error) {
//     console.error("Error:", error);
//   } else {
//     console.log("Data:", data);
//   }

//   const { country_code } = data[0];

//   console.log(country_code);

//   try {
//     await supabase.from("visited_countries").insert([
//       {
//         country_code: country_code,
//         user_id: currentUserId,
//       },
//     ]);
//     res.redirect("/");
//   } catch (error) {
//     console.log(error);
//   }

//   const country = req.body.country;
//   const { data, error } = await supabase.from('countries')
//     .select('country_code')
//     .ilike('country_name', '%' + country.toLowerCase() + '%');

//   if (error) {
//     console.error("Error fetching country code:", error);
//     return res.status(500).json({ error: "Error fetching country code" });
//   }

//   if (data && data.length > 0) {
//     const { country_code } = data[0];
//     try {
//       await supabase.from('visited_countries').insert([
//         { country_code: country_code, user_id: currentUserId }
//       ]);
//     } catch (insertError) {
//       console.error("Error inserting visited country:", insertError);
//       return res.status(500).json({ error: "Error inserting visited country" });
//     }
//   }

//   res.redirect("/")
