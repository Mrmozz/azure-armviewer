# ARM Viewer
This is a simple but functional web based viewer / visualizer for Azure Resource Monitor (ARM) templates. The app is written in Node.js + Express with some jQuery & JS on the client. The app makes heavy use of the [Cytoscape.js](http://js.cytoscape.org/) library for rending the view 

### Features
- Loading from file (upload JSON template)
- Loading from remote URL
- Loading from [Azure Quickstart Templates](https://github.com/Azure/azure-quickstart-templates) on Github
- Snap to grid mode
- Exporting to PNG

### Limitations
- The app attempts to find the links (`dependsOn` relationships) between ARM resources, however due to the many subtle and complex ways these relationships can be defined, not every link is correctly picked up.
- Resources may not be shown with the correct icon. Icons for the most common resource types have been added, more are added as required. 
- A shortened resource *type* rather than the *name* is shown as the label on nodes on the graph. Resolving names for resources is an extremly complex task, due to the programatic way names are generally expressed with ARM functions and expressions. It is felt that showing names would add little value for a lot of development effort, however it may be considered in the future

# Demo Version
A runnning demo instance is deployed and usable here [http://armviewer.azurewebsites.net/](http://armviewer.azurewebsites.net/)

# Screenshot
![](https://user-images.githubusercontent.com/14982936/33526343-9bd465d6-d837-11e7-86b0-1a25ad5ffaf4.png)

# Running & Contributing
### Pre-reqs
- Node.js v6+ (v8.9 recommended)

### Running locally
Clone or download this repo then run `npm install` and then `npm start`

Express will listen on port 3000, so access the app via **http://localhost:3000/**

### Containers 
Docker build file is provided with the source, build as normal with `docker build`. Also a pre-built image is [available on Dockerhub](https://hub.docker.com/r/bencuk/armviewer/)

To run the image simply expose port 3000, e.g. `docker run -d -p 3000:3000 bencuk/armviewer`