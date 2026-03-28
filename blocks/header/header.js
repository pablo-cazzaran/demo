import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  if (block.textContent === '') {
    // load nav as fragment
    const navMeta = getMetadata('nav');
    const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
    const fragment = await loadFragment(navPath);

    // decorate nav DOM
    block.textContent = '';
    const nav = document.createElement('nav');
    nav.id = 'nav';
    while (fragment.firstElementChild) nav.append(fragment.firstElementChild);
    block.append(nav);
  }

  // Create overlay element if it doesn't exist
  let overlay = block.querySelector('.overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    block.append(overlay);
  }

  // Add click event to the header block to toggle the dim overlay
  block.addEventListener('click', () => {
    overlay.classList.toggle('active');
  });

  // Optional: Clicking the overlay dismisses the dim effect
  overlay.addEventListener('click', () => {
    overlay.classList.remove('active');
  });
}
