const TOTAL_FRAMES = 230;
const LERP_FACTOR = 0.09; // Smooth inertia factor for canvas scrubbing

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const loader = document.getElementById('loader');

const images = [];
let loadedCount = 0;
let targetFrame = 0;
let currentFrame = 0;
let isLoaded = false;
let isIntroFinished = false;
let imagesReady = false;

// Minimal Developer Workspace Initializing Intro Controller
function startWorkspaceIntro() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    isIntroFinished = true;
    checkCompleteAndTransition();
    return;
  }

  // Phase 1: INITIALIZING state & progress line
  // Phase 2 (0.3s): Soft ambient lighting glow activates behind center
  setTimeout(() => {
    if (loader) loader.classList.add('phase-2-active');
  }, 350);

  // Minimum intro timing before transition (~1.2s - 1.5s) for smooth fast feel
  setTimeout(() => {
    isIntroFinished = true;
    checkCompleteAndTransition();
  }, 1250);
}

function checkCompleteAndTransition() {
  if (isIntroFinished && imagesReady) {
    if (loader && !loader.classList.contains('loaded')) {
      loader.classList.add('loaded');
      setTimeout(loopTypewriter, 300);
    }
  }
}

// Infinite Looping Typing Animation State
const textToType = "Senior .NET Full Stack Developer (C#)";
const typedTitleEl = document.getElementById('typed-title');
let charIndex = 0;
let isDeleting = false;
let typewriterTimeout = null;

function loopTypewriter() {
  if (!typedTitleEl) return;

  const currentSubstring = textToType.substring(0, charIndex);
  typedTitleEl.textContent = currentSubstring;

  let speed = isDeleting ? 35 : 65;

  if (!isDeleting && charIndex === textToType.length) {
    speed = 2400;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    speed = 600;
  } else {
    charIndex += isDeleting ? -1 : 1;
  }

  typewriterTimeout = setTimeout(loopTypewriter, speed);
}

// Format frame index: e.g. 1 -> "Background/ezgif-frame-001.png"
function getFramePath(index) {
  const paddedIndex = String(index).padStart(3, '0');
  const base = import.meta.env.BASE_URL ? (import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/') : './';
  return `${base}Background/ezgif-frame-${paddedIndex}.png`;
}

// Adjust canvas resolution for High-DPI (Retina) displays
function updateCanvasSize() {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  drawFrame(Math.round(currentFrame));
}

// Calculate cover mode positioning
function drawFrame(frameIndex) {
  if (!images[frameIndex] || !images[frameIndex].complete) return;

  const dpr = window.devicePixelRatio || 1;
  const canvasW = window.innerWidth;
  const canvasH = window.innerHeight;
  const img = images[frameIndex];

  const imgW = img.naturalWidth || 1920;
  const imgH = img.naturalHeight || 1080;

  const scale = Math.max(canvasW / imgW, canvasH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const x = (canvasW - drawW) / 2;
  const y = (canvasH - drawH) / 2;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.drawImage(img, x, y, drawW, drawH);
}

// Calculate target frame index from total page scroll position
function updateTargetFrame() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return;

  const scrollFraction = Math.max(0, Math.min(1, window.scrollY / maxScroll));
  targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
}

// Toggle Navbar background from About section downwards
function updateNavbarBackground() {
  const navbar = document.getElementById('navbar');
  const aboutSection = document.getElementById('about');
  if (!navbar || !aboutSection) return;

  const aboutTop = aboutSection.offsetTop - 120;
  if (window.scrollY >= aboutTop) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

// Highlight active section in sticky navigation header cleanly
function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY = window.scrollY;
  const viewMid = scrollY + window.innerHeight / 3;

  sections.forEach(current => {
    const sectionHeight = current.offsetHeight;
    const sectionTop = current.offsetTop - 100;
    const sectionId = current.getAttribute('id');
    const navLink = document.querySelector(`.nav-menu a[href*="#${sectionId}"]`);

    if (navLink) {
      if (viewMid >= sectionTop && viewMid < sectionTop + sectionHeight) {
        navLink.classList.add('active');
      } else {
        navLink.classList.remove('active');
      }
    }
  });
}

// Animation loop with Linear Interpolation (LERP) for silky smooth 3D scrubbing
function animate() {
  const diff = targetFrame - currentFrame;
  if (Math.abs(diff) > 0.0001) {
    currentFrame += diff * LERP_FACTOR;
  } else {
    currentFrame = targetFrame;
  }

  const renderIndex = Math.round(currentFrame);
  drawFrame(renderIndex);

  requestAnimationFrame(animate);
}

// Preload all frames into memory
function preloadImages() {
  // Safety timeout: Ensure intro never stalls permanently if network stalls
  setTimeout(() => {
    if (!imagesReady) {
      console.warn("Preload safety timeout reached; forcing transition to homepage.");
      imagesReady = true;
      checkCompleteAndTransition();
    }
  }, 4500);

  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    const src = getFramePath(i);
    
    img.onload = () => {
      onImageLoad();
    };
    img.onerror = () => {
      console.warn(`Failed to load frame: ${src}`);
      onImageLoad();
    };
    
    img.src = src;
    images.push(img);
  }
}

function onImageLoad() {
  loadedCount++;
  const percentage = Math.min(100, Math.floor((loadedCount / TOTAL_FRAMES) * 100));

  if (progressBar) progressBar.style.width = `${percentage}%`;
  if (progressText) progressText.innerText = `${percentage}%`;

  if (loadedCount === 1) {
    // Immediately render frame 1 behind dark overlay so workspace background is ready
    drawFrame(0);
  }

  if (loadedCount === TOTAL_FRAMES && !isLoaded) {
    isLoaded = true;
    onAllImagesLoaded();
  }
}

function onAllImagesLoaded() {
  updateCanvasSize();
  updateTargetFrame();
  currentFrame = targetFrame;
  drawFrame(Math.round(currentFrame));

  imagesReady = true;

  updateNavbarBackground();
  requestAnimationFrame(animate);

  checkCompleteAndTransition();
}

// Mobile Navigation Toggle
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
    });
  });
}

// Proportional Desktop Canvas Scaling for Mobile Viewports
function updateViewportScaling() {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;

  const screenWidth = window.screen.width || window.innerWidth;
  if (screenWidth < 1120) {
    const targetWidth = 1120;
    const scale = (screenWidth / targetWidth).toFixed(4);
    meta.setAttribute('content', `width=${targetWidth}, initial-scale=${scale}, maximum-scale=3.0, user-scalable=yes`);
  } else {
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0');
  }
}

// Initialize viewport scaling
updateViewportScaling();

// Event Listeners
window.addEventListener('scroll', () => {
  updateTargetFrame();
  updateActiveNavLink();
  updateNavbarBackground();
}, { passive: true });

window.addEventListener('resize', () => {
  updateViewportScaling();
  updateCanvasSize();
  updateTargetFrame();
  updateActiveNavLink();
  updateNavbarBackground();
});

// Initialize Preloading & Workspace Intro Sequence
updateCanvasSize();
startWorkspaceIntro();
preloadImages();
