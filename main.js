const { chromium } = require('playwright');
const fs = require('fs').promises;


(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("Navigating to the website...");
    await page.goto('https://apps.abacus.ai/chatllm/62d3636d8/?forceAppId=62d3636d8');
    console.log("Website loaded successfully.");

    console.log("Logging in...");
    await page.waitForSelector('input[placeholder=" Email"]');
    await page.fill('input[placeholder=" Email"]', 'contact.dheeraj.jha@gmail.com');
    console.log("Email entered.");

    await page.waitForSelector('input[placeholder=" Password"]');
    await page.fill('input[placeholder=" Password"]', 'Flower1!!Flower1!!');
    console.log("Password entered.");

    await page.click('button[type="submit"]');
    console.log("Login button clicked.");

    // Wait for the logged-in state
    console.log("Waiting for logged-in state...");
    await page.waitForSelector('textarea[placeholder="Write something..."]', { timeout: 8000000 });
    console.log("Logged in successfully.");

    console.log("Loading prompts from JSON file...");
    const promptsJson = await fs.readFile('prompts.json', 'utf-8');
    const prompts = JSON.parse(promptsJson);
    console.log(`Loaded ${prompts.length} prompts.`);

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      console.log(`\nProcessing prompt ${i+1} of ${prompts.length}`);

      console.log("Filling prompt input...");
      await page.fill('textarea[placeholder="Write something..."]', prompt);
      console.log(`Prompt ${i+1} entered: "${prompt}"`);

      console.log("Waiting for send button to be visible and clicking it...");
      await page.waitForFunction(() => {
        const buttonContainer = document.querySelector('div.self-end.pb-\\[10px\\].pr-\\[10px\\].flex.gap-\\[5px\\]');
        if (!buttonContainer) return false;
        const sendButton = buttonContainer.querySelector('button:has(svg.fa-paper-plane)');
        if (sendButton && sendButton.offsetParent !== null) {
          sendButton.click();
          return true;
        }
        return false;
      }, { timeout: 30000 });
      console.log("Send button clicked.");

      console.log("Waiting for response...");
      await page.waitForSelector(`div[data-testid="chat-message-${i*2+1}"]`);
      console.log("Response received.");

      console.log("Clicking copy button...");
      await page.click(`div[data-testid="chat-message-${i*2+1}"] button[aria-label="Copy response"]`);
      console.log("Copy button clicked.");

      console.log("Extracting response text...");
      const responseText = await page.$eval(`div[data-testid="chat-message-${i*2+1}"]`, el => el.textContent);
      console.log("Response text extracted.");

      console.log(`Saving response to file: response_${i+1}.txt`);
      await fs.writeFile(`response_${i+1}.txt`, responseText);
      console.log(`Response ${i+1} saved to file.`);

      console.log("Waiting before next prompt...");
      await page.waitForTimeout(8000000);
      console.log("Wait complete.");
    }

    console.log("\nAll prompts processed successfully.");
  } catch (error) {
    console.error('An error occurred:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log("Error screenshot saved as 'error-screenshot.png'");
  } finally {
    console.log("Closing browser...");
    await browser.close();
    console.log("Browser closed.");
  }
})();
