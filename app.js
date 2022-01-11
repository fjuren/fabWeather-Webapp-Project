require('dotenv').config();
const express = require('express');
const https = require('https');
const axios = require('axios')
const ejs = require("ejs");
const bodyParser = require('body-parser');
const app = express();


app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static(__dirname + '/public'));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');


app.get('/', function(req, res) {

  const options = {
    path: '/json/',
    host: 'ipapi.co',
    port: 443,
    headers: {
      'User-Agent': 'nodejs-ipapi-v1.02'
    }
  };

  https.get(options, function(resp) {
    var body = ''
    resp.on('data', function(data) {
      body += data;
    });

    resp.on('end', function() {
      var loc = JSON.parse(body);
      cityIP = loc.city

      var lat = null
      var lon = null
      const apiKey = process.env.OPEN_API_KEY;
      const units = 'metric'

      const urlToday = 'https://api.openweathermap.org/data/2.5/weather?q=' + cityIP + '&appid=' + apiKey + '&units=' + units

      // ------------------ URL TODAY --------------------
      https.get(urlToday, function(response) {
        // console.log(response.statusCode);

        response.on("data", function(data) {
          const weatherData = JSON.parse(data);
          const tempToday = weatherData.main.temp;

          const tempMinToday = weatherData.main.temp_min;
          const tempMaxToday = weatherData.main.temp_max;
          const feelsLikeToday = weatherData.main.feels_like;

          const weatherDescToday = weatherData.weather[0].description;
          const iconImgToday = weatherData.weather[0].icon;
          const iconToday = "http://openweathermap.org/img/wn/" + iconImgToday + "@2x.png"
          const lat = weatherData.coord.lat;
          const lon = weatherData.coord.lon;

          const city = cityIP
          const oneCallDaily = 'https://api.openweathermap.org/data/2.5/onecall?lat=' + lat + '&lon=' + lon + '&units=' + units + '&appid=' + apiKey


          // -------------------- OPENWEATHER ONE CALL --------------------------
          https.get(oneCallDaily, function(response) {
            console.log('statusCode: ' + response.statusCode);
            let chunks = "";
            response.on("data", function(chunk) {
              chunks += chunk
            });
            response.on("end", function() {

              // -------------------- DAILY ------------------------
              const oneCallDailyData = JSON.parse(chunks);
              const dayData = oneCallDailyData.daily;
              // console.log(dayData);

              const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const dailyDays = []
              const dailyDesc = []
              const dailyIcon = []
              const dailyTempMin = []
              const dailyTempMax = []
              // 5 day forecast data capture (excluding current day);
              for (let i = 1; i < 6; i++) {
                const d = new Date(oneCallDailyData.daily[i].dt * 1000);
                const wDesc = oneCallDailyData.daily[i].weather[0].description;
                const wIcon = oneCallDailyData.daily[i].weather[0].icon;
                const iconDaily = "http://openweathermap.org/img/wn/" + wIcon + "@2x.png"
                const tMin = oneCallDailyData.daily[i].temp.min;
                const tMax = oneCallDailyData.daily[i].temp.max;
                dailyDays.push(days[d.getDay()]);
                dailyDesc.push(wDesc)
                dailyIcon.push(iconDaily);
                dailyTempMin.push(tMin);
                dailyTempMax.push(tMax);
              }

              res.render('index.ejs', {
                // Current Day
                cityEJS: city,
                tempTodayEJS: tempToday,
                tempMinTodayEJS: tempMinToday,
                tempMaxTodayEJS: tempMaxToday,
                feelsLikeTodayEJS: feelsLikeToday,
                iconTodayEJS: iconToday,
                weatherDescTodayEJS: weatherDescToday,
                error: null,
                // daily forecast
                day1EJS: dailyDays[0],
                day2EJS: dailyDays[1],
                day3EJS: dailyDays[2],
                day4EJS: dailyDays[3],
                day5EJS: dailyDays[4],
                // daily weather description
                day1DescEJS: dailyDesc[0],
                day2DescEJS: dailyDesc[1],
                day3DescEJS: dailyDesc[2],
                day4DescEJS: dailyDesc[3],
                day5DescEJS: dailyDesc[4],
                // daily weather icon
                day1IconEJS: dailyIcon[0],
                day2IconEJS: dailyIcon[1],
                day3IconEJS: dailyIcon[2],
                day4IconEJS: dailyIcon[3],
                day5IconEJS: dailyIcon[4],
                // daily minimum temp
                day1TempMinEJS: dailyTempMin[0],
                day2TempMinEJS: dailyTempMin[1],
                day3TempMinEJS: dailyTempMin[2],
                day4TempMinEJS: dailyTempMin[3],
                day5TempMinEJS: dailyTempMin[4],
                // daily maximum temp
                day1TempMaxEJS: dailyTempMax[0],
                day2TempMaxEJS: dailyTempMax[1],
                day3TempMaxEJS: dailyTempMax[2],
                day4TempMaxEJS: dailyTempMax[3],
                day5TempMaxEJS: dailyTempMax[4]
              })
            });
          });
        });
      });
    });
  });
});

