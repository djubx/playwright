// just run this file to clean the packages data, usually called after prompts-manager.js has generated the prompts and main has generated the packages data

const fs = require('fs').promises;
const path = require('path');

async function getPackagesDataFromFiles() {
    const prompts = JSON.parse(await fs.readFile(path.join(__dirname, 'prompts.json'), 'utf-8'));
    const packageNames = prompts.map(prompt => prompt.packageName);
    console.log("total packages: ", packageNames.length);

    // read packages.txt
    let data = [];
    for (let packageName of packageNames) {
        // console.log("reading package: ", packageName);
        const singlePackageData = await fs.readFile(path.join(__dirname, `packages/${packageName}.txt`), 'utf-8');
        data.push(singlePackageData);
        // console.log("read package: ", packageName);
    }
    return data;
}

function extractBetweenSeparators(text, startSeparator, endSeparator) {
    // Find the start and end positions of the separators
    const startIndex = text.indexOf(startSeparator);
    const endIndex = text.indexOf(endSeparator);

    // Check if both separators exist
    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
        return ""; // Return empty string if separators are not found correctly
    }

    // Extract the text between the separators
    let extractedText = text.substring(startIndex + startSeparator.length, endIndex);

    // Trim any spaces or newlines from the start and end
    extractedText = extractedText.trim();

    return extractedText;
}

function convertToJSON(packageData, packageName) {
    let separators = [
        "<-- START_DESCRIPTION -->",
        "<-- END_DESCRIPTION -->",
        "<-- START_TUTORIAL -->",
        "<-- END_TUTORIAL -->",
        "<-- MAIN -->",
        "<-- END_MAIN -->"
    ]

    let descriptionData = "";
    let tutorialData = "";
    let mainData = "";

    descriptionData = extractBetweenSeparators(packageData, separators[0], separators[1]);
    tutorialData = extractBetweenSeparators(packageData, separators[2], separators[3]);
    mainData = extractBetweenSeparators(packageData, separators[4], separators[5]);

    let jsonData = {
        packageName: packageName,
        description: descriptionData,
        tutorial: tutorialData,
        main: mainData
    }

    return jsonData;
}

function ensureStartsWithImport(text) {
    const importKeyword = "import";
    // Find the first occurrence of "import"
    const importIndex = text.indexOf(importKeyword);
    // If "import" is found, return the text starting from "import"
    if (importIndex !== -1) {
        return text.substring(importIndex);
    }
    return text;
}

function ensureEndsWithCodeBlock(text) {
    const codeBlockEnding = "```";

    if (text.endsWith("\n```")) {
        return text;
    }
    // Check if the text already ends with a newline
    if (text.endsWith("\n")) {
        return text + codeBlockEnding;
    } else {
        return text + "\n" + codeBlockEnding;
    }
}

function verifyDataAndUpdateIfRequired(jsonData, packageName) {
    // description and tutorial should start with #
    if (!jsonData.description.startsWith("#")) {
        console.log("description does not start with # for package: ", packageName);
    }
    if (!jsonData.tutorial.startsWith("#")) {
        console.log("tutorial does not start with # for package: ", packageName);
    }
    if (!jsonData.main.startsWith("import")) {
        // console.log("main does not start with import for package: ", packageName);
        jsonData.main = ensureStartsWithImport(jsonData.main);
        jsonData.main = "```dart\n" + jsonData.main;
        jsonData.main = ensureEndsWithCodeBlock(jsonData.main);
    }
    return jsonData;
}

async function main() {
    const prompts = JSON.parse(await fs.readFile(path.join(__dirname, 'prompts.json'), 'utf-8'));
    const packageNames = prompts.map(prompt => prompt.packageName);
    const jsonConvertedDataList = await getPackagesDataFromFiles();

    let extractedDataPackages = [];
    for (let i = 0; i < jsonConvertedDataList.length; i++) {
        let jsonData = convertToJSON(jsonConvertedDataList[i], packageNames[i]);
        jsonData = verifyDataAndUpdateIfRequired(jsonData, packageNames[i]);
        extractedDataPackages.push(jsonData);
    }

    // write to file
    await fs.writeFile(path.join(__dirname, 'extractedDataPackages.json'), JSON.stringify(extractedDataPackages, null, 2), 'utf-8');
}

main();