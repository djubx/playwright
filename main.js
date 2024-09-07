const { chromium } = require('playwright');
const fs = require('fs').promises;

async function launchBrowser() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  return { browser, context, page };
}

async function login(page) {
  console.log("Navigating to the website...");
  await page.goto('https://apps.abacus.ai/chatllm/62d3636d8/?forceAppId=62d3636d8');
  console.log("Website loaded successfully.");

  console.log("Logging in...");
  await page.waitForSelector('input[placeholder=" Email"]');
  await page.fill('input[placeholder=" Email"]', 'contact.dheeraj.jha@gmail.com');
  await page.waitForSelector('input[placeholder=" Password"]');
  await page.fill('input[placeholder=" Password"]', 'Flower1!!Flower1!!');
  await page.click('button[type="submit"]');

  console.log("Waiting for logged-in state...");
  await page.waitForSelector('textarea[placeholder="Write something..."]', { timeout: 8000000 });
  console.log("Logged in successfully.");
}

async function loadPrompts() {
  console.log("Loading prompts from JSON file...");
  const promptsJson = await fs.readFile('prompts.json', 'utf-8');
  const prompts = JSON.parse(promptsJson);
  console.log(`Loaded ${prompts.length} prompts.`);
  return prompts;
}

async function enterPrompt(page, command, isFirstPrompt) {
  if (isFirstPrompt) {
    console.log("Filling prompt input...");
    await page.fill('textarea[placeholder="Write something..."]', command);
  } else {
    console.log("Editing existing prompt...");
    await page.evaluate(() => {
      const hiddenElement = document.querySelector('.cursor-pointer.hidden.p-1');
      if (hiddenElement) {
        hiddenElement.click();
      }
    });
    await page.fill('#text', command);
  
    console.log("Clicking Regenerate button...");
    await page.click('button:has-text("Regenerate")');
  
    // await page.waitForTimeout(2000); // Wait for 2 seconds
  }
  
  console.log(`Prompt entered and Regenerate clicked: "${command}"`);
}

async function sendPrompt(page) {
  console.log("Waiting for send button to be visible and clicking it...");
  await page.waitForSelector('button:has(svg.fa-paper-plane)', { visible: true, timeout: 30000 });
  await page.click('button:has(svg.fa-paper-plane)');
  console.log("Send button clicked.");
}

async function waitForResponse(page, context) {
  console.log("Waiting for response...");
  await page.waitForSelector('button:has(svg.fa-clipboard)', { timeout: 300000 });
  console.log("Response received and copy button is visible.");

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.waitForTimeout(1000);

  console.log("Clicking copy button...");
  await page.click('button:has(svg.fa-clipboard)');
  console.log("Copy button clicked.");
}

async function extractClipboardText(page) {
  console.log("Extracting response text from clipboard...");
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
    console.log(`Saving response to file: ${packageName}.txt`);
    await fs.writeFile(`${packageName}.txt`, clipboardText);
    console.log(`Response saved to file: ${packageName}.txt`);
  } else {
    console.log("Failed to extract text from clipboard.");
    await fs.writeFile(`error_${packageName}.txt`, `Failed to extract text from clipboard for prompt: ${command}`);
  }
}

async function handleError(page, packageName, command, error) {
  console.error(`Error processing response:`, error);
  await fs.writeFile(`error_${packageName}.txt`, `Error processing prompt: ${command}\nError: ${error.message}`);
  await page.screenshot({ path: `error_screenshot_${packageName}.png` });
  console.log(`Error screenshot saved as 'error_screenshot_${packageName}.png'`);
}

async function processPrompts(page, context, prompts) {
  for (let i = 0; i < prompts.length; i++) {
    const { packageName, command } = prompts[i];
    console.log(`\nProcessing prompt ${i+1} of ${prompts.length}`);

    try {
      await enterPrompt(page, command, i === 0);
      await sendPrompt(page);
      await waitForResponse(page, context);
      const clipboardText = await extractClipboardText(page);
      await saveResponse(clipboardText, packageName, command);
    } catch (error) {
      await handleError(page, packageName, command, error);
    }

    console.log("Waiting before next prompt...");
  }
}

async function main() {
  let browser, context, page;
  try {
    ({ browser, context, page } = await launchBrowser());
    await login(page);
    const prompts = await loadPrompts();
    await processPrompts(page, context, prompts);
    console.log("\nAll prompts processed successfully.");
  } catch (error) {
    console.error('An error occurred:', error);
    if (page) {
      await page.screenshot({ path: 'error-screenshot.png' });
      console.log("Error screenshot saved as 'error-screenshot.png'");
    }
  } finally {
    if (browser) {
      console.log("Closing browser...");
      await browser.close();
      console.log("Browser closed.");
    }
  }
}

main();
