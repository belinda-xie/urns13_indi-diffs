// this code makes it so you can't move on past the instructions until the timer is up (last "next" is disabled)
/* jspsych-instructions.js
 * Josh de Leeuw
 *
 * This plugin displays text (including HTML formatted strings) during the experiment.
 * Use it to show instructions, provide performance feedback, etc...
 *
 * Page numbers can be displayed to help with navigation by setting show_page_number
 * to true.
 *
 * documentation: docs.jspsych.org
 *
 *
 */

jsPsych.plugins["instructions-time-limit"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "instructions-time-limit",
    description: '',
    parameters: {
      pages: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: 'Pages',
        default: undefined,
        array: true,
        description: 'Each element of the array is the content for a single page.'
      },
      time_limit: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Time limit',
        default: null,
        description: 'How long to show the instructions.'
      },
      int_time: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'interruption',
        default: null,
        description: 'When to have the interruption occur.'
      },
      key_forward: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        pretty_name: 'Key forward',
        default: 'rightarrow',
        description: 'The key the subject can press in order to advance to the next page.'
      },
      key_backward: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        pretty_name: 'Key backward',
        default: 'leftarrow',
        description: 'The key that the subject can press to return to the previous page.'
      },
      allow_backward: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Allow backward',
        default: true,
        description: 'If true, the subject can return to the previous page of the instructions.'
      },
      allow_forward: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Allow forward',
        default: true,
        description: 'If true, the subject can go to the next of the instructions.'
      },
      allow_keys: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Allow keys',
        default: true,
        description: 'If true, the subject can use keyboard keys to navigate the pages.'
      },
      show_clickable_nav: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Show clickable nav',
        default: false,
        description: 'If true, then a "Previous" and "Next" button will be displayed beneath the instructions.'
      },
      show_page_number: {
          type: jsPsych.plugins.parameterType.BOOL,
          pretty_name: 'Show page number',
          default: false,
          description: 'If true, and clickable navigation is enabled, then Page x/y will be shown between the nav buttons.'
      },
      button_label_previous: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Button label previous',
        default: 'Previous',
        description: 'The text that appears on the button to go backwards.'
      },
      button_label_next: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Button label next',
        default: 'Next',
        description: 'The text that appears on the button to go forwards.'
      }
    }
  }

  plugin.trial = function(display_element, trial) {

    var current_page = 0;

    var view_history = [];
    var page_view_time_history = [];
    var int_answer = [];

    var start_time = (new Date()).getTime();

    var last_page_update_time = start_time;

    function btnListener(evt){
    	evt.target.removeEventListener('click', btnListener);
    	if(this.id === "jspsych-instructions-back"){
    		back();
    	}
    	else if(this.id === 'jspsych-instructions-next'){
    		next();
    	}
    }

    function show_current_page() {
      let pagenum_display = "";
      if(trial.show_page_number) {
          pagenum_display = "Page "+(current_page+1)+"/"+trial.pages.length;
      }
      display_element.innerHTML = trial.pages[current_page];
      if (trial.show_clickable_nav) {

// this is where it says to only allow "previous" button if current page is > 0 or after the first page

        var nav_html = "<div class='jspsych-instructions-nav' style='padding: 10px 0px;'>";
        if (trial.allow_backward) {
          let allowed = (current_page > 0  && trial.show_page_number)? '' : "disabled='disabled'";
          nav_html += "<button id='jspsych-instructions-back' class='jspsych-btn' style='margin-right: 5px;' "+allowed+">&lt; "+trial.button_label_previous+"</button>";
        }
        if (trial.allow_forward) {
          let allowed = (trial.show_page_number)? '' : "disabled='disabled'";
          nav_html += "<button id='jspsych-instructions-next' class='jspsych-btn' style='margin-left: 5px;' "+allowed+">"+trial.button_label_next+ " &gt;</button></div>";

        }

        if (trial.pages.length > 1 && trial.show_page_number) {
            nav_html += "<span style='margin: 0 1em;' class='"+
                "jspsych-instructions-pagenum'>"+pagenum_display+"</span>";
        }
        //nav_html += "<button id='jspsych-instructions-next' class='jspsych-btn'"+
        //    "style='margin-left: 5px;'>"+trial.button_label_next+
        //    " &gt;</button></div>";

        display_element.innerHTML += nav_html;

        if (current_page != 0 && trial.allow_backward) {
          display_element.querySelector('#jspsych-instructions-back').addEventListener('click', btnListener);
        }

         display_element.querySelector('#jspsych-instructions-next').addEventListener('click', btnListener);
      } else if (trial.show_page_number && trial.pages.length > 1) {
          // page numbers for non-mouse navigation
          display_element.innerHTML += "<div class='jspsych-instructions-pagenum'>"+
            pagenum_display+"</div>"
      }

    }

    function next() {

      add_current_page_to_view_history()

      current_page++;

      // if done, finish up...
      if (current_page >= trial.pages.length) {
        endTrial();
      } else {
        show_current_page();
      }

    }

    function back() {

      add_current_page_to_view_history()

      current_page--;

      show_current_page();
    }

    function add_current_page_to_view_history() {

      var current_time = (new Date()).getTime();

      var page_view_time = current_time - last_page_update_time;

      view_history.push(
       current_page
      );

      page_view_time_history.push(
       page_view_time
      );

   //   view_history.push({
  //      page_index: current_page,
  //      viewing_time: page_view_time
  //    });

      last_page_update_time = current_time;
    }

    // JS add here for trying to save interruption data
    var answer = {
      answer:null
    };

    if (trial.int_time !==null) {
      jsPsych.pluginAPI.setTimeout(function() {
          var int_answer = prompt('What is 100+300?');
          console.log(int_answer);
          answer.int_answer = int_answer;
      }, trial.int_time);
    }

  //  console.log(int_answer);

    function endTrial() {
      jsPsych.pluginAPI.clearAllTimeouts();
      if (trial.allow_keys) {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboard_listener);
      }

      display_element.innerHTML = '';

      var trial_data = {
        "int_answer": answer.int_answer,
        "view_history": JSON.stringify(view_history),
        "page_view_time": JSON.stringify(page_view_time_history),

       // "rt": (new Date()).getTime() - start_time
      };

      jsPsych.finishTrial(trial_data);
    }

    var after_response = function(info) {

      // have to reinitialize this instead of letting it persist to prevent accidental skips of pages by holding down keys too long
      keyboard_listener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: [trial.key_forward, trial.key_backward],
        rt_method: 'date',
        persist: false,
        allow_held_key: false
      });
      // check if key is forwards or backwards and update page
      if (jsPsych.pluginAPI.compareKeys(info.key, trial.key_backward)) {
        if (current_page !== 0 && trial.allow_backward) {
          back();
        }
      }

      if (jsPsych.pluginAPI.compareKeys(info.key, trial.key_forward)) {
        if (current_page < trial.pages.length && trial.allow_forward) {
          next();
        }
      }

    };

    show_current_page();

    if (trial.allow_keys) {
      var keyboard_listener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: [trial.key_forward, trial.key_backward],
        rt_method: 'date',
        persist: false
      });
    }

    // end trial if time limit is set
    if (trial.time_limit !==null) {
      jsPsych.pluginAPI.setTimeout(function() {
        endTrial();
      }, trial.time_limit);
    }

  };

  return plugin;
})();
