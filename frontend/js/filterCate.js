function initRecipeFilters() {
  const filterRating = document.getElementById('filterRating');
  const filterCategory = document.getElementById('filterCategory');
  const filterRegion = document.getElementById('filterRegion');
  const filterSort = document.getElementById('filterSort');
  const clearBtn = document.getElementById('clearFilters');
  const grid = document.getElementById('recipesGridA'); // <-- correct ID

  if (!grid || !clearBtn || !filterRating || !filterCategory || !filterRegion || !filterSort) return;

  function applyFilters() {
    const cards = Array.from(grid.querySelectorAll('.recipe-card'));
    let filteredCards = [...cards];

    if (filterRating.value) {
      filteredCards = filteredCards.filter(card =>
        Number(card.dataset.rating) >= Number(filterRating.value)
      );
    }

    if (filterCategory.value) {
      filteredCards = filteredCards.filter(card =>
        card.dataset.category.toLowerCase() === filterCategory.value.toLowerCase()
      );
    }

    if (filterRegion.value) {
      filteredCards = filteredCards.filter(card =>
        card.dataset.region.toLowerCase() === filterRegion.value.toLowerCase()
      );
    }

    if (filterSort.value) {
      filteredCards.sort((a, b) =>
        filterSort.value === 'latest'
          ? new Date(b.dataset.date) - new Date(a.dataset.date)
          : new Date(a.dataset.date) - new Date(b.dataset.date)
      );
    }

    grid.innerHTML = '';
    filteredCards.forEach(card => grid.appendChild(card));
  }

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
}
