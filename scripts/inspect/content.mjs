/**
 * Extract the real content of every homepage section, forcing lazy rails and
 * carousel pages to load first. Writes docs/research/<host>/content.json.
 * Usage: node scripts/inspect/content.mjs
 */
import path from 'node:path';
import { openPage, primeLazyContent, writeJson, HOST, RES_DIR } from './lib.mjs';

const RES = RES_DIR;

const run = async () => {
  const { browser, page } = await openPage({ viewport: 'desktop', wait: 'domcontentloaded' });
  await primeLazyContent(page);

  // Force horizontal rails to load every tile.
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const rails = [...document.querySelectorAll('*')].filter((el) => {
      const s = getComputedStyle(el);
      return el.scrollWidth > el.clientWidth + 40 && /auto|scroll/.test(s.overflowX);
    });
    for (const rail of rails) {
      for (let x = 0; x <= rail.scrollWidth; x += 300) { rail.scrollLeft = x; await sleep(120); }
      rail.scrollLeft = 0; await sleep(200);
    }
  });

  // Page through the bestsellers carousel so page-2 cards render.
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const dots = [...document.querySelectorAll('.content_9 .control-dots .dot, .content_9 [class*="dot"]')];
    for (const d of dots) { d.click?.(); await sleep(1200); }
    dots[0]?.click?.();
    await sleep(800);
  });
  await page.waitForTimeout(1500);

  const content = await page.evaluate(() => {
    const txt = (el) => el?.textContent?.trim().replace(/\s+/g, ' ') || '';
    const imgSrc = (el) => el?.currentSrc || el?.src || '';

    // ---- header nav ----
    const nav = [...document.querySelectorAll('.menu-container .subnav')].map((sn) => {
      const columns = [...sn.querySelectorAll('.subnav-content > ul.submenu-list > li.subSubmenu')].map((li) => ({
        heading: txt(li.querySelector('.category-subchild-title, .child-title, a')),
        links: [...li.querySelectorAll('a')].map((a) => ({ label: txt(a), href: a.getAttribute('href') })),
      }));
      const flat = [...sn.querySelectorAll('.subnav-content a')].map((a) => ({ label: txt(a), href: a.getAttribute('href') }));
      return {
        label: txt(sn.querySelector('.category-title')),
        href: sn.querySelector('.subnavbtn a')?.getAttribute('href') || null,
        submenuKind: sn.querySelector('.submenu-list')?.className?.toString() || '',
        columns,
        links: flat,
      };
    });

    const utility = {
      logo: imgSrc(document.querySelector('.bakingo-logo')),
      locationLabel: txt(document.querySelector('.location-text')),
      searchPlaceholder: document.querySelector('.search-input')?.placeholder || '',
      searchIcon: imgSrc(document.querySelector('.header-search-icon')),
      actions: [...document.querySelectorAll('.profile-container > *')].map((el) => ({
        label: txt(el.querySelector('.profileTitle')),
        href: el.getAttribute?.('href') || null,
        icon: imgSrc(el.querySelector('img')),
        iconClass: el.querySelector('img')?.className?.toString() || '',
        dropdown: [...el.querySelectorAll('.drop-data-header .dropdown-item')].map((a) => ({
          label: txt(a),
          href: a.getAttribute('href'),
        })),
      })),
    };

    // ---- hero slides ----
    const hero = [...document.querySelectorAll('.content_7 .slide')].map((s) => ({
      src: imgSrc(s.querySelector('img')),
      alt: s.querySelector('img')?.alt || '',
      href: s.querySelector('a')?.getAttribute('href') || null,
      cloned: s.getAttribute('aria-hidden') === 'true',
    }));

    // ---- categories ----
    const catRoot = document.querySelector('.content_4');
    const categories = [...(catRoot?.querySelectorAll('a') || [])].map((a) => ({
      label: txt(a),
      href: a.getAttribute('href'),
      img: imgSrc(a.querySelector('img')),
      alt: a.querySelector('img')?.alt || '',
    }));
    const categoryHeading = {
      eyebrow: txt(catRoot?.querySelector('.heading-title-text')),
      subtitle: txt(catRoot?.querySelector('.heading-subtitle-text')),
    };

    // ---- bestsellers ----
    const bsRoot = document.querySelector('.content_9');
    const products = [...(bsRoot?.querySelectorAll('.product-card') || [])]
      .map((card) => ({
        name: txt(card.querySelector('.product-card-title')),
        href: card.querySelector('a')?.getAttribute('href') || null,
        img: imgSrc(card.querySelector('.product-img')),
        alt: card.querySelector('.product-img')?.alt || '',
        // .re-price holds the bare number; the ₹ glyph is a CSS ::before on the container
        price: txt(card.querySelector('.re-price')),
        rating: txt(card.querySelector('.bk-rating')),
        reviews: txt(card.querySelector('.bk-review')),
        eggless: !!card.querySelector('.status-square.eggless'),
      }))
      .filter((p) => p.img);
    const bestsellerHeading = {
      eyebrow: txt(bsRoot?.querySelector('.heading-title-text')),
      subtitle: txt(bsRoot?.querySelector('.heading-subtitle-text')),
      starIcon: imgSrc(bsRoot?.querySelector('.star-icon')),
      viewAll: txt(bsRoot?.querySelector('a[class*="view"], .view-all')) || null,
    };

    // ---- promise ----
    const prRoot = document.querySelector('.content_1');
    const promises = [...(prRoot?.querySelectorAll('.feature-item') || [])].map((li) => ({
      img: imgSrc(li.querySelector('img')),
      alt: li.querySelector('img')?.alt || '',
      imgClass: li.querySelector('img')?.className?.toString() || '',
      title: txt(li.querySelector('.feature-title')),
      body: txt(li.querySelector('.feature-description')),
    }));
    const promiseHeading = {
      eyebrow: txt(prRoot?.querySelector('.heading-title-text')),
      subtitle: txt(prRoot?.querySelector('.heading-subtitle-text')),
    };

    // ---- cta ----
    const ctaRoot = document.querySelector('.content_6');
    const cta = {
      img: imgSrc(ctaRoot?.querySelector('img')),
      alt: ctaRoot?.querySelector('img')?.alt || '',
      texts: [...new Set([...(ctaRoot?.querySelectorAll('h1,h2,h3,p,span,button,a') || [])].map(txt).filter(Boolean))].slice(0, 8),
      href: ctaRoot?.querySelector('a')?.getAttribute('href') || null,
      bg: getComputedStyle(ctaRoot || document.body).backgroundImage,
    };

    // ---- social grid ----
    const socialRoot = document.querySelector('.insta-story-wrapper');
    const social = {
      heading: txt(socialRoot?.querySelector('.insta-heading')),
      subHeading: txt(socialRoot?.querySelector('.insta-subHeading')),
      storyManImg: imgSrc(socialRoot?.querySelector('.story-man')),
      rows: [...(socialRoot?.querySelectorAll('.insta-row') || [])].map((row) =>
        [...row.querySelectorAll('img')].map((img) => ({
          src: imgSrc(img),
          alt: img.alt,
          cls: img.className?.toString().slice(0, 60),
          w: Math.round(img.getBoundingClientRect().width),
          h: Math.round(img.getBoundingClientRect().height),
        }))
      ),
      tiles: [...(socialRoot?.querySelectorAll('.insta-row img') || [])].map((img) => ({
        src: imgSrc(img),
        alt: img.alt,
        cls: img.className?.toString().slice(0, 60),
        w: Math.round(img.getBoundingClientRect().width),
        h: Math.round(img.getBoundingClientRect().height),
      })),
    };

    // ---- seo accordion ----
    const seoRoot = document.querySelector('#seo-container');
    const seo = {
      heading: txt(seoRoot?.querySelector('.about-us-title')),
      links: [...(seoRoot?.querySelectorAll('a') || [])].map((a) => ({ label: txt(a), href: a.getAttribute('href') })),
      paragraphs: [...(seoRoot?.querySelectorAll('p') || [])].map(txt).filter(Boolean),
    };

    // ---- footer ----
    const fRoot = document.querySelector('.footer-container');
    const footer = {
      newsletterHeading: txt(fRoot?.querySelector('.subscribe-newsletter')),
      inputPlaceholder: fRoot?.querySelector('.subscribe-form input')?.placeholder || '',
      subscribeArrow: imgSrc(fRoot?.querySelector('.subscribe-form img')),
      copyright: txt(fRoot?.querySelector('.policy')) ||
        [...(fRoot?.querySelectorAll('div,p,span') || [])].map(txt).find((t) => /©/.test(t) && t.length < 80) || '',
      logo: imgSrc(fRoot?.querySelector('.bakingo-image-bottom')),
      columns: [...(fRoot?.querySelectorAll('.footer-description') || [])].map((col) => ({
        heading: txt(col.querySelector('.footer-heading')),
        links: [...col.querySelectorAll('a')].map((a) => ({ label: txt(a), href: a.getAttribute('href') })),
      })),
      socials: [...(fRoot?.querySelectorAll('.all-logos a') || [])].map((a) => ({
        href: a.getAttribute('href'),
        icon: imgSrc(a.querySelector('img')),
        cls: a.querySelector('img')?.className?.toString() || '',
      })),
      background: getComputedStyle(fRoot || document.body).backgroundImage,
    };

    return { utility, nav, hero, categories, categoryHeading, products, bestsellerHeading, promises, promiseHeading, cta, social, seo, footer };
  });

  await browser.close();
  await writeJson(path.join(RES, 'content.json'), content);
  console.log('nav:', content.nav.length, '| hero:', content.hero.length, '| categories:', content.categories.length,
    '| products:', content.products.length, '| promises:', content.promises.length,
    '| social tiles:', content.social.tiles.length, '| seo links:', content.seo.links.length,
    '| footer columns:', content.footer.columns.length);
};

run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
