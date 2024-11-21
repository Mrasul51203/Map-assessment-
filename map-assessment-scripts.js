
jQuery(document).ready(function ($) {
    // Define Greater London bounds
    const greaterLondonBounds = L.latLngBounds(
        L.latLng(51.28676, -0.5103), // Southwest corner
        L.latLng(51.69131, 0.3340)   // Northeast corner
    );

    var map = L.map('user-map', {
        center: greaterLondonBounds.getCenter(),
        zoom: 12,
        minZoom: 11,
        maxZoom: 18,
        maxBounds: greaterLondonBounds,
        maxBoundsViscosity: 1.0
    });

    L.tileLayer('https://theseru.co.uk/idealmap/maptiles/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    var polyline;
    var firstClick = true;

    // Start drawing
    $('.start-draw').on('click', function() {
        polyline = L.polyline([], {color: 'blue', weight: 5}).addTo(map);
        map.on('click', addLatLng);
        $(this).hide();
        $('.stop-draw').show();
    });

    // Stop drawing
    $('.stop-draw').on('click', function() {
        map.off('click', addLatLng);
        $(this).hide();
        $('.start-draw').show();
    });

    // Function to add a point to the polyline
    function addLatLng(e) {
        if (firstClick) {
            L.circleMarker(e.latlng, {
                radius: 5,
                fillColor: 'blue',
                color: 'blue',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.5
            }).addTo(map);
            firstClick = false;
        }
        polyline.addLatLng(e.latlng);
    }

    // Undo last drawn point
    $('.undo').on('click', function() {
        if (polyline && polyline.getLatLngs().length > 0) {
            var latlngs = polyline.getLatLngs();
            latlngs.pop();
            polyline.setLatLngs(latlngs);
        }
    });

    // Clear all drawn items
    $('.clear').on('click', function() {
        if (confirm('Are you sure you want to clear all drawn items?')) {
            drawnItems.clearLayers();
            if (polyline) {
                map.removeLayer(polyline);
            }
            polyline = null;
            firstClick = true;
        }
    });

    // Home button functionality
    $('.home').on('click', function() {
        map.fitBounds(greaterLondonBounds);
    });

    // Flag button functionality
    $('.flag').on('click', function() {
        alert('Flagged!'); // Placeholder for flag functionality
    });

    // Review button functionality
    $('.review').on('click', function() {
        alert('Reviewing...'); // Placeholder for review functionality
    });

    // Next button functionality
    $('.next').on('click', function() {
        alert('Next item...'); // Placeholder for next functionality
    });

    // Previous button functionality
    $('.previous').on('click', function() {
        alert('Previous item...'); // Placeholder for previous functionality
    });

    // Submit button functionality
    $('.submit').on('click', function() {
        if (!polyline || polyline.getLatLngs().length < 2) {
            alert('Please draw a route before submitting.');
            return;
        }

        var route = polyline.getLatLngs().map(function(latlng) {
            return [latlng.lat, latlng.lng];
        });

        $.ajax({
            url: mapAssessmentAjax.ajaxurl,
            method: 'POST',
            data: {
                action: 'submit_user_route',
                nonce: mapAssessmentAjax.nonce,
                route: JSON.stringify(route),
                question_id: $('#current-question-id').val() // Make sure to add a hidden input with the current question ID
            },
            success: function(response) {
                if (response.success) {
                    alert('Route submitted successfully!');
                    // Clear the map and reset for the next question
                    drawnItems.clearLayers();
                    if (polyline) {
                        map.removeLayer(polyline);
                    }
                    polyline = null;
                    firstClick = true;
                    // You might want to load the next question here
                } else {
                    alert('Error: ' + response.data.message);
                }
            },
            error: function() {
                alert('An error occurred while submitting the route. Please try again.');
            }
        });
    });
});
