const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173');
  
  // Wait for loading screen to disappear
  await page.waitForTimeout(2000);
  
  // Click Voice Chat button in top left
  // title="නිර්නාම ඇමතුම් (Anonymous Voice Chat)"
  const voiceBtn = await page.$('button[title="නිර්නාම ඇමතුම් (Anonymous Voice Chat)"]');
  if (voiceBtn) {
    await voiceBtn.click();
    console.log("Clicked Voice button");
  } else {
    console.log("Could not find Voice button");
  }
  
  await page.waitForTimeout(500);
  
  // Click Start Call
  const startBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ඇමතුමක් ආරම්භ කරන්න'));
  });
  if (startBtn) {
    await startBtn.click();
    console.log("Clicked Start Call button");
  } else {
    console.log("Could not find Start Call button");
  }
  
  await page.waitForTimeout(1000);
  
  await browser.close();
})();
