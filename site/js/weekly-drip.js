(() => {
  const categoryTabs = document.getElementById('dripCategoryTabs');
  const categorySections = document.getElementById('dripCategorySections');
  const updated = document.getElementById('dripUpdated');
  const status = document.getElementById('dripStatus');
  const number = new Intl.NumberFormat('en-CA');

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const relativeDate = (iso) => {
    const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const formatUpdated = (iso) => {
    if (!iso) return 'Waiting for first automatic refresh';
    return new Intl.DateTimeFormat('en-CA', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(new Date(iso));
  };

  const videoCard = (video, index) => `
    <article class="drip-video-card">
      <a class="drip-thumb" href="${escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer" aria-label="Watch ${escapeHtml(video.title)} on YouTube">
        <img src="${escapeHtml(video.thumbnail)}" alt="" loading="lazy" width="640" height="360">
        <span class="drip-rank">${String(index + 1).padStart(2, '0')}</span>
        <span class="drip-duration">${escapeHtml(video.duration)}</span>
      </a>
      <div class="drip-card-body">
        <span class="drip-topic">${escapeHtml(video.primaryTopic)}</span>
        <h3><a href="${escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(video.title)}</a></h3>
        <p class="drip-channel">${escapeHtml(video.channelTitle)}</p>
        <div class="drip-stats">
          <span>${number.format(video.views)} views</span>
          <span>${number.format(video.viewsPerDay)}/day</span>
          <span>${relativeDate(video.publishedAt)}</span>
        </div>
      </div>
    </article>`;

  const categorySection = (category) => `
    <section class="drip-category" id="drip-${escapeHtml(category.id)}" data-drip-category="${escapeHtml(category.id)}">
      <div class="drip-category-head">
        <div>
          <p class="drip-kicker">TOP 10 THIS WEEK</p>
          <h2>${escapeHtml(category.name)}</h2>
          <p>${escapeHtml(category.description)}</p>
        </div>
        <a href="#drip-top" class="drip-back">Back to categories ↑</a>
      </div>
      ${category.topics?.length ? `<div class="drip-pulse" aria-label="Trending topics">${category.topics.map((topic, i) => `<span class="drip-pulse-item"><b>${String(i + 1).padStart(2, '0')}</b> ${escapeHtml(topic.label)}</span>`).join('')}</div>` : ''}
      <div class="drip-video-grid">
        ${(category.videos || []).map(videoCard).join('')}
      </div>
    </section>`;

  const setFilter = (id) => {
    document.querySelectorAll('[data-drip-category]').forEach((section) => {
      section.hidden = id !== 'all' && section.dataset.dripCategory !== id;
    });
    document.querySelectorAll('[data-drip-filter]').forEach((button) => {
      button.classList.toggle('active', button.dataset.dripFilter === id);
      button.setAttribute('aria-pressed', button.dataset.dripFilter === id ? 'true' : 'false');
    });
  };

  fetch('/data/weekly-drip.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      updated.textContent = formatUpdated(data.updatedAt);
      const categories = (data.categories || []).filter((category) => category.videos?.length);
      if (!categories.length) {
        status.hidden = false;
        status.innerHTML = '<strong>Weekly Drip is installed.</strong><br>The first video batch will appear after the GitHub workflow runs with a YouTube API key.';
        return;
      }

      categoryTabs.innerHTML = `<button type="button" data-drip-filter="all" class="active" aria-pressed="true">All Categories</button>` + categories.map((category) => `<button type="button" data-drip-filter="${escapeHtml(category.id)}" aria-pressed="false">${escapeHtml(category.name)}</button>`).join('');
      categorySections.innerHTML = categories.map(categorySection).join('');
      status.hidden = true;

      document.querySelectorAll('[data-drip-filter]').forEach((button) => {
        button.addEventListener('click', () => setFilter(button.dataset.dripFilter));
      });
      setFilter('all');
    })
    .catch((error) => {
      console.error(error);
      status.hidden = false;
      status.textContent = 'Weekly Drip could not load its latest data. Please try again shortly.';
    });

})();
