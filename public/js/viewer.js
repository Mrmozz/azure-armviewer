// Globals
var cy;
var settingSnap = false;

function initCy() {
  cy = cytoscape({ 
    container: $('#mainview'),
    wheelSensitivity: 0.15,
    maxZoom: 5,
    minZoom: 0.2
  });
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
    'shape': 'rectangle',
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
    $('#snapBut').addClass('btn-info')    
  } else {  
    cy.snapToGrid('snapOff');
    $('#snapBut').removeClass('btn-info')
    $('#snapBut').addClass('btn-primary')    
  }  
}