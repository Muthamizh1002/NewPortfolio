// Ensure full browser reloads always start at Home section
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);
if (window.location.hash) {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

const TOTAL_FRAMES = 230;
const LERP_FACTOR = 0.09; // Smooth inertia factor for canvas scrubbing
const MAX_CONCURRENT_DOWNLOADS = 4;

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const loader = document.getElementById('loader');

const images = new Array(TOTAL_FRAMES).fill(null);
const loadedFrames = new Set();
const loadingFrames = new Set();

let loadedCount = 0;
let targetFrame = 0;
let currentFrame = 0;
let isIntroFinished = false;
let imagesReady = false;
let isAnimRunning = false;
let lastDrawnIndex = -1;

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

// Find closest already-loaded frame index to guarantee continuous smooth scrolling without freezes
function getBestAvailableFrame(index) {
  if (loadedFrames.has(index)) return index;

  let offset = 1;
  while (offset < TOTAL_FRAMES) {
    const prev = index - offset;
    if (prev >= 0 && loadedFrames.has(prev)) return prev;

    const next = index + offset;
    if (next < TOTAL_FRAMES && loadedFrames.has(next)) return next;

    offset++;
  }
  return null;
}

// Adjust canvas resolution for High-DPI (Retina) displays
function updateCanvasSize() {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  drawFrame(Math.round(currentFrame), true);
}

// Calculate cover mode positioning and draw image
function drawFrame(frameIndex, forceRedraw = false) {
  const bestIndex = getBestAvailableFrame(frameIndex);
  if (bestIndex === null || !images[bestIndex]) return;

  if (!forceRedraw && bestIndex === lastDrawnIndex) return;

  const dpr = window.devicePixelRatio || 1;
  const canvasW = window.innerWidth;
  const canvasH = window.innerHeight;
  const img = images[bestIndex];

  const imgW = img.naturalWidth || 1920;
  const imgH = img.naturalHeight || 1080;

  const scale = Math.max(canvasW / imgW, canvasH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const x = (canvasW - drawW) / 2;
  const y = (canvasH - drawH) / 2;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.drawImage(img, x, y, drawW, drawH);
  lastDrawnIndex = bestIndex;
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

// Priority-based queue logic for controlled progressive preloading
function getNextFrameToLoad() {
  // Priority 1: Current target frame & nearby frames (targetFrame +/- 5)
  const roundedTarget = Math.round(targetFrame);
  for (let offset = 0; offset <= 5; offset++) {
    const candidate1 = roundedTarget + offset;
    if (candidate1 >= 0 && candidate1 < TOTAL_FRAMES && !loadedFrames.has(candidate1) && !loadingFrames.has(candidate1)) {
      return candidate1;
    }
    const candidate2 = roundedTarget - offset;
    if (candidate2 >= 0 && candidate2 < TOTAL_FRAMES && !loadedFrames.has(candidate2) && !loadingFrames.has(candidate2)) {
      return candidate2;
    }
  }

  // Priority 2: Nearby initial frames (0 to 10)
  for (let i = 0; i <= 10; i++) {
    if (i < TOTAL_FRAMES && !loadedFrames.has(i) && !loadingFrames.has(i)) {
      return i;
    }
  }

  // Priority 3: Evenly spaced keyframes (every 10 frames)
  for (let i = 0; i < TOTAL_FRAMES; i += 10) {
    if (!loadedFrames.has(i) && !loadingFrames.has(i)) {
      return i;
    }
  }

  // Priority 4: Remaining frames in sequence order
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    if (!loadedFrames.has(i) && !loadingFrames.has(i)) {
      return i;
    }
  }

  return null;
}

function processQueue() {
  while (loadingFrames.size < MAX_CONCURRENT_DOWNLOADS) {
    const nextIndex = getNextFrameToLoad();
    if (nextIndex === null) break;
    loadFrame(nextIndex);
  }
}

function loadFrame(index) {
  loadingFrames.add(index);
  const img = new Image();
  const src = getFramePath(index + 1);

  const onComplete = () => {
    loadingFrames.delete(index);
    images[index] = img;
    loadedFrames.add(index);
    onImageLoad(index);
    processQueue();
  };

  img.onload = () => {
    if ('decode' in img) {
      img.decode().then(onComplete).catch(onComplete);
    } else {
      onComplete();
    }
  };

  img.onerror = () => {
    console.warn(`Failed to load frame: ${src}`);
    loadingFrames.delete(index);
    processQueue();
  };

  img.src = src;
}

function onImageLoad(index) {
  loadedCount++;
  const percentage = Math.min(100, Math.floor((loadedCount / TOTAL_FRAMES) * 100));

  if (progressBar) progressBar.style.width = `${percentage}%`;
  if (progressText) progressText.innerText = `${percentage}%`;

  // As soon as Frame 0 is loaded and decoded, render immediately & unblock intro
  if (index === 0 || loadedFrames.has(0)) {
    if (lastDrawnIndex === -1) {
      drawFrame(0, true);
    }
    if (!imagesReady) {
      imagesReady = true;
      checkCompleteAndTransition();
    }
  }

  // Ensure scrubbing animation loop starts as soon as initial frame is ready
  if (!isAnimRunning && loadedCount >= 1) {
    isAnimRunning = true;
    requestAnimationFrame(animate);
  }
}

// Preload frames using controlled concurrent priority queue
function preloadImages() {
  // Safety timeout: Ensure intro never stalls permanently if network stalls
  setTimeout(() => {
    if (!imagesReady) {
      console.warn("Preload safety timeout reached; forcing transition to homepage.");
      imagesReady = true;
      checkCompleteAndTransition();
    }
  }, 4500);

  processQueue();
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
  processQueue();
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

