/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    // const port = 8000 // Change this to your server port
    const port = 1337 // Change this to your server port
    const path = `http://localhost:${port}/`;
  
    // return `${path}data/restaurants.json`;
    return `${path}`;
  }

  /**
   * Database Name.
   * 
   * This is the name (id/ key) been used to save item in the indexDb
   */
  static get DB_APP_NAME() {
    return 'restaurants-app-data';
  }

  /**
   * Make API Request to the Server to Get Restaurants
   * 
   * @param {Function} callback 
   */
  static fetchDataFromServer(callback, dataType = 'restaurants') {
    fetch(DBHelper.DATABASE_URL + dataType)
      .then(res => res.json())
      /* .then(data => {
        // save in index db
        idbKeyval.set(DBHelper.DB_APP_NAME + dataType, data);
        // return the data
        callback(null, data)
      }) */
      .then(data => callback(null, data))
      .catch(err => callback(err, null))
  }

  /**
   * Fetch all restaurants.
   * 
   * changing caching strategy from offline first to network first
   */
  static fetchRestaurants(callback) {
    const dataType = 'restaurants';
    // try and get prevous data from the indexDb
    idbKeyval.get(DBHelper.DB_APP_NAME + dataType)
    .then(dbRes => {
      if(dbRes) {
        callback(null, dbRes);
      } else {
        // if data does not exist, get from server and save to indexDb
        DBHelper.fetchDataFromServer(callback, dataType)
      }
    })
    .catch(dbErr => {
      DBHelper.fetchDataFromServer(callback, dataType);
    })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /** 
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Fetch All The Restaurants Reviews
   */
  static fetchReviews(callback) {
    const dataType = 'reviews';
    DBHelper.fetchDataFromServer(callback, dataType)
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    const port = 8000;
    const path = `http://localhost:${port}/`;

    // check for the photograph
    restaurant.photograph = (restaurant.photograph) ? restaurant.photograph : String(restaurant.id);

    // for a werid reason, localDiskDb.db file photograph column does not have .jpg at the end of the image name.
    // check if the photograph name ends with .jpg else append it.
    const restaurantImage = (restaurant.photograph && restaurant.photograph.endsWith('.jpg')) ? `${path}img/${restaurant.photograph}` : `${path}img/${restaurant.photograph}.jpg`;
    return restaurantImage;
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
      // marker.addTo(map);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

