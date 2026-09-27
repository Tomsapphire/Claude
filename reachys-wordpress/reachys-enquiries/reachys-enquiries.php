<?php
/**
 * Plugin Name: reachys Enquiries
 * Description: Receives the reachys landing page contact form, stores each submission under "Enquiries" in the admin and emails a notification.
 * Version:     1.1.0
 * Author:      reachys
 * License:     GPL-2.0-or-later
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const REACHYS_ENQ_POST_TYPE = 'reachys_enquiry';
const REACHYS_ENQ_ACTION    = 'reachys_enquiry';
const REACHYS_ENQ_SERVICES  = array(
	'Full-service marketing',
	'Strategy',
	'Brand & identity',
	'Content & social',
	'Performance & SEO',
);

/**
 * Admin-only post type that holds the submissions.
 */
function reachys_enq_register_post_type() {
	register_post_type(
		REACHYS_ENQ_POST_TYPE,
		array(
			'labels'          => array(
				'name'          => 'Enquiries',
				'singular_name' => 'Enquiry',
				'menu_name'     => 'Enquiries',
				'all_items'     => 'All enquiries',
				'edit_item'     => 'Enquiry',
				'search_items'  => 'Search enquiries',
				'not_found'     => 'No enquiries yet.',
			),
			'public'          => false,
			'show_ui'         => true,
			'show_in_menu'    => true,
			'show_in_rest'    => false,
			'menu_position'   => 25,
			'menu_icon'       => 'dashicons-email-alt',
			'supports'        => array( 'title' ),
			'capability_type' => 'post',
			'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
			'map_meta_cap'    => true,
		)
	);
}
add_action( 'init', 'reachys_enq_register_post_type' );

/**
 * Handle a form post (logged-in and logged-out visitors).
 */
function reachys_enq_handle() {
	$is_ajax = ! empty( $_POST['ajax'] );

	// Honeypot: real visitors never see or fill this field.
	if ( ! empty( $_POST['website'] ) ) {
		reachys_enq_respond( $is_ajax, true );
	}

	// Simple rate limit: 5 submissions per 10 minutes per visitor.
	$ip_key = 'reachys_enq_' . md5( isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : '' );
	$count  = (int) get_transient( $ip_key );
	if ( $count >= 5 ) {
		reachys_enq_respond( $is_ajax, false, 'Too many messages in a short time — please try again in a few minutes.' );
	}

	$name    = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
	$email   = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$company = isset( $_POST['company'] ) ? sanitize_text_field( wp_unslash( $_POST['company'] ) ) : '';
	$service = isset( $_POST['service'] ) ? sanitize_text_field( wp_unslash( $_POST['service'] ) ) : '';
	$message = isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '';

	$name    = mb_substr( $name, 0, 200 );
	$company = mb_substr( $company, 0, 200 );
	$message = mb_substr( $message, 0, 5000 );
	if ( ! in_array( $service, REACHYS_ENQ_SERVICES, true ) ) {
		$service = '';
	}

	if ( '' === $name || ! is_email( $email ) ) {
		reachys_enq_respond( $is_ajax, false, 'Please add your name and a valid email address.' );
	}

	$post_id = wp_insert_post(
		array(
			'post_type'   => REACHYS_ENQ_POST_TYPE,
			'post_status' => 'publish',
			'post_title'  => $company ? sprintf( '%s — %s', $name, $company ) : $name,
		),
		true
	);
	if ( is_wp_error( $post_id ) ) {
		reachys_enq_respond( $is_ajax, false, 'Sorry, something went wrong. Please email us instead.' );
	}

	update_post_meta( $post_id, '_rx_name', $name );
	update_post_meta( $post_id, '_rx_email', $email );
	update_post_meta( $post_id, '_rx_company', $company );
	update_post_meta( $post_id, '_rx_service', $service );
	update_post_meta( $post_id, '_rx_message', $message );

	set_transient( $ip_key, $count + 1, 10 * MINUTE_IN_SECONDS );

	/**
	 * Filter the address that receives new-enquiry notifications.
	 * Defaults to Settings → General → Administration Email Address.
	 */
	$to   = apply_filters( 'reachys_enquiry_notify_email', get_option( 'admin_email' ) );
	$body = "New enquiry from the website\n\n"
		. "Name: {$name}\n"
		. "Email: {$email}\n"
		. "Company: {$company}\n"
		. "Service: {$service}\n\n"
		. "Message:\n{$message}\n\n"
		. 'View in WordPress: ' . admin_url( 'post.php?post=' . $post_id . '&action=edit' ) . "\n";
	$headers = array( 'Reply-To: ' . $name . ' <' . $email . '>' );
	wp_mail( $to, 'New enquiry: ' . $name, $body, $headers );

	reachys_enq_respond( $is_ajax, true );
}
add_action( 'admin_post_nopriv_' . REACHYS_ENQ_ACTION, 'reachys_enq_handle' );
add_action( 'admin_post_' . REACHYS_ENQ_ACTION, 'reachys_enq_handle' );

