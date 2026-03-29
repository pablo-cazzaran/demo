import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Builds the top utility row (row 1):
 *   logo | search | utility links | icon tray
 *
 * @param {Element} section - The first .section element from the authored fragment
 * @param {Element} overlay - The overlay div
 * @returns {Element} - The decorated .default-content-wrapper for row 1
 */
function buildTopBar(section, overlay) {
  const wrapper = section.querySelector('.default-content-wrapper');
  if (!wrapper) return section;

  // --- 1. Logo: first <p> containing a <picture> ---
  const logoPara = wrapper.querySelector('p:has(picture)');
  const logoEl = document.createElement('div');
  logoEl.className = 'header-logo';
  if (logoPara) {
    logoEl.append(logoPara.querySelector('picture') || logoPara);
  }

  // --- 2. Parse authored <ul> elements in order ---
  const [searchUl, iconUl, utilityUl] = [...wrapper.querySelectorAll('ul')];

  // Search bar — first UL: ["Search by SKU…", search-icon]
  const searchEl = document.createElement('div');
  searchEl.className = 'header-search';
  const searchPlaceholder = searchUl?.querySelector('li:first-child')?.textContent?.trim()
    || 'Search by SKU number, Application or Keyword';
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = searchPlaceholder;
  searchInput.setAttribute('aria-label', searchPlaceholder);
  const searchBtn = document.createElement('button');
  searchBtn.className = 'header-search-btn';
  searchBtn.setAttribute('aria-label', 'Submit search');
  // Clone the icon span with its img child (decorateIcons already ran on the fragment)
  const searchIconSpan = searchUl?.querySelector('.icon-search');
  if (searchIconSpan) {
    searchBtn.append(searchIconSpan.cloneNode(true));
  }
  searchEl.append(searchInput, searchBtn);

  // Mobile search (clone, shown only < 900 px)
  const searchMobile = document.createElement('div');
  searchMobile.className = 'header-search-mobile';
  const searchInputMobile = searchInput.cloneNode();
  const searchBtnMobile = document.createElement('button');
  searchBtnMobile.className = 'header-search-mobile-btn';
  searchBtnMobile.setAttribute('aria-label', 'Submit search');
  if (searchIconSpan) {
    searchBtnMobile.append(searchIconSpan.cloneNode(true));
  }
  searchMobile.append(searchInputMobile, searchBtnMobile);

  // Utility text links (Quick Order, Support, Contact Us) — third UL
  const utilityLinksEl = document.createElement('nav');
  utilityLinksEl.className = 'header-utility-links';
  utilityLinksEl.setAttribute('aria-label', 'Utility navigation');
  if (utilityUl) {
    utilityUl.querySelectorAll('li a').forEach((a) => {
      const link = a.cloneNode(true);
      utilityLinksEl.append(link);

      // Show overlay when a utility link is clicked
      link.addEventListener('click', (e) => {
        e.preventDefault();
        overlay.classList.add('active');
      });
    });
  }

  // Icon tray — deep clone the spans so the img injected by decorateIcons is preserved
  const iconTrayEl = document.createElement('div');
  iconTrayEl.className = 'header-icon-tray';
  if (iconUl) {
    iconUl.querySelectorAll('li .icon').forEach((icon) => {
      const iconName = [...icon.classList].find((c) => c.startsWith('icon-') && c !== 'icon')
        ?.replace('icon-', '');
      const btn = document.createElement('a');
      btn.href = '#';
      btn.setAttribute('aria-label', iconName || 'icon');
      btn.className = `header-icon-${iconName}`;
      btn.append(icon.cloneNode(true));
      iconTrayEl.append(btn);
    });
  }

  // Separator between cart and hamburger (visible only on mobile via CSS)
  const separator = document.createElement('span');
  separator.className = 'header-icon-separator';
  separator.setAttribute('aria-hidden', 'true');

  // Hamburger button (hidden on desktop via CSS)
  const hamburger = document.createElement('button');
  hamburger.className = 'header-hamburger';
  hamburger.setAttribute('aria-label', 'Open navigation menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>`;

  // Append separator + hamburger into icon tray — CSS shows/hides per breakpoint
  iconTrayEl.append(separator, hamburger);

  // Replace wrapper content with structured layout
  wrapper.textContent = '';
  wrapper.append(logoEl, searchEl, utilityLinksEl, iconTrayEl);

  // Inject mobile search row after the section (outside the flex row)
  section.after(searchMobile);

  return { hamburger, searchMobile };
}

/**
 * Builds the primary navigation row (row 2) from the second section.
 *
 * @param {Element} section - The second .section element
 * @param {Element} overlay - The overlay div
 * @returns {Element} ul.header-nav-links
 */
function buildNavBar(section, overlay) {
  const wrapper = section.querySelector('.default-content-wrapper');
  if (!wrapper) return null;

  // Mark this section so CSS can target it reliably
  section.classList.add('header-nav-section');

  const navList = document.createElement('ul');
  navList.className = 'header-nav-links';
  navList.setAttribute('role', 'list');

  wrapper.querySelectorAll('li a').forEach((a) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = a.href;
    link.textContent = a.textContent.trim();
    if (a.title) link.title = a.title;

    // Show overlay when a nav link is clicked
    link.addEventListener('click', (e) => {
      e.preventDefault();
      overlay.classList.add('active');
    });

    li.append(link);
    navList.append(li);
  });

  wrapper.textContent = '';
  wrapper.append(navList);

  return navList;
}

