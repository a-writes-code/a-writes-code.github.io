import { initBrainPhysics } from "./brain-physics.js";
import { initProjectAnimations } from "./project-animations.js";

document.documentElement.classList.add("js");
document.querySelector("#year").textContent = new Date().getFullYear();

const themeButton = document.querySelector(".theme-toggle");
function syncThemeLabel() {
  const dark =
    getComputedStyle(document.documentElement).colorScheme === "dark";
  themeButton.setAttribute(
    "aria-label",
    `Switch to ${dark ? "light" : "dark"} theme`,
  );
  const color = getComputedStyle(document.documentElement)
    .getPropertyValue("--paper")
    .trim();
  document
    .querySelector('meta[name="theme-color"]')
    .setAttribute("content", color);
}
themeButton.addEventListener("click", () => {
  const dark =
    getComputedStyle(document.documentElement).colorScheme === "dark";
  const next = dark ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("aritra-theme", next);
  } catch {
    /* The theme still works when storage is disabled. */
  }
  syncThemeLabel();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener(
  "change",
  syncThemeLabel,
);
syncThemeLabel();

const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector("#main-nav");
function closeMenu() {
  nav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
}
menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("open", open);
});
nav
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav.classList.contains("open")) {
    closeMenu();
    menuButton.focus();
  }
});
matchMedia("(min-width: 961px)").addEventListener("change", (event) => {
  if (event.matches) closeMenu();
});

const filters = [...document.querySelectorAll("[data-filter]")];
const cards = [...document.querySelectorAll(".research-card")];
filters.forEach((button) =>
  button.addEventListener("click", () => {
    const topic = button.dataset.filter;
    filters.forEach((filter) => {
      const selected = filter === button;
      filter.classList.toggle("active", selected);
      filter.setAttribute("aria-pressed", String(selected));
    });
    let count = 0;
    cards.forEach((card) => {
      const visible =
        topic === "all" || card.dataset.topics.split(" ").includes(topic);
      card.hidden = !visible;
      if (visible) count++;
    });
    document.querySelector("#research-count").textContent =
      `${count} research direction${count === 1 ? "" : "s"}`;
  }),
);

let copyTimeout;
document
  .querySelector(".copy-email")
  ?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const status = document.querySelector(".copy-status");
    clearTimeout(copyTimeout);
    try {
      await navigator.clipboard.writeText(button.dataset.email);
      status.textContent = "Copied!";
    } catch {
      status.textContent = "Select the email address to copy it.";
    }
    copyTimeout = setTimeout(() => {
      status.textContent = "";
    }, 4000);
  });

const navLinks = [...nav.querySelectorAll("a")];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach((link) => {
        if (link.hash === `#${entry.target.id}`)
          link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
  },
  { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
);
document
  .querySelectorAll("main>section[id]")
  .forEach((section) => sectionObserver.observe(section));

initBrainPhysics();
initProjectAnimations();

const publicationSearch = document.querySelector("#publication-search");
const publicationYear = document.querySelector("#publication-year");
function filterPublications() {
  const query = publicationSearch.value.trim().toLocaleLowerCase();
  const year = publicationYear.value;
  let count = 0;
  document.querySelectorAll(".publication-item").forEach((item) => {
    const visible =
      (year === "all" || item.dataset.year === year) &&
      item.textContent.toLocaleLowerCase().includes(query);
    item.hidden = !visible;
    if (visible) count++;
  });
  document.querySelector("#publication-count").textContent =
    `${count} work${count === 1 ? "" : "s"}`;
  document.querySelector("#publication-empty").hidden = count > 0;
}
publicationSearch?.addEventListener("input", filterPublications);
publicationYear?.addEventListener("change", filterPublications);
