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
    
    // 2nd pass, work on resources
    this.processResources(this.template.resources);
  }

  assignIds(resources, parentRes) {
    resources.forEach(res => {
      let match = res.name.match(/^\[(.*)\]$/);
      if(match) {
        res.nameEval = this.evalExpression(match[1]);
      } else {
        res.nameEval = res.name;
      }
      console.log("####### nameEval ", res.nameEval);

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
      // - TODO: Improve plural removal, it's so hacky
      let label = res.type.replace(/^.*\//i, '');
      label = label.replace(/ses$/i, 'ss');
      label = label.replace(/ies$/i, 'y');
      label = label.replace(/s$/i, '');
      label = label.replace(/databas$/i, 'database');
      
      // Set default image, no way to catch 404 on client side :/
      let img = `/img/arm/default.png`;
      if(require('fs').existsSync(`public/img/arm/${res.type}.png`))
        img = `/img/arm/${res.type}.png`;
      
      // App Service sites & plans can have different icons depending on 'kind'
      if(res.type.includes('microsoft.web') && res.kind) {
        if(res.kind.toLowerCase() == 'apiapp') img = `/img/arm/microsoft.web/apiapp.png`;
        if(res.kind.toLowerCase() == 'mobileapp') img = `/img/arm/microsoft.web/mobileapp.png`;
        if(res.kind.toLowerCase() == 'functionapp') img = `/img/arm/microsoft.web/functionapp.png`;
        if(res.kind.toLowerCase() == 'linux') img = `/img/arm/microsoft.web/serverfarmslinux.png`;
      }

      // Stick resource node in resulting elements list
      this.elements.push({
        group: "nodes",
        data: {
          id: res.id,
          name: escape(res.nameEval),
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
          let concatMatch = /\[concat\('(.*?)',\s*(.*?)\)\]/i.exec(dep);
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

  evalExpression(exp) {
    console.log(`~~~ BEGIN EVAL ON |${exp}|`);
    exp = exp.trim();

    // catch special cases, with referenced properties
    let match = exp.match(/(\w+)\((.*)\)\.(.*)/);
    if(match) {
      let funcName = match[1].toLowerCase();
      let funcParams = match[2];
      let funcProps = match[3].toLowerCase();
      if(funcName == 'resourcegroup' && funcProps == 'id') return 'res-group-id'; 
      if(funcName == 'subscription' && funcProps == 'subscriptionid') return 'subscription-id'; 
      if(funcName == 'deployment' && funcProps == 'name') return 'deployment-name'; 
    }
    
    // it's a function!
    match = exp.match(/(\w+)\((.*)\)/);
    if(match) {
      let funcName = match[1].toLowerCase();
      let funcParams = match[2];
      console.log(`~~~ function: *${funcName}* |${funcParams}|`);
      
      if(funcName == 'variables') {
        return this.funcVariables(this.evalExpression(funcParams));
      }
      if(funcName == 'uniquestring') {
        return this.funcUniquestring(this.evalExpression(funcParams));
      }   
      if(funcName == 'concat') {
        return this.funcConcat(funcParams);
      }
      if(funcName == 'parameters') {
        // This is a small cop out, but we can't know the value of parameters in a template!
        return `{{${this.evalExpression(funcParams)}}}`;
      }               
    }

    // it's a string literal
    match = exp.match(/^\'(.*)\'$/);
    if(match) {
      console.log(`~~~ returning! str |${match[1]}|`);
      return match[1];
    }

    // it's a number literal
    match = exp.match(/^(\d+)/);
    if(match) {
      console.log(`~~~ returning! int |${match[1]}|`);
      return match[1].toString();
    }

    return exp;
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
  
  funcVariables(varName) {
    console.log('~~~ lookingVar', varName);
    let findKey = Object.keys(this.template.variables).find(key => varName == key);
    if(findKey) {
      let val = this.template.variables[findKey];
      console.log(`~~~ foundVar ${varName}=${val}`);
      let match = val.match(/^\[(.*)\]$/);
      if(match) {
        return this.evalExpression(match[1]);
      }
      return val;
    } else {
      return "undefined-var";
    }
  }

  funcUniquestring(baseStr) {
    let o = this.hashCode(baseStr);
    o = Buffer(`${o}`).toString('base64');
    console.log(`~~~ funcUniquestring i:${baseStr} o:${o}`);
    return o;
  }
  
  funcConcat(funcParams) {
    console.log(`~~~ funcConcat ${funcParams}`);
    let paramList = funcParams.split(',');
    var res = "";
    for(var p in paramList) {
      let param = paramList[p];
      param = param.trim();
      res += this.evalExpression(param)
    }
    console.log(`~~~ concatRes |${res}|`);
    return res;
  }

  /*
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