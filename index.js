const puppeteer = require('puppeteer');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


// script variables - will move to ENV/Azure variables
const user = '';
const pass = '';
const exchange = '';
const stock = '';
const result_path = '';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--headless'],
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 1200, height: 720 });
  await page.goto('https://www.ortex.com/login', { waitUntil: 'networkidle0' });
  await page.type('#id_username', user);
  await page.type('#id_password', pass);

  await Promise.all([
    page.keyboard.press('Enter'),
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);

  // TODO: parameterize exchange code and stock symbol.
  await page.goto(`https://www.ortex.com/symbol/${exchange}/${stock}/short_interest`, { waitUntil: 'networkidle0' });

  // Get window object from short interest page
  const handle = await page.evaluateHandle(() => window);
  const properties = await handle.getProperties();
  // Get combined data object
  const dataHandle = properties.get('combined_data');
  const data_properties = await dataHandle.getProperties();
  const data = await dataHandle.jsonValue()

  // Get individual data objects
  const priceHandle = data_properties.get((data.length - 1).toString());
  const prices = await priceHandle.jsonValue();

  const ageHandle = data_properties.get('age');
  const age = await ageHandle.jsonValue();

  const c2bHandle = data_properties.get('c2b');
  const c2b = await c2bHandle.jsonValue();

  const ffolHandle = data_properties.get('ffol');
  const ffol = await ffolHandle.jsonValue();

  const onlHandle = data_properties.get('onl');
  const onl = await onlHandle.jsonValue();

  const shorts_dtc_NoneHandle = data_properties.get('shorts_dtc_None');
  const shorts_dtc_None = await shorts_dtc_NoneHandle.jsonValue();

  const sieHandle = data_properties.get('sie');
  const sie = await sieHandle.jsonValue();

  const sieffHandle = data_properties.get('sieff');
  const sieff = await sieffHandle.jsonValue();

  const ticketsHandle = data_properties.get('tickets');
  const tickets = await ticketsHandle.jsonValue();

  const utlHandle = data_properties.get('utl');
  const utl = await utlHandle.jsonValue();

  const volHandle = data_properties.get('vol');
  const vol = await volHandle.jsonValue();

  const xcrHandle = data_properties.get('xcr');
  const xcr = await xcrHandle.jsonValue();

  await handle.dispose();

  await browser.close();


  const data_grid = prices.map((i) => {
    result = {
      date: (new Date(i[0])).toLocaleDateString(),
      open: i[1],
      high: i[2],
      low: i[3],
      close: i[4],
      age: age.filter((a) => a[0] === i[0])[0]?.[1] ?? '',
      c2b: c2b.filter((c) => c[0] === i[0])[0]?.[1] ?? '',
      ffol: ffol.filter((f) => f[0] === i[0])[0]?.[1] ?? '',
      onl: onl.filter((o) => o[0] === i[0])[0]?.[1] ?? '',
      shorts_dtc: shorts_dtc.filter((s) => s[0] === i[0])[0]?.[1] ?? '',
      sie: sie.filter((s) => s[0] === i[0])[0]?.[1] ?? '',
      sieff: sieff.filter((e) => e[0] === i[0])[0]?.[1] ?? '',
      tickets: tickets.filter((t) => t[0] === i[0])[0]?.[1] ?? '',
      utl: utl.filter((u) => u[0] === i[0])[0]?.[1] ?? '',
      vol: vol.filter((v) => v[0] === i[0])[0]?.[1] ?? '',
      xcr: xcr.filter((x) => x[0] === i[0])[0]?.[1] ?? ''
    }
    return result
  });

  const csvWriter = createCsvWriter({
    path: `${result_path}\\${stock}_processed_data.csv`,
    header: [
      { id: 'date', title: 'date' },
      { id: 'open', title: 'open' },
      { id: 'high', title: 'high' },
      { id: 'low', title: 'low' },
      { id: 'close', title: 'close' },
      { id: 'age', title: 'age' },
      { id: 'c2b', title: 'c2b' },
      { id: 'ffol', title: 'ffol' },
      { id: 'onl', title: 'onl' },
      { id: 'shorts_dtc', title: 'shorts_dtc' },
      { id: 'sie', title: 'sie' },
      { id: 'sieff', title: 'sieff' },
      { id: 'tickets', title: 'tickets' },
      { id: 'utl', title: 'utl' },
      { id: 'vol', title: 'vol' },
      { id: 'xcr', title: 'xcr' }
    ]
  });

  csvWriter.writeRecords(data_grid).then(() => console.log('The CSV file was written successfully'));

})();

