const { chromium } = require('playwright');

const accounts = [
  { role: 1, email: 'admin.demo@iticket.com', password: 'AdminDemo#2026' },
  { role: 2, email: 'tecnico.demo@iticket.com', password: 'TecnicoDemo#2026' },
  { role: 3, email: 'usuario.demo@iticket.com', password: 'UsuarioDemo#2026' },
];

async function loginWeb(browser, account) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:5502/index.html', { waitUntil: 'load' });
  await page.fill('#txtCorreo', account.email);
  await page.fill('#txtClave', account.password);
  await page.click('#btnIniciarSesion');
  await page.waitForFunction(() => sessionStorage.getItem('usuarioLogueado'), null, { timeout: 10000 });
  const session = await page.evaluate(() => JSON.parse(sessionStorage.getItem('usuarioLogueado')));
  const target = { 1: 'dashboardAdmin.html', 2: 'dashboardTecnicos.html', 3: 'dashboardUsuarios.html' }[account.role];
  await page.goto(`http://127.0.0.1:5502/${target}`, { waitUntil: 'load' });
  await page.waitForSelector('#menuLateral', { timeout: 10000 });
  await page.waitForTimeout(1000);
  const dashboard = await page.evaluate(() => ({
    path: location.pathname,
    role: Number(JSON.parse(sessionStorage.getItem('usuarioLogueado')).idRol),
    home: document.querySelector('#enlaceInicio')?.getAttribute('href'),
    links: [...document.querySelectorAll('#menuLateral a[href]')]
      .filter((el) => el.getClientRects().length > 0)
      .map((el) => el.getAttribute('href')),
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflowX: getComputedStyle(document.documentElement).overflowX,
  }));
  if (account.role === 3) {
    await page.goto('http://127.0.0.1:5502/dashboardAdmin.html', { waitUntil: 'load' });
    await page.waitForTimeout(500);
    dashboard.deniedPath = new URL(page.url()).pathname;
  }
  await page.close();
  return { sessionRole: Number(session.idRol), ...dashboard };
}

async function loginMobile(browser, account) {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  await page.goto('http://127.0.0.1:5501/index.html', { waitUntil: 'load' });
  await page.fill('#email', account.email);
  await page.fill('#password', account.password);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => sessionStorage.getItem('usuarioLogueado'), null, { timeout: 10000 });
  const target = { 1: 'gestionTickets.html', 2: 'ticketsAsignados.html', 3: 'misTickets.html' }[account.role];
  await page.goto(`http://127.0.0.1:5501/${target}`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const screen = await page.evaluate(() => ({
    path: location.pathname,
    role: Number(JSON.parse(sessionStorage.getItem('usuarioLogueado')).idRol),
    ticketNav: document.querySelector('.bottom-nav a[aria-label="Tickets"]')?.getAttribute('href'),
    switchVisible: (() => {
      const el = document.querySelector('.notificaciones');
      return !!el && !el.closest('.filter-wrapper, .selector-interfaz')?.hidden && el.getClientRects().length > 0;
    })(),
    managementOptionVisible: (() => {
      const el = [...document.querySelectorAll('.filter-opcion')]
        .find((node) => node.getAttribute('href')?.includes('gestionTickets'));
      return !!el && !el.hidden && el.getClientRects().length > 0;
    })(),
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflowX: getComputedStyle(document.documentElement).overflowX,
  }));
  if (account.role === 3) {
    await page.goto('http://127.0.0.1:5501/gestionTickets.html', { waitUntil: 'load' });
    await page.waitForTimeout(500);
    screen.deniedPath = new URL(page.url()).pathname;
  }
  await page.close();
  return { sessionRole: screen.role, ...screen };
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const web = [];
  const mobile = [];
  for (const account of accounts) {
    web.push({ requestedRole: account.role, ...(await loginWeb(browser, account)) });
    mobile.push({ requestedRole: account.role, ...(await loginMobile(browser, account)) });
  }
  console.log(JSON.stringify({ web, mobile }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
