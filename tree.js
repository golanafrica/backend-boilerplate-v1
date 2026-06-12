const fs = require('fs');
const path = require('path');

const EXCLUDES = ['node_modules', '.git', 'dist', '.next', 'tree.js', 'tree.txt'];

function generateTree(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    const filteredFiles = files.filter(file => !EXCLUDES.includes(file));

    filteredFiles.forEach((file, index) => {
        const filePath = path.join(dir, file);
        const isDirectory = fs.statSync(filePath).isDirectory();
        const isLast = index === filteredFiles.length - 1;
        
        const marker = isLast ? '└── ' : '├── ';
        console.log(`${prefix}${marker}${isDirectory ? '📁 ' : '📄 '}${file}`);

        if (isDirectory) {
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            generateTree(filePath, newPrefix);
        }
    });
}

console.log(`📁 ${path.basename(__dirname)}/`);
generateTree(__dirname);