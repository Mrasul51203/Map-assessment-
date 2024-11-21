<?php
/*
Plugin Name: Map Assessment System
Description: A map-based assessment system for theseru.co.uk
Version: 1.0
Author: Your Name
Text Domain: map-assessment
*/

if (!defined('ABSPATH')) exit; // Exit if accessed directly

// Define constants
define('MAP_ASSESSMENT_PATH', plugin_dir_path(__FILE__));
define('MAP_ASSESSMENT_URL', plugin_dir_url(__FILE__));

// Include necessary files
if (file_exists(MAP_ASSESSMENT_PATH . 'admin-map.php')) {
    require_once MAP_ASSESSMENT_PATH . 'admin-map.php';
}
if (file_exists(MAP_ASSESSMENT_PATH . 'user-map.php')) {
    require_once MAP_ASSESSMENT_PATH . 'user-map.php';
}

// ... (rest of the code - enqueue scripts, activation/deactivation hooks, etc.) ...

// AJAX handlers
function map_assessment_get_question() {
    check_ajax_referer('map_assessment_nonce', 'nonce');
    $question_id = intval($_POST['question_id']);
    global $wpdb;
    $table_name = $wpdb->prefix . 'map_questions';
    $question = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $question_id));
    if ($question) {
        wp_send_json_success($question);
    } else {
        wp_send_json_error(['message' => 'Question not found']);
    }
}
add_action('wp_ajax_get_question', 'map_assessment_get_question');

function map_assessment_update_question() {
    check_ajax_referer('map_assessment_nonce', 'nonce');
    $question_id = intval($_POST['question_id']);
    $question_text = sanitize_textarea_field($_POST['question_text']);
    $start_point = sanitize_text_field($_POST['start_point']);
    $end_point = sanitize_text_field($_POST['end_point']);
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'map_questions';
    $result = $wpdb->update(
        $table_name,
        [
            'question_text' => $question_text,
            'start_point' => $start_point,
            'end_point' => $end_point,
        ],
        ['id' => $question_id],
        ['%s', '%s', '%s'],
        ['%d']
    );
    
    if ($result !== false) {
        wp_send_json_success(['message' => 'Question updated successfully']);
    } else {
        wp_send_json_error(['message' => 'Failed to update question']);
    }
}
add_action('wp_ajax_update_question', 'map_assessment_update_question');

function map_assessment_delete_question() {
    check_ajax_referer('map_assessment_nonce', 'nonce');
    $question_id = intval($_POST['question_id']);
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'map_questions';
    $result = $wpdb->delete($table_name, ['id' => $question_id], ['%d']);
    
    if ($result !== false) {
        wp_send_json_success(['message' => 'Question deleted successfully']);
    } else {
        wp_send_json_error(['message' => 'Failed to delete question']);
    }
}
add_action('wp_ajax_delete_question', 'map_assessment_delete_question');

function map_assessment_update_submission() {
    check_ajax_referer('map_assessment_nonce', 'nonce');
    $submission_id = intval($_POST['submission_id']);
    $updated_path = sanitize_text_field($_POST['updated_path']);
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'map_answers';
    $result = $wpdb->update(
        $table_name,
        ['answer_data' => $updated_path],
        ['id' => $submission_id],
        ['%s'],
        ['%d']
    );
    
    if ($result !== false) {
        wp_send_json_success(['message' => 'Submission updated successfully']);
    } else {
        wp_send_json_error(['message' => 'Failed to update submission']);
    }
}
add_action('wp_ajax_update_submission', 'map_assessment_update_submission');

?>

function map_assessment_submit_user_route() {
    check_ajax_referer('map_assessment_nonce', 'nonce');
    $question_id = intval($_POST['question_id']);
    $route = sanitize_text_field($_POST['route']);
    $user_id = get_current_user_id();

    global $wpdb;
    $table_name = $wpdb->prefix . 'map_answers';
    $result = $wpdb->insert(
        $table_name,
        [
            'user_id' => $user_id,
            'question_id' => $question_id,
            'answer_data' => $route,
            'submitted_at' => current_time('mysql')
        ],
        ['%d', '%d', '%s', '%s']
    );

    if ($result !== false) {
        wp_send_json_success(['message' => 'Route submitted successfully']);
    } else {
        wp_send_json_error(['message' => 'Failed to submit route']);
    }
}
add_action('wp_ajax_submit_user_route', 'map_assessment_submit_user_route');
add_action('wp_ajax_nopriv_submit_user_route', 'map_assessment_submit_user_route');
