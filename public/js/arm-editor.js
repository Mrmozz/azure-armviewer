// Switch to editor mode
function startEditor(rawTemplate) {
  isEditing = true;
  
  // create the editor
  var container = document.getElementById("editor");
  var options = { 
    modes:['code', 'tree'],
    onError: showError
  };

  if(!editor)
    editor = new JSONEditor(container, options);
  
  editor.setText(rawTemplate);
  $('#mainview').hide();
  $('#editor').show();
  $('#edit-tools').show();
  $('#view-tools').hide();

  if (infoShown) {
    $('#infobox').toggle("slide");
    infoShown = false;
  }
}

// Save the edits, check for errors and if OK, post the form to the server
function editorSave() {
  if (err = checkErrors()) {
    showError(err);
  } else {
    $('#editorText').val(editor.getText())
    $('#editorForm').submit();
  }
}

// Cancel the edits, switch back to viewer with original data
function editorCancel() {
  startViewer(data);
}

// Simple validation checks
function checkErrors() {
  let editorContents = editor.getText();
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

function showError(err) {
  $('#snackbar').html(err);
  $('#snackbar').addClass('show');
  setTimeout(function () { $('#snackbar').removeClass('show'); }, 3000);
}
