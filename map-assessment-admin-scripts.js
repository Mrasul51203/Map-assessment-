let adminMap, submissionsMap;
let greenMarker, redMarker;
let currentEditingPath;

const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Define Greater London bounds
const greaterLondonBounds = L.latLngBounds(
    L.latLng(51.28676, -0.5103), // Southwest corner
    L.latLng(51.69131, 0.3340)   // Northeast corner
);

jQuery(document).ready(function($) {
    if ($('#create-question-map').length) {
        initCreateQuestionMap();
    } else if ($('#view-submissions-map').length) {
        initViewSubmissionsMap();
    }
});

function initCreateQuestionMap() {
    adminMap = L.map('create-question-map', {
        center: greaterLondonBounds.getCenter(),
        zoom: 11,
        minZoom: 11,
        maxZoom: 18,
        maxBounds: greaterLondonBounds,
        maxBoundsViscosity: 1.0
    });

    L.tileLayer('https://theseru.co.uk/idealmap/maptiles/{z}/{x}/{y}.png', {
        attribution: '© Your Attribution'
    }).addTo(adminMap);

    adminMap.on('click', function(e) {
        if (greenMarker && redMarker) {
            return;
        }
        if (!greenMarker) {
            greenMarker = L.marker(e.latlng, {icon: greenIcon, draggable: true}).addTo(adminMap);
        } else if (!redMarker) {
            redMarker = L.marker(e.latlng, {icon: redIcon, draggable: true}).addTo(adminMap);
        }
    });

    // Ensure the create question button event listener is attached
    jQuery('#create-question').on('click', createQuestion);
    
    // Add event listeners for setting markers
    jQuery('#set-green-marker').on('click', function() {
        adminMap.once('click', function(e) {
            if (greenMarker) {
                adminMap.removeLayer(greenMarker);
            }
            greenMarker = L.marker(e.latlng, {icon: greenIcon, draggable: true}).addTo(adminMap);
        });
    });

    jQuery('#set-red-marker').on('click', function() {
        adminMap.once('click', function(e) {
            if (redMarker) {
                adminMap.removeLayer(redMarker);
            }
            redMarker = L.marker(e.latlng, {icon: redIcon, draggable: true}).addTo(adminMap);
        });
    });
}

