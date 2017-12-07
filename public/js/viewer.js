// Globals
var cy;
var settingSnap = false;

function initCy() {
  $('#infobox').hide();

  cy = cytoscape({ 
    container: $('#mainview'),
    wheelSensitivity: 0.15,
    maxZoom: 5,
    minZoom: 0.2,
    selectionType: 'single'
  });

  // Handle selection events
  cy.on('select', evt => {
    // Only work with nodes
    if(!evt.target.isEdge()) {

      // Force selection of single nodes only
      if(cy.$('node:selected').length > 1)
        cy.$('node:selected')[0].unselect();

      // The rest of this is just pull info from the node's data and showing it in a HTML div & table
      $('#infobox .panel-body').show();
      $('#infobox').fadeIn(200);
      $('#infoimg').attr('src', evt.target.data('img'));
      $('#infotype').text(evt.target.data('type'));
      $('#infoname').text(unescape(evt.target.data('name')));
      if(evt.target.data('location') != 'undefined') 
        $('#infoloc').text(unescape(evt.target.data('location'))).parent().show();
      else
        $('#infoloc').parent().hide();

      if(evt.target.data('kind')) 
        $('#infokind').text(evt.target.data('kind')).parent().show();
      else
        $('#infokind').parent().hide();       

      if(evt.target.data('vminfo')) {
        let vmInfoHtml = $('<div></div>');
        Object.keys(evt.target.data('vminfo')).forEach(k => {
          vmInfoHtml.append(`<b>${k}:</b> ${evt.target.data('vminfo')[k]}<br/>`)
        });
        $('#infovm').html(vmInfoHtml).parent().show();
      } else
        $('#infovm').parent().hide();            
    }
  })

  cy.on('unselect', evt => {
    if(cy.$('node:selected').length <= 0)
      $('#infobox').fadeOut(200);
  })
}

function loadData(elements) {
  cy.add(elements);
  reLayout();
}

function reLayout() {
  cy.style().selector('node').style({
    'background-color': '#FFFFFF',
    'background-opacity': 1,
    'label': 'data(label)',
    'background-image': 'data(img)',
    'background-width': '90%',
    'background-height': '90%',
    'shape': 'roundrectangle',
    'width': '128',
    'height': '128',
    'border-width': '0',
    'font-family': '"Segoe UI", Arial, Helvetica, sans-serif',
    'font-size': '15vh',
    'color': '#444444',
    'text-valign': 'bottom',
    'text-margin-y': '10vh',
    'font-size': '20%'
  });
  cy.style().selector('node:selected').style({
    'border-width': '4',
    'border-color': 'rgb(0,120,215)'
  });

  cy.style().selector('edge').style({
    'target-arrow-shape': 'triangle',
    'curve-style': 'bezier',
    'width': 6,
  }).update();

  cy.snapToGrid({gridSpacing: 200, lineWidth: 3, drawGrid: true});
  if(settingSnap)
    cy.snapToGrid('snapOn');
  else  
    cy.snapToGrid('snapOff');

  cy.resize();
  cy.layout({name: 'breadthfirst'}).run();
  cy.fit();
}

function savePNG() {
  let pngBlob = cy.png({output: 'blob', bg: '#FFFFFF'})
  saveAs(pngBlob, "arm-template.png");
}

function toggleSnap() {
  settingSnap = !settingSnap; 
  if(settingSnap) {
    cy.snapToGrid('snapOn');
    cy.fit();
    $('#snapBut').removeClass('btn-primary')
    $('#snapBut').addClass('pressed')    
  } else {  
    cy.snapToGrid('snapOff');
    $('#snapBut').removeClass('pressed')
    $('#snapBut').addClass('btn-primary')    
  }  
}

function toggleInfo() {
  $('#infobox .panel-body').toggle();
}