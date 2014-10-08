// Author: technetlk@gmail.com (https://github.com/technet/brackets.coffeescriptcompiler, http://tutewall.com)

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";
   
    var CF_DOMAIN_NAME  = "technet.csdomain",
        DOMAIN_PATH     = "node/cfdomain",
        CF_VERSION      = "getVersion",
        CF_COMPILE      = "compile",
        CFCOPTION_FILE  = "cfcoptions.json";
    
    var ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        FileUtils       = brackets.getModule("file/FileUtils"),
        FileSystem      = brackets.getModule("filesystem/FileSystem"),
        AppInit         = brackets.getModule("utils/AppInit"),
        NodeDomain      = brackets.getModule("utils/NodeDomain");
    
    var cfDomain        = new NodeDomain(CF_DOMAIN_NAME, ExtensionUtils.getModulePath(module, DOMAIN_PATH));
    

    var REGX_CSOPTIONS_TAG  = /cfcoptions/i,
        REGX_CSOPTIONS      = /\{.*\}/;

    var cfcOptionFiles      = {};       // This will keep cfcoptions.json path stored instead of realoading each time,
                                        // and of the modification is done to this file it will be automatically loaded.


    function writeJSFile(fileData) {

        var destFile = FileSystem.getFileForPath(fileData.destFilePath);
        FileUtils.writeText(destFile, fileData.jsCode, true);
        // Possible Issue: https://github.com/adobe/brackets/issues/8115
    }

    function compile(fileData) {
        cfDomain.exec(CF_COMPILE, fileData.csCode, fileData.compileOptions)
            .done(function (jsCode) {
                fileData.jsCode = jsCode;
                writeJSFile(fileData);
            })
            .fail(function (error) {
                fileData.jsCode = error;
                writeJSFile(fileData);
            });
    }

    function setDefaultOptions(fileData) {

    }

    function setOptions(optionObject, fileData) {

        if (optionObject.out) {

            var trimmedOut = optionObject.out.trim();
            if (trimmedOut.length > 0) {
                fileData.destFilePath = fileData.sourceFolder + ((/\.js$/i).test(trimmedOut) ? trimmedOut : (((/\/$/).test(trimmedOut) ? trimmedOut :  trimmedOut + "/") + FileUtils.getFilenameWithoutExtension(fileData.fileName) + ".js"));
            }
        }
    }

    function getOptionsFromText(fileData, document) {

        var i       = 0,
            found   = false,
            eof     = false;
        var lineData;
        var optionString;

        while (!found && !eof) {

            lineData = document.getLine(i++);
            if (lineData !== undefined) {

                var trimmed = lineData.trim();
                if (trimmed.length > 0 && trimmed.charAt(0) === '#' && REGX_CSOPTIONS_TAG.test(trimmed)) {

                    optionString = REGX_CSOPTIONS.exec(trimmed);
                    found = true;
                } else if (trimmed.length > 0) {
                    eof = true;     // Don't check beyond first non empty line to figure out compile options
                }
            } else {
                eof = true;
            }
        }

        if (found && optionString) {
            try {

                var optionObject = JSON.parse(optionString);
                setOptions(optionObject, fileData);

                return true;        // found options from the file itself

            } catch (ex) {
            }
        }

        return false;   // Didn't find any options in the file.
    }

    function getOptionsFromFile(fileData) {

        var optionFile = fileData.sourceFolder + CFCOPTION_FILE;
        // Try accessing the file
        try {
            if (FileSystem.getFileForPath(optionFile).exists()) {
                var optionsData = FileUtils.readAsText(optionFile);
                if (optionsData !== undefined && optionsData !== null) {
                    optionsData = optionsData.trim();
                    var optionObject = JSON.parse(optionsData);
                    setOptions(optionObject, fileData);
                }
            }
        } catch (ex) {
            // No file or some other error
        }
    }

    function compileAndSave(document) {

        var text = document.getText();

        var fileData = {};
        fileData.compileOptions = {};
        fileData.csCode = text;
        fileData.sourcefilePath = document.file.fullPath;
        fileData.sourceFolder = FileUtils.getDirectoryPath(fileData.sourcefilePath);
        fileData.destFilePath = FileUtils.getFilenameWithoutExtension(fileData.sourcefilePath) + ".js";
        fileData.fileName = FileUtils.getBaseName(fileData.sourcefilePath);

        if (!getOptionsFromText(fileData, document)) {   // We found options from the file so give it priority, else try to find option file
            getOptionsFromFile(fileData);
        }

        compile(fileData);
    }

    function onDocumentSavedEventHandler(event, document) {

        var documentFile = document.file;
        var filePath = documentFile.fullPath;
        if (FileUtils.getFileExtension(filePath).toLowerCase() === "coffee") {
            // We have found coffeescript file, it's time to compile...
            compileAndSave(document);
        }
    }

    AppInit.appReady(function () {

        $(DocumentManager).on('documentSaved', onDocumentSavedEventHandler);

    });

    
});
