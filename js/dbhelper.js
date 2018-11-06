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
    return 'restaurants-app-data-';
  }

  /**
   * Get Data from the IndexDB Using it's url as the unique identifier
   * 
   * @param {string} dataType the resource url | unique identifier
   * @param {any} err err message or object
   * @param {function} callback callback
   */
  static getDataFromDB(dataType, err, callback) {
    console.log('getting from db: ', err, dataType);

    idbKeyval.get(DBHelper.DB_APP_NAME + dataType)
      .then(dbRes => {
        if(dbRes) {
          callback(null, dbRes);
        } 
      })
      .catch(dbErr => {
        console.log('[dbhelper.js] err fetching from db', err, dbErr);
        callback(err, null);
      })
  }

  /**
   * Save Data to the IndexDB using it's url as the unique identifier
   * 
   * @param {string} dataType the resource url | unique identifier
   * @param {any} data The Data to save in the IndexDB
   * @param {function} callback callback
   */
  static saveDataInDB(dataType, data, callback = function(){}) {
    idbKeyval.set(DBHelper.DB_APP_NAME + dataType, data)
      .then(_ => callback())
      .catch(e => {
        console.log('[dbhelper.js] err saving data in db', e);
        callback();
      })
  }

  /**
   * Make API Request to the Server to Get Restaurants
   * 
   * @param {Function} callback 
   */
  static fetchDataFromServer(callback, dataType, method = 'GET', data = '') {
    if (method == 'GET' || method == 'DELETE') {
      fetch(DBHelper.DATABASE_URL + dataType, {method: method})
      .then(res => res.json())
      .then(data => callback(null, data))
      .catch(err => callback(err, null))
    } else {
      fetch(DBHelper.DATABASE_URL + dataType, {method: method, body: data})
      .then(res => res.json())
      .then(data => callback(null, data))
      .catch(err => callback(err, null))
    }
  }

  /**
   * Fetch all restaurants.
   * 
   * changing caching strategy from offline first to network first
   */
  static fetchRestaurants(callback) {
    const dataType = 'restaurants';

    // try to get data from network
    DBHelper.fetchDataFromServer((err, data) => {
      // on err, try to get the same data from indexDb
      if (err) {
        /* idbKeyval.get(DBHelper.DB_APP_NAME + dataType)
          .then(dbRes => {
            if(dbRes) {
              callback(null, dbRes);
            } 
          })
          .catch(dbErr => {
            console.log('[dbhelper.js] err fetching from db', dbErr, err);
            callback(err, null);
          }) */
          DBHelper.getDataFromDB(dataType, err, callback)
      } else {
        // save in index db
        DBHelper.saveDataInDB(dataType, data);
        callback(null, data);
      }
    }, dataType);
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
   * Fetch All The Users Faviourite Restaurants
   *  
   * @param {function} callback callback
   */
  static fetchAllFavRestaurants(callback) {
    const dataType = `restaurants?is_favorite=true`;

    DBHelper.fetchDataFromServer((err, data) => {
      // on err, try to get the same data from indexDb
      if (err) {
        DBHelper.getDataFromDB(dataType, err, callback);
      } else {
        // save in index db
        // idbKeyval.set(DBHelper.DB_APP_NAME + dataType, data);
        DBHelper.saveDataInDB(dataType, data);
        callback(null, data);
      }
    }, dataType);
  }

  /**
   * Set A Restaurant as a Favorite 
   * 
   * @param {number} id restaurant id
   * @param {function} callback callback
   */
  static setFavRestaurant(id, callback) {
    const dataType = `restaurants/${id}/?is_favorite=true`;

    DBHelper.fetchDataFromServer((err, data) => {
      if(err) {
        callback('Err Setting this restaurant as fav', null);
      } else {
        callback(null, data);
      }
    }, dataType, 'PUT');
  }

  /**
   * Unset A Restaurant as a Favorite 
   * 
   * @param {number} id restaurant id
   * @param {*} callback callback
   */
  static unSetFavRestaurant(id, callback) {
    const dataType = `restaurants/${id}/?is_favorite=false`;

    DBHelper.fetchDataFromServer((err, data) => {
      if(err) {
        callback('Err UnSetting this restaurant as fav', null);
      } else {
        callback(null, data);
      }
    }, dataType, 'PUT');
  }

  /**
   * Send A Post Request to Create A New Review
   * 
   * @param {number} id restaurant id
   * @param {string} name the reviewer name
   * @param {number} rating rating
   * @param {string} comments reviewer comment text
   * @param {function} callback callback
   */
  static createNewReview(id, name, rating, comments, callback) {
    const dataType = `reviews`;

    const data = JSON.stringify({
      restaurant_id: id,
      name: name,
      rating: rating,
      comments: comments
    });

    DBHelper.fetchDataFromServer((err, data) => {
      if(err) {
        callback('Err Creating New Review', null);
      } else {
        callback(null, data);
      }
    }, dataType, 'POST', data);
  }

  /**
   * Send A Put Request to Update A Review
   * 
   * @param {number} id review id
   * @param {string} name the reviewer name
   * @param {number} rating rating
   * @param {string} comments reviewer comment text
   * @param {function} callback callback
   */
  static updateReview(id, name, rating, comments, callback) {
    const dataType = `reviews/${id}`;

    const data = JSON.stringify({
      name: name,
      rating: rating,
      comments: comments
    });

    DBHelper.fetchDataFromServer((err, data) => {
      if(err) {
        callback('Err Updating Review', null);
      } else {
        callback(null, data);
      }
    }, dataType, 'PUT', data);
  }

  /**
   * Send a Delete Request to Delete a Review
   * 
   * WARNING: This Will Totally Delete the Review
   * 
   * @param {number} id review id
   * @param {function} callback callback
   */
  static deleteReview(id, callback) {
    const dataType = `reviews/${id}`;

    DBHelper.fetchDataFromServer((err, data) => {
      if(err) {
        callback('Err Deleting Review', null);
      } else {
        callback(null, data);
      }
    }, dataType, 'DELETE');
  }

  /**
   * Fetch All The Restaurants Reviews
   */
  static fetchReviews(callback) {
    const dataType = 'reviews';

    DBHelper.fetchDataFromServer((err, data) => {
      // on err, try to get the same data from indexDb
      if (err) {
        DBHelper.getDataFromDB(dataType, err, callback);
      } else {
        // save in index db
        // idbKeyval.set(DBHelper.DB_APP_NAME + dataType, data);
        DBHelper.saveDataInDB(dataType, data);
        callback(null, data);
      }
    }, dataType);
  }

  /**
   * Fetch Reviews By Its Id
   * 
   * @param {number} id Review Id
   * @param {Function} callback The Callback
   */
  static fetchReviewsById(id, callback) {
    const dataType = `reviews/${id}`;

    DBHelper.fetchReviews((err, reviews) => {
      const review = reviews.find(e => e.id == id);
      if (review) {
        callback(null, review);
      } else {
        // before throwing an error. check with the server if the review exist
        DBHelper.fetchDataFromServer((err, data) => {
          if (err) {
            callback('Review with this id does not exist', null);
          } else {
            callback(null, data);
          }
        }, dataType)
      }
    })
  }

  /**
   * Fetch Reviews By Its Restaurant Id
   * 
   * @param {number} id Restaurant id
   * @param {function} callback callback
   */
  static fetchReviewsByItsRestaurantId(id, callback) {
    const dataType = `reviews?restaurant_id=${id}`;
    DBHelper.fetchDataFromServer((err, data) => {
      if (err) {
        DBHelper.getDataFromDB(dataType, err, callback);
        callback(err, null);
      } else {
        DBHelper.saveDataInDB(dataType, data);
        callback(null, data);
      }
    }, dataType);
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

