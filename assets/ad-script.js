const icons = document.querySelectorAll(
    ".cart--icon, .rohe-search-icon, .wishlist-icon, .menu-inverse-icon"
);

const inverseIcons = document.querySelectorAll(
    ".menu-icon, .cart-inverse-icon, .wishlist-inverse-icon, .rohe-inverse-search-icon"
);

const handleScroll = () => {
    const isScrolled = window.scrollY > 25;

    inverseIcons.forEach(icon => {
        icon.style.display = isScrolled ? "block" : "none";
    });

    icons.forEach(icon => {
        icon.style.display = isScrolled ? "none" : "block";
    });
};

handleScroll();
window.addEventListener("scroll", handleScroll);
