const fs = require('fs');
const path = require('path');

function getAllFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules')) {
        results = results.concat(getAllFiles(file, ext));
      }
    } else {
      if (file.endsWith(ext) && !file.endsWith('check.js')) results.push(file);
    }
  });
  return results;
}

const files = getAllFiles(__dirname, '.js');
let errors = 0;

for (const file of files) {
  try {
    require(file);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' || err instanceof ReferenceError || err instanceof TypeError || err instanceof SyntaxError) {
      console.error(`Error in ${file}:`);
      console.error(err);
      errors++;
    }
  }
}

if (errors > 0) {
  console.log(`Found ${errors} files with errors.`);
  process.exit(1);
} else {
  console.log('All files required successfully without missing modules or reference errors at top level.');
}
