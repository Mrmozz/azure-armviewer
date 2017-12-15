// Globals
editing = false

// Switch to editor mode
function startEditor() {
  editing = true;
  if (infoShown) {
    $('#infobox').toggle("slide");
    infoShown = false;
  }

  $('#mainview').hide();
  $('#editor').text(template);
  $('#editor').show();
  $('.tools').children().hide();
  $('.tools').append(`
   <li><button class='btn btn-success navbar-btn tool' style="color:white" 
   onclick='editorSave()' data-toggle="tooltip" 
   title="Save"><i class="fas fa-save"></i> Save</button></li>`);
   $('.tools').append(`
   <li><button class='btn btn-warning navbar-btn tool' style="color:white" 
   onclick='editorCancel()' data-toggle="tooltip" 
   title="Save"><i class="far fa-times"></i> Cancel</button></li>`);
}

// Save the edits, check for errors and if OK, post the form to the server
function editorSave() {
  if (err = checkErrors()) {
    $('#snackbar').html(err);
    $('#snackbar').addClass('show');
    setTimeout(function () { $('#snackbar').removeClass('show'); }, 3000);
  } else {
    $('#editorform').submit();
  }
}

// Cancel the edits, replace template with orginal contents & post the form to the server
function editorCancel() {
  $('#editor').val(template); 
  $('#editorform').submit();
}

// Simple validation checks
function checkErrors() {
  let editorContents = $('#editor').val();
  let temp = null;

  // Try to parse JSON file
  try {
    temp = JSON.parse(editorContents);
  } catch (ex) {
    return `That doesn't appear to be a JSON document! - ${ex}`;
  }

  // Some simple ARM validation
  if (!temp.resources || !temp.$schema) {
    return `OK that might be JSON, but I don't think that's a valid ARM template!`;
  }
  return false;
}

// Make tab key in editor insert 3 spaces
$(document).delegate('#editor', 'keydown', function (e) {
  var keyCode = e.keyCode || e.which;

  if (keyCode == 9) {
    e.preventDefault();
    var start = this.selectionStart;
    var end = this.selectionEnd;

    // set textarea value to: text before caret + tab + text after caret
    $(this).val($(this).val().substring(0, start)
      + "   "
      + $(this).val().substring(end));

    // put caret at right position again
    this.selectionStart =
      this.selectionEnd = start + 3;
  }
});

// Make CTRL+S work as 'Save'
$(window).bind('keydown', function (event) {
  if (event.ctrlKey || event.metaKey) {
    switch (String.fromCharCode(event.which).toLowerCase()) {
      case 's':
        if (editing) {
          event.preventDefault();
          editorSave();
          break;
        }
      default:
    }
  }
});