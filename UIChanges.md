# UI Improvement: Replace "යළි පූරණය" Button with a Floating Refresh Button

## Objective

Improve the mobile user experience by:

- Removing the large **"යළි පූරණය" (Reload)** button from the main content.
- Adding a **Floating Refresh Action Button (FAB)** fixed to the bottom-right corner.
- Keeping the refresh button visible while scrolling.
- Saving vertical space and allowing users to refresh from anywhere on the page.

---

# 1. Remove the Existing Refresh Button

Delete (or comment out) the current reload button.

Example:

```html
<!-- Remove this -->
<button id="reloadBtn" class="reload-btn">
    ↻ යළි පූරණය
</button>
```

or remove the entire container if it exists.

---

# 2. Add Floating Refresh Button

Place this **once**, preferably just before the closing `</body>` tag.

```html
<button
    id="floatingRefreshBtn"
    class="floating-refresh-btn"
    aria-label="Refresh"
    title="Refresh Page"
>
    <i class="fas fa-rotate-right"></i>
</button>
```

If you are not using Font Awesome:

```html
<button
    id="floatingRefreshBtn"
    class="floating-refresh-btn"
    aria-label="Refresh"
    title="Refresh Page"
>
    ↻
</button>
```

---

# 3. CSS

```css
.floating-refresh-btn {
    position: fixed;
    right: 20px;
    bottom: 25px;

    width: 58px;
    height: 58px;

    border: none;
    border-radius: 50%;

    background: #d89b8d;
    color: #fff;

    font-size: 22px;
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    box-shadow: 0 6px 18px rgba(0,0,0,0.25);

    z-index: 9999;

    transition: all .25s ease;
}

.floating-refresh-btn:hover {
    transform: scale(1.08);
}

.floating-refresh-btn:active {
    transform: scale(0.95);
}

@media (max-width:768px) {
    .floating-refresh-btn{
        right:18px;
        bottom:22px;

        width:56px;
        height:56px;
    }
}
```

---

# 4. JavaScript

```javascript
const refreshBtn = document.getElementById("floatingRefreshBtn");

refreshBtn.addEventListener("click", () => {
    window.location.reload();
});
```

---

# 5. (Optional) Rotate Icon While Refreshing

```javascript
const refreshBtn = document.getElementById("floatingRefreshBtn");

refreshBtn.addEventListener("click", () => {

    refreshBtn.style.transform = "rotate(360deg)";
    refreshBtn.style.transition = "0.5s";

    setTimeout(() => {
        location.reload();
    }, 300);

});
```

---

# 6. Recommended Position

```
                 ┌───────────────┐
                 │               │
                 │               │
                 │   Content     │
                 │               │
                 │               │
                 │               │
                 │            ↻  │
                 └───────────────┘
                     Bottom Right
```

- Position: Fixed
- Bottom: 20–25px
- Right: 18–20px
- Always visible while scrolling
- Does not affect page layout

---

# Benefits

- Saves a large amount of vertical space.
- Refresh button is always accessible.
- Better mobile UX.
- Cleaner interface.
- Modern Material Design style.
- Users no longer need to scroll back to the top to refresh the content.

---

# Final Result

### Before

```
Message Input

[ Submit ]

Statistics

[ යළි පූරණය ]

Message List
```

### After

```
Message Input

[ Submit ]

Statistics

Message List







                    ○↻
```

The floating refresh button stays fixed at the bottom-right corner even while the user scrolls through the messages.