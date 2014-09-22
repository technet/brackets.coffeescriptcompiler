/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    var DOMAIN_NAME = "technet.csdomain";
    
    var cs = require("./coffee-script");
    //var path = require("path");

    /**
    * return CoffeeScript.VERSION
    */
    function getVersion() {
        
        return cs.CoffeeScript.VERSION;
    }
    
    function compile(code, options) {
        var jsCode = cs.CoffeeScript.compile(code, options);
        return jsCode;
    }


    function init(domainManager) {
        
        if (!domainManager.hasDomain(DOMAIN_NAME)) {
            domainManager.registerDomain(DOMAIN_NAME, {major: 0, minor: 1});
        }
        
        domainManager.registerCommand(
            DOMAIN_NAME,                    // Domain name
            "getVersion",                   // Function name exposed to outside
            getVersion,                     // Actual command handler (local)
            false,                           // This command is synchronous in Node
            "Returns CoffeeScript version", // Description
            null,                           // Input parameters
            [{name: "version", type: "string", description : "version number"}]
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "compile",
            compile,
            false,
            "Compile the given CoffeeScript code to JavaScript",
            [{name: "code", type: "string", description : "CoffeeScript code"}, {name: "options", type: "object", description : "Compile options"}],
            [{name: "jsCode", type: "string", description : "Compiled JavaScript code"}]
        );
    }
    
    exports.init = init;
    exports.DOMAIN_NAME = DOMAIN_NAME;
}());
