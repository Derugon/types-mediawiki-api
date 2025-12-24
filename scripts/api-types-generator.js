// Paste this into the browser console
// and copy the console log output

function processParamInfo(prefix, param) {
    let type = param.type;
    if (Array.isArray(type)) {
        type = type.map((e) => `'${e}'`).join(" | ");
        if (param.multi) {
            // can be single item or array of items
            type = `OneOrMore<${type}>`;
        }
    } else {
        // API uses type=text for long string fields
        if (type === "text" || type === "title" || type === "user" || type === "raw") {
            type = "string";
        } else if (type === "integer") {
            type = "number";
        }
        if (param.multi) {
            type = `${type} | ${type}[]`;
        }
    }

    // Avoid being over-specific
    if (
        param.name === "tags" ||
        param.name === "tagfilter" || // edit tags, used in core
        param.name === "wikis" || // used by Extension:Echo APIs
        param.name === "site" // gusite used by ApiQueryGlobalUsage
    ) {
        type = "string | string[]";
    }

    let name = prefix + param.name;
    if (name.includes("-")) {
        name = `"${name}"`;
    }

    return `${name}?: ${type};`;
}

function getInterfaceName(module) {
    return module.classname
        .replace(/\\/g, "")
        .replace(/^(?:MediaWiki|Extensions?)+/, "")
        .replace(/ApiApi/g, "Api");
}

function processModuleInfo(parent, module) {
    return [
        `export interface ${getInterfaceName(module)}Params extends ${parent} {`,
        ...module.parameters.map((param) =>
            processParamInfo(module.prefix, param).replace(/^/gm, "\t"),
        ),
        "}",
    ].join("\n");
}

const actionData = await new mw.Api().get({
    action: "paraminfo",
    format: "json",
    uselang: "en",
    helpformat: "html",
    modules: "*",
    formatversion: "2",
});

const queryData = await new mw.Api().get({
    action: "paraminfo",
    format: "json",
    uselang: "en",
    helpformat: "html",
    modules: "query+*",
    formatversion: "2",
});

const actionTypes = actionData.paraminfo.modules.map((module) => processModuleInfo("ApiParams", module));

const queryTypes = queryData.paraminfo.modules.map((module) =>
    processModuleInfo("ApiQueryParams", module),
);

console.log([...actionTypes, ...queryTypes].join("\n\n"));
