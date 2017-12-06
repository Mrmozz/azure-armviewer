# ARM Viewer
This is a simple but functional web based viewer / visualizer for Azure Resource Monitor (ARM) templates. The app is written in Node.js + Express with some jQuery & JS on the client. The app makes heavy use of the [Cytoscape.js](http://js.cytoscape.org/) library for rending the view 

### Features
- Loading from file (upload JSON template)
- Loading from remote URL
- Loading from [Azure Quickstart Templates](https://github.com/Azure/azure-quickstart-templates) on Github
- Snap to grid mode
- Clicking on a resource will display info for that resource in a breakout info box
- Exporting to PNG

# Demo Version
A runnning demo instance is deployed and usable here [http://armviewer.azurewebsites.net/](http://armviewer.azurewebsites.net/)

# Screenshot
![](https://user-images.githubusercontent.com/14982936/33665812-04b02a18-da90-11e7-8f87-6a31bdf68363.png)

# Limitations & Known Issues 
- The app attempts to find the links (`dependsOn` relationships) between ARM resources, however due to the many subtle and complex ways these relationships can be defined & expressed, certain links may not be picked up & displayed.
- Resources may not be shown with the correct icon. Icons for the most commonly used resource types have been added, more icons are being added during development. 
- A shortened resource *type* rather than the *name* is shown as the label on nodes on the graph, this makes for much more readable diagrams 
- Resolving names for resources is attempted, but due to programmatic way names are generally expressed with ARM functions and expressions, full name resolution is not always possible
- Templates using the loop functions `copy` & `copyIndex` to create multiple resources will not be rendered correctly due to limitations on evaluating the dynamic iterative state of the template    

# Running & Contributing
### Pre-reqs
- Node.js v6+ (v8.9 recommended)

### Running locally
Clone or download this repo then run `npm install` and then `npm start`

Express will listen on port 3000, so access the app via **http://localhost:3000/**

### Containers 
Docker build file is provided with the source, build as normal with `docker build`. Also a pre-built image is [available on Dockerhub](https://hub.docker.com/r/bencuk/armviewer/)

To run the image simply expose port 3000, e.g. `docker run -d -p 3000:3000 bencuk/armviewer`