function createQuestion() {
    console.log('createQuestion function called');

    if (!greenMarker || !redMarker) {
        alert('Please set both green and red markers before creating a question.');
        return;
    }

    const questionText = prompt('Enter the question text:');
    if (!questionText) {
        return;
    }

    const data = {
        action: 'create_question',
        nonce: mapAssessmentAjax.nonce,
        question_text: questionText,
        start_point: JSON.stringify(greenMarker.getLatLng()),
        end_point: JSON.stringify(redMarker.getLatLng())
    };

    console.log('AJAX data:', data);

    jQuery.ajax({
        url: mapAssessmentAjax.ajaxurl,
        method: 'POST',
        data: data,
        success: function(response) {
            console.log('AJAX response:', response);
            if (response.success) {
                alert('Question created successfully!');
                // Clear the map and reset markers
                if (greenMarker) adminMap.removeLayer(greenMarker);
                if (redMarker) adminMap.removeLayer(redMarker);
                greenMarker = null;
                redMarker = null;
            } else {
                alert('Error: ' + response.data.message);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log('AJAX error:', textStatus, errorThrown);
            alert('An error occurred while creating the question. Please try again.');
        }
    });
}


function initManageQuestionsPage() {
    $('.edit-question').on('click', function() {
        const questionId = $(this).data('id');
        editQuestion(questionId);
    });

    $('.delete-question').on('click', function() {
        const questionId = $(this).data('id');
        deleteQuestion(questionId);
    });

    $('#save-edited-question').on('click', saveEditedQuestion);
    $('#close-edit-modal').on('click', closeEditModal);
}

function editQuestion(questionId) {
    jQuery.ajax({
        url: mapAssessmentAjax.ajaxurl,
        method: 'POST',
        data: {
            action: 'get_question',
            nonce: mapAssessmentAjax.nonce,
            question_id: questionId
        },
        success: function(response) {
            if (response.success) {
                $('#edit-question-id').val(response.data.id);
                $('#edit-question-text').val(response.data.question_text);
                $('#edit-question-modal').show();
                initEditQuestionMap(response.data.start_point, response.data.end_point);
            } else {
                alert('Error: ' + response.data.message);
            }
        },
        error: function() {
            alert('An error occurred while fetching the question. Please try again.');
        }
    });
}

function initEditQuestionMap(startPoint, endPoint) {
    if (adminMap) {
        adminMap.remove();
    }

    adminMap = L.map('edit-question-map', {
        center: greaterLondonBounds.getCenter(),
        zoom: 11,
        minZoom: 11,
        maxZoom: 18,
        maxBounds: greaterLondonBounds,
        maxBoundsViscosity: 1.0
    });

    L.tileLayer('https://theseru.co.uk/idealmap/maptiles/{z}/{x}/{y}.png', {
        attribution: '© Your Attribution'
    }).addTo(adminMap);

    const start = startPoint.split(',').map(Number);
    const end = endPoint.split(',').map(Number);

    greenMarker = L.marker(start, {icon: greenIcon, draggable: true}).addTo(adminMap);
    redMarker = L.marker(end, {icon: redIcon, draggable: true}).addTo(adminMap);

    adminMap.fitBounds(L.latLngBounds(start, end));
}

function saveEditedQuestion() {
    const questionId = $('#edit-question-id').val();
    const questionText = $('#edit-question-text').val();
    const startPoint = greenMarker.getLatLng();
    const endPoint = redMarker.getLatLng();

    jQuery.ajax({
        url: mapAssessmentAjax.ajaxurl,
        method: 'POST',
        data: {
            action: 'update_question',
            nonce: mapAssessmentAjax.nonce,
            question_id: questionId,
            question_text: questionText,
            start_point: startPoint.lat + ',' + startPoint.lng,
            end_point: endPoint.lat + ',' + endPoint.lng
        },
        success: function(response) {
            if (response.success) {
                alert('Question updated successfully.');
                closeEditModal();
                location.reload();
            } else {
                alert('Error: ' + response.data.message);
            }
        },
        error: function() {
            alert('An error occurred while updating the question. Please try again.');
        }
    });
}

function closeEditModal() {
    $('#edit-question-modal').hide();
    if (adminMap) {
        adminMap.remove();
    }
}

function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question?')) {
        jQuery.ajax({
            url: mapAssessmentAjax.ajaxurl,
            method: 'POST',
            data: {
                action: 'delete_question',
                nonce: mapAssessmentAjax.nonce,
                question_id: questionId
            },
            success: function(response) {
                if (response.success) {
                    alert('Question deleted successfully.');
                    location.reload();
                } else {
                    alert('Error: ' + response.data.message);
                }
            },
            error: function() {
                alert('An error occurred while deleting the question. Please try again.');
            }
        });
    }
}

function initViewSubmissionsMap() {
    submissionsMap = L.map('view-submissions-map', {
        center: greaterLondonBounds.getCenter(),
        zoom: 11,
        minZoom: 11,
        maxZoom: 18,
        maxBounds: greaterLondonBounds,
        maxBoundsViscosity: 1.0
    });

    L.tileLayer('https://theseru.co.uk/idealmap/maptiles/{z}/{x}/{y}.png', {
        attribution: '© Your Attribution'
    }).addTo(submissionsMap);

    viewSubmissions();

    // Add event listeners for new buttons
    $('#undo-edit').on('click', undoEdit);
    $('#clear-edit').on('click', clearEdit);
    $('#line-color').on('change', changeLineColor);
    $('#edit-route').on('click', function() { editSubmission(currentSubmissionId); });
    $('#save-route').on('click', saveEditedRoute);
    $('#cancel-edit').on('click', cancelEdit);
    $('#redraw-route').on('click', startDrawing);
}


    
    fetchSubmissionRoute(submissionId, function(route) {
        currentEditingPath = L.polyline(route, {color: $('#line-color').val()}).addTo(submissionsMap);
        submissionsMap.fitBounds(currentEditingPath.getBounds());
        currentEditingPath.editing.enable();
    });
}


    console.log('Editing submission:', submissionId);
    currentSubmissionId = submissionId;
    $('#edit-route').hide();
    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route, #cancel-edit').show();
    
    if (currentEditingPath) {
        submissionsMap.removeLayer(currentEditingPath);
    }
    
    fetchSubmissionRoute(submissionId, function(route) {
        currentEditingPath = L.polyline(route, {color: $('#line-color').val()}).addTo(submissionsMap);
        submissionsMap.fitBounds(currentEditingPath.getBounds());
        currentEditingPath.editing.enable();
    });
}

