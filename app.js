"use strict";

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $searchForm = $("#searchForm");

/** Given a search term, search for TV shows that match that query.
 *
 *  Returns a promise with an array of show objects: [{ id, name, summary, image, actors }, { id, name, summary, image, actors }, ...].
 *  If no image URL is given by the API, a default image URL is used.
 */

async function getShowsByTerm(term) {
    try {
      const response = await fetch(`http://api.tvmaze.com/search/shows?q=${term}`);
  
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
  
      const data = await response.json();
  
      // Map the API response to the required format, including the image and actors
      return data.map(result => ({
        id: result.show.id,
        name: result.show.name,
        summary: result.show.summary,
        image: result.show.image ? result.show.image.medium : "https://tinyurl.com/tv-missing",
        actors: result.show._embedded?.cast?.map(actor => actor.person.name) || []  // Use optional chaining
      }));
  
    } catch (error) {
      console.error(error);
      // Handle errors appropriately
      return [];
    }
  }
  

/** Handle search form submission: get shows from API and display.
 *  Hide episodes area (that only gets shown if they ask for episodes)
 */

async function searchForShowAndDisplay() {
  const term = $("#searchForm-term").val();
  const shows = await getShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}

$searchForm.on("submit", async function (evt) {
    console.log("Form submitted");  // Add this line
    evt.preventDefault();
    await searchForShowAndDisplay();
  });
  

/** Given list of shows, create markup for each and append to DOM */

function populateShows(shows) {
    $showsList.empty();
  
    for (let show of shows) {
      const $show = $(
        `<div data-show-id="${show.id}" class="Show col-md-6 col-lg-4 mb-4">
           <div class="card">
             <img class="card-img-top" src="${show.image}" alt="${show.name}">
             <div class="card-body">
               <h5 class="card-title text-primary">${show.name}</h5>
               <p class="card-text">${show.summary}</p>
               <p class="card-text"><b>Actors:</b> ${show.actors.join(", ")}</p>
               <button class="btn btn-outline-light btn-sm Show-getEpisodes">
                 Episodes
               </button>
             </div>
           </div>
         </div>`
      );
  
      $showsList.append($show);
  
      // Add event listener for the "Episodes" button
      $show.find(".Show-getEpisodes").on("click", async function () {
        const showId = $(this).closest(".Show").data("show-id");
        const episodes = await getEpisodesOfShow(showId);
        populateEpisodesModal(episodes);
      });
    }
  }
  

/** Given a show ID, get from API and return a promise with an array of episodes:
 *  [{ id, name, season, number }, { id, name, season, number }, ...]
 */

async function getEpisodesOfShow(id) {
  try {
    const response = await fetch(`http://api.tvmaze.com/shows/${id}/episodes`);

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();

    // Map the API response to the required format
    return data.map(episode => ({
      id: episode.id,
      name: episode.name,
      season: episode.season,
      number: episode.number
    }));

  } catch (error) {
    console.error(error);
    // Handle errors appropriately
    return [];
  }
}

/** Populate the episodes area with a list of episodes in a Bootstrap modal */

async function populateEpisodesModal(episodes) {
  const $modalBody = $(".modal-body");
  $modalBody.empty();

  for (let episode of episodes) {
    const $episode = $(`<p>${episode.name} (Season ${episode.season}, Episode ${episode.number})</p>`);
    $modalBody.append($episode);
  }

  $("#episodesModal").modal("show");
}
