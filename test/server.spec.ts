import { Browser } from 'puppeteer'
import { openPageSSR as openPage, closeBrowser, openBrowser } from './browser'
import { buildForServer as build } from './build'
import * as fs from 'fs'
import * as path from 'path'

let browser: Browser
beforeAll(async () => {
  browser = await openBrowser()
})

describe('baseline', () => {
  fs
    .readdirSync(path.join(__dirname, 'fixtures'))
    .filter((filename: string) => filename.endsWith('.vue'))
    .map((filename: string) => filename.replace(/\.vue$/i, ''))
    .forEach(fixture => {
      test(fixture, async () => {
        const filename = path.join(__dirname, 'fixtures', fixture + '.vue')
        const page = await openPage(fixture, browser, await build(filename))

        expect(await page.$('h1')).toBeTruthy()
        expect(
          await page.evaluate(() => document.querySelector('h1')!.textContent)
        ).toEqual(expect.stringContaining('Hello World'))
        expect(
          await page.evaluate(
            () => window.getComputedStyle(document.querySelector('h1')!)!.color
          )
        ).toEqual('rgb(255, 0, 0)')

        await page.close()
      })
    })
})

afterAll(async () => {
  await closeBrowser(browser)
})
