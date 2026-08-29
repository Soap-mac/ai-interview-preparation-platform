function buildFinalCode(driver, code, language) {
    if (language === "javascript") {
        const safeDriver = driver.replace(/split\(\/s\+\/\)/g, "split(/\\s+/)");
        let finalCode = safeDriver.replace(`// Write your code here`, code);
        finalCode = finalCode.replace(
            /const (\w+) = tokens\.slice\((\d+|\w+(?:[+\-]\d+)?)\)\.map\(Number\);/g,
            `const $1 = tokens.slice($2).join(' ');`
        );
        return finalCode;
    }

    if (language === "python") {
        return `${code}\n\n${driver}`;
    }

    if (language === "java") {
        if (!driver.includes("// Write your code here")) {
            throw new Error("Java driver code missing placeholder");
        }
        return driver.replace("// Write your code here", code);
    }

    if (language === "cpp") {
        if (!driver.includes("// Write your code here")) {
            throw new Error("C++ driver code missing placeholder");
        }
        return driver.replace("// Write your code here", code);
    }

    throw new Error("Unsupported language");
}

module.exports = buildFinalCode;