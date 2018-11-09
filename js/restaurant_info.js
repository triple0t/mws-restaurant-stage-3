let restaurant, form, toSend = false, offlineName = 'offline', offlineData;
// let newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoia21hc3RlciIsImEiOiJjamp2MnA1bTYwejZlM2tvNnBlZXZ3d3RtIn0.HRb1Ker_505j-qaDbVZZcw',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      self.form = document.getElementById('f-review-form');
      self.form.onsubmit = getFormData;
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);

      // register custom events
      window.addEventListener('offline', handleOffline);
      window.addEventListener('online', handleOnline);

      // create an empty array for the offline reviews if it does not exist
      DBHelper.getDataFromDB(self.offlineName, '', (err, suc) => {
        if(err && err == 'no-data') {
          // console.log('saving for the first time');
          self.offlineData = [];
          DBHelper.saveDataInDB(self.offlineName, self.offlineData);
        } else {
          self.offlineData = suc;
          handleOnline();
        }
      });
    }
  });
}  
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt = `Image For ${restaurant.name} Restaurant`;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  DBHelper.fetchReviewsByItsRestaurantId(restaurant.id, (err, suc) => {
    if (err) {
      console.error('err with fetching reviews', err);
    } else {
      // fill reviews
      fillReviewsHTML(suc);
    }
  });
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  // date.innerHTML = review.date;
  date.innerHTML = new Date(review.createdAt).toDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

getFormData = (event) => {
  event.preventDefault();
  // console.log(event);
  const restaurant_id = self.restaurant.id;
  const review_name = self.form.elements[0].value;
  const review_rating = self.form.elements[1].value;
  const review_comment = self.form.elements[2].value;

  // console.log('review details: ', review_name, review_rating, review_comment);

  if (navigator.onLine && self.toSend) {
    // create a new review when user is online

    DBHelper.createNewReview(restaurant_id, review_name, review_rating, review_comment, (err, suc) => {
      if (err) {
        console.error('err creating review', err);
      } else {
        const ul = document.getElementById('reviews-list');
        ul.appendChild(createReviewHTML(suc));
        ul.scrollIntoView(false);
        // console.log('res: ', suc);
      }
      // reset the form
      self.form.reset();
    });
  } else {
    // when the user is offine, save the review in the indexDB

    DBHelper.getDataFromDB(self.offlineName, '', (err, res) => {
      if (res) {
        res.push({
          restaurant_id,
          review_name, 
          review_rating, 
          review_comment
        });
        self.offlineData = res;
      }
      DBHelper.saveDataInDB(self.offlineName, self.offlineData);

      alert('Hello, you are currently offline, but your review has been saved and would be avaliable when you are back online');
      // reset the form
      self.form.reset();
    });
  }
}

handleOffline = (event) => {
  // when user is offine, diable sending to the server
  self.toSend = false;
  // console.log('you are offine')
}

handleOnline = (event) => {
  // when user is online, enable sending to the server
  self.toSend = true;
  // console.log('you are onine');
  DBHelper.getDataFromDB(self.offlineName, '', (err, suc) => {
    if (suc && suc.length > 0) {
      // console.log('good, now u can send to the server now', suc);
      const ul = document.getElementById('reviews-list');
      suc.forEach(e => {
        DBHelper.createNewReview(e.restaurant_id, e.review_name, e.review_rating, e.review_comment, (errc, succ) => {
          if (errc) {
            console.error('err creating review', errc);
          } else {
            ul.appendChild(createReviewHTML(succ));
          }
        });
      });

      // when done, update the db
      self.offlineData = [];
      DBHelper.saveDataInDB(self.offlineName, self.offlineData);
      ul.scrollIntoView(false);
    }
  });
}