function undoEdit() {
    if (currentEditingPath && currentEditingPath.editing) {
        currentEditingPath.editing.undo();
    }
}

function clearEdit() {
    if (currentEditingPath && currentEditingPath.editing) {
        currentEditingPath.editing.clear();
    }
}

function changeLineColor() {
    if (currentEditingPath) {
        const color = $('#line-color').val();
        currentEditingPath.setStyle({ color: color });
    }
}

,
            success: function(response) {
                if (response.success) {
                    alert('Route updated successfully.');
                    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route, #cancel-edit').hide();
                    $('#edit-route').show();
                    viewSubmissions(); // Refresh the submissions view
                } else {
                    alert('Failed to update route: ' + response.data.message);
                }
            },
            error: function() {
                alert('An error occurred while updating the route.');
            }
        });
    } else {
        alert('No route to save.');
    }
}


    if (currentEditingPath) {
        const updatedPath = currentEditingPath.getLatLngs();
        jQuery.ajax({
            url: mapAssessmentAjax.ajaxurl,
            method: 'POST',
            data: {
                action: 'update_submission',
                nonce: mapAssessmentAjax.nonce,
                submission_id: currentSubmissionId,
                updated_path: JSON.stringify(updatedPath)
            },
            success: function(response) {
                if (response.success) {
                    alert('Route updated successfully.');
                    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route, #cancel-edit').hide();
                    $('#edit-route').show();
                } else {
                    alert('Failed to update route: ' + response.data.message);
                }
            },
            error: function() {
                alert('An error occurred while updating the route.');
            }
        });
    } else {
        alert('No route to save.');
    }
},
            success: function(response) {
                if (response.success) {
                    alert('Route updated successfully.');
                    cancelEdit();
                    viewSubmissions(); // Refresh the submissions view
                } else {
                    alert('Error: ' + response.data.message);
                }
            },
            error: function() {
                alert('An error occurred while updating the route. Please try again.');
            }
        });
    }
}


        submissionsMap.removeLayer(currentEditingPath);
        currentEditingPath = null;
    }
    
    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route, #cancel-edit').hide();
    $('#edit-route').show();
    
    // Refresh the original submission route
    if (currentSubmissionId) {
        fetchSubmissionRoute(currentSubmissionId, function(route) {
            currentEditingPath = L.polyline(route, {color: 'blue'}).addTo(submissionsMap);
            submissionsMap.fitBounds(currentEditingPath.getBounds());
        });
    }
}


    console.log('Canceling edit');
    stopDrawing();
    
    if (currentEditingPath) {
        if (currentEditingPath.editing) {
            currentEditingPath.editing.disable();
        }
        submissionsMap.removeLayer(currentEditingPath);
        currentEditingPath = null;
    }
    
    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route, #cancel-edit').hide();
    $('#edit-route').show();
    
    // Refresh the original submission route
    if (currentSubmissionId) {
        fetchSubmissionRoute(currentSubmissionId, function(route) {
            currentEditingPath = L.polyline(route, {color: 'blue'}).addTo(submissionsMap);
            submissionsMap.fitBounds(currentEditingPath.getBounds());
        });
    }
}

