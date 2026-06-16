const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function closeMenu() {
  document.body.classList.remove("nav-open");
  nav?.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");
}

navToggle?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("open") || false;
  document.body.classList.toggle("nav-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

function setActiveNav(sectionId) {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${sectionId}`;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function updateActiveNav() {
  if (sections.length === 0) return;

  const headerOffset = document.querySelector(".site-header")?.offsetHeight || 0;
  const activationLine = headerOffset + 48;
  const currentSection = sections.reduce((active, section) => {
    const top = section.getBoundingClientRect().top;
    return top <= activationLine ? section : active;
  }, sections[0]);

  setActiveNav(currentSection.id);
}

let navFrame = 0;

function requestActiveNavUpdate() {
  if (navFrame) return;

  navFrame = window.requestAnimationFrame(() => {
    navFrame = 0;
    updateActiveNav();
  });
}

window.addEventListener("scroll", requestActiveNavUpdate, { passive: true });
window.addEventListener("resize", requestActiveNavUpdate);
window.addEventListener("load", updateActiveNav);
window.addEventListener("hashchange", () => window.setTimeout(updateActiveNav, 120));
updateActiveNav();

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const code = document.getElementById(button.dataset.copy);
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code.textContent.trim());
      const originalText = button.textContent;
      button.textContent = "Copiato";
      window.setTimeout(() => {
        button.textContent = originalText;
      }, 1400);
    } catch {
      button.textContent = "Errore";
    }
  });
});

document.querySelectorAll("[data-endpoint][data-query]").forEach((button) => {
  button.addEventListener("click", () => {
    const code = document.getElementById(button.dataset.query);
    if (!code) return;

    const endpointUrl = new URL(button.dataset.endpoint);
    endpointUrl.searchParams.set("query", code.textContent.trim());
    window.open(endpointUrl.toString(), "_blank", "noopener");
  });
});

document.querySelectorAll("[data-explain]").forEach((button) => {
  button.addEventListener("click", () => {
    const explanation = document.getElementById(button.dataset.explain);
    if (!explanation) return;

    const isHidden = explanation.hidden;
    explanation.hidden = !isHidden;
    button.setAttribute("aria-expanded", String(isHidden));
    button.textContent = isHidden ? "Nascondi spiegazione" : "Spiega query";
  });
});

function refreshModelCarouselHeights(scope = document) {
  scope.querySelectorAll("[data-model-carousel]").forEach((carousel) => {
    carousel.updateModelHeight?.();
  });
}

function getActiveCase(caseCarousel) {
  return caseCarousel.querySelector(".prompt-case.is-active:not([hidden])");
}

function getActiveModelCarousel(caseCarousel) {
  return getActiveCase(caseCarousel)?.querySelector("[data-model-carousel]");
}

function getModelStatusText(modelCarousel) {
  if (!modelCarousel) return "1 / 3";

  const activeIndex = Number(modelCarousel.dataset.modelActiveIndex || 0);
  const modelCount = modelCarousel.querySelectorAll("[data-model-index]").length;
  return `${activeIndex + 1} / ${modelCount}`;
}

function updateSharedModelStatus(caseCarousel) {
  if (!caseCarousel) return;

  const status = caseCarousel.querySelector("[data-model-status]");
  const activeModelCarousel = getActiveModelCarousel(caseCarousel);

  if (status) {
    status.textContent = activeModelCarousel?.getModelStatus?.() || getModelStatusText(activeModelCarousel);
  }
}

function placeSharedModelHeader(caseCarousel) {
  const header = caseCarousel.querySelector("[data-shared-model-header]");
  const activeCase = getActiveCase(caseCarousel);
  const activeModelCarousel = activeCase?.querySelector("[data-model-carousel]");

  if (header) {
    header.hidden = !activeModelCarousel;
  }

  if (header && activeCase && activeModelCarousel && header.nextElementSibling !== activeModelCarousel) {
    activeCase.insertBefore(header, activeModelCarousel);
  }
}

document.querySelectorAll("[data-prompt-carousel]").forEach((carousel) => {
  const cases = Array.from(carousel.querySelectorAll("[data-case-index]"));
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const status = carousel.querySelector("[data-case-status]");
  const modelPreviousButton = carousel.querySelector("[data-model-prev]");
  const modelNextButton = carousel.querySelector("[data-model-next]");
  let activeIndex = cases.findIndex((item) => item.classList.contains("is-active"));

  if (activeIndex < 0) activeIndex = 0;

  function showCase(index) {
    activeIndex = (index + cases.length) % cases.length;

    cases.forEach((item, itemIndex) => {
      const isActive = itemIndex === activeIndex;
      item.hidden = !isActive;
      item.classList.toggle("is-active", isActive);
    });

    placeSharedModelHeader(carousel);

    window.requestAnimationFrame(() => {
      refreshModelCarouselHeights(cases[activeIndex]);
      updateSharedModelStatus(carousel);
    });

    if (status) {
      status.textContent = `${activeIndex + 1} / ${cases.length}`;
    }
  }

  function showCaseFromHash(shouldScroll = false) {
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    const targetIndex = cases.findIndex((item) => item.id === targetId);

    if (targetIndex < 0) return false;

    showCase(targetIndex);

    if (shouldScroll) {
      window.requestAnimationFrame(() => {
        cases[targetIndex].scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    return true;
  }

  previousButton?.addEventListener("click", () => {
    showCase(activeIndex - 1);
  });

  nextButton?.addEventListener("click", () => {
    showCase(activeIndex + 1);
  });

  modelPreviousButton?.addEventListener("click", () => {
    getActiveModelCarousel(carousel)?.showModelDelta?.(-1);
    updateSharedModelStatus(carousel);
  });

  modelNextButton?.addEventListener("click", () => {
    getActiveModelCarousel(carousel)?.showModelDelta?.(1);
    updateSharedModelStatus(carousel);
  });

  window.addEventListener("hashchange", () => {
    showCaseFromHash(true);
  });

  if (cases.length > 0) {
    if (!showCaseFromHash(true)) {
      showCase(activeIndex);
    }
  }
});

document.querySelectorAll("[data-model-carousel]").forEach((carousel) => {
  const track = carousel.querySelector(".model-carousel-track");
  const viewport = carousel.querySelector(".model-carousel-viewport");
  const panels = Array.from(carousel.querySelectorAll("[data-model-index]"));
  let activeIndex = panels.findIndex((item) => item.classList.contains("is-active"));

  if (activeIndex < 0) activeIndex = 0;

  function updateHeight() {
    const activePanel = panels[activeIndex];

    if (!viewport || !activePanel || carousel.closest("[hidden]")) return;

    viewport.style.height = `${activePanel.offsetHeight}px`;
  }

  function showModel(index) {
    if (!track || panels.length === 0) return;

    activeIndex = (index + panels.length) % panels.length;
    carousel.dataset.modelActiveIndex = String(activeIndex);
    track.style.transform = `translateX(-${activeIndex * 100}%)`;

    panels.forEach((item, itemIndex) => {
      const isActive = itemIndex === activeIndex;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-hidden", String(!isActive));
    });

    updateSharedModelStatus(carousel.closest("[data-prompt-carousel]"));

    updateHeight();
    window.setTimeout(updateHeight, 380);
  }

  carousel.updateModelHeight = updateHeight;
  carousel.showModelDelta = (delta) => showModel(activeIndex + delta);
  carousel.getModelStatus = () => `${activeIndex + 1} / ${panels.length}`;

  showModel(activeIndex);
});

window.addEventListener("resize", () => {
  refreshModelCarouselHeights();
});