console.log('server is up');

app.post('/', function(req, res) {

  const cityQuery = req.body.cityName;
  var lat = null
  var lon = null
  const apiKey = process.env.OPEN_API_KEY;
  const units = 'metric'

  const urlToday = 'https://api.openweathermap.org/data/2.5/weather?q=' + cityQuery + '&appid=' + apiKey + '&units=' + units

  // ------------------ URL TODAY --------------------
  https.get(urlToday, function(response) {

    response.on("data", function(data) {
      const weatherData = JSON.parse(data);
      const tempToday = weatherData.main.temp;

      const tempMinToday = weatherData.main.temp_min;
      const tempMaxToday = weatherData.main.temp_max;
      const feelsLikeToday = weatherData.main.feels_like;

      const weatherDescToday = weatherData.weather[0].description;
      const iconImgToday = weatherData.weather[0].icon;
      const iconToday = "http://openweathermap.org/img/wn/" + iconImgToday + "@2x.png"
      const lat = weatherData.coord.lat;
      const lon = weatherData.coord.lon;

      const city = cityQuery
      const oneCallDaily = 'https://api.openweathermap.org/data/2.5/onecall?lat=' + lat + '&lon=' + lon + '&units=' + units + '&appid=' + apiKey



      // -------------------- OPENWEATHER ONE CALL --------------------------
      https.get(oneCallDaily, function(response) {
        console.log('statusCode: ' + response.statusCode);
        let chunks = "";
        response.on("data", function(chunk) {
          chunks += chunk
        });
        response.on("end", function() {

          // -------------------- DAILY ------------------------
          const oneCallDailyData = JSON.parse(chunks);
          const dayData = oneCallDailyData.daily;
          // console.log(dayData);

          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dailyDays = []
          const dailyDesc = []
          const dailyIcon = []
          const dailyTempMin = []
          const dailyTempMax = []
          // 5 day forecast data capture (excluding current day);
          for (let i = 1; i < 6; i++) {
            const d = new Date(oneCallDailyData.daily[i].dt * 1000);
            const wDesc = oneCallDailyData.daily[i].weather[0].description;
            const wIcon = oneCallDailyData.daily[i].weather[0].icon;
            const iconDaily = "http://openweathermap.org/img/wn/" + wIcon + "@2x.png"
            const tMin = oneCallDailyData.daily[i].temp.min;
            const tMax = oneCallDailyData.daily[i].temp.max;
            dailyDays.push(days[d.getDay()]);
            dailyDesc.push(wDesc)
            dailyIcon.push(iconDaily);
            dailyTempMin.push(tMin);
            dailyTempMax.push(tMax);
          }

          res.render('index.ejs', {
            // Current Day
            cityEJS: city,
            tempTodayEJS: tempToday,
            tempMinTodayEJS: tempMinToday,
            tempMaxTodayEJS: tempMaxToday,
            feelsLikeTodayEJS: feelsLikeToday,
            iconTodayEJS: iconToday,
            weatherDescTodayEJS: weatherDescToday,
            error: null,
            // daily forecast
            day1EJS: dailyDays[0],
            day2EJS: dailyDays[1],
            day3EJS: dailyDays[2],
            day4EJS: dailyDays[3],
            day5EJS: dailyDays[4],
            // hourly weather description

            // hourly weather icon

            // daily weather description
            day1DescEJS: dailyDesc[0],
            day2DescEJS: dailyDesc[1],
            day3DescEJS: dailyDesc[2],
            day4DescEJS: dailyDesc[3],
            day5DescEJS: dailyDesc[4],
            // daily weather icon
            day1IconEJS: dailyIcon[0],
            day2IconEJS: dailyIcon[1],
            day3IconEJS: dailyIcon[2],
            day4IconEJS: dailyIcon[3],
            day5IconEJS: dailyIcon[4],
            // daily minimum temp
            day1TempMinEJS: dailyTempMin[0],
            day2TempMinEJS: dailyTempMin[1],
            day3TempMinEJS: dailyTempMin[2],
            day4TempMinEJS: dailyTempMin[3],
            day5TempMinEJS: dailyTempMin[4],
            // daily maximum temp
            day1TempMaxEJS: dailyTempMax[0],
            day2TempMaxEJS: dailyTempMax[1],
            day3TempMaxEJS: dailyTempMax[2],
            day4TempMaxEJS: dailyTempMax[3],
            day5TempMaxEJS: dailyTempMax[4]
          })
        });
      });
    });
  });
});



app.listen(process.env.PORT || 3000, function() {
  console.log("Server is running on port 3000...");
})