function startDrawing() {
    if (currentEditingPath) {
        submissionsMap.removeLayer(currentEditingPath);
    }
    currentEditingPath = L.polyline([], { color: 'blue' }).addTo(submissionsMap);
    currentEditingPath.editing.enable();
    submissionsMap.on('click', addLatLng);
    $('#redraw-route').hide();
    $('#undo-edit, #clear-edit, #line-color, #save-route, #cancel-edit').show();
}

function addLatLng(e) {
    currentEditingPath.addLatLng(e.latlng);
}

let currentSubmissionId;

function viewSubmissions() {
    jQuery.ajax({
        url: mapAssessmentAjax.ajaxurl,
        method: 'POST',
        data: {
            action: 'get_submissions',
            nonce: mapAssessmentAjax.nonce
        },
        success: function(response) {
            if (response.success) {
                displaySubmissions(response.data.submissions);
            } else {
                alert('Failed to fetch submissions.');
            }
        },
        error: function(error) {
            console.error('Error:', error);
            alert('An error occurred while fetching submissions.');
        }
    });
}

function undoEdit() {
    if (currentEditingPath) {
        let latlngs = currentEditingPath.getLatLngs();
        if (latlngs.length > 0) {
            latlngs.pop();
            currentEditingPath.setLatLngs(latlngs);
        }
    }
}

function clearEdit() {
    if (currentEditingPath) {
        currentEditingPath.setLatLngs([]);
    }
}

function changeLineColor() {
    let color = $('#line-color').val();
    if (currentEditingPath) {
        currentEditingPath.setStyle({color: color});
    }
}

let isDrawing = false;

function startDrawing() {
    isDrawing = true;
    submissionsMap.on('click', addPoint);
    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route').show();
    $('#edit-route').hide();
}

function stopDrawing() {
    isDrawing = false;
    submissionsMap.off('click', addPoint);
    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route').hide();
    $('#edit-route').show();
}

function addPoint(e) {
    if (isDrawing && currentEditingPath) {
        currentEditingPath.addLatLng(e.latlng);
    }
}


    
    fetchSubmissionRoute(submissionId, function(route) {
        currentEditingPath = L.polyline(route, {color: $('#line-color').val()}).addTo(submissionsMap);
        submissionsMap.fitBounds(currentEditingPath.getBounds());
        currentEditingPath.editing.enable();
    });
}


    console.log('Editing submission:', submissionId);
    currentSubmissionId = submissionId;
    $('#edit-route').hide();
    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route, #cancel-edit').show();
    
    if (currentEditingPath) {
        submissionsMap.removeLayer(currentEditingPath);
    }
    
    // Fetch the current route for the submission
    fetchSubmissionRoute(submissionId, function(route) {
        currentEditingPath = L.polyline(route, {color: $('#line-color').val()}).addTo(submissionsMap);
        submissionsMap.fitBounds(currentEditingPath.getBounds());
        startDrawing();
    });
}

,
            success: function(response) {
                if (response.success) {
                    alert('Route updated successfully.');
                    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route, #cancel-edit').hide();
                    $('#edit-route').show();
                    viewSubmissions(); // Refresh the submissions view
                } else {
                    alert('Failed to update route: ' + response.data.message);
                }
            },
            error: function() {
                alert('An error occurred while updating the route.');
            }
        });
    } else {
        alert('No route to save.');
    }
}


    console.log('Saving edited route');
    stopDrawing();
    
    // Here you would typically send the edited route data to the server
    // For now, we'll just log the coordinates
    console.log('New route coordinates:', currentEditingPath.getLatLngs());
    
    // TODO: Implement AJAX call to save the edited route
    // saveRouteToServer(currentSubmissionId, currentEditingPath.getLatLngs());
    
    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route, #cancel-edit').hide();
    $('#edit-route').show();
}


        submissionsMap.removeLayer(currentEditingPath);
        currentEditingPath = null;
    }
    
    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route, #cancel-edit').hide();
    $('#edit-route').show();
    
    // Refresh the original submission route
    if (currentSubmissionId) {
        fetchSubmissionRoute(currentSubmissionId, function(route) {
            currentEditingPath = L.polyline(route, {color: 'blue'}).addTo(submissionsMap);
            submissionsMap.fitBounds(currentEditingPath.getBounds());
        });
    }
}


    console.log('Canceling edit');
    stopDrawing();
    
    if (currentEditingPath) {
        submissionsMap.removeLayer(currentEditingPath);
        currentEditingPath = null;
    }
    
    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route, #cancel-edit').hide();
    $('#edit-route').show();
    
    // Refresh the original submission route
    fetchSubmissionRoute(currentSubmissionId, function(route) {
        currentEditingPath = L.polyline(route, {color: 'blue'}).addTo(submissionsMap);
        submissionsMap.fitBounds(currentEditingPath.getBounds());
    });
}

