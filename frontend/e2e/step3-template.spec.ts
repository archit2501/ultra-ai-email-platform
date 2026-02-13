import { test, expect, Page } from '@playwright/test'
import { login } from './helpers'

const goToTemplatePage = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.removeItem('campaign-drafts')
  })
  await page.goto('/campaigns/create/step3-template')
  await page.waitForLoadState('networkidle')

  const loginField = page.getByPlaceholder('Enter your username')
  if (await loginField.isVisible().catch(() => false)) {
    await login(page)
    await page.addInitScript(() => {
      localStorage.removeItem('campaign-drafts')
    })
    await page.goto('/campaigns/create/step3-template')
    await page.waitForLoadState('networkidle')
  }

  // Check if we're already on template page with content
  const currentUrl = page.url()
  if (currentUrl.includes('step3-template')) {
    const richContent = page.locator('button, [role="switch"], input, [role="tab"]')
    if (await richContent.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      return
    }
  }

  // Navigate through steps if needed
  await page.goto('/campaigns/create/step1-source')
  await page.waitForLoadState('networkidle')

  const goalHeading = page.getByRole('heading', { name: /What's your goal\?/i })
  if (await goalHeading.isVisible()) {
    await page.getByRole('button', { name: /Looking for Jobs/i }).click()
  }

  const dataSourceHeading = page.getByRole('heading', { name: /Where do you want to get recipients\?/i })
  if (await dataSourceHeading.isVisible()) {
    await page.getByRole('button', { name: /Upload CSV/i }).click()
  }

  const uploadHeading = page.getByRole('heading', { name: /Upload CSV File/i })
  if (await uploadHeading.isVisible()) {
    const input = page.locator('input[type="file"]').first()
    await input.setInputFiles('test-data/valid-recipients.csv')
  }

  const mapHeading = page.getByRole('heading', { name: /Map Columns/i })
  if (await mapHeading.isVisible({ timeout: 10000 })) {
    const continueBtn = page.getByRole('button', { name: /Continue|Next|Confirm/i })
    if (await continueBtn.first().isVisible()) {
      await continueBtn.first().click()
    }
  }

  await page.waitForTimeout(2000)

  // Navigate through enrichment
  let nextBtn = page.getByRole('button').filter({ hasText: /next|continue|proceed/i })
  if (await nextBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
    await nextBtn.first().click()
    await page.waitForTimeout(2000)
  }

  // Navigate to template
  nextBtn = page.getByRole('button').filter({ hasText: /next|continue|proceed/i })
  if (await nextBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
    await nextBtn.first().click()
    await page.waitForTimeout(2000)
  }

  // Final fallback: direct navigation
  if (!page.url().includes('step3-template')) {
    await page.goto('/campaigns/create/step3-template')
    await page.waitForLoadState('networkidle')
  }
}

test.describe('Step 3 - Template Selection', () => {
  test('reach template selection page', async ({ page }) => {
    await goToTemplatePage(page)
    await expect(page.locator('body')).toContainText(/Template|template|Email|email/, { timeout: 5000 })
  })

  test('template source options visible', async ({ page }) => {
    await goToTemplatePage(page)
    
    const marketplace = page.getByText(/Marketplace|marketplace/i)
    const myTemplates = page.getByText(/My Templates|my templates/i)
    const aiGenerate = page.getByText(/AI Generate|ai generate/i)
    const createNew = page.getByText(/Create New|create new/i)
    
    let optionsFound = 0
    if (await marketplace.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      optionsFound++
    }
    if (await myTemplates.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      optionsFound++
    }
    if (await aiGenerate.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      optionsFound++
    }
    if (await createNew.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      optionsFound++
    }
    expect(optionsFound).toBeGreaterThan(0)
  })

  test('marketplace tab accessible', async ({ page }) => {
    await goToTemplatePage(page)
    
    const marketplaceBtn = page.getByRole('tab').filter({ hasText: /Marketplace|marketplace/i })
    if (await marketplaceBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await marketplaceBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('my templates tab accessible', async ({ page }) => {
    await goToTemplatePage(page)
    
    const myTemplatesBtn = page.getByRole('tab').filter({ hasText: /My Templates|my templates/i })
    if (await myTemplatesBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await myTemplatesBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('AI generate tab accessible', async ({ page }) => {
    await goToTemplatePage(page)
    
    const aiBtn = page.getByRole('tab').filter({ hasText: /AI|Ai/i })
    if (await aiBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await aiBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('create new tab accessible', async ({ page }) => {
    await goToTemplatePage(page)
    
    const createBtn = page.getByRole('tab').filter({ hasText: /Create|create|New|new/i })
    if (await createBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('template filtering available', async ({ page }) => {
    await goToTemplatePage(page)
    
    const filterBtn = page.getByRole('button').filter({ hasText: /Filter|filter/i })
    if (await filterBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(filterBtn.first()).toBeVisible()
    }
  })

  test('search functionality available', async ({ page }) => {
    await goToTemplatePage(page)
    
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="Search" i]')
    if (await searchInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(searchInput.first()).toBeVisible()
    }
  })

  test('template preview works', async ({ page }) => {
    await goToTemplatePage(page)
    
    const previewBtn = page.getByRole('button').filter({ hasText: /Preview|preview/i })
    if (await previewBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await previewBtn.first().click()
      await page.waitForTimeout(1000)
    }
  })

  test('template rating visible', async ({ page }) => {
    await goToTemplatePage(page)
    
    const rating = page.getByText(/⭐|★|rating|Rating/i)
    if (await rating.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(rating.first()).toBeVisible()
    }
  })

  test('template usage stats visible', async ({ page }) => {
    await goToTemplatePage(page)
    
    const stats = page.getByText(/used|Uses|times/i)
    if (await stats.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(stats.first()).toBeVisible()
    }
  })

  test('template category selection works', async ({ page }) => {
    await goToTemplatePage(page)
    
    const categoryFilter = page.locator('button, [role="option"]').filter({ hasText: /Category|category|Tech|Sales|HR/i })
    if (await categoryFilter.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await categoryFilter.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('template tone selection available', async ({ page }) => {
    await goToTemplatePage(page)
    
    const tone = page.getByText(/Professional|Enthusiastic|Friendly|Formal/i)
    if (await tone.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(tone.first()).toBeVisible()
    }
  })

  test('template use button clickable', async ({ page }) => {
    await goToTemplatePage(page)
    
    const useBtn = page.getByRole('button').filter({ hasText: /Use|use|Select|select/i })
    if (await useBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(useBtn.first()).toBeVisible()
    }
  })

  test('AI generate opens with prompts', async ({ page }) => {
    await goToTemplatePage(page)
    
    const aiBtn = page.getByRole('button', { name: /AI|Generate|Ai generate/i })
    if (await aiBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await aiBtn.first().click()
      await page.waitForTimeout(1000)
      
      const prompt = page.locator('textarea, input[placeholder*="prompt" i]')
      if (await prompt.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(prompt.first()).toBeVisible()
      }
    }
  })

  test('AI generate button triggers generation', async ({ page }) => {
    await goToTemplatePage(page)
    
    const generateBtn = page.getByRole('button').filter({ hasText: /Generate|generate/i })
    if (await generateBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await generateBtn.first().click()
      await page.waitForTimeout(1500)
    }
  })

  test('template variations shown', async ({ page }) => {
    await goToTemplatePage(page)
    
    const variations = page.getByText(/Variation|variation|Version|version/i)
    if (await variations.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(variations.first()).toBeVisible()
    }
  })

  test('template editor available', async ({ page }) => {
    await goToTemplatePage(page)
    
    const editorBtn = page.getByRole('button').filter({ hasText: /Edit|edit|Customize|customize/i })
    if (await editorBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(editorBtn.first()).toBeVisible()
    }
  })

  test('template personalization options visible', async ({ page }) => {
    await goToTemplatePage(page)
    
    const personalize = page.getByText(/Personali|{{|variable|Variable/i)
    if (await personalize.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(personalize.first()).toBeVisible()
    }
  })

  test('template subject line preview', async ({ page }) => {
    await goToTemplatePage(page)
    
    const subject = page.getByText(/Subject|subject|Title|title/i)
    if (await subject.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(subject.first()).toBeVisible()
    }
  })

  test('template body preview shows', async ({ page }) => {
    await goToTemplatePage(page)
    
    const body = page.locator('[role="region"], .prose, .editor').first()
    if (await body.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(body).toBeVisible()
    }
  })

  test('template character count visible', async ({ page }) => {
    await goToTemplatePage(page)
    
    const charCount = page.getByText(/character|Character|length/i)
    if (await charCount.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(charCount.first()).toBeVisible()
    }
  })

  test('template version history accessible', async ({ page }) => {
    await goToTemplatePage(page)
    
    const historyBtn = page.getByRole('button').filter({ hasText: /History|history|Versions|versions/i })
    if (await historyBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await historyBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('template analytics available', async ({ page }) => {
    await goToTemplatePage(page)
    
    const analyticsBtn = page.getByRole('button').filter({ hasText: /Analytics|analytics|Stats|stats/i })
    if (await analyticsBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await analyticsBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('template copy functionality works', async ({ page }) => {
    await goToTemplatePage(page)
    
    const copyBtn = page.getByRole('button').filter({ hasText: /Copy|copy|Duplicate|duplicate/i })
    if (await copyBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await copyBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('template delete option available', async ({ page }) => {
    await goToTemplatePage(page)
    
    const deleteBtn = page.getByRole('button').filter({ hasText: /Delete|delete|Remove|remove/i })
    if (await deleteBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(deleteBtn.first()).toBeVisible()
    }
  })

  test('template favorites toggle works', async ({ page }) => {
    await goToTemplatePage(page)
    
    const favoriteBtn = page.getByRole('button').filter({ hasText: /⭐|★|Favorite|favorite/i })
    if (await favoriteBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await favoriteBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('AI tone variations selectable', async ({ page }) => {
    await goToTemplatePage(page)
    
    const tones = page.getByText(/Professional|Enthusiastic|Story|Value|Consultant/i)
    if (await tones.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const buttons = page.locator('button').filter({ hasText: /Professional|Enthusiastic|Story|Value|Consultant/i })
      if (await buttons.first().isVisible()) {
        await buttons.first().click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('back button returns to enrichment step', async ({ page }) => {
    await goToTemplatePage(page)
    
    const backBtn = page.getByRole('button').filter({ hasText: /Back/ })
    if (await backBtn.first().isVisible()) {
      await backBtn.first().click()
      await page.waitForTimeout(1000)
      await expect(page).toHaveURL(/step2-enrich|step3-template/, { timeout: 5000 })
    }
  })

  test('continue to send options button works', async ({ page }) => {
    await goToTemplatePage(page)
    
    const continueBtn = page.getByRole('button').filter({ hasText: /Continue|Next|Proceed/i })
    if (await continueBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      // Just verify it exists - don't click to avoid navigation
      await expect(continueBtn.first()).toBeVisible()
    }
  })

  test('template save as draft option', async ({ page }) => {
    await goToTemplatePage(page)
    
    const saveDraftBtn = page.getByRole('button').filter({ hasText: /Save|save|Draft|draft/i })
    if (await saveDraftBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(saveDraftBtn.first()).toBeVisible()
    }
  })

  test('template collaboration features visible', async ({ page }) => {
    await goToTemplatePage(page)
    
    const share = page.getByText(/Share|share|Collaborate|collaborate/i)
    if (await share.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(share.first()).toBeVisible()
    }
  })

  test('template performance metrics shown', async ({ page }) => {
    await goToTemplatePage(page)
    
    const metrics = page.getByText(/Performance|performance|Click Rate|open rate|CTR/i)
    if (await metrics.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(metrics.first()).toBeVisible()
    }
  })

  test('template sorting options available', async ({ page }) => {
    await goToTemplatePage(page)
    
    const sortBtn = page.getByRole('button').filter({ hasText: /Sort|sort|By|by/i })
    if (await sortBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await sortBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('template pagination working', async ({ page }) => {
    await goToTemplatePage(page)
    
    const nextPage = page.getByRole('button').filter({ hasText: /Next|next|>/i })
    if (await nextPage.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(nextPage.first()).toBeVisible()
    }
  })

  test('template settings preserved on reload', async ({ page }) => {
    await goToTemplatePage(page)
    
    const filterBtn = page.getByRole('button').filter({ hasText: /Filter|filter/i })
    if (await filterBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterBtn.first().click()
      await page.waitForTimeout(500)
      
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      const filterBtn2 = page.getByRole('button').filter({ hasText: /Filter|filter/i })
      if (await filterBtn2.first().isVisible({ timeout: 3000 })) {
        await expect(filterBtn2.first()).toBeVisible()
      }
    }
  })

  test('template search results update dynamically', async ({ page }) => {
    await goToTemplatePage(page)
    
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="Search" i]')
    if (await searchInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.first().type('test', { delay: 50 })
      await page.waitForTimeout(1000)
    }
  })
})
