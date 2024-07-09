const fs = require("fs");
const pg = require("pg");
const axios = require("axios");
const express = require("express");
const dotenv = require("dotenv").config();
const { execSync } = require("child_process");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// Path to save the certificate
const certPath = path.join(__dirname, 'root.crt');

try {
  execSync(`wget "https://storage.yandexcloud.net/cloud-certs/CA.pem" --output-document ${certPath}`);
  execSync(`chmod 0600 ${certPath}`);
} catch (error) {
  console.error("Error executing shell commands: ", error);
}

const config = {
  connectionString: "postgres://candidate:62I8anq3cFq5GYh2u4Lh@rc1b-r21uoagjy1t7k77h.mdb.yandexcloud.net:6432/db1",
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(certPath).toString(),
  },
};

const conn = new pg.Client(config);

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS my_github_username (
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

const insertCharacterQuery = `
INSERT INTO my_github_username (name, status, species, gender, origin, location, image, episode_count)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
`;

async function fetchAndStoreCharacters() {
  try {
    await conn.query(createTableQuery);
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const response = await axios.get(`https://rickandmortyapi.com/api/character/?page=${page}`);
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
        await conn.query(insertCharacterQuery, values);
      }
      page++;
    }
    console.log("Inserted");
  } catch (e) {
    console.error(e);
  }
}

async function startServer() {
  try {
    await conn.connect();
    await fetchAndStoreCharacters();

    app.use(express.static("public"));

    app.get("/api", async (req, res) => {
      try {
        const result = await conn.query("SELECT * FROM my_github_username");
        res.json(result.rows);
      } catch (e) {
        console.error(e);
        res.status(500).send("Error");
      }
    });

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error("Database connection error:", e);
  }
}

startServer();