function fetchSubmissionRoute(submissionId, callback) {
    jQuery.ajax({
        url: mapAssessmentAjax.ajaxurl,
        method: 'POST',
        data: {
            action: 'get_submission_route',
            nonce: mapAssessmentAjax.nonce,
            submission_id: submissionId
        },
        success: function(response) {
            if (response.success) {
                callback(response.data.route);
            } else {
                alert('Failed to fetch submission route.');
            }
        },
        error: function(error) {
            console.error('Error:', error);
            alert('An error occurred while fetching the submission route.');
        }
    });
}














function displaySubmissions(submissions) {
    submissionsMap.eachLayer(layer => {
        if (layer instanceof L.Polyline || layer instanceof L.Marker) {
            submissionsMap.removeLayer(layer);
        }
    });

    submissions.forEach((submission, index) => {
        const path = L.polyline(submission.route, {color: 'red'}).addTo(submissionsMap);
        
        const marker = L.marker(submission.route[0], {
            icon: L.divIcon({
                className: 'submission-marker',
                html: `<div>${index + 1}</div>`
            })
        }).addTo(submissionsMap);

        marker.on('click', () => {
            showSubmissionDetails(submission, path);
        });
    });
    
    if (submissions.length > 0) {
        submissionsMap.fitBounds(L.featureGroup(submissionsMap.getLayers()).getBounds());
    }
}

function showSubmissionDetails(submission, path) {
    currentSubmissionId = submission.id;
    
    // Update the modal content
    $('#submission-modal').html(`
        <h3>Submission Details</h3>
        <p id="user-id">User ID: ${submission.user_id}</p>
        <p id="submitted-at">Submitted at: ${submission.submitted_at}</p>
        <textarea id="feedback-text" rows="4" cols="50">${submission.feedback || ''}</textarea>
        <button id="save-feedback">Save Feedback</button>
        <button id="edit-route">Edit Route</button>
        <button id="redraw-route" style="display:none;">Redraw Route</button>
        <button id="save-route" style="display:none;">Save Route</button>
        <button id="cancel-edit" style="display:none;">Cancel Edit</button>
        <button id="close-modal">Close</button>
    `);
    
    // Show the modal
    $('#submission-modal').show();

    document.getElementById('save-feedback').addEventListener('click', () => {
        const feedback = document.getElementById('feedback-text').value;
        saveFeedback(submission.id, feedback);
    });

    document.getElementById('edit-route').addEventListener('click', () => {
        currentEditingPath = path;
        path.editing.enable();
        document.getElementById('edit-route').style.display = 'none';
        document.getElementById('redraw-route').style.display = 'inline-block';
        document.getElementById('save-route').style.display = 'inline-block';
        document.getElementById('cancel-edit').style.display = 'inline-block';
    });

    document.getElementById('redraw-route').addEventListener('click', () => {
        submissionsMap.removeLayer(path);
        currentEditingPath = L.polyline([], {color: 'blue'}).addTo(submissionsMap);
        submissionsMap.on('click', addPointToRoute);
    });

    document.getElementById('save-route').addEventListener('click', () => {
        const newRoute = currentEditingPath.getLatLngs();
        saveEditedRoute(submission.id, newRoute);
        disableRouteEditing();
    });

    document.getElementById('cancel-edit').addEventListener('click', () => {
        disableRouteEditing();
        currentEditingPath.setLatLngs(submission.route);
    });

    document.getElementById('close-modal').addEventListener('click', () => {
        disableRouteEditing();
        document.body.removeChild(modal);
    });
}

