var map = L.map('map').setView([47.4711, -120.7401], 7.5);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/outdoors-v12',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoianNlcmZhc3MiLCJhIjoiY2w5eXA5dG5zMDZydDN2cG1zeXduNDF5eiJ9.6-9p8CxqQlWrUIl8gSjmNw'
}).addTo(map);

var drawnItems = L.featureGroup().addTo(map);

var tableData = L.layerGroup().addTo(map);
var url = "https://gisdb.xyz/sql?q=";
// change the Query below by replacing lab_7_name with your table name
var sqlQuery = "SELECT * FROM wildlife_sighting";
function addPopup(feature, layer) {
    layer.bindPopup(
        "<b>Species observed:</b>" + " " + feature.properties.input_species + "</b><br>" + "<b>Approximate number of individuals observed:</b>" + " " + feature.properties.input_number + "<br>" + "<b>Date of sighting:</b>" + " " + feature.properties.input_date + "<br>" + "<b>Time of sighting:</b>" + " " + feature.properties.input_time + "</b><br>" + "<b>Photo:</b>" + " " + feature.properties.input_photo + "</b><br>"
    );
}

fetch(url + sqlQuery)
    .then(function(response) {
    return response.json();
    })
    .then(function(data) {
        L.geoJSON(data, {onEachFeature: addPopup}).addTo(tableData);
    });

new L.Control.Draw({
    draw : {
        polygon : true,
        polyline : false,
        rectangle : true,     
        circle : true,        
        circlemarker : false,  
        marker: true
    },
    edit : {
        featureGroup: drawnItems
    }
}).addTo(map);
// HTML form that allows the user to enter attribute information while responding to questions in the form.
function createFormPopup() {
    var popupContent = 
    '<form>' + 
        'What species was observed?<input type="text" id="input_species"><br>' + 
        'Approximate number of individuals observed?<br><input type="number" id="input_number"><br>' + 
        'Date of sighting:<br><input type="date" id="input_date"><br>' + 
        'Time of sighting:<br><input type="time" id="input_time"><br>' + 
        'Please provide a photo of the animal (Optional):<br><input type="file" id="input_photo" accept="image/png, image/jpeg"><br>' + 
        'Description of area (Optional):<br><input type="text" id="input_desc"><br>' + 
        'Your name:<input type="text" id="input_name"><br>' + 
        'Contact info (Optional):<br><input type="text" id="input_contact"><br>' + 
        '<input type="button" value="Submit" id="submit">' + 
        '</form>'
    drawnItems.bindPopup(popupContent).openPopup();
}

map.addEventListener("draw:created", function(e) {
    e.layer.addTo(drawnItems);
    createFormPopup();
});

function setData(e) {

    if(e.target && e.target.id == "submit") {

        // Get user name and description
        var enteredSpecies = document.getElementById("input_species").value;
        var enteredIndividuals = document.getElementById("input_number").value;
        var enteredDate = document.getElementById("input_date").value;
        var enteredTime = document.getElementById("input_time").value;
        var enteredPhoto = document.getElementById("input_photo").value;
        var enteredDescription = document.getElementById("input_desc").value;
        var enteredUsername = document.getElementById("input_name").value;
        var enteredContactinfo = document.getElementById("input_contact").value;

           	// For each drawn layer
    drawnItems.eachLayer(function(layer) {
           
        // Create SQL expression to insert layer
        var drawing = JSON.stringify(layer.toGeoJSON().geometry);
        var sql =
            "INSERT INTO wildlife_sighting (geom, input_species, input_number, input_date, input_time, input_photo, input_desc, input_name, input_contact) " +
            "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
            drawing + "'), 4326), '" +
            enteredSpecies + "', '" +
            enteredIndividuals + "', '" +
            enteredDate + "', '" +
            enteredTime + "', '" +
            enteredPhoto + "', '" +
            enteredDescription + "', '" +
            enteredUsername + "', '" +
            enteredContactinfo + "')";
        console.log(sql);

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

    // Transfer submitted drawing to the tableData layer 
    //so it persists on the map without you having to refresh the page
    var newData = layer.toGeoJSON();
    newData.properties.input_species = enteredSpecies;
    newData.properties.input_number = enteredIndividuals;
    newData.properties.input_date = enteredDate;
    newData.properties.input_time = enteredTime;
    newData.properties.input_photo = enteredPhoto;
    L.geoJSON(newData, {onEachFeature: addPopup}).addTo(tableData);

    });

        // Clear drawn items layer
        drawnItems.closePopup();
        drawnItems.clearLayers();

    }
}

document.addEventListener("click", setData);

map.addEventListener("draw:editstart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:deletestart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:editstop", function(e) {
    drawnItems.openPopup();
});
map.addEventListener("draw:deletestop", function(e) {
    if(drawnItems.getLayers().length > 0) {
        drawnItems.openPopup();
    }
});
