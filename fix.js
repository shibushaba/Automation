const fs = require('fs');
const path = 'C:\\\\Users\\\\shibu\\\\OneDrive\\\\Desktop\\\\Automation-1\\\\Instagram Automation.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const formatMemoryNode = data.nodes.find(n => n.name === 'Format Memory');
if (formatMemoryNode) {
    formatMemoryNode.parameters.jsCode = `
let memoryFlag = 'No contact details shared yet.';

const inputData = $input.all();
if (inputData.length > 0 && inputData[0].json && inputData[0].json.NAME) {
  memoryFlag = 'User already shared contact details earlier. Do not ask for them again. Name: ' + inputData[0].json.NAME;
}

return {
  json: {
    aiInput: $('Edit Fields5').first().json.aiInput,
    senderId: $('Edit Fields5').first().json.senderId,
    memoryContext: memoryFlag
  }
};
`.trim();
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Fixed Format Memory code node');
