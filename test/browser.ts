import * as fs from 'fs'
import * as path from 'path'
import { Browser, Page } from 'puppeteer'
import promised from '@znck/promised'

const puppeteer = require('puppeteer')
const VUE_SOURCE = promised(fs).readFile(require.resolve('vue/dist/vue.min.js'))

export async function openBrowser(options: any = {}) {
  return await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: Boolean(process.env.CI)
  })
}

export async function closeBrowser(browser: Browser) {
  await browser.close()
}

async function createPage(browser: Browser, content: string, selector: string): Promise<Page> {
  const page = await browser.newPage()

  await page.setContent(content)

  await page.waitFor(selector)

  return page
}


export async function openPage(
  name: string,
  browser: Browser,
  code: string,
  selector: string = 'h1'
): Promise<Page> {

  const content = `
  <!doctype html>
  <html>
    <head>
      <title>${name}</title>
    </head>
    <body>
      <div id="app"></div>
      <script>
      ${await VUE_SOURCE}
      </script>
      <script>
      ${await code}
      </script>
    </body>
  </html>`

  if (!Boolean(process.env.CI)) {
    const dir = path.join(__dirname, './output')

    if (!(await promised(fs).exists(dir))) await promised(fs).mkdir(dir)
    await promised(fs).writeFile(path.join(dir, name + '.html'), content)
  }

  return createPage(browser, content, selector)
}

export async function openPageSSR(
  name: string,
  browser: Browser,
  content: string,
  selector: string = 'h1'
): Promise<Page> {
  if (!Boolean(process.env.CI)) {
    const dir = path.join(__dirname, './output')

    if (!(await promised(fs).exists(dir))) await promised(fs).mkdir(dir)
    await promised(fs).writeFile(path.join(dir, name + '-ssr.html'), content)
  }

  return createPage(browser, content, selector)
}
