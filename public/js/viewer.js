// Globals
var cy;

function initCy() {
  cy = cytoscape({ 
    container: $('#mainview'),
    wheelSensitivity: 0.15,
    maxZoom: 5,
    minZoom: 0.2
  });
  //cy.snapToGrid({gridSpacing: 200, lineWidth: 3, drawGrid: true});
}

function loadData(elements) {
  cy.add(elements);
  resize();
}

function resize() {
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
    'text-margin-y': '10vh'
  });

  cy.style().selector('edge').style({
    'target-arrow-shape': 'triangle',
    'curve-style': 'bezier',
    'width': 6,
  }).update();

  cy.resize();
  cy.layout({name: 'breadthfirst'}).run();
  //cy.snapToGrid({gridSpacing: 200, lineWidth: 3, drawGrid: true});
}