/**
 * The form posts to the page it is on (no /wp-admin URL, so it works with
 * login-hiding/security plugins and sub-folder installs). Catch it early.
 */
function reachys_enq_maybe_handle() {
	if ( ! isset( $_SERVER['REQUEST_METHOD'] ) || 'POST' !== $_SERVER['REQUEST_METHOD'] ) {
		return;
	}
	if ( empty( $_POST['rx_action'] ) || REACHYS_ENQ_ACTION !== $_POST['rx_action'] ) {
		return;
	}
	reachys_enq_handle();
}
add_action( 'init', 'reachys_enq_maybe_handle', 20 );

/**
 * JSON for the page's script; a redirect back to the page when JavaScript is off.
 */
function reachys_enq_respond( $is_ajax, $ok, $error = '' ) {
	if ( $is_ajax ) {
		if ( $ok ) {
			wp_send_json_success();
		}
		wp_send_json_error( array( 'message' => $error ), 400 );
	}
	$back = wp_get_referer() ? wp_get_referer() : home_url( '/' );
	$back = remove_query_arg( 'enquiry', strtok( $back, '#' ) );
	$back = add_query_arg( 'enquiry', $ok ? 'sent' : 'error', $back ) . '#contact';
	wp_safe_redirect( $back );
	exit;
}

/**
 * List screen columns.
 */
function reachys_enq_columns( $columns ) {
	return array(
		'cb'         => $columns['cb'],
		'title'      => 'Name',
		'rx_email'   => 'Email',
		'rx_service' => 'Service',
		'date'       => 'Received',
	);
}
add_filter( 'manage_' . REACHYS_ENQ_POST_TYPE . '_posts_columns', 'reachys_enq_columns' );

function reachys_enq_column_content( $column, $post_id ) {
	if ( 'rx_email' === $column ) {
		$email = get_post_meta( $post_id, '_rx_email', true );
		printf( '<a href="mailto:%1$s">%2$s</a>', esc_attr( $email ), esc_html( $email ) );
	} elseif ( 'rx_service' === $column ) {
		echo esc_html( get_post_meta( $post_id, '_rx_service', true ) );
	}
}
add_action( 'manage_' . REACHYS_ENQ_POST_TYPE . '_posts_custom_column', 'reachys_enq_column_content', 10, 2 );

/**
 * Read-only details box on the single enquiry screen.
 */
function reachys_enq_meta_box() {
	add_meta_box( 'reachys_enq_details', 'Enquiry details', 'reachys_enq_render_details', REACHYS_ENQ_POST_TYPE, 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'reachys_enq_meta_box' );

function reachys_enq_render_details( $post ) {
	$rows = array(
		'Name'    => get_post_meta( $post->ID, '_rx_name', true ),
		'Email'   => get_post_meta( $post->ID, '_rx_email', true ),
		'Company' => get_post_meta( $post->ID, '_rx_company', true ),
		'Service' => get_post_meta( $post->ID, '_rx_service', true ),
	);
	echo '<table class="form-table" role="presentation"><tbody>';
	foreach ( $rows as $label => $value ) {
		echo '<tr><th scope="row">' . esc_html( $label ) . '</th><td>';
		if ( 'Email' === $label && $value ) {
			printf( '<a href="mailto:%1$s">%2$s</a>', esc_attr( $value ), esc_html( $value ) );
		} else {
			echo esc_html( $value ? $value : '—' );
		}
		echo '</td></tr>';
	}
	echo '<tr><th scope="row">Message</th><td>' . nl2br( esc_html( get_post_meta( $post->ID, '_rx_message', true ) ) ) . '</td></tr>';
	echo '<tr><th scope="row">Received</th><td>' . esc_html( get_the_date( 'j F Y, H:i', $post ) ) . '</td></tr>';
	echo '</tbody></table>';
}

/**
 * Search the stored fields too, not just the title.
 */
function reachys_enq_search( $search, $query ) {
	global $wpdb;
	if ( ! is_admin() || ! $query->is_main_query() || REACHYS_ENQ_POST_TYPE !== $query->get( 'post_type' ) ) {
		return $search;
	}
	$term = $query->get( 's' );
	if ( '' === $term ) {
		return $search;
	}
	$like = '%' . $wpdb->esc_like( $term ) . '%';
	return $wpdb->prepare(
		" AND ( {$wpdb->posts}.post_title LIKE %s OR EXISTS ( SELECT 1 FROM {$wpdb->postmeta} pm WHERE pm.post_id = {$wpdb->posts}.ID AND pm.meta_key LIKE '\\_rx\\_%%' AND pm.meta_value LIKE %s ) )",
		$like,
		$like
	);
}
add_filter( 'posts_search', 'reachys_enq_search', 10, 2 );
