# Lab 7: SQL for back end mobile data collection

## TGIS 504, Winter 2023, Dr. Emma Slager

### Introduction

In Lab 6, you set up a data collection tool that allowed users to draw shapes on a map using Leaflet.draw and entered attribute data for those shapes using an HTML form. However, the drawn layers were not stored anywhere, just printed to the console. In addition to an input interface, to have a functional data collection tool, we also need a permanent storage location and a mechanism for writing user input to that location. In this lab, therefore, you will set up and configure a database table to store user-submitted information so that it can be retrieved, displayed, and analyzed at a later time. 

This lab is based on the exercises in [Chapter 13 of Michael Dormer's _Introduction to Web Mapping_](http://132.72.155.230:3838/js/collaborative-mapping.html), with modifications and additions by myself. 

*Lab 7 starter files*

* Lab 7 testing files, including an index.html file, scripts.js file, and styles.css file. We'll use these for testing out the initial SQL table you set up. Download from Github.
* Your Lab 6 files, from which you will copy your HTML form in Step 7.1 below. 

*Technology stack for Lab 7*

* VS Code or another text editor for editing files
* Leaflet & Leaflet.draw libraries
* Chrome or another web browser with developer tools (JS console)
* PostgreSQL and PostGIS, which you'll access with a CLI (command line interface)
* A custom SQL API I've set up on a cloud server

### 1. Working with PostgreSQL and PostGIS

The first step in achieving the goals of this lab is to set up the permanent storage location for the data. We will build tables in a PostGIS database, which means that what we need is an (empty) table in our database that contains columns and data types according to the data we intend to collect. 

In this week's reading, you learned a bit about SQL queries for spatial databases. Here in step 1, we'll set up a new table in a PostGIS database and practice running some SQL queries. 

#### 1.1. Connect to the database

Enter the command prompt interface on your computer. First, you will connect to the cloud server where I've installed our PostGIS database. Enter the following in your command prompt window: 

```bash
ssh genuser@178.128.228.240
```

SSH stands for Secure Shell, the protocol we're using to make the connection. genuser is a 'generic user' set up on the server, and the numbers are the server's IP address. 

Press enter and you will be prompted to enter a password. The password for genuser is 504MSGT. Type this (remember that the characters will not appear on the screen) and press enter. 

Next, you will log in to the database. I've set up an account for each of you and will give you your credentials separately. Use your credentials to log in. The general command for logging in is as follows: 

```bash
psql -h localhost -U yourusername gisdb
```
Hit enter and you will be prompted to enter a password. Enter the password that I shared with you when I assigned you your username. 

`psql` is how we access postgreSQL commands, `-h localhost` specifies that we want to log in with the localhost port, `-U yourusername` is how you specify which user to log in as, and `gisdb` is the name of the database. 

Let's explore the database. Enter the following command to show all of the tables in the current schema: 

```sql
\dt
```

You should see a list of tables. At a minimum, the list will include 2 tables set up by a superuser and 2 set up by the user emma. (Depending on where your classmates are in this lab, you may also see their tables.)

Enter the following SQL command to view entries in the plants table:

```SQL
SELECT * FROM plants LIMIT 5;
```

This should return the first 5 entries from the table plants and display them in the CLI. This table is likely familiar from the reading you did this week. Feel free to use what you learned in that reading to experiment with other SELECT queries before moving on. 

#### 1.2 Create a new table

Each of your users has permissions to create tables, select data from tables, and insert into tables (you do not have permissions to drop or delete tables or achieve admin level tasks). Type (don't copy and paste!) the following SQL query into your CLI to create a new table, but note that *you should name your table with your own username, not yourusername_table!* This is why I'm asking you to type this rather than copying and pasting. 

```sql
CREATE TABLE yourusername_table(
    geom geometry,
    name text
);
```

Press enter and if all goes well, you should see `CREATE TABLE` returned, indicating that the table was created. If you get an error, try again, correcting any mistakes. Test to see if your table was created by again listing the tables in the database with the `\dt;` command. 

#### 1.3. Modify the table

First, let's add an additional columns, called 'description'. This will hold an attributes that a user can set with the Leaflet.draw interface in the Lab 7 testing files. The testing files replicate a simple version of what you built in Lab 6, and produce an interface that looks like the screenshot below:

![testing interface screenshot](images/Lab7-1.png) 

We'll use a SQL statement to add a column. The general SQL syntax to add a column to a table is:

ALTER TABLE *table_name*
ADD *column_name datatype*;

To add a column to hold the description attribute, we will use that code, substituting in the name of our table and the name we want to give the new column, and specifying the correct data type. Copy or type the following command into the text box and click 'Apply':

```SQL
ALTER TABLE yourusername_table
ADD description text;
```

You should see the confirmation  `ALTER TABLE` and if you wish, you can confirm the change by running the following SELECT query to display the table: 

```SQL
SELECT * FROM yourusername_table
```

For the curious, you can also use the following SQL command to change a table's name. This is optional, but if your table name contains a typo or if you just want to rename it to something else, you can do so now using the following:  

```SQL
ALTER TABLE table_name
RENAME TO new_table_name;
```
Again, this is optional, but you can similarly rename a column using the following: 

```SQl
ALTER TABLE table_name
RENAME COLUMN old_column_name TO new_column_name;
```

#### 1.4. Add data to the table

Before we add data to the table using the Leaflet.draw interface, let's first add some sample data using an SQL command. Let's add a point at the location of the UWT campus, giving it the name 'UW Tacoma' and the description 'A beautiful, urban campus in Tacoma, WA'. We can use the SQL ```INSERT INTO``` and ```VALUES``` keywords for inserting new data, as shown in the query below (note that you will have to change the name of the table in the first line so that it matches the name of *your* table):

```SQL
INSERT INTO lab_7_name (geom, name, description) VALUES (
  ST_SetSRID(
    ST_GeomFromGeoJSON(
      '{"type":"Point","coordinates":[-122.4383461, 47.2449897]}'
    ), 
  4326
  ),
  'UW Tacoma', 
  'A beautiful, urban campus in Tacoma, WA'
);
```

After changing the name of the table in the first line of the query to match your table's name, hit Enter. Next, run the `SELECT *` query on your table to confirm that the data was added. 

The SQL command we used to add this data looks quite long and complex, so let's walk through it. Note first that the high-level structure used to specify the column names and values to insert looks like this: 

```SQL
INSERT INTO table_name (..., ..., ...) VALUES (..., ..., ...);
```

The first three ```...``` symbols are replaced with the column names where the values go into. The second set of `...` symbols are replaced with the values themselves. Note that the order of the column names needs to match the order of the values, so that the correct value will be inserted into the correct column. In the present example, the ordering of the first triplet (the column names `geom`, `name`, and `description`) matches the order of the second triplet after the `VALUES` keyword (the geometry, `'UW Tacoma'`, and `'A beautiful, urban campus in Tacoma, WA'`). 

To create the geometry value that goes into the `the_geom` column, the query makes use a function, `ST_GeomFromGeoJSON`. This function converts GeoJSON syntax (`{"type":"Point","coordinates":[-122.4383461, 47.2449897]}` in our example) into what is called Well-Known Binary, or WKB. This is a form of compression that reduces the required storage space for the database. If we were to look at the raw data that is stored for this value, instead of the long string of GeoJSON, we would see instead `010100000011f5ccdc0d9c5ec0adad8ed25b9f4740`. Sometimes when reading about or using WKB, you may also see references to  WKT, or Well-Known Text, which would display this point as: `POINT(-122.4383461 47.2449897)` for example, which is conveniently human-readable. To explore these three formats further and convert between them, see [this online tool](https://rodic.fr/blog/online-conversion-between-geometric-formats/). 

In addition to converting GeoJSON to WKB, the query uses the `ST_SetSRID` function to specify that the GeoJSON coordinates are in lng/lat, and that they use WGS 84 coordinate reference system. The SRID in `ST_SetSRID` stands for 'spatial reference ID', and it uses the EPSG code `4326` to specify that the SRID is WGS 84. As you learned last quarter and again in Lab 3, [the EPSG system](https://en.wikipedia.org/wiki/EPSG_Geodetic_Parameter_Dataset) is a public registry of geodetic datums and spatial reference systems, which can all be referred to with a numeric code. 

### 2. Using the SQL API

To utilize this database with the data collection tool you built with Leaflet in Lab 6, we will use a custom SQL API that I set up for you. This API allows for communication between a web browser and the PostGIS database hosted on the cloud server. The API allows us to send SQL queries to the database via HTTP using a URL that includes the server's IP address and the SQL query. The server processes the request and returns the data that is requested by the query in a format of choice, such as CSV, JSON, or GeoJSON. Because the API uses HTTP to send and receive data, we can send requests to the database--and get responses--using client-side JavaScript code. 

The basic URL structure for sending a request to the SQL API looks like this: 

```
https:178.128.228.240:4000/sql?q=SQL_STATEMENT
```

where:

- `178.128.228.240` is the server's IP address;
- `:4000` is the port we are connecting on, and 
- `SQL_STATEMENT` should be replaced with the SQL **query**

For example, here is a specific query:

```
https:178.128.228.240:4000/sql?q=
SELECT * FROM emma_table
```

where:

Based on the data that is currently in the table, the data that would be returned from this call would be the following GeoJSON content: 

```JSON
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-122.4383461, 47.244989]
      },
      "properties": {
        "name": "UW Tacoma",
        "description": "A beautiful, urban campus in Tacoma, WA"
      }
    }
  ]
}
```

<!-- It's important to note that whenever we export the result of the query in a spatial format (such as `format=GeoJSON`), the geometry column (`the_geom` in this case) must appear in the query. Otherwise, the server cannot generate the geometric part of the layer, and we get an error. For instance, if instead of selecting `*` from the table, we selected only the columns `name` and `description` using the following API call--

```
https://ejeans.carto.com/api/v2/sql?format=GeoJSON&q=
SELECT name, description FROM lab_7_emma
```

the result would be the following error message, instead of the requested GeoJSON: 

```json
{"error":["column \"the_geom\" does not exist"]}
```

If we wanted *only* non-geographic attribute data to be returned, we could run the API call without specifying any format, and then the result would be returned in default JSON. For example, 

```
https://ejeans.carto.com/api/v2/sql?&q=
SELECT name, description FROM lab_7_emma
```

would return: 

```json
{"rows":[{"name":"UW Tacoma","description":"A beautiful, urban campus in Tacoma, WA"}],"time":0.008,"fields":{"name":{"type":"string","pgtype":"text"},"description":{"type":"string","pgtype":"text"}},"total_rows":1}
```
-->

Any SQL query that contains a column with the data format 'geometry' will return results in the GeoJSON format. This table has a column called 'geom' with data in the 'geometry' format, and so the result is a GeoJSON. Because the returned file is in GeoJSON format, we can import it into a Leaflet map quite easily. In the next step, we'll use a call to the SQL API to display data on our map. 

### 3. Displaying data from the database in Leaflet

In VS Code, open the Project Folder for the Lab 7 testing files you downloaded from GitHub, and open the JavaScript file. Take a moment to familiarize yourself with the code, noting that it is very similar to the code you wrote in Lab 6, with a simpler HTML form for collecting attributes. From top to bottom, it should achieve the following: 

* initialize a map, set the default view and base map tile layer
* create an editable feature group named `drawnItems`
* instantiate a control that allows the user to draw shapes on the map
* create a function that opens a form within a popup on any shape the user draws and add an event listener to open that popup when the shape is completed
* create a function that saves data of the shape's geometry and attributes entered into the form. This data is currently printed to the console when the event listener tied to the 'submit' button on the form is triggered. 
* add a series of event listeners to control the behavior of the popup when a shape is being edited. 

The first change we will make to the existing code will be to add previously drawn shapes that are stored in the SQL table to the map. Under the line of code where you declare the `drawnItems` variable and before where you instantiate the Leaflet.draw control (`new L.Control.Draw...`), add the following:

```javascript
var tableData = L.layerGroup().addTo(map);
var url = "https://178.128.228.240:4000/sql?q=";
// change the Query below by replacing lab_7_name with your table name
var sqlQuery = "SELECT geom, description, name FROM emma_table";
function addPopup(feature, layer) {
    layer.bindPopup(
        "<b>" + feature.properties.name + "</b><br>" +
        feature.properties.description
    );
}

fetch(url + sqlQuery)
    .then(function(response) {
    return response.json();
    })
    .then(function(data) {
        L.geoJSON(data, {onEachFeature: addPopup}).addTo(tableData);
    });
```

This code does a few things. Let's look first at the top chunk of code. Here we declare a variable named `tableData` to hold the data already in the SQL table (as a layer group) and we add it to the map. Next we create variables called `url` and `sqlQuery` to hold portions of the SQL API call, which we'll use in a moment. We don't have to store these as variables, but breaking the API call up like this makes it easy to understand and modify different parts of the call to adjust what we request from the API. Finally, we write a function to bind a popup to the features that will be displayed from the table data. Note that the popup for each of the loaded features displays the `name` and the `description` properties, which the user will enter in the popup form when submitting drawn shapes. 

Next let's look at the second chunk of code. This uses a method that is likely new to you, namely `fetch`. 

![Mean Girls fetch gif](https://media3.giphy.com/media/G6ojXggFcXWCs/giphy.gif)

Fetch is an HTML 5 API used for loading resources asynchronously in the web page. In this sense, it is very similar to the AJAX requests you've made with JQuery to load GeoJSONs into Leaflet maps in the past. You can [learn more about the Fetch API here](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)--and note that it is not supported by the Internet Explorer browser at this time. 

The Fetch request we make in the code above requests the resource located at the specified parameter--in this case, the URL created by the combination of the variables `url` and `sqlQuery`, or `http://178.128.228.240:4000/sql?q=SELECT geom, description, name FROM emma_table`. 

The `.then()` method in the next bit of code takes the response from the Fetch request and formats it as JSON, and the next `.then()` adds the popups created by the `addPopup` function we wrote above to the map. 

Save your changes and preview in your browser. Navigate in the map to Tacoma, and you should see a point on the map with a clickable popup: 

![screenshot of marker loaded from database](images/image3.png)

If you don't see the point above, check your work to identify any typos or errors, using the JavaScript console to help, before moving on to the next step. 

### 4. Sending user inputs to the database 

In step 3 you displayed data *from* the database on your map; now it's time to send user inputs from your map *to* the database. 

The JavaScript code in the Lab 7 testing files contains a function called `setData` that, when the user clicks the 'submit' button on the HTML form, packages the geometry of the shape the user has drawn as a variable named `drawing`, and packages the attributes the user has entered for the name and description as variables named `enteredUsername` and `enteredDescription`. It then uses `console.log` to print these three variables to the console. Now, instead of printing the variables to the console, we want to send them to the database as values to be stored in a row. 

Replace the portion of the code inside the `setData` function shown in the screenshot below with the code in the code block below.

Replace this: 

![screenshot of what to replace](images/image4.png)

With this: 

```javascript
   	// For each drawn layer
    drawnItems.eachLayer(function(layer) {
           
			// Create SQL expression to insert layer
            var drawing = JSON.stringify(layer.toGeoJSON().geometry);
            var sql =
                "INSERT INTO YourTableName (geom, name, description) " +
                "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
                drawing + "'), 4326), '" +
                enteredUsername + "', '" +
                enteredDescription + "');";
            console.log(sql);

            // Send the data
            fetch(url + encodeURI(sql))
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                console.log("Data saved:", data);
            })
            .catch(function(error) {
                console.log("Problem saving the data:", error);
            });

        // Transfer submitted drawing to the tableData layer 
        //so it persists on the map without you having to refresh the page
        var newData = layer.toGeoJSON();
        newData.properties.description = enteredDescription;
        newData.properties.name = enteredUsername;
        L.geoJSON(newData, {onEachFeature: addPopup}).addTo(tableData);

    });
```

Once again, there's a lot going on here, so let's take it bit by bit. Let's look at the part under the first comment: 

```javascript
		// For each drawn layer
        drawnItems.eachLayer(function(layer) {
        	// Code does something with each drawn layer
        });
```

The `.eachLayer` method used here allows us to iterate so that the code that follows will run for every shape that the user draws on the map. Note that the final curly bracket and parenthesis of the code closes this function, as indicated by the tabbing that aligns it with this opening line of code. 

So what does the internal function in the `.eachLayer` iteration do with each layer? Three things: 

1. **Construct** the `INSERT` query for adding a new record into the table
2. **Send** the query to the SQL API
3. **Copy** the submitted drawing to the tableData layer, to display it on the map

Here is the code for the SQL query construction:

```javascript
        // Create SQL expression to insert layer
            var drawing = JSON.stringify(layer.toGeoJSON().geometry);
            var sql =
                "INSERT INTO YourTableName (geom, name, description) " +
                "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
                drawing + "'), 4326), '" +
                enteredUsername + "', '" +
                enteredDescription + "')";
            console.log(sql);
```
Here we've made some adjustments to what happens with the `drawing` variable, which in Lab 6 we simply printed to the console. First: **change the name of the table in the sql statement from `YourTableName` to *your* table's name.** Now that that's done, what's happening here is you're writing a SQL command to insert data into your table. This is just like what we did in part 1.2 above, only you're writing the SQL command in JavaScript instead of in the command line interface, and you're using variables to construct the query dynamically from user inputs. Just like before, you're converting the geometry of the shape from GeoJSON to WKB, using EPSG code 4326 to indicate that the coordinates are in WGS 84. You're also setting the values to be inserted into the `name` and `description` columns equal to what the user entered in the popup form. To help us double check our work, we're also using `console.log` to see in the browser's JS console what's being submitted to the database. 

In the code under the next comment, we actually send the data to the database with the SQL API: 

```Javascript
            // Send the data
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: "q=" + encodeURI(sql)
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                console.log("Data saved:", data);
            })
            .catch(function(error) {
                console.log("Problem saving the data:", error);
            });
```

Notice again that we are using Fetch, and that we are connecting to the URL you specified with the `url` variable in step 3. Recall that in this case, the URL is `https://178.128.228.240:4000/sql`. We use the POST method (an HTTP method for sending data to a server; documentation available here) to send the data, properly formatted and [encoded](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI). The remaining parts of the code (the `.then()` functions and the `.catch` function) log some additional information to the console to help us notice and resolve any errors. 

Finally, let's look at the code under the last comment: 

```javascript
        // Transfer submitted drawing to the tableData layer 
        //so it persists on the map without you having to refresh the page
        var newData = layer.toGeoJSON();
        newData.properties.description = enteredDescription;
        newData.properties.name = enteredUsername;
        L.geoJSON(newData, {onEachFeature: addPopup}).addTo(tableData);
```

This part of the code transfers the drawn data to the `tableData` layer to display it on the map without reloading the map. Basically, the drawn `layer` is translated to GeoJSON, combined with the `name` and `description` properties, then added on the map with `L.geoJSON`. Without this part, our drawing would only be sent to the database without being shown on the map, unless we reload the web page. 

Save your changes and preview in the browser. Draw a shape on your map, enter some attribute information for the name and description, and click submit. Your shape should persist on the map; this is great! Next let's check the JS console to make sure the data was submitted to the database. 

Logged to the console, you should see an SQL statement with the geometry of the shape you drew and values for the non-spatial attributes based on what you entered in the form. Additionally, you should see a message that the data was saved. Refresh the page and your newly drawn shape should still show up. If you instead get an error message, check your code for mistakes and try again. 

### 5. A note about permissions

Any database is always associated with one or more database users, who are granted a specific set of privileges. When you set up your ArcGIS Online database for the ArcGIS Field Maps map you made in Lab 4, you granted 'Add,' 'Delete', and 'Update' privileges to members of your MSGT cohort, for instance. We typically talk about database user privileges in terms of various roles. For example, an administrator may have the maximal set of privileges, meaning they can do anything in the database: reading and writing into tables, creating new tables, deleting existing tables, adding or removing other uses, and so on. On the other hand, a read-only user may have a more limited set of privileges so that they can only consume data from the database but cannot make changes to any tables. 

The way you've accessed our database with the SQL API implies a database connection with the default user named `readonlyuser`, which I created when I set up the database. The `readonlyuser` has **read** permissions on all tables in the database, which is why you can execute the SQL query starting with `SELECT` in step 3 to display data from the database in your map. However, as the name `readonlyuser` implies, we would not ordinarily grant such a user **write** permissions that would allow them to modify the table. 

For a simple crowdsourcing app, intended for a trusted audience, we have granted `INSERT` privileges to `readonlyuser` as a simple and effective  way to enable users of the interface you created in Lab 6 to add data to the database. In a way, this makes our database exposed: anyone who enters our web page will be able to insert new records into the table. On the other hand, the worst-case scenario is just that our table will be filled with many unnecessary records. The only privilege we will grant is `INSERT`, which means that `readonlyuser` cannot delete any previously entered records or modify the table in any other way. Moreover, when the URL for our page is shared with a trusted audience, such as among students taking a survey in a class, the chances of someone taking the trouble of finding our page and intentionally sabotaging our database by filling it with a large amount of fake records is very small. If this were a professional deployment, however, we would want to set up a dynamic server with an authentication system to enable only authenticated users to modify the database. 

If at some point in the future you wanted to disable the ability for a `readonlyuser` to insert data into the table, for example when data collection is completed and we do not want to accept any more entries, you can always **revoke** the privilege granted to insert data into the table as follows:

```sql
REVOKE INSERT ON TABLE table_name
  FROM readonlyuser; 
```

### 6. Setting up a table for your Lab 6 data collection scenario

Up to now, we've been working with a table designed to work with the simplified attribute collection form in the Lab 7 testing files. However, in lab 6, you created a more complex HTML form for collecting attributes specific to your own data collection scenario. In this step, you'll repeat the actions in steps 1-5 to create a new table to hold the data users will collect with the tool you built in lab 6. 

Back in the command line interface, create a new table with an appropriate name (return to steps 1.2 and 1.3 of these instructions if you need a reminder of how to do so) to set up your table with all the necessary columns to hold the data your form will collect. Your table will need: 

1. a 'geom' field to hold the geometry of each shape the user draws, which should be created when you upload the template file
2. a field for each input in your form, which you have to create. You must select the data type for each field (text, integer, numeric, boolean, date, [etc.](https://www.postgresql.org/docs/current/datatype.html)), so ensure that it matches the data type collected by the given input. 

### 7. Update your HTML and JS code to connect the form to the table. 

#### 7.1 Copy your files and update your HTML form

Before continuing, save a copy of the Lab 7 testing files that you've been editing, putting them in a new folder with a name of your choosing. You'll keep a version of the files that you edited in steps 1-5 of this lab as a backup for your reference, but in this step, you'll make some additional, significant changes that warrant a saving a new version. 

Next, replace the section of the code that creates the HTML form in the popup that opens on each feature with the form you created in Lab 6. This means you will replace the following: 

``` javascript 
function createFormPopup() {
    var popupContent =
        '<form>' +
        'Description:<br><input type="text" id="input_desc"><br>' +
        'User\'s Name:<br><input type="text" id="input_name"><br>' +
        '<input type="button" value="Submit" id="submit">' +
        '</form>' 
    drawnItems.bindPopup(popupContent).openPopup();
}
```

with the longer form you wrote to go into the `createFormPopup()` function in your Lab 6 files. Save your work and test your file to ensure that the form appears as expected when you finish drawing a shape. Do not worry about what happens when you click the 'submit' button yet, as you'll fix that next. 

#### 7.2 Update your JS

Next, update your JS file to connect the form to the table. Recall that there are a couple of places in the code that determine how the form and the table interact, both within the `setData(e)` function:

1. Where we select by element ID to get the values the user entered and store those values in variables. In Step 1-5 above, for instance, this looked something like this: 

   ```javascript
           var enteredUsername = document.getElementById("input_name").value;
           var enteredDescription = document.getElementById("input_desc").value;
   ```

2. Where we write the SQL expression that inserts data into the table. In Steps 1-5, this looked something like this: 

   ```javascript
               var drawing = JSON.stringify(layer.toGeoJSON().geometry);
               var sql =
                   "INSERT INTO lab_7_name (the_geom, name, description) " +
                   "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
                   drawing + "'), 4326), '" +
                   enteredUsername + "', '" +
                   enteredDescription + "')";
               console.log(sql);
   ```

Update each section of the code here to link your table to your form. This should involve the following:

* Creating a variable for each value that the user inputs and selecting by input ID to access those values. (i.e. update the code in #1 above. You also did this in Lab 6 so that you could log the data to the console, so feel free to copy and paste the appropriate code from your prior work, or recreate it here.)
* Changing the table name (i.e. lab_7_name) and columns (i.e. name, description) referenced in the `INSERT INTO` command to match the name of your newly created table and its columns
* Changing the variables in the `INSERT INTO` command to match the variables that are holding the input values (i.e. swap enteredUsername and enteredDecription for the variables that hold your form's values). 

Save your changes and test them in the browser. You should be able to draw a new shape, fill in the form, and post the data to the database without any errors being logged to the console. Using the command line interface, check your table by running a `SELECT * FROM tablename` query to see if the data was saved.  

#### 7.3 Ensure that drawn shapes persist on the map

At this point, your data collection tool (the map) should be sending user-submitted data to the database. However, in testing, you probably noticed that the shapes the user draws are not persisting on the map. To fix that, we need to make three small changes. First, toward the top of your code, update the variable `sqlQuery` so that it is selecting from the correct table (the exact name must match the name of the table you created in step 6, rather than the table we tested with in steps 1-5.). You can use * to select all columns, or name just specific columns that you want to display, e.g.:

```javascript
var sqlQuery = "SELECT * FROM step6_table_name";
```

Immediately below that line in the code, you should see a function named `addPopup`. This bit of code is pulling attributes from the GeoJSON that is exported from the database table to display in each feature's popup. Change the content of that popup by pulling different properties that match the column names in your new table, e.g. replacing `feature.properties.name` and `feature.properties.description` in the example below with whatever properties you wish to display in your popups: 

``` javascript
function addPopup(feature, layer) {
    layer.bindPopup(
        "<b>" + feature.properties.name + "</b><br>" +
        feature.properties.description
    );
}
```

Finally, towards the bottom of your code (within the function named `setData`), you have a few lines of code that transfer any drawings the user has made in the current session to the layer called `tableData` so that they persist on the map without the user having to refresh the page:  

```javascript
  var newData = layer.toGeoJSON();
    newData.properties.description = enteredDescription;
    newData.properties.name = enteredUsername;
    L.geoJSON(newData, {onEachFeature: addPopup}).addTo(tableData);
```

Change the content of this code block so that it is also displaying the properties you want to show up in a popup, similar to what you changed in the `addPopup` function above. 

Save your changes and check your work, using the JavaScript console to help you trouble shoot any issues that arise. 

### 8. Submission

Upload your completed map to GitHub and submit a link to your work on Canvas. You need only provide a link to your data collection tool (the map). You've accomplished quite a lot in this lab, so there is no write-up for Lab 7.
