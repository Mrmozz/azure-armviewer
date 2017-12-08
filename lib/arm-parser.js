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
    this.firstPass(this.template.resources, null);
    
    // 2nd pass, work on resources
    this.processResources(this.template.resources);
  }

  firstPass(resources, parentRes) {
    resources.forEach(res => {

      // Resolve and eval resource names if they are expressions
      let match = res.name.match(/^\[(.*)\]$/);
      if(match) {
        res.name = this.evalExpression(match[1]);
      } 
      // Resolve and eval resource locations if they are expressions
      if(res.location){
        match = res.location.match(/^\[(.*)\]$/);
        if(match) {
          res.location = this.evalExpression(match[1]);
        } 
      }

      // Make all res types fully qualified, solves a lots of headaches
      if(parentRes)
        res.type = parentRes.type.toLowerCase() + '/' + res.type.toLowerCase();
      else
        res.type = res.type.toLowerCase();

      // Assign a hashed id & full qualified name
      res.id = this.hashCode(res.type + '_' + res.name);
      res.fqn = res.type + '/' + res.name;
      
      // Recurse into nested resources
      if(res.resources) {
        this.firstPass(res.resources, res)
      }
    });
  }

  processResources(resources) {
    resources.forEach(res => {
      let name = res.name;

      // Maybe change this? Looks mostly OK
      let label = res.type.replace(/^.*\//i, '');

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

      // Try and grab some of the VM info
      let vminfo = null;
      if(res.type == 'microsoft.compute/virtualmachines') {
        vminfo = {};
        try {
          if(res.properties.osProfile.linuxConfiguration) {
            vminfo.os = 'Linux'          
          } 
          if(res.properties.osProfile.windowsConfiguration) {
            vminfo.os = 'Windows'          
          }  
          if(res.properties.osProfile.computerName) {
            vminfo.hostname = escape( this.evalExpression(res.properties.osProfile.computerName) );
          }                              
          if(res.properties.osProfile.adminUsername) {
            vminfo.user = escape( this.evalExpression(res.properties.osProfile.adminUsername) ); 
          }
          if(res.properties.hardwareProfile.vmSize) {
            vminfo.size = escape( this.evalExpression(res.properties.hardwareProfile.vmSize) ); 
          } 
          if(res.properties.storageProfile.imageReference) {
            vminfo.image = "";
            if(res.properties.storageProfile.imageReference.publisher) {vminfo.image += this.evalExpression(res.properties.storageProfile.imageReference.publisher);} 
            if(res.properties.storageProfile.imageReference.offer) {vminfo.image += '/'+this.evalExpression(res.properties.storageProfile.imageReference.offer);} 
            if(res.properties.storageProfile.imageReference.sku) {vminfo.image += '/'+this.evalExpression(res.properties.storageProfile.imageReference.sku);} 
          }                     
        } catch (ex) {
          console.log('ERROR! Error parsing VM resource: ', res.name);
        }
      }      

      // Stick resource node in resulting elements list
      this.elements.push({
        group: "nodes",
        data: {
          id: res.id,
          name: escape(res.name),
          img: img,
          kind: res.kind ? res.kind : '',
          type: res.type,
          label: label,
          location: escape(res.location),
          vminfo: vminfo ? vminfo : ''
        }
      });

      if(res.dependsOn) {
        res.dependsOn.forEach(dep => {
          
          let match = dep.match(/^\[(.*)\]$/);
          if(match) {
            dep = this.evalExpression(match[1]);
          }  

          // Find resource by eval'ed dependsOn string
          let depres = this.findResource(dep);
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
    //console.log(`~~~ eval exp|${exp}|`);
    exp = exp.trim();

    // catch special cases, with referenced properties
    let match = exp.match(/(\w+)\((.*)\)\.(.*)/);
    if(match) {
      let funcName = match[1].toLowerCase();
      let funcParams = match[2];
      let funcProps = match[3].toLowerCase();
      if(funcName == 'resourcegroup' && funcProps == 'id') return 'res-group-id'; 
      if(funcName == 'resourcegroup' && funcProps == 'location') return 'res-group-loc'; 
      if(funcName == 'subscription' && funcProps == 'subscriptionid') return 'subscription-id'; 
      if(funcName == 'deployment' && funcProps == 'name') return 'deployment-name'; 
    }
    
    // it's a function!
    match = exp.match(/(\w+)\((.*)\)/);
    if(match) {
      let funcName = match[1].toLowerCase();
      let funcParams = match[2];
      //console.log(`~~~ function: *${funcName}* |${funcParams}|`);
      
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
        // This is a small cop out, but we can't know the value of parameters until deployment!
        return `{{${this.evalExpression(funcParams)}}}`;
      }  
      if(funcName == 'replace') {
        return this.funcReplace(funcParams);
      }         
      if(funcName == 'resourceid') {
        let resid = this.funcResourceid(funcParams);
        // clean up
        resid = resid.replace(/^\//, '');
        resid = resid.replace(/\/\//, '/');
        return resid;
      }            
    }

    // it's a string literal
    match = exp.match(/^\'(.*)\'$/);
    if(match) {
      return match[1];
    }

    // it's a number literal
    match = exp.match(/^(\d+)/);
    if(match) {
      return match[1].toString();
    }

    return exp;
  }

  findResource(id) {
    return this.template.resources.find(res => {
      // Simple match on substring is possible after 
      // fully resolving names & types
      return res.fqn.toLowerCase().includes(id.toLowerCase());
    });
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
    let findKey = Object.keys(this.template.variables).find(key => varName == key);
    if(findKey) {
      let val = this.template.variables[findKey];

      // Variables can be JSON objects, give up at this point
      if(typeof(val) != 'string') return "variable-obj";

      // variable values can be expressions too, so down the rabbit hole we go...
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
    let out = this.hashCode(baseStr);
    out = Buffer(`${out}`).toString('base64');
    return out;
  }
  
  funcConcat(funcParams) {
    let paramList = this.parseParams(funcParams);

    var res = "";
    for(var p in paramList) {
      let param = paramList[p];
      param = param.trim();
      res += this.evalExpression(param)
    }
    return res;
  }

  funcResourceid(funcParams) {
    let paramList = this.parseParams(funcParams);
    var res = "";
    for(var p in paramList) {
      let param = paramList[p];
      param = param.trim();
      res += '/' + this.evalExpression(param)
    }
    return res;
  }  

  funcReplace(funcParams) {
    let paramList = this.parseParams(funcParams);
    var input = this.evalExpression(paramList[0]);
    var search = this.evalExpression(paramList[1]);
    var replace = this.evalExpression(paramList[2]);
    
    return input.replace(search, replace);
  }  

  // Parsing non-nested commas in a param list is IMPOSSIBLE WITH A REGEX
  // This is a brute force parser for comma separated param lists
  parseParams(params) {
    var depth = 0;
    var parts = [];
    var lastSplit = 0;
    for(var i in params) {
      let c = params[i];
      if(c === '(') depth++;
      if(c === ')') depth--;

      let endOfString = i == params.length-1;
      if((c === ',' && depth == 0) || endOfString) {
        let endPoint = endOfString ? params.length : i;
        parts.push(params.substring(lastSplit, endPoint).trim())
        lastSplit = parseInt(i) + 1;
      }
    }
    return parts;
  }
}

module.exports = ARMParser;
