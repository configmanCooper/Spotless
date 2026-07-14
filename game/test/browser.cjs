const fs = require('fs');
const { chromium } = require('playwright-core');

function browserExecutable() {
  const candidates = [
    process.env.CHROME_EXE,
    chromium.executablePath(),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new Error('No Chromium browser found. Set CHROME_EXE to Chrome or Edge.');
  return found;
}

function launchOptions() {
  return {
    executablePath: browserExecutable(),
    args: ['--use-gl=swiftshader', '--no-sandbox'],
  };
}

module.exports = { chromium, launchOptions };
