/* ===============================
   THEME TOGGLE & SYNC
=============================== */
(function () {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  
  // Sync UI icon and aria-label with the theme set in the head
  function syncThemeUI() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (themeIcon) {
      themeIcon.setAttribute('name', currentTheme === 'light' ? 'sunny-outline' : 'moon-outline');
      themeIcon.setAttribute('aria-label', currentTheme === 'light' ? 'sunny outline' : 'moon outline');
    }
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', currentTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncThemeUI);
  } else {
    syncThemeUI();
  }

  // Toggle handler
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      syncThemeUI();
    });
  }
})();

/* ===============================
   HAMBURGER + SIDEBAR
=============================== */
(function () {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  if (hamburger && sidebar && overlay) {
    const toggleSidebar = () => {
      hamburger.classList.toggle('active');
      sidebar.classList.toggle('show');
      overlay.classList.toggle('show');
    };

    hamburger.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    sidebar.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
      });
    });
  }
})();

/* ===============================
   RELEASES CAROUSEL
=============================== */
(async function () {
  const track = document.getElementById('release-track');
  if (!track) return;

  try {
    const response = await fetch('releases.json');
    if (!response.ok) throw new Error('Failed to load releases.json');
    const releases = await response.json();

    releases.forEach((release, i) => {
      const item = document.createElement('div');
      item.className = 'carousel-item';
      item.innerHTML = `
        <div class="card-inner">
          <div class="card-front">
            <img src="${release.image}" alt="${release.title}" loading="lazy">
          </div>
          <div class="card-back">
            <h3>${release.title}</h3>
            <a href="${release.link}" class="btn" target="_blank">Listen Now</a>
          </div>
        </div>
        <p class="card-caption">${i < releases.length - 1 ? "Swipe Next" : "End of List"}</p>
      `;
      track.appendChild(item);
    });

    const items = [...track.children];
    if (items.length === 0) return;

    let index = 0;
    let startX = 0;

    function update() {
      track.style.transform = `translateX(-${index * 100}%)`;
    }

    /* Swipe Controls */
    track.addEventListener("touchstart", e => startX = e.touches[0].clientX, { passive: true });
    track.addEventListener("touchend", e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        index = (index + (diff > 0 ? 1 : -1) + items.length) % items.length;
      }
      update();
      items.forEach(it => {
        const inner = it.querySelector('.card-inner');
        if (inner) inner.classList.remove('is-flipped');
      });
    });

    /* Card Flip */
    items.forEach(item => {
      const inner = item.querySelector('.card-inner');
      if (inner) {
        inner.addEventListener('click', e => {
          if (e.target.tagName !== 'A') {
            inner.classList.toggle('is-flipped');
          }
        });
      }
    });

    /* Auto Slide */
    setInterval(() => {
      index = (index + 1) % items.length;
      update();
      items.forEach(it => {
        const inner = it.querySelector('.card-inner');
        if (inner) inner.classList.remove('is-flipped');
      });
    }, 4000);

  } catch (err) {
    console.error(err);
    track.innerHTML = "<p style='color:var(--text-secondary);'>⚠️ Unable to load releases.</p>";
  }
})();

/* ===============================
   YOUTUBE CAROUSEL (WITH FALLBACK)
=============================== */
(async function () {
  const track = document.getElementById("youtube-track");
  if (!track) return;

  const channelID = "UCgqVuw9Oh9jBlmYlh03Q2aw";
  const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.youtube.com%2Ffeeds%2Fvideos.xml%3Fchannel_id%3D${channelID}`;

  let videos = [];
  try {
    const response = await fetch(rssUrl);
    const data = await response.json();
    if (data.status !== 'ok') throw new Error('Failed to fetch RSS');

    videos = data.items.map(item => {
      const videoId = item.guid.split(':')[2];
      return {
        id: videoId,
        title: item.title
      };
    });
  } catch (err) {
    console.warn("YouTube feed failed. Falling back to local videos.json:", err);
    try {
      const response = await fetch("videos.json");
      if (!response.ok) throw new Error('Failed to fetch videos.json');
      videos = await response.json();
    } catch (fallbackErr) {
      console.error("Fallback failed:", fallbackErr);
      track.innerHTML = "<p style='color:var(--text-secondary);'>⚠️ Unable to load latest videos.</p>";
      return;
    }
  }

  // Render videos
  track.innerHTML = "";
  videos.forEach(video => {
    const item = document.createElement("div");
    item.className = "youtube-item";
    item.innerHTML = `
      <div class="card">
        <div class="card-front">
          <img src="https://img.youtube.com/vi/${video.id}/hqdefault.jpg" loading="lazy" alt="${video.title}">
        </div>
        <div class="card-back">
          <a href="https://youtu.be/${video.id}" target="_blank" class="listen-btn">Listen Now</a>
        </div>
      </div>
    `;
    track.appendChild(item);
  });

  // Initialize 3D Tilt for new elements
  const tiltCards = track.querySelectorAll('.card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -15;
      const rotateY = ((x - centerX) / centerX) * 15;
      let baseRotateY = card.classList.contains('tap-flip') ? 180 : 0;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${baseRotateY + rotateY}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  const items = [...track.children];
  if (items.length === 0) return;

  let index = 0, startX = 0;

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  track.addEventListener("touchstart", e => startX = e.touches[0].clientX, { passive: true });
  track.addEventListener("touchend", e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      index = (index + (diff > 0 ? 1 : -1) + items.length) % items.length;
    }
    update();
  });

  setInterval(() => {
    index = (index + 1) % items.length;
    update();
  }, 4000);

  items.forEach(item => {
    const card = item.querySelector(".card");
    if (card) {
      card.addEventListener("click", () => {
        card.classList.toggle("tap-flip");
      });
    }
  });
})();

/* ===============================
   FAQ EXPAND
=============================== */
document.querySelectorAll(".faq-question").forEach(btn => {
  btn.addEventListener("click", () => btn.classList.toggle("active"));
});

/* ===============================
   SCROLL TO TOP
=============================== */
(function () {
  const scrollTopBtn = document.getElementById("scrollTop");
  if (scrollTopBtn) {
    window.addEventListener("scroll", () => {
      scrollTopBtn.classList.toggle("show", window.scrollY > 300);
    });

    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();

/* ===============================
   3D TILT EFFECT FOR STATIC CARDS
=============================== */
document.querySelectorAll('.card-inner').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;
    let baseRotateY = card.classList.contains('is-flipped') ? 180 : 0;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${baseRotateY + rotateY}deg)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ===============================
   SCROLL FADE-IN ANIMATION
=============================== */
document.addEventListener("DOMContentLoaded", () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
  });
});
