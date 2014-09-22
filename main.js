// Author: technetlk@gmail.com (https://github.com/technet/brackets.coffeescriptcompiler, http://tutewall.com)

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50, */
/*global define, brackets, $, _ */

define(function (require, exports, module) {
    "use strict";
   
    var CF_DOMAIN_NAME  = "technet.csdomain",
        DOMAIN_PATH     = "node/cfdomain",
        CF_VERSION      = "getVersion",
        CF_COMPILE      = "compile";
    
    var ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        DocumentManager = brackets.getModule('document/DocumentManager'),
        FileUtils       = brackets.getModule('file/FileUtils'),
        FileSystem      = brackets.getModule('filesystem/FileSystem'),
        AppInit         = brackets.getModule("utils/AppInit"),
        NodeDomain      = brackets.getModule("utils/NodeDomain");
    
    var cfDomain        = new NodeDomain(CF_DOMAIN_NAME, ExtensionUtils.getModulePath(module, DOMAIN_PATH));
    

    var REGX_CSOPTIONS_TAG  = /cfcoptions/i,
        REGX_CSOPTIONS      = /\{.*\}/;


    function writeJSFile(fileData) {

        var destFile = FileSystem.getFileForPath(fileData.destFilePath);
        FileUtils.writeText(destFile, fileData.jsCode);
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

            } catch (ex) {
                setDefaultOptions(fileData);
            }

        } else {
            setDefaultOptions(fileData);
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

        getOptionsFromText(fileData, document);

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