/**
 * Builds the mobile slide-in drawer from the nav links and utility links.
 *
 * @param {Element} block
 * @param {NodeList} navLinks - anchors from the primary nav
 * @param {NodeList} utilityLinks - anchors from the utility bar
 * @param {Element} hamburger
 * @param {Element} overlay
 */
function buildNavDrawer(block, navLinks, utilityLinks, hamburger, overlay) {
  const drawer = document.createElement('div');
  drawer.className = 'header-nav-drawer';
  drawer.setAttribute('aria-label', 'Mobile navigation');
  drawer.setAttribute('aria-hidden', 'true');

  // Close button row
  const closeRow = document.createElement('div');
  closeRow.className = 'header-nav-drawer-close';
  const closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Close navigation menu');
  closeBtn.innerHTML = '&times;';
  closeRow.append(closeBtn);

  // Primary nav links
  const drawerLinks = document.createElement('ul');
  drawerLinks.className = 'header-nav-drawer-links';
  navLinks.forEach((a) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = a.href;
    link.textContent = a.textContent;

    // Show overlay when a drawer link is clicked
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // Drawer might already be open with overlay active, but we ensure it here
      overlay.classList.add('active');
    });

    li.append(link);
    drawerLinks.append(li);
  });

  // Utility links
  const drawerUtility = document.createElement('ul');
  drawerUtility.className = 'header-nav-drawer-utility';
  utilityLinks.forEach((a) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = a.href;
    link.textContent = a.textContent;

    // Show overlay when a drawer utility link is clicked
    link.addEventListener('click', (e) => {
      e.preventDefault();
      overlay.classList.add('active');
    });

    li.append(link);
    drawerUtility.append(li);
  });

  const inner = document.createElement('div');
  inner.className = 'header-nav-drawer-inner';
  inner.append(closeRow, drawerLinks, drawerUtility);
  drawer.append(inner);
  block.append(drawer);

  const openDrawer = () => {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
  };

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    openDrawer();
  });

  closeBtn.addEventListener('click', closeDrawer);

  // Close drawer when clicking outside (on the overlay)
  overlay.addEventListener('click', closeDrawer);
}

/**
 * Loads and decorates the header block.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // Check if nav is already in the block
  let nav = block.querySelector('nav');
  if (!nav) {
    // Load nav as authored fragment (standard AEM pattern)
    const navMeta = getMetadata('nav');
    const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
    const fragment = await loadFragment(navPath);

    block.textContent = '';
    nav = document.createElement('nav');
    nav.id = 'nav';
    while (fragment && fragment.firstElementChild) nav.append(fragment.firstElementChild);
    block.append(nav);
  }

  // Ensure overlay exists inside block (needed for Shadow DOM CSS scoping)
  let overlay = block.querySelector('.overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    block.append(overlay);
  }

  // Dismiss overlay when clicked
  overlay.addEventListener('click', (e) => {
    e.stopPropagation();
    overlay.classList.remove('active');
  });

  // Locate the sections inside nav (standard AEM pattern)
  const sections = [...nav.querySelectorAll('.section')];
  if (sections.length === 0) return;

  // Use section 1 for top bar components
  const section1 = sections[0];
  // If only one section exists, we might need a different logic or just use it twice
  const section2 = sections.length > 1 ? sections[1] : null;

  // Build top bar and retrieve references to dynamic elements
  const { hamburger, searchMobile } = buildTopBar(section1, overlay);

  // Insert mobile search row after section 1 (it lives outside the flex row)
  if (searchMobile) {
    section1.after(searchMobile);
  }

  // Build primary nav row (usually from section 2, or part of section 1 if combined)
  const targetNavSection = section2 || section1;
  const navList = buildNavBar(targetNavSection, overlay);

  // Collect nav & utility anchors for the mobile drawer
  const navAnchors = navList ? [...navList.querySelectorAll('a')] : [];
  const utilityAnchors = [...(section1.querySelectorAll('.header-utility-links a'))];

  // Build the mobile slide-in drawer
  if (hamburger) {
    buildNavDrawer(block, navAnchors, utilityAnchors, hamburger, overlay);
  }
}
