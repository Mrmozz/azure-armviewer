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
![](https://user-images.githubusercontent.com/14982936/33782004-bc29946c-dc4e-11e7-97e5-6c1ea56928d6.png)

# Limitations & Known Issues 
- The app attempts to find the links (`dependsOn` relationships) between ARM resources, however due to the many subtle and complex ways these relationships can be defined & expressed, certain links may not be picked up & displayed.
- Icons for the most commonly used & popular resource types have been added, however not every resource is covered. The default ARM cube icon will be shown as a fallback. More icons are being added during development as missing icons are found. 
- Resolving names & other properties for resources is attempted, but due to programmatic way these are generally defined with ARM functions and expressions, full name resolution is not always possible
- Templates using the loop functions `copy` & `copyIndex` to create multiple resources will not be rendered correctly due to limitations on evaluating the dynamic iterative state of the template    

# Running & Contributing
### Pre-reqs
- Node.js v6+ (v8.9 recommended)

### Running locally
Clone or download this repo then run `npm install` and then `npm start`

Express will listen on port 3000 (or what the `PORT` env var is set to), so access the app via **http://localhost:3000/**

### Containers 
Docker build file is provided with the source, build as normal with `docker build`. Also a pre-built image is [available on Dockerhub](https://hub.docker.com/r/bencuk/armviewer/)

To run the image simply expose port 3000, e.g. `docker run -d -p 3000:3000 bencuk/armviewer`