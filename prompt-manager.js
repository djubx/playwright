const fs = require('fs').promises;
const path = require('path');


const prompt = `
Write a detailed technical blog on the "REPLACE_ME" Flutter package. Structure the blog in three distinct parts, with each part in its own separate markdown format. Use \RealFlutter\ as the main class name throughout the examples.

1. **Description**: Provide a high-level overview of the package, examples on when to use this and its features.
2. **Tutorial**: Walk through the setup process and explain how to use the package. Include platform-specific details (research as necessary for Android and iOS), and provide any required configurations or optimizations.
3. **Complete Example**: Provide a fully functional Flutter main file that demonstrates all key features of the package. Add stepwise comments within the code to explain what each part does. After the code, include a detailed explanation of the application flow via comments. Let this also be the part of code but in comments just below the code.

To make parsing easier, add markers to begin and end each section:
- Start and end the description with <-- START_DESCRIPTION --> and <-- END_DESCRIPTION -->.
- Start and end the tutorial with <-- START_TUTORIAL --> and <-- END_TUTORIAL -->.
- For the main file example, use <-- START_MAIN and END_MAIN --> as a marker just before the code begins and end the marker only after the comments explaining the flow of the application are complete.

Make sure to:
- Include detailed code comments explaining the flow of the app step-by-step.
- Provide a final summary explaining how the code flows, after the comments inside the code block.
- Use // style comments even for explaining the flow of the application.
`

const packageListToCreatePromptsFor = [
    "easy_image_viewer",
    "brasil_fields",
    "background_downloader",
    "maps_toolkit",
    "json_path",
    "json_rpc_2",
    "slide_countdown",
    "math_expressions",
    "google_mlkit_face_detection",
    "phone_numbers_parser",
    "octo_image",
    "slang",
    "lints",
    "flutter_branch_sdk",
    "platform",
    "flutter_displaymode",
    "sidebarx",
    "bottom_picker",
    "random_string",
    "textfield_tags",
    "dart_frog",
    "sqlite3",
    "ffigen",
    "http_interceptor",
    "flutter_background",
    "multicast_dns",
    "android_alarm_manager_plus",
    "pub_semver",
    "swipe_to",
    "dio_cookie_manager",
    "android_id",
    "shelf_proxy",
    "video_editor",
    "flutter_login_facebook",
    "oauth2",
    "convert",
    "flutter_expandable_fab",
    "flutter_vlc_player",
    "lint",
    "freerasp",
    "process_run",
    "eva_icons_flutter",
    "shorebird_code_push",
    "flutter_rust_bridge",
    "flutter_gen_runner",
    "pigeon",
    "pinch_zoom",
    "infinite_carousel",
    "dismissible_page",
    "otp_autofill",
    "dart_ipify",
    "keyboard_dismisser",
    "flutter_onboarding_slider",
    "msix",
    "motion_toast",
    "skeleton_text",
    "flutter_translate",
    "whatsapp_unilink",
    "tray_manager",
    "devicelocale",
    "flutter_image_slideshow",
    "slider_button",
    "flutter_file_downloader",
    "elegant_notification",
    "gcloud",
    "postgres",
    "talker",
    "flutter_screen_lock",
    "shelf_static",
    "flutter_slider_drawer",
    "action_slider",
    "appinio_swiper",
    "flag",
    "image_picker_web",
    "soundpool",
    "flutter_config",
    "two_dimensional_scrollables",
    "linkify",
    "blurrycontainer",
    "markdown_widget",
    "flutter_compass",
    "delayed_display",
    "flutter_libphonenumber",
    "pedometer",
    "amplify_auth_cognito",
    "flutter_nfc_kit",
    "meta_seo",
    "sticky_grouped_list",
    "intercom_flutter",
    "flutter_dynamic_icon",
    "open_settings",
    "boxy",
    "contained_tab_bar_view",
    "flutter_advanced_switch",
    "open_store",
    "google_mlkit_barcode_scanning",
    "d_chart",
    "graphs",
    "flutter_floating_bottom_bar",
    "super_clipboard",
    "otp",
    "flutter_braintree",
    "another_flutter_splash_screen",
    "fancy_shimmer_image",
    "stylish_bottom_bar",
    "flutter_acrylic",
    "simple_circular_progress_bar",
    "postgrest",
    "talker_dio_logger",
    "image_editor_plus",
    "mailto",
    "multi_split_view",
    "fading_edge_scrollview",
    "date_field",
    "flutter_link_previewer",
    "camera_web",
    "filesize",
    "alarm",
    "lpinyin",
    "simple_html_css",
    "super_drag_and_drop",
    "rect_getter",
    "flutter_reorderable_grid_view",
    "simple_ripple_animation",
    "reflectable",
    "sign_in_button",
    "circular_menu",
    "country_flags",
    "cli_completion",
    "copy_with_extension",
    "google_api_availability",
    "unity_ads_plugin",
    "stomp_dart_client",
    "flashy_tab_bar2",
    "floating_action_bubble",
    "pub_updater",
    "cunning_document_scanner",
    "csslib"
  ]

  let list = []
  async function main() {
    for (let packageName of packageListToCreatePromptsFor) {
        const newPrompt = prompt.replace("REPLACE_ME", packageName);
        let promptObj = {
            "packageName": packageName,
            "command": newPrompt
        }
        list.push(promptObj);
    }

    await fs.writeFile(path.join(__dirname, 'promptManagerPrompts.json'), JSON.stringify(list, null, 2));
    // load from file
    let prompts = JSON.parse(await fs.readFile(path.join(__dirname, 'promptManagerPrompts.json'), 'utf-8'));
    console.log(prompts);
  }

  main();