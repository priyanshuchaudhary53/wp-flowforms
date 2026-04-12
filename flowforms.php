<?php

/**
 * FlowForms WordPress Plugin
 *
 * @package FlowForms
 *
 * Plugin Name: FlowForms
 * Description: FlowForms lets you create beautiful step-by-step forms in WordPress. A modern conversational form builder and Typeform alternative for WordPress.
 * Plugin URI:  https://flowforms.priyanshuc.dev/
 * Version:     1.0.0
 * Author:      Priyanshu
 * Author URI:  https://priyanshuc.dev/
 * Text Domain: flowforms
 * License:     GPL-3.0-only
 * License URI: https://opensource.org/licenses/GPL-3.0
 */

if (! defined('ABSPATH')) exit; // Exit if accessed directly

// Define constants
define('WPFF_VERSION', '1.0.0');
define('WPFF_NAME', 'FlowForms');
define('WPFF_SLUG', 'flowforms');

define('WPFF_FILE', __FILE__);
define('WPFF_PATH', plugin_dir_path(__FILE__));
define('WPFF_URL', plugin_dir_url(__FILE__));

// Autoload classes
require_once WPFF_PATH . 'includes/FlowForms.php';

flowforms();
