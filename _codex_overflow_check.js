const { chromium } = require('playwright');

async function inspect(browser, url, user, viewport, screenshot) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript((value) => {
    sessionStorage.setItem('usuarioLogueado', JSON.stringify(value));
  }, user);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const data = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll('body *')]
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id,
          cls: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          position: getComputedStyle(el).position,
          display: getComputedStyle(el).display,
        };
      })
      .filter((item) => item.display !== 'none' && item.width > 0 && (item.right > viewportWidth + 2 || item.left < -2))
      .sort((a, b) => b.right - a.right)
      .slice(0, 30);
    return {
      url: location.href,
      viewportWidth,
      htmlScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      htmlOverflow: getComputedStyle(document.documentElement).overflowX,
      bodyOverflow: getComputedStyle(document.body).overflowX,
      offenders,
    };
  });
  await page.screenshot({ path: screenshot, fullPage: false });
  await page.close();
  return data;
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const results = [];
  results.push(await inspect(
    browser,
    'http://127.0.0.1:5502/dashboardUsuarios.html',
    {
      idUsuario: 11,
      idRol: 3,
      nombreUsuario: 'Usuario Demo',
      nombre: 'Usuario Demo',
      correo: 'usuario.demo@iticket.com',
      nombreRol: 'Usuario',
      rolUsuario: 'usuario',
      idDepartamento: 2,
      nombreDepartamento: 'Soporte',
      departamento: 'Soporte',
      estado: true,
    },
    { width: 390, height: 844 },
    'C:\\Users\\danie\\OneDrive\\Desktop\\iTicket movil\\_web_user_390.png',
  ));
  results.push(await inspect(
    browser,
    'http://127.0.0.1:5501/misTickets.html',
    { idUsuario: 11, idRol: 3, nombreUsuario: 'Usuario Demo', correo: 'usuario.demo@iticket.com' },
    { width: 360, height: 800 },
    'C:\\Users\\danie\\OneDrive\\Desktop\\iTicket movil\\_mobile_user_360.png',
  ));
  results.push(await inspect(
    browser,
    'http://127.0.0.1:5501/ticketsAsignados.html',
    { idUsuario: 10, idRol: 2, nombreUsuario: 'Tecnico Demo', correo: 'tecnico.demo@iticket.com' },
    { width: 360, height: 800 },
    'C:\\Users\\danie\\OneDrive\\Desktop\\iTicket movil\\_mobile_tech_360.png',
  ));
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
