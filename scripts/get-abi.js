const fs = require('fs');

const artifact = require('../artifacts/contracts/Token.sol/Token.json');

console.log("=== CONTRACT ABI ===");
console.log(JSON.stringify(artifact.abi, null, 2));

fs.writeFileSync('MyToken-ABI.json', JSON.stringify(artifact.abi, null, 2));
console.log("\n ABI saved to MyToken-ABI.json");