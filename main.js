// depends on prompts.json only. It takes the prompts and generates the blogs. (Prompts are generated by prompt-manager.js)

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Add this function at the beginning of the file
async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  console.log(message);
  await fs.appendFile('log.txt', logMessage);
}

async function launchBrowser() {
  await log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await log("Browser launched successfully.");
  return { browser, context, page };
}

async function login(page) {
  await log("Navigating to the website...");
  await page.goto('https://apps.abacus.ai/chatllm/62d3636d8/?forceAppId=62d3636d8');
  await log("Website loaded successfully.");

  await log("Logging in...");
  await page.waitForSelector('input[placeholder=" Email"]');
  await page.fill('input[placeholder=" Email"]', 'contact.dheeraj.jha@gmail.com');
  await page.waitForSelector('input[placeholder=" Password"]');
  await page.fill('input[placeholder=" Password"]', 'Flower1!!Flower1!!');
  await page.click('button[type="submit"]');

  await log("Waiting for logged-in state...");
  await page.waitForSelector('textarea[placeholder="Write something..."]', { timeout: 8000000 });
  await log("Logged in successfully.");
}

async function loadPrompts() {
  await log("Loading prompts from JSON file...");
  const promptsJson = await fs.readFile('prompts.json', 'utf-8');
  const prompts = JSON.parse(promptsJson);
  await log(`Loaded ${prompts.length} prompts.`);
  return prompts;
}

async function enterPrompt(page, command, isFirstPrompt) {
  if (isFirstPrompt) {
    await log("Filling prompt input...");
    await page.fill('textarea[placeholder="Write something..."]', command);
  } else {
    await log("Editing existing prompt...");
    await page.evaluate(() => {
      const hiddenElement = document.querySelector('.cursor-pointer.hidden.p-1');
      if (hiddenElement) {
        hiddenElement.click();
      }
    });
    await page.fill('#text', command);
  
    await log("Clicking Regenerate button...");
    await page.click('button:has-text("Regenerate")');
  }
  
  await log(`Prompt entered and Regenerate clicked: "${command}"`);
}

async function sendPrompt(page) {
  await log("Waiting for send button to be visible and clicking it...");
  await page.waitForTimeout(500);
  await page.waitForSelector('button:has(svg.fa-paper-plane)', { visible: true, timeout: 3000000 });
  await page.waitForTimeout(500);
  await page.click('button:has(svg.fa-paper-plane)');
  await log("Send button clicked.");
}

async function waitForResponse(page, context) {
  await log("Waiting for response...");
  await page.waitForSelector('button:has(svg.fa-clipboard)', { timeout: 300000 });
  await log("Response received and copy button is visible.");

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.waitForTimeout(1000);

  await log("Clicking copy button...");
  await page.click('button:has(svg.fa-clipboard)');
  await log("Copy button clicked.");
}

async function extractClipboardText(page) {
  await log("Extracting response text from clipboard...");
  return await page.evaluate(async () => {
    try {
      return await navigator.clipboard.readText();
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      return null;
    }
  });
}

async function saveResponse(clipboardText, packageName, command) {
  if (clipboardText) {
    const filePath = path.join('packages', `${packageName}.txt`);
    await log(`Saving response to file: ${filePath}`);
    await fs.mkdir('packages', { recursive: true });
    await fs.writeFile(filePath, clipboardText);
    await log(`Response saved to file: ${filePath}`);
  } else {
    await log("Failed to extract text from clipboard.");
    const errorFilePath = path.join('packages', `error_${packageName}.txt`);
    await fs.mkdir('packages', { recursive: true });
    await fs.writeFile(errorFilePath, `Failed to extract text from clipboard for prompt: ${command}`);
  }
}

async function handleError(page, packageName, command, error) {
  await log(`Error processing response: ${error}`);
  const errorFilePath = path.join('packages', `error_${packageName}.txt`);
  await fs.mkdir('packages', { recursive: true });
  await fs.writeFile(errorFilePath, `Error processing prompt: ${command}\nError: ${error.message}`);
  const screenshotPath = path.join('screenshots', `error_screenshot_${packageName}.png`);
  await fs.mkdir('screenshots', { recursive: true });
  await page.screenshot({ path: screenshotPath });
  await log(`Error screenshot saved as '${screenshotPath}'`);
  await page.reload();
}

async function processPrompts(page, context, prompts) {
  for (let i = 0; i < prompts.length; i++) {
    const { packageName, command } = prompts[i];
    await log(`\nProcessing prompt ${i+1} of ${prompts.length}`);

    try {
      await enterPrompt(page, command, i === 0);
      await sendPrompt(page);
      await waitForResponse(page, context);
      const clipboardText = await extractClipboardText(page);
      // take screenshot
      const screenshotPath = path.join('screenshots', `screenshot_${packageName}.png`);
      await fs.mkdir('screenshots', { recursive: true });
      await page.screenshot({ path: screenshotPath });
      await saveResponse(clipboardText, packageName, command);
    } catch (error) {
      await handleError(page, packageName, command, error);
    }

    await log("Waiting before next prompt...");
  }
}

async function main() {
  let browser, context, page;
  try {
    await log("Starting main process...");
    ({ browser, context, page } = await launchBrowser());
    await login(page);
    await page.waitForTimeout(10000);
    await log("Waiting for 10 seconds completed.");
    const prompts = await loadPrompts();
    await processPrompts(page, context, prompts);
    await log("All prompts processed successfully.");
  } catch (error) {
    await log(`An error occurred: ${error}`);
    if (page) {
      const errorScreenshotPath = path.join('screenshots', 'error-screenshot.png');
      await fs.mkdir('screenshots', { recursive: true });
      await page.screenshot({ path: errorScreenshotPath });
      await log(`Error screenshot saved as '${errorScreenshotPath}'`);
      await page.reload();
    }
  } finally {
    if (browser) {
      await log("Closing browser...");
      await browser.close();
      await log("Browser closed.");
    }
  }
}

main();