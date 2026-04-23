const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'controllers');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes("require('./asyncHandler')")) {
    content = content.replace(/require\('\.\/asyncHandler'\)/g, "require('../middleware/asyncHandler')");
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  }
}
let serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
serverContent = serverContent.replace("const { createClient } = require('redis');\n", "");
fs.writeFileSync(path.join(__dirname, 'server.js'), serverContent);
console.log('Fixed server.js');
