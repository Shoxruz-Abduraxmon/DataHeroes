const fs = require("fs");
const pg = require("pg");
const axios = require("axios");
const express = require("express");
const dotenv = require("dotenv").config();
const { execSync } = require("child_process");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

try {
  execSync("mkdir -p ~/.postgresql");
  execSync(
    'wget "https://storage.yandexcloud.net/cloud-certs/CA.pem" --output-document ~/.postgresql/root.crt',
  );
  execSync("chmod 0600 ~/.postgresql/root.crt");
} catch (error) {
  console.error("Error downloading certificate:", error);
}

const config = {
  connectionString:
    "postgres://candidate:62I8anq3cFq5GYh2u4Lh@rc1b-r21uoagjy1t7k77h.mdb.yandexcloud.net:6432/db1",
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("/home/runner/.postgresql/root.crt").toString(),
  },
};
const conn = new pg.Client(config);

const createTab = `
  CREATE TABLE IF NOT EXISTS shoxruzabduraxmon (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      status VARCHAR(50),
      species VARCHAR(50),
      gender VARCHAR(50),
      origin VARCHAR(255),
      location VARCHAR(255),
      image VARCHAR(255),
      episode_count INTEGER
  );
`;

const insert = `
INSERT INTO shoxruzabduraxmon (name, status, species, gender, origin, location, image, episode_count)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
`;

async function fetch() {
  try {
    await conn.connect();
    await conn.query(createTab);
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const response = await axios.get(
        `https://rickandmortyapi.com/api/character/?page=${page}`,
      );
      const characters = response.data.results;
      totalPages = response.data.info.pages;

      for (const character of characters) {
        const values = [
          character.name,
          character.status,
          character.species,
          character.gender,
          character.origin.name,
          character.location.name,
          character.image,
          character.episode.length,
        ];
        await conn.query(insert, values);
      }
      page++;
    }
    console.log("Data inserted");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await conn.end();
  }
}

fetch();

app.use(express.static("public"));

app.get("/api/characters", async (req, res) => {
  try {
    const conn = new pg.Client(config);
    await conn.connect();
    const result = await conn.query("SELECT * FROM shoxruzabduraxmon");
    res.json(result.rows);
    await conn.end();
  } catch (e) {
    console.error("Error fetching data:", e);
  }
});
app.listen(PORT, () => {
  console.log(`localhost: ` +PORT);
});
