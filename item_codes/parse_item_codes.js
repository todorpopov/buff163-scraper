const fs = require('node:fs');

function parseFile(filename){
    const fileContent = []
    try {
        const data = fs.readFileSync(filename, 'utf8');

        const splitLines = data.split('\n')
        for(let i = 0; i < splitLines.length; i++) {
            const splitLine = splitLines[i].split(';')
            fileContent.push({
                code: splitLine[0],
                item_name: splitLine[1]
            })
        }
    } catch (err) {
        console.error(err);
    }
    return fileContent
}

console.log(parseFile('codes.txt'))