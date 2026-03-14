<?php

/**
 * WP FlowForms WordPress Plugin
 * 
 * @package WPFlowForms
 * 
 * Plugin Name: WP FlowForms
 * Description: WP FlowForms lets you create beautiful step-by-step forms in WordPress. A modern conversational form builder and Typeform alternative for WordPress.
 * Plugin URI:  https://wpflowforms.com/
 * Version:     1.0.0
 * Author:      Priyanshu
 * Author URI:  https://priyanshuc.dev/
 * Text Domain: wp-flowforms
 * License:     GPL-3.0-only
 * License URI: https://opensource.org/licenses/GPL-3.0
 */

if (! defined('ABSPATH')) exit; // Exit if accessed directly  

// Define constants
define('WP_FLOWFORMS_VERSION', '1.0.0');
define('WP_FLOWFORMS_NAME', 'WP FlowForms');
define('WP_FLOWFORMS_SLUG', 'wp-flowforms');

define('WP_FLOWFORMS_FILE', __FILE__);
define('WP_FLOWFORMS_PATH', plugin_dir_path(__FILE__));
define('WP_FLOWFORMS_URL', plugin_dir_url(__FILE__));

// Autoload classes
require_once WP_FLOWFORMS_PATH . 'includes/WP_FlowForms.php';

wp_flowforms();
