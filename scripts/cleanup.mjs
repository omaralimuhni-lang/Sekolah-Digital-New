import { execSync } from 'child_process';
import fs from 'fs';

console.log('🧹 Starting cleanup check in view components...');

try {
  // Run TypeScript compiler to find unused variables, locals, etc.
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ No orphan imports or unused state variables found by TypeScript.');
} catch (error) {
  const output = error.stdout?.toString() || '';
  const lines = output.split('\n').filter(Boolean);
  
  const viewIssues = lines.filter(line => line.includes('src/views/'));

  if (viewIssues.length > 0) {
    console.log(`\n⚠️ Found ${viewIssues.length} issues in view components:\n`);
    viewIssues.forEach(issue => console.log(issue));
    console.log('\n💡 Please manually remove these orphan imports and unused variables before deployment.');
    process.exit(1);
  } else {
    console.log('✅ Codebase view components are clean!');
  }
}
