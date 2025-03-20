import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ejs from 'ejs'
import bodyParser from 'body-parser';

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

const supabase = createClient(url, key)

const app  = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}))

let users = [
    {id: 1, name: "Tom Jones", color: "red" },
    {id: 2, name: "Henry Smith", color: "green"}
]

let currentUserId = 1;

async function getCurrentUser() {
    const {data, error} = await supabase.from('users').select('*').eq('id', currentUserId);
    if(error) {
        console.log("Error fetching user");
        return;
    }

    if(data.length === 0) {
        console.log("No user found");
        return;
    }

    return data[0];
}

async function checkedCountries() {
    const {data, error}  = await supabase.from('visited_countries').select('country_code').eq('user_id', currentUserId);
    data.forEach(d => {
        console.log(d.country_code)
    })
}

app.get("/", async (req, res) => {
    try {
        const currentUser = await getCurrentUser();
        checkedCountries();
        const {data, error} = await supabase.from('countries').select("*");
        if(error) {
            console.log('Error', error);
        }else{
           console.log(currentUser.name)
        }
    }catch(error) {
        console.error("Unexpected error", error )
    }
})

app.listen(3000, () => {
    console.log("Listening on port " + port)
})