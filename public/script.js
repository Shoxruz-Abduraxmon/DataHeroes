async function fetchCharacters() {
  try {
    const response = await fetch("/api/characters");
    const characters = await response.json();
    const charactersDiv = document.getElementById("characters");
    characters.forEach((character) => {
      const characterCard = document.createElement("div");
      characterCard.className = "character-card";
      characterCard.innerHTML = `
        <img src="${character.image}" alt="${character.name}" width="100" height="100">
        <div>
          <h2>${character.name}</h2>
          <p>Status: ${character.status}</p>
          <p>Species: ${character.species}</p>
          <p>Gender: ${character.gender}</p>
          <p>Origin: ${character.origin}</p>
          <p>Location: ${character.location}</p>
          <p>Episode Count: ${character.episode_count}</p>
        </div>
      `;
      charactersDiv.appendChild(characterCard);
    });
  } catch (e) {
    console.error("Error fetching characters:", e);
  }
}

fetchCharacters();
