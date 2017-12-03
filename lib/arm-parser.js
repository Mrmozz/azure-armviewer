class ARMParser {
  constructor(templateJSON) {
    this.template = null;
    this.error = null;
    this.elements = [];
    
    // Try to parse JSON file
    try {
      this.template = JSON.parse(templateJSON);
    } catch(ex) {
      this.error = `That doesn't appear to be a JSON document! - ${ex}`;
      return;
    }

    // Some simple ARM validation
    if(!this.template.resources || !this.template.$schema) {
      this.error = `OK that might be JSON, but I don't think that's a valid ARM template!`;
      return;      
    }
        
    // first pass, fix types and assign ids with a hash function
    this.assignIds(this.template.resources, null);
    //console.log(JSON.stringify(this.template));
    //require('fs').writeFileSync('dump.json', JSON.stringify(this.template, 3))

    this.processResources(this.template.resources);
  }

  assignIds(resources, parentRes) {
    resources.forEach(res => {
      // Make all res types fully qualified, solves a lots of headaches
      if(parentRes)
        res.type = parentRes.type.toLowerCase() + '/' + res.type.toLowerCase();
      else
        res.type = res.type.toLowerCase();

      // Assign a hashed id
      res.id = this.hashCode(res.type + '_' + res.name);

      // Recurse into nested resources
      if(res.resources) {
        this.assignIds(res.resources, res)
      }
    });
  }

  processResources(resources) {
    resources.forEach(res => {
      let name = res.name; //this.parseARMExpression(res.name);
      // Maybe change this? Looks mostly OK
      //let label = res.type.replace(/^\w+\.\w+\//i, '');
      let label = res.type.replace(/^.*\//i, '');
      label = label.replace(/ses$/i, 'ss');
      label = label.replace(/ies$/i, 'y');
      label = label.replace(/s$/i, '');
      
      // Set default image, no way to catch 404 on client side :/
      let img = `/img/arm/default.png`;
      if(require('fs').existsSync(`public/img/arm/${res.type}.png`))
        img = `/img/arm/${res.type}.png`;

      // Stick resource node in resulting elements list
      this.elements.push({
        group: "nodes",
        data: {
          id: res.id,
          name: escape(name),
          img: img,
          type: res.type,
          label: label,
          location: escape(res.location)
        }
      });

      // Just some possible dependsOn formats we need to cope with!!
      // - "[concat('Microsoft.Web/serverfarms/', variables('servicePlanName'))]"
      // - "[resourceId('Microsoft.Sql/servers', variables('sqlServerName'))]"
      // - "[variables('sqlServerName')]"
      // - "myResource"
      if(res.dependsOn) {
        res.dependsOn.forEach(dep => {
          // match concat style dependsOn
          let concatMatch = /\[concat\('(.*?)',\s(.*?)\)\]/i.exec(dep);
          if(concatMatch) {
            // remove trailing slash if there
            let typepart = concatMatch[1].replace(/\/$/, "");
            let namepart = concatMatch[2];
            let depres = this.findResourceByType(typepart.toLowerCase(), `[${namepart}]`);
            if(depres) this.addLink(res, depres);
            return;
          }
          // match resourceId style dependsOn
          let resIdMatch = /\[resourceId\('(.*?)',\s*(.*?)\)\]/i.exec(dep);
          if(resIdMatch) {
            // remove trailing slash if there
            let typepart = resIdMatch[1].replace(/\/$/, "");
            let namepart = resIdMatch[2];
            let depres = this.findResourceByType(typepart.toLowerCase(), `[${namepart}]`);
            if(depres) this.addLink(res, depres);
            return;
          }
          // fallback to matching on the name part
          let depres = this.findResourceByName(dep);
          if(depres) this.addLink(res, depres);
          return;
        });
      }

      // Now recurse into nested resources
      if(res.resources) {
        this.processResources(res.resources);
      }
    })    
  }

  addLink(r1, r2) {
    this.elements.push({
      group: "edges",
      data: {
        id: `${r1.id}_${r2.id}`,
        source: r1.id,
        target: r2.id
      }      
    })
  }

  findResourceByType(type, name) {
    return this.template.resources.find(res => (res.name == name && res.type == type));
  }

  findResourceByName(name) {
    return this.template.resources.find(res => (res.name == name));
  }

  getElements() {
    return this.elements;
  }

  getError() {
    return this.error;
  }

  // Simple random ID generator, good enough, with len=6 it's a 1:56 in billion chance of a clash
  makeId(len) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < len; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  hashCode(str) {
    var hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr   = str.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };

  /*parseARMExpression(input) {
    //input = input.toLowerCase();
    let out = input;

    let varMatch = /\[variables\('(.*?)'\)\]/g.exec(input);
    if(varMatch) {
      out = this.lookupVariable(varMatch[1]);
    }
    let paramMatch = /\[parameters\('(.*?)'\)\]/g.exec(input);
    if(paramMatch) {
      out = this.lookupParameter(paramMatch[1]);
    }
    
    return out;
  }

  lookupVariable(varName) {
    let findKey = Object.keys(this.template.variables).find(key => varName == key);
    if(findKey) {
      return this.template.variables[findKey]
    } else {
      return "undefined-var";
    }
  }

  lookupParameter(paramName) {
    let findKey = Object.keys(this.template.parameters).find(key => paramName == key);
    if(findKey) {
      return this.template.parameters[findKey].defaultValue;
    } else {
      return "undefined-var";
    }
  }*/
}

module.exports = ARMParser;