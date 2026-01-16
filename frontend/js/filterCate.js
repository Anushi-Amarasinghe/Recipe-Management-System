document.addEventListener('DOMContentLoaded', () => {
  const filterRating = document.getElementById('filterRating');
  const filterCategory = document.getElementById('filterCategory');
  const filterRegion = document.getElementById('filterRegion');
  const filterSort = document.getElementById('filterSort');
  const clearBtn = document.getElementById('clearFilters');

  const grid = document.getElementById('recipesGrid');
  const cards = Array.from(document.querySelectorAll('.recipe-card'));

  function applyFilters() {
    let filteredCards = [...cards];

    // Filter by Rating
    if (filterRating.value) {
      filteredCards = filteredCards.filter(card =>
        Number(card.dataset.rating) >= Number(filterRating.value)
      );
    }

    // Filter by Category
    if (filterCategory.value) {
      filteredCards = filteredCards.filter(card =>
        card.dataset.category === filterCategory.value
      );
    }

    // Filter by Region
    if (filterRegion.value) {
      filteredCards = filteredCards.filter(card =>
        card.dataset.region === filterRegion.value
      );
    }

    // Sort by Latest / Oldest
    if (filterSort.value) {
      filteredCards.sort((a, b) => {
        const dateA = new Date(a.dataset.date);
        const dateB = new Date(b.dataset.date);

        return filterSort.value === 'latest'
          ? dateB - dateA
          : dateA - dateB;
      });
    }

    // Render results
    grid.innerHTML = '';
    filteredCards.forEach(card => grid.appendChild(card));
  }

  // Event listeners
  filterRating.addEventListener('change', applyFilters);
  filterCategory.addEventListener('change', applyFilters);
  filterRegion.addEventListener('change', applyFilters);
  filterSort.addEventListener('change', applyFilters);

  clearBtn.addEventListener('click', () => {
    filterRating.value = '';
    filterCategory.value = '';
    filterRegion.value = '';
    filterSort.value = '';
    applyFilters();
  });
});
