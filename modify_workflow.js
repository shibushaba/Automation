const fs = require('fs');

const path = 'C:\\Users\\shibu\\OneDrive\\Desktop\\Automation-1\\Instagram Automation.json';
let data = JSON.parse(fs.readFileSync(path, 'utf8'));

// 1. Remove Simple Memory1 Node
data.nodes = data.nodes.filter(n => n.name !== 'Simple Memory1');

// 2. Remove connections involving Simple Memory1
delete data.connections['Simple Memory1'];
for (const [source, targets] of Object.entries(data.connections)) {
  for (const [type, endpoints] of Object.entries(targets)) {
    data.connections[source][type] = endpoints.map(arr => arr.filter(target => target.node !== 'Simple Memory1'));
  }
}

// 3. Create the 'Check DB' Node
const checkDbNode = {
  "parameters": {
    "operation": "search",
    "documentId": {
      "__rl": true,
      "value": "1uw8HiXeJBalLRwpkfKeaizAo6kTwem45Cqqf5yBe0n0",
      "mode": "list",
      "cachedResultName": "Automaponix-Leads",
      "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1uw8HiXeJBalLRwpkfKeaizAo6kTwem45Cqqf5yBe0n0/edit?usp=drivesdk"
    },
    "sheetName": {
      "__rl": true,
      "value": "gid=0",
      "mode": "list",
      "cachedResultName": "Sheet1",
      "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1uw8HiXeJBalLRwpkfKeaizAo6kTwem45Cqqf5yBe0n0/edit#gid=0"
    },
    "filtersUI": {
      "customFilters": [
        {
          "key": "SESSION ID",
          "value": "={{ $json.senderId }}"
        }
      ]
    },
    "options": {}
  },
  "id": "e4b2d398-db7a-4c28-98f5-ab9f237efb8e",
  "name": "Check DB",
  "type": "n8n-nodes-base.googleSheets",
  "typeVersion": 4.7,
  "position": [
    1952,
    736
  ],
  "alwaysOutputData": true, // To ensure workflow continues even if lead is not found
  "credentials": {
    "googleSheetsOAuth2Api": {
      "id": "2dvuvMpwQe7b0sGm",
      "name": "Google Sheets account"
    }
  }
};

data.nodes.push(checkDbNode);

// Create a 'Merge Memory' Code Node
// this node preserves aiInput and adds memory flag
const mergeCodeNode = {
  "parameters": {
    "jsCode": "let memoryFlag = 'No contact details shared yet.';\nif ($input.all()[0].json.NAME) {\n  memoryFlag = 'User already shared contact details earlier. Do not ask for them again. Name: ' + $input.all()[0].json.NAME;\n}\n\nreturn {\n  json: {\n    aiInput: $('Edit Fields5').item.json.aiInput,\n    senderId: $('Edit Fields5').item.json.senderId,\n    memoryContext: memoryFlag\n  }\n};\n"
  },
  "id": "c3a1e289-fc3a-4f51-a2f2-1a2b3c4d5e6f",
  "name": "Format Memory",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [
    2100,
    736
  ]
};

data.nodes.push(mergeCodeNode);

// 4. Update AI Agent2's System Message & Prompt
const agent2 = data.nodes.find(n => n.name === 'AI Agent2');
if (agent2) {
    if (agent2.parameters && agent2.parameters.options && agent2.parameters.options.systemMessage) {
        let sm = agent2.parameters.options.systemMessage;
        // Replace Session Memory block explicitly:
        const oldMemoryRegex = /Session Memory[\s\S]*?never before message 4\./;
        const newMemoryText = "Memory:\n{{ $json.memoryContext }}";
        if (oldMemoryRegex.test(sm)) {
            sm = sm.replace(oldMemoryRegex, newMemoryText);
        } else {
            // Append if not found
            sm += "\n\n" + newMemoryText;
        }
        agent2.parameters.options.systemMessage = sm;
    }
    // Update Prompt to read merged aiInput
    if (agent2.parameters) {
        agent2.parameters.text = "={{ $json.aiInput }}";
    }
    // Move agent a bit right so it doesn't overlap
    if (agent2.position) agent2.position[0] = 2300;
}

// 5. Adjust Connections
// Edit Fields5 -> Check DB -> Format Memory -> AI Agent2

// Remove Old: Edit Fields5 -> AI Agent2
if (data.connections['Edit Fields5'] && data.connections['Edit Fields5'].main && data.connections['Edit Fields5'].main[0]) {
    data.connections['Edit Fields5'].main[0] = data.connections['Edit Fields5'].main[0].filter(c => c.node !== 'AI Agent2');
    data.connections['Edit Fields5'].main[0].push({ "node": "Check DB", "type": "main", "index": 0 });
} else {
    data.connections['Edit Fields5'] = { main: [[{ "node": "Check DB", "type": "main", "index": 0 }]] };
}

data.connections['Check DB'] = {
  "main": [
    [
      { "node": "Format Memory", "type": "main", "index": 0 }
    ]
  ]
};

data.connections['Format Memory'] = {
  "main": [
    [
      { "node": "AI Agent2", "type": "main", "index": 0 }
    ]
  ]
};

// Also verify simple memory references in Groq Chat Model / others
for (const [source, targets] of Object.entries(data.connections)) {
    if (targets.ai_memory) {
        targets.ai_memory = targets.ai_memory.map(arr => arr.filter(t => t.node !== 'Simple Memory1'));
    }
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Update successful');
