const TOTAL_FRAMES = 300;
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
    // Pause at full text before deleting
    speed = 2400;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    // Pause at empty text before typing again
    isDeleting = false;
    speed = 600;
  } else {
    charIndex += isDeleting ? -1 : 1;
  }

  typewriterTimeout = setTimeout(loopTypewriter, speed);
}

// Format frame index: e.g. 1 -> "/Background/ezgif-frame-001.png"
function getFramePath(index) {
  const paddedIndex = String(index).padStart(3, '0');
  return `/Background/ezgif-frame-${paddedIndex}.png`;
}

// Adjust canvas resolution for High-DPI (Retina) displays
function updateCanvasSize() {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  // Render current frame immediately on resize
  drawFrame(Math.round(currentFrame));
}

// Calculate cover mode positioning (keeps image aspect ratio filled across screen)
function drawFrame(frameIndex) {
  if (!images[frameIndex] || !images[frameIndex].complete) return;

  const dpr = window.devicePixelRatio || 1;
  const canvasW = window.innerWidth;
  const canvasH = window.innerHeight;
  const img = images[frameIndex];

  const imgW = img.naturalWidth || 1920;
  const imgH = img.naturalHeight || 1080;

  // Object-fit cover scaling math
  const scale = Math.max(canvasW / imgW, canvasH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const x = (canvasW - drawW) / 2;
  const y = (canvasH - drawH) / 2;

  // Reset transform and clear
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

// Preload all 300 frames into memory
function preloadImages() {
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    const src = getFramePath(i);
    
    img.onload = () => {
      onImageLoad();
    };
    img.onerror = () => {
      console.warn(`Failed to load frame: ${src}`);
      onImageLoad(); // Prevent locking
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

  // Fade out loader smoothly
  if (loader) {
    loader.classList.add('loaded');
  }

  // Start infinite looping typewriter animation
  setTimeout(loopTypewriter, 300);

  // Initial Navbar background state check
  updateNavbarBackground();

  // Start smooth 3D animation loop
  requestAnimationFrame(animate);
}

// Mobile Navigation Toggle
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  // Close menu when clicking a link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
    });
  });
}

// Event Listeners
window.addEventListener('scroll', () => {
  updateTargetFrame();
  updateActiveNavLink();
  updateNavbarBackground();
}, { passive: true });

window.addEventListener('resize', () => {
  updateCanvasSize();
  updateTargetFrame();
  updateActiveNavLink();
  updateNavbarBackground();
});

// Initialize Preloading & Setup
updateCanvasSize();
preloadImages();
