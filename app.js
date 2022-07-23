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


app.get('/', function (req, res) {

  const options = {
    path: '/json/',
    host: 'ipapi.co',
    port: 443,
    headers: {
      'User-Agent': 'nodejs-ipapi-v1.02'
    }
  };

  https.get(options, function (resp) {
    var body = ''
    resp.on('data', function (data) {
      body += data;
    });

    resp.on('end', function () {
      var loc = JSON.parse(body);
      cityIP = loc.city

      var lat = null
      var lon = null
      const apiKey = process.env.OPEN_API_KEY;
      const units = 'metric'

      const urlToday = 'https://api.openweathermap.org/data/2.5/weather?q=' + cityIP + '&appid=' + apiKey + '&units=' + units

      // ------------------ URL TODAY --------------------
      https.get(urlToday, function (response) {
        // console.log(response);

        response.on("data", function (data) {
          const weatherData = JSON.parse(data);
          const tempToday = parseFloat(weatherData.main.temp).toFixed(1); // rounding text value to tenths
          const tempMinToday = parseFloat(weatherData.main.temp_min).toFixed(1);
          const tempMaxToday = parseFloat(weatherData.main.temp_max).toFixed(1);
          const feelsLikeToday = parseFloat(weatherData.main.feels_like).toFixed(1);

          const weatherDescToday = weatherData.weather[0].description;
          const iconImgToday = weatherData.weather[0].icon;
          const iconToday = "http://openweathermap.org/img/wn/" + iconImgToday + "@2x.png"
          const lat = weatherData.coord.lat;
          const lon = weatherData.coord.lon;

          const city = cityIP
          const oneCallDaily = 'https://api.openweathermap.org/data/2.5/onecall?lat=' + lat + '&lon=' + lon + '&exclude=minutely' + '&units=' + units + '&appid=' + apiKey


          // -------------------- OPENWEATHER ONE CALL --------------------------
          https.get(oneCallDaily, function (response) {
            console.log('statusCode: ' + response.statusCode);
            let chunks = "";
            response.on("data", function (chunk) {
              chunks += chunk
            });
            response.on("end", function () {

              // -------------------- DAILY ------------------------
              const oneCallDailyData = JSON.parse(chunks);
              const timezoneOffset = oneCallDailyData.timezone_offset
              const hourly = oneCallDailyData.hourly;
              // console.log(hourly)
              const dailyHours_timezone = []
              const dailyHours_desc = []
              const dailyHours_temp = []
              const dailyHours_icon = []


              // timezone conversion
              for (let h = 1; h < 9; h++) {
                const hourlyConvert_timezone = new Date((hourly[h].dt + timezoneOffset) * 1000);
                const hours_timezone = hourlyConvert_timezone.getUTCHours();

                if (hours_timezone == 0) {
                  dailyHours_timezone.push(12 + "am")
                } else if (hours_timezone > 12) {
                  let hours_timezoneShift = hours_timezone - 12;
                  dailyHours_timezone.push(hours_timezoneShift + "pm")
                } else if (hours_timezone == 12) {
                  dailyHours_timezone.push(12 + "pm");
                } else {
                  dailyHours_timezone.push(hours_timezone + "am")
                }
                dailyHours_desc.push(hourly[h].weather[0].description);
                const roundTemp = parseFloat(hourly[h].temp).toFixed(0);
                dailyHours_temp.push(roundTemp);
                const hourly_icon = hourly[h].weather[0].icon;
                const hourly_iconImg = "http://openweathermap.org/img/wn/" + hourly_icon + "@2x.png";
                dailyHours_icon.push(hourly_iconImg);
              };
              // console.log(dailyHours_timezone);
              const dayData = oneCallDailyData.daily;
              // console.log(dayData);

              // Parse hourly weather data
              // const hours =


              // Parse daily weather data
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
                const tMin = parseFloat(oneCallDailyData.daily[i].temp.min).toFixed(1);
                const tMax = parseFloat(oneCallDailyData.daily[i].temp.max).toFixed(1);
                dailyDays.push(days[d.getDay()]);
                dailyDesc.push(wDesc)
                dailyIcon.push(iconDaily);
                dailyTempMin.push(tMin);
                dailyTempMax.push(tMax);
              }

              res.render("index.ejs", {
                // Current Day
                cityEJS: city,
                tempTodayEJS: tempToday,
                tempMinTodayEJS: tempMinToday,
                tempMaxTodayEJS: tempMaxToday,
                feelsLikeTodayEJS: feelsLikeToday,
                iconTodayEJS: iconToday,
                weatherDescTodayEJS: weatherDescToday,
                error: null,
                // hourly forecast (8hrs)
                hour1EJS: dailyHours_timezone[0],
                hour2EJS: dailyHours_timezone[1],
                hour3EJS: dailyHours_timezone[2],
                hour4EJS: dailyHours_timezone[3],
                hour5EJS: dailyHours_timezone[4],
                hour6EJS: dailyHours_timezone[5],
                hour7EJS: dailyHours_timezone[6],
                hour8EJS: dailyHours_timezone[7],
                // hourly weather description
                hour1DescEJS: dailyHours_desc[0],
                hour2DescEJS: dailyHours_desc[1],
                hour3DescEJS: dailyHours_desc[2],
                hour4DescEJS: dailyHours_desc[3],
                hour5DescEJS: dailyHours_desc[4],
                hour6DescEJS: dailyHours_desc[5],
                hour7DescEJS: dailyHours_desc[6],
                hour8DescEJS: dailyHours_desc[7],
                // hourly temp 
                hour1TempEJS: dailyHours_temp[0],
                hour2TempEJS: dailyHours_temp[1],
                hour3TempEJS: dailyHours_temp[2],
                hour4TempEJS: dailyHours_temp[3],
                hour5TempEJS: dailyHours_temp[4],
                hour6TempEJS: dailyHours_temp[5],
                hour7TempEJS: dailyHours_temp[6],
                hour8TempEJS: dailyHours_temp[7],
                // hourly weather icon
                iconHour1EJS: dailyHours_icon[0],
                iconHour2EJS: dailyHours_icon[1],
                iconHour3EJS: dailyHours_icon[2],
                iconHour4EJS: dailyHours_icon[3],
                iconHour5EJS: dailyHours_icon[4],
                iconHour6EJS: dailyHours_icon[5],
                iconHour7EJS: dailyHours_icon[6],
                iconHour8EJS: dailyHours_icon[7],
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

function serverDelay(x) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(x);
    }, 1700);
  });
}

app.post('/', function (req, res) {

  const cityQuery = req.body.cityName;
  var lat = null
  var lon = null
  const apiKey = process.env.OPEN_API_KEY;
  const units = 'metric'

  const urlToday = 'https://api.openweathermap.org/data/2.5/weather?q=' + cityQuery + '&appid=' + apiKey + '&units=' + units

  // ------------------ URL TODAY --------------------
  https.get(urlToday, function (response) {
    // console.log(response);
    response.on("data", async function (data) {
      try {
        const weatherData = await serverDelay(JSON.parse(data));
        const tempToday = parseFloat(weatherData.main.temp).toFixed(1); // rounding text value to tenths
        const tempMinToday = parseFloat(weatherData.main.temp_min).toFixed(1);
        const tempMaxToday = parseFloat(weatherData.main.temp_max).toFixed(1);
        const feelsLikeToday = parseFloat(weatherData.main.feels_like).toFixed(1);

        const weatherDescToday = weatherData.weather[0].description;
        const iconImgToday = weatherData.weather[0].icon;
        const iconToday = "http://openweathermap.org/img/wn/" + iconImgToday + "@2x.png"
        const lat = weatherData.coord.lat;
        const lon = weatherData.coord.lon;

        const city = cityQuery
        const oneCallDaily = 'https://api.openweathermap.org/data/2.5/onecall?lat=' + lat + '&lon=' + lon + '&units=' + units + '&appid=' + apiKey


        // -------------------- OPENWEATHER ONE CALL --------------------------
        https.get(oneCallDaily, function (response) {
          console.log('statusCode: ' + response.statusCode);
          let chunks = "";
          response.on("data", function (chunk) {
            chunks += chunk
          });
          response.on("end", async function () {

            // -------------------- DAILY ------------------------
            const oneCallDailyData = await serverDelay(JSON.parse(chunks));
            const timezoneOffset = oneCallDailyData.timezone_offset
            const hourly = oneCallDailyData.hourly;
            // console.log(hourly[0])
            const dailyHours_timezone = []
            const dailyHours_temp = []
            const dailyHours_desc = []
            const dailyHours_icon = []

            for (let h = 1; h < 9; h++) {
              const hourlyConvert_timezone = new Date((hourly[h].dt + timezoneOffset) * 1000);

              const hours_timezone = hourlyConvert_timezone.getUTCHours();

              if (hours_timezone == 0) {
                dailyHours_timezone.push(12 + "am")
              } else if (hours_timezone > 12) {
                let hours_timezoneShift = hours_timezone - 12;
                dailyHours_timezone.push(hours_timezoneShift + "pm")
              } else if (hours_timezone == 12) {
                dailyHours_timezone.push(12 + "pm");
              } else {
                dailyHours_timezone.push(hours_timezone + "am")
              }
              dailyHours_desc.push(hourly[h].weather[0].description);
              const roundTemp = parseFloat(hourly[h].temp).toFixed(0);
              dailyHours_temp.push(roundTemp);
              const hourly_icon = hourly[h].weather[0].icon;
              const hourly_iconImg = "http://openweathermap.org/img/wn/" + hourly_icon + "@2x.png";
              dailyHours_icon.push(hourly_iconImg);
            };

            // console.log(dailyHours_timezone);


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
              const tMin = parseFloat(oneCallDailyData.daily[i].temp.min).toFixed(1);
              const tMax = parseFloat(oneCallDailyData.daily[i].temp.max).toFixed(1);
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
              // hourly timezone (8hrs)
              hour1EJS: dailyHours_timezone[0],
              hour2EJS: dailyHours_timezone[1],
              hour3EJS: dailyHours_timezone[2],
              hour4EJS: dailyHours_timezone[3],
              hour5EJS: dailyHours_timezone[4],
              hour6EJS: dailyHours_timezone[5],
              hour7EJS: dailyHours_timezone[6],
              hour8EJS: dailyHours_timezone[7],
              // hourly weather description
              hour1DescEJS: dailyHours_desc[0],
              hour2DescEJS: dailyHours_desc[1],
              hour3DescEJS: dailyHours_desc[2],
              hour4DescEJS: dailyHours_desc[3],
              hour5DescEJS: dailyHours_desc[4],
              hour6DescEJS: dailyHours_desc[5],
              hour7DescEJS: dailyHours_desc[6],
              hour8DescEJS: dailyHours_desc[7],
              // hourly temp 
              hour1TempEJS: dailyHours_temp[0],
              hour2TempEJS: dailyHours_temp[1],
              hour3TempEJS: dailyHours_temp[2],
              hour4TempEJS: dailyHours_temp[3],
              hour5TempEJS: dailyHours_temp[4],
              hour6TempEJS: dailyHours_temp[5],
              hour7TempEJS: dailyHours_temp[6],
              hour8TempEJS: dailyHours_temp[7],
              // hourly weather icon
              iconHour1EJS: dailyHours_icon[0],
              iconHour2EJS: dailyHours_icon[1],
              iconHour3EJS: dailyHours_icon[2],
              iconHour4EJS: dailyHours_icon[3],
              iconHour5EJS: dailyHours_icon[4],
              iconHour6EJS: dailyHours_icon[5],
              iconHour7EJS: dailyHours_icon[6],
              iconHour8EJS: dailyHours_icon[7],
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
      } catch (err) {
        res.render('error.ejs')
      }
    });
  });
});



app.listen(process.env.PORT || 3000, function () {
  console.log("Server is running on port 3000...");
})