function addPointToRoute(e) {
    currentEditingPath.addLatLng(e.latlng);
}

function disableRouteEditing() {
    if (currentEditingPath) {
        currentEditingPath.editing.disable();
        submissionsMap.off('click', addPointToRoute);
    }
    document.getElementById('edit-route').style.display = 'inline-block';
    document.getElementById('redraw-route').style.display = 'none';
    document.getElementById('save-route').style.display = 'none';
    document.getElementById('cancel-edit').style.display = 'none';
}

function saveFeedback(submissionId, feedback) {
    jQuery.ajax({
        url: mapAssessmentAjax.ajaxurl,
        method: 'POST',
        data: {
            action: 'save_feedback',
            nonce: mapAssessmentAjax.nonce,
            submission_id: submissionId,
            feedback: feedback
        },
        success: function(response) {
            if (response.success) {
                alert('Feedback saved successfully!');
            } else {
                alert('Failed to save feedback. Please try again.');
            }
        },
        error: function(error) {
            console.error('Error:', error);
            alert('An error occurred while saving feedback.');
        }
    });
}

function saveEditedRoute(submissionId, newRoute) {
    jQuery.ajax({
        url: mapAssessmentAjax.ajaxurl,
        method: 'POST',
        data: {
            action: 'save_edited_route',
            nonce: mapAssessmentAjax.nonce,
            submission_id: submissionId,
            route: JSON.stringify(newRoute)
        },
        success: function(response) {
            if (response.success) {
                alert('Route updated successfully!');
                disableRouteEditing();
            } else {
                alert('Failed to update route. Please try again.');
            }
        },
        error: function(error) {
            console.error('Error:', error);
            alert('An error occurred while updating the route.');
        }
    });
}


function editSubmission(submissionId) {
    console.log('Editing submission:', submissionId);
    currentSubmissionId = submissionId;
    $('#edit-route').hide();
    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route, #cancel-edit').show();
    
    if (currentEditingPath) {
        submissionsMap.removeLayer(currentEditingPath);
    }
    
    fetchSubmissionRoute(submissionId, function(route) {
        currentEditingPath = L.polyline(route, {color: $('#line-color').val()}).addTo(submissionsMap);
        submissionsMap.fitBounds(currentEditingPath.getBounds());
        currentEditingPath.editing.enable();
    });
}

function saveEditedRoute() {
    if (currentEditingPath) {
        const updatedPath = currentEditingPath.getLatLngs();
        jQuery.ajax({
            url: mapAssessmentAjax.ajaxurl,
            method: 'POST',
            data: {
                action: 'update_submission',
                nonce: mapAssessmentAjax.nonce,
                submission_id: currentSubmissionId,
                updated_path: JSON.stringify(updatedPath)
            },
            success: function(response) {
                if (response.success) {
                    alert('Route updated successfully.');
                    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route, #cancel-edit').hide();
                    $('#edit-route').show();
                    viewSubmissions(); // Refresh the submissions view
                } else {
                    alert('Failed to update route: ' + response.data.message);
                }
            },
            error: function() {
                alert('An error occurred while updating the route.');
            }
        });
    } else {
        alert('No route to save.');
    }
}

function cancelEdit() {
    console.log('Canceling edit');
    stopDrawing();
    
    if (currentEditingPath) {
        if (currentEditingPath.editing) {
            currentEditingPath.editing.disable();
        }
        submissionsMap.removeLayer(currentEditingPath);
        currentEditingPath = null;
    }
    
    $('#redraw-route, #undo-edit, #clear-edit, #line-color, #save-route, #cancel-edit').hide();
    $('#edit-route').show();
    
    // Refresh the original submission route
    if (currentSubmissionId) {
        fetchSubmissionRoute(currentSubmissionId, function(route) {
            currentEditingPath = L.polyline(route, {color: 'blue'}).addTo(submissionsMap);
            submissionsMap.fitBounds(currentEditingPath.getBounds());
        });
    }
}
