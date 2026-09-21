/* =========================================================
   KARIGO BACKEND CONFIGURATION
   ========================================================= */
const API_BASE_URL = (
    window.KARIGO_API_BASE_URL ||
    document.documentElement.dataset.apiBaseUrl ||
    `${window.location.protocol === "file:" ? "http:" : window.location.protocol}//${window.location.hostname || "127.0.0.1"}:8000`
).replace(/\/$/, "");
async function loadProducts() {
    try {
        console.log("Loading products...");
        const products = await apiRequest("/api/products/");
        console.log("Products received:", products);
        renderBuyerProducts(products);
        return products;
    } catch (error) {
        console.error("Failed to load products:", error);
        showToast("Unable to load products.");
        return [];
    }
}
function renderBuyerProducts(products) {
    const grid = document.getElementById("buyerProductGrid");
    if (!grid) {
        console.error("buyerProductGrid not found");
        return;
    }
    grid.innerHTML = "";
    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div style="padding: 30px; text-align: center;">
                <h3>No products available</h3>
                <p>Artisans have not added products yet.</p>
            </div>
        `;
        updateProductResultCount(0);
        return;
    }
    products.forEach(product => {
        const name =
            product.name || "Handmade Product";
        const description =
            product.description ||
            "Beautiful handmade product created by a skilled artisan.";
        const category =
            product.category ||
            "Handicrafts";
        const price =
            product.price !== null &&
                product.price !== undefined
                ? product.price
                : 0;
        const quantity =
            product.quantity !== null &&
                product.quantity !== undefined
                ? product.quantity
                : 0;
        const imageUrl =
            product.image_url || "";
        const categorySlug =
            getProductCategorySlug(category);
        const card = document.createElement("article");
        card.className = "buyer-product-card";
        card.dataset.category = categorySlug;
        card.dataset.name = name;
        card.innerHTML = `
            <div class="buyer-product-image">
                ${imageUrl
                ? `<img src="${imageUrl}"
                               alt="${escapeHtml(name)}"
                               style="width:100%;height:100%;object-fit:cover;">`
                : `<span style="font-size:50px;">✦</span>`
            }
                <span class="product-badge">
                    Handmade
                </span>
            </div>
            <div class="buyer-product-info">
                <small>
                    ${escapeHtml(category)}
                </small>
                <h3>
                    ${escapeHtml(name)}
                </h3>
                <p>
                    ${escapeHtml(description)}
                </p>
                <div class="buyer-product-bottom">
                    <strong>
                        ₹${Number(price).toLocaleString("en-IN")}
                    </strong>
                    <button
                        class="cart-add-btn"
                        data-product="${escapeHtml(name)}"
                        data-price="${price}"
                        data-product-id="${product.id}"
                        data-category="${escapeHtml(category)}"
                        data-material="${escapeHtml(product.material || "")}"
                        data-region="${escapeHtml(product.region || "")}"
                    >
                        + Cart
                    </button>
                </div>
                <button
                    class="buy-now-btn"
                    data-product="${escapeHtml(name)}"
                    data-product-id="${product.id}"
                >
                    Buy Now →
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
    updateProductResultCount(products.length);
}
function getProductCategorySlug(category) {
    const value = String(category || "").toLowerCase();
    if (
        value.includes("pottery") ||
        value.includes("ceramic")
    ) {
        return "pottery";
    }
    if (
        value.includes("textile") ||
        value.includes("handloom") ||
        value.includes("cloth")
    ) {
        return "textiles";
    }
    if (
        value.includes("bamboo") ||
        value.includes("cane") ||
        value.includes("jute")
    ) {
        return "bamboo";
    }
    if (
        value.includes("wood")
    ) {
        return "wood";
    }
    if (
        value.includes("jewellery") ||
        value.includes("jewelry")
    ) {
        return "jewellery";
    }
    return "other";
}
function updateProductResultCount(count) {
    const resultCount =
        document.getElementById("productResultCount");
    if (!resultCount) {
        return;
    }
    resultCount.textContent =
        `${count} product${count !== 1 ? "s" : ""}`;
}
function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
/* =========================================================
   KARIGO API HELPER
   ========================================================= */
async function apiRequest(endpoint, options = {}) {
    const token =
        localStorage.getItem("karigoToken");
    const headers = {
        ...(options.headers || {})
    };
    /*
     * Don't manually set Content-Type for FormData.
     * Browser will set the correct multipart boundary.
     */
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }
    if (token) {
        headers["Authorization"] =
            `Bearer ${token}`;
    }
    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );
    let data = {};
    try {
        data = await response.json();
    } catch {
        data = {};
    }
    if (!response.ok) {
        let message = "Something went wrong";

        if (typeof data.detail === "string") {
            message = data.detail;
        }
        else if (Array.isArray(data.detail)) {
            message = data.detail.map(error => {
                const field = error.loc
                    ? error.loc.join(".")
                    : "field";

                return `${field}: ${error.msg}`;
            }).join(", ");
        }
        else if (data.message) {
            message = data.message;
        }

        throw new Error(message);
    }
    return data;
}
/* =========================================================
   KARIGO PAGE NAVIGATION
   ========================================================= */
const pages = document.querySelectorAll(".page");
const toast = document.getElementById("toast");
function showPage(pageId) {
    const target = document.getElementById(pageId);
    if (!target) {
        console.warn(`Page "${pageId}" does not exist.`);
        return;
    }
    if (pageId === "buyerHomePage") {
        loadProducts();
    }
    if (pageId === "sellerGalleryPage") {
        loadSellerProducts();
    }
    if (pageId === "sellerQuotationsPage") {
        renderSellerQuotations();
    }
    if (pageId === "buyerCartPage") {
        renderCart();
    }
    pages.forEach(page => page.classList.remove("active"));
    target.classList.add("active");
    history.replaceState({ page: pageId }, "", `#${pageId}`);
    target.scrollTop = 0;
}
/* Navigation for every element with data-go */
document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-go]");
    if (!trigger) return;
    showPage(trigger.dataset.go);
});
/* Toast notification */
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}
/* ==================== SELLER LOGIN ==================== */
const sellerLoginForm =
    document.getElementById("sellerLoginForm");

sellerLoginForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("sellerEmail")
                .value.trim();

        const password =
            document.getElementById("sellerPassword")
                .value;

        if (!email || !password) {
            showToast("Enter email and password.");
            return;
        }

        try {

            const data = await apiRequest(
                `/api/auth/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
                { method: "POST" }
            );

            if (data.user?.role !== "artisan") {
                throw new Error("This account is registered as a buyer. Please use buyer login.");
            }

            // Save JWT
            localStorage.setItem(
                "karigoToken",
                data.access_token
            );

            localStorage.setItem(
                "sellerEmail",
                email
            );

            showToast("Login successful!");

            setTimeout(() => {

                showPage("sellerHomePage");

            }, 1000);

        }
        catch (error) {

            console.error(error);

            showToast(
                "Cannot connect to backend"
            );
        }
    }
);
/* ==================== BUYER LOGIN ==================== */
const buyerLoginForm = document.getElementById("buyerLoginForm");
buyerLoginForm?.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();
        const identifier =
            document
                .getElementById("buyerIdentifier")
                .value
                .trim();
        const password =
            document
                .getElementById("buyerPassword")
                .value;
        if (!identifier) {
            showToast("Enter your email or mobile number.");
            return;
        }
        if (!password) {
            showToast("Enter your password.");
            return;
        }
        try {
            showToast("Logging in...");
            const data = await apiRequest(
                `/api/auth/login?email=${encodeURIComponent(identifier)}&password=${encodeURIComponent(password)}`,
                { method: "POST" }
            );
            if (data.user?.role !== "buyer") {
                throw new Error("This account is registered as an artisan. Please use seller login.");
            }
            console.log(
                "Login response:",
                data
            );
            // Save JWT
            localStorage.setItem(
                "karigoToken",
                data.access_token
            );
            localStorage.setItem(
                "karigoRole",
                "buyer"
            );
            showToast(
                "Login successful ✓"
            );
            setTimeout(() => {
                showPage("buyerHomePage");
            }, 500);
        } catch (error) {
            console.error(
                "Login error:",
                error
            );
            showToast(
                error.message ||
                "Login failed"
            );
        }
    }
);
/* ==================== REGISTRATION ==================== */
document
    .getElementById("sellerRegisterForm")
    ?.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("sellerName").value.trim();
        const email = document.getElementById("sellerRegisterEmail").value.trim();
        const password = document.getElementById("newSellerPassword").value;

        try {
            showToast("Creating seller account...");
            await apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ name, email, password, role: "artisan" })
            });
            showToast("Account created. Please log in.");
            setTimeout(() => showPage("sellerLoginPage"), 650);
        } catch (error) {
            console.error("Seller registration error:", error);
            showToast(error.message || "Could not create seller account.");
        }
    });
document
    .getElementById("buyerRegisterForm")
    ?.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("buyerName").value.trim();
        const email = document.getElementById("buyerEmail").value.trim();
        const password = document.getElementById("newBuyerPassword").value;

        try {
            showToast("Creating buyer account...");
            await apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ name, email, password, role: "buyer" })
            });
            showToast("Account created. Please log in.");
            setTimeout(() => showPage("buyerLoginPage"), 650);
        } catch (error) {
            console.error("Buyer registration error:", error);
            showToast(error.message || "Could not create buyer account.");
        }
    });
/* ==================== PASSWORD SHOW/HIDE ==================== */
document.querySelectorAll("[data-toggle-password]").forEach(button => {
    button.addEventListener("click", () => {
        const input =
            document.getElementById(button.dataset.togglePassword);
        if (input.type === "password") {
            input.type = "text";
            button.textContent = "Hide";
        } else {
            input.type = "password";
            button.textContent = "Show";
        }
    });
});
/* ==================== FORGOT PASSWORD ==================== */
document.getElementById("forgotPassword")?.addEventListener("click", () => {
    showToast("Password reset flow will be connected later.");
});
/* ==================== KEYBOARD ==================== */
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        const current = document.querySelector(".page.active");
        if (current?.id !== "introPage") {
            showPage("rolePage");
        }
    }
});
/* ==================== INITIAL PAGE ==================== */
const hash = window.location.hash.replace("#", "");
const validPage = document.getElementById(hash);
if (validPage && hash !== "introPage") {
    showPage(hash);
} else {
    showPage("introPage");
}
/* =========================================================
   KARIGO SELLER ACCOUNT
   ========================================================= */
const sellerAccountForm =
    document.getElementById("sellerAccountForm");
sellerAccountForm?.addEventListener("submit", function (event) {
    event.preventDefault();
    showToast("Your business details have been saved ✓");
    setTimeout(() => {
        showPage("sellerHomePage");
    }, 900);
});
/* =========================================================
   KARIGO GALLERY - STOCK MANAGEMENT
   ========================================================= */
function updateProductStatus(row) {
    const stockValue =
        row.querySelector(".stock-value");
    const status =
        row.querySelector(".stock-status");
    const stock =
        parseInt(stockValue.textContent);
    status.classList.remove(
        "available",
        "low",
        "out"
    );
    if (stock <= 0) {
        status.textContent = "Out of Stock";
        status.classList.add("out");
    }
    else if (stock <= 5) {
        status.textContent = "Low Stock";
        status.classList.add("low");
    }
    else {
        status.textContent = "Available";
        status.classList.add("available");
    }
}
/* =========================================================
   ADD STOCK
   ========================================================= */

document.addEventListener("click", async function (event) {

    if (!event.target.classList.contains("stock-plus")) {
        return;
    }

    const row =
        event.target.closest(".product-row");

    if (!row) {
        return;
    }

    const productId =
        row.dataset.productId;

    const stockElement =
        row.querySelector(".stock-value");

    const oldValue =
        parseInt(stockElement.textContent) || 0;

    const newValue =
        oldValue + 1;

    try {

        event.target.disabled = true;

        await updateProductStock(
            productId,
            newValue
        );

        stockElement.textContent =
            newValue;

        updateProductStatus(row);
        updateGallerySummary();

        showToast("Stock increased ✓");

    } catch (error) {

        showToast(
            error.message ||
            "Failed to update stock."
        );

    } finally {

        event.target.disabled = false;

    }
});
/* =========================================================
   REMOVE STOCK
   ========================================================= */

document.addEventListener("click", async function (event) {

    if (!event.target.classList.contains("stock-minus")) {
        return;
    }

    const row =
        event.target.closest(".product-row");

    if (!row) {
        return;
    }

    const productId =
        row.dataset.productId;

    const stockElement =
        row.querySelector(".stock-value");

    const oldValue =
        parseInt(stockElement.textContent) || 0;

    if (oldValue <= 0) {
        showToast("Stock is already zero.");
        return;
    }

    const newValue =
        oldValue - 1;

    try {

        event.target.disabled = true;

        await updateProductStock(
            productId,
            newValue
        );

        stockElement.textContent =
            newValue;

        updateProductStatus(row);
        updateGallerySummary();

        showToast("Stock decreased ✓");

    } catch (error) {

        showToast(
            error.message ||
            "Failed to update stock."
        );

    } finally {

        event.target.disabled = false;

    }
});
/* DELETE PRODUCT */
document.addEventListener("click", async function (event) {
    if (!event.target.classList.contains("delete-product")) return;

    const row = event.target.closest(".product-row");
    if (!row) return;

    const productName = row.querySelector(".product-info strong").textContent;
    if (!confirm(`Remove "${productName}" from your gallery?`)) return;

    try {
        await apiRequest(`/api/products/${row.dataset.productId}`, { method: "DELETE" });
        row.style.opacity = "0";
        row.style.transform = "translateX(20px)";
        setTimeout(() => {
            row.remove();
            updateGallerySummary();
            checkGalleryEmpty();
            showToast("Product removed from your gallery.");
        }, 250);
    } catch (error) {
        console.error("Product deletion failed:", error);
        showToast(error.message || "Failed to remove product.");
    }
});
/* =========================================================
   GALLERY SUMMARY
   ========================================================= */
function updateGallerySummary() {
    const rows =
        document.querySelectorAll(
            "#productList .product-row"
        );
    let totalStock = 0;
    let availableProducts = 0;
    rows.forEach(row => {
        const stock =
            parseInt(
                row.querySelector(".stock-value").textContent
            );
        totalStock += stock;
        if (stock > 0) {
            availableProducts++;
        }
    });
    const productCount =
        document.getElementById("productCount");
    const availableCount =
        document.getElementById("availableCount");
    const totalStockElement =
        document.getElementById("totalStock");
    if (productCount) {
        productCount.textContent = rows.length;
    }
    if (availableCount) {
        availableCount.textContent = availableProducts;
    }
    if (totalStockElement) {
        totalStockElement.textContent = totalStock;
    }
}
/* =========================================================
   EMPTY GALLERY
   ========================================================= */
function checkGalleryEmpty() {
    const rows =
        document.querySelectorAll(
            "#productList .product-row"
        );
    const table =
        document.querySelector(
            ".product-table-container"
        );
    const empty =
        document.getElementById("galleryEmpty");
    if (!rows.length) {
        table.style.display = "none";
        empty.style.display = "block";
    }
    else {
        table.style.display = "block";
        empty.style.display = "none";
    }
}
/* =========================================================
   LOAD SELLER PRODUCTS FROM BACKEND
   ========================================================= */

async function loadSellerProducts() {
    try {
        console.log("Loading seller products from backend...");

        const products = await apiRequest("/api/products/mine");

        console.log("Seller products received:", products);

        renderSellerProducts(products);

    } catch (error) {
        console.error(
            "Failed to load seller products:",
            error
        );

        showToast("Unable to load products.");
    }
}
function renderSellerProducts(products) {

    const productList =
        document.getElementById("productList");

    if (!productList) {
        console.error("productList not found.");
        return;
    }

    productList.innerHTML = "";

    if (!products || products.length === 0) {
        checkGalleryEmpty();
        updateGallerySummary();
        return;
    }

    products.forEach(product => {

        const row =
            document.createElement("div");

        row.className = "product-row";

        row.dataset.productId = product.id;

        const stock =
            Number(product.quantity) || 0;

        const price =
            product.price !== null &&
                product.price !== undefined
                ? `₹${product.price}`
                : "Price not set";

        row.innerHTML = `
            <div class="product-info">
                <strong>
                    ${escapeHtml(product.name || "Unnamed Product")}
                </strong>

                <span>
                    ${escapeHtml(product.category || "Uncategorized")}
                </span>
            </div>

            <div class="product-price">
                ${price}
            </div>

            <div class="product-stock">
                <button
                    class="stock-minus"
                    type="button"
                >
                    −
                </button>

                <span class="stock-value">
                    ${stock}
                </span>

                <button
                    class="stock-plus"
                    type="button"
                >
                    +
                </button>
            </div>

            <div class="stock-status">
                <span class="stock-status">
                    ${stock > 0 ? "Available" : "Out of Stock"}
                </span>
            </div>

            <button
                class="delete-product"
                type="button"
            >
                Delete
            </button>
        `;

        productList.appendChild(row);

        updateProductStatus(row);
    });

    updateGallerySummary();
    checkGalleryEmpty();
}
/* Initial gallery calculation */
updateGallerySummary();

/* =========================================================
   UPDATE PRODUCT STOCK IN BACKEND
   ========================================================= */

async function updateProductStock(productId, quantity) {
    try {
        console.log("Updating stock:", {
            productId,
            quantity
        });

        const updatedProduct = await apiRequest(
            `/api/products/${productId}/stock`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    quantity: quantity
                })
            }
        );

        console.log("Stock updated successfully:", updatedProduct);

        return updatedProduct;

    } catch (error) {
        console.error("Stock update failed:", error);

        showToast(
            error.message || "Failed to update stock."
        );

        throw error;
    }
}
/* =========================================================
   KARIGO - ADD PRODUCT SYSTEM
   ========================================================= */
/* =========================================================
   IMAGE / CAMERA
   ========================================================= */
const openCameraBtn =
    document.getElementById("openCameraBtn");
const productImageInput =
    document.getElementById("productImageInput");
const productImagePreview =
    document.getElementById("productImagePreview");
const photoPlaceholder =
    document.getElementById("photoPlaceholder");
openCameraBtn?.addEventListener("click", function () {
    productImageInput.click();
});
productImageInput?.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) {
        return;
    }
    const imageURL =
        URL.createObjectURL(file);
    productImagePreview.src =
        imageURL;
    productImagePreview.style.display =
        "block";
    photoPlaceholder.style.display =
        "none";
    /*
     * Save the image temporarily.
     *
     * Later this file will be sent to your backend:
     *
     * AI Image Enhancement
     * Background Removal
     * Product Image Generation
     */
    window.karigoProductImage = file;
});
/* =========================================================
   VOICE RECORDING
   ========================================================= */
const recordBtn =
    document.getElementById("recordBtn");
const recordIcon =
    document.getElementById("recordIcon");
const recordText =
    document.getElementById("recordText");
const voiceStatus =
    document.getElementById("voiceStatus");
const voiceAnimation =
    document.getElementById("voiceAnimation");
const recordTime =
    document.getElementById("recordTime");
const voiceResult =
    document.getElementById("voiceResult");
const transcriptText =
    document.getElementById("transcriptText");
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let recordingTimer = null;
let recordedAudio = null;
/* =========================================================
   START / STOP RECORDING
   ========================================================= */
recordBtn?.addEventListener("click", async function () {
    /* STOP RECORDING */
    if (
        mediaRecorder &&
        mediaRecorder.state === "recording"
    ) {
        mediaRecorder.stop();
        return;
    }
    /* START RECORDING */
    try {
        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });
        audioChunks = [];
        mediaRecorder =
            new MediaRecorder(stream);
        mediaRecorder.addEventListener(
            "dataavailable",
            function (event) {
                if (event.data.size > 0) {
                    audioChunks.push(
                        event.data
                    );
                }
            }
        );
        mediaRecorder.addEventListener(
            "stop",
            function () {
                const audioBlob =
                    new Blob(
                        audioChunks,
                        {
                            type: "audio/webm"
                        }
                    );
                recordedAudio =
                    audioBlob;
                stream
                    .getTracks()
                    .forEach(
                        track => track.stop()
                    );
                finishRecording();
            }
        );
        mediaRecorder.start();
        startRecordingUI();
        /*
         * Optional browser speech recognition.
         *
         * This allows the prototype to show
         * what the seller said.
         *
         * Actual multilingual AI transcription
         * will be connected to the backend later.
         */
        startSpeechRecognition();
    }
    catch (error) {
        console.error(error);
        voiceStatus.textContent =
            "Microphone permission is required.";
    }
});
/* =========================================================
   RECORDING UI
   ========================================================= */
function startRecordingUI() {
    recordBtn.classList.add("recording");
    recordIcon.textContent = "⏹";
    recordText.textContent =
        "Stop Recording";
    voiceStatus.textContent =
        "Listening... Speak naturally";
    voiceAnimation.classList.add(
        "recording"
    );
    recordingStartTime =
        Date.now();
    recordingTimer =
        setInterval(
            updateRecordingTime,
            1000
        );
}
function updateRecordingTime() {
    const elapsed =
        Math.floor(
            (Date.now() - recordingStartTime)
            / 1000
        );
    const minutes =
        String(
            Math.floor(elapsed / 60)
        ).padStart(2, "0");
    const seconds =
        String(
            elapsed % 60
        ).padStart(2, "0");
    recordTime.textContent =
        `${minutes}:${seconds}`;
}
function finishRecording() {
    clearInterval(recordingTimer);
    recordBtn.classList.remove(
        "recording"
    );
    recordIcon.textContent =
        "✓";
    recordText.textContent =
        "Record Again";
    voiceStatus.textContent =
        "Recording saved";
    voiceAnimation.classList.remove(
        "recording"
    );
    /*
     * Reset timer for next recording.
     */
    recordTime.textContent =
        "00:00";
}
/* =========================================================
   SPEECH RECOGNITION
   ========================================================= */
let speechRecognition = null;
function startSpeechRecognition() {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        transcriptText.textContent =
            "Voice recording saved. AI transcription will be connected later.";
        voiceResult.style.display =
            "block";
        return;
    }
    speechRecognition =
        new SpeechRecognition();
    speechRecognition.continuous =
        true;
    speechRecognition.interimResults =
        true;
    /*
     * Browser language.
     *
     * Later this will be replaced by
     * multilingual AI detection.
     */
    speechRecognition.lang =
        "en-IN";
    speechRecognition.onresult =
        function (event) {
            let finalText = "";
            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                finalText +=
                    event.results[i][0].transcript;
            }
            transcriptText.textContent =
                finalText;
            voiceResult.style.display =
                "block";
        };
    speechRecognition.onerror =
        function () {
            console.log(
                "Speech recognition unavailable."
            );
        };
    try {
        speechRecognition.start();
    }
    catch (error) {
        console.log(
            "Speech recognition already running."
        );
    }
}
/* =========================================================
   PROCESS PRODUCT
   ========================================================= */
const processProductBtn =
    document.getElementById(
        "processProductBtn"
    );
processProductBtn?.addEventListener(
    "click",
    function () {
        const image =
            window.karigoProductImage;
        const transcript =
            transcriptText?.textContent;
        /* IMAGE REQUIRED */
        if (!image) {
            showToast(
                "Please add a product photo first."
            );
            return;
        }
        /* VOICE REQUIRED */
        if (
            !recordedAudio &&
            (
                !transcript ||
                transcript.includes(
                    "Your spoken description"
                )
            )
        ) {
            showToast(
                "Please describe your product first."
            );
            return;
        }
        /* PROCESSING STATE */
        processProductBtn.classList.add(
            "processing"
        );
        processProductBtn.innerHTML =
            `
            <span>Karigo is creating your listing</span>
            <span>✦</span>
            `;
        /*
         * Simulate AI processing.
         *
         * This is where we will later send:
         *
         * image
         * +
         * recordedAudio
         * +
         * transcript
         *
         * to your backend AI service.
         */
        setTimeout(
            function () {
                createProductPreview();
            },
            2200
        );
    }
);
/* =========================================================
   CREATE AI PREVIEW
   ========================================================= */
function createProductPreview() {
    /* SHOW IMAGE */
    const aiImage =
        document.getElementById(
            "aiProductImage"
        );
    if (
        window.karigoProductImage
    ) {
        aiImage.src =
            URL.createObjectURL(
                window.karigoProductImage
            );
    }
    /*
     * Demo AI-generated content.
     *
     * Later these values will come
     * directly from your AI backend.
     */
    const transcript =
        transcriptText?.textContent || "";
    let generatedName =
        "Handcrafted Artisan Product";
    let generatedDescription =
        "Beautifully handcrafted artisan product made using traditional craftsmanship. Each piece is created with care and reflects the unique skill of the artisan.";
    let generatedCategory =
        "Handicrafts";
    let generatedPrice =
        500;
    /*
     * Very basic prototype detection.
     *
     * REAL AI will do this later.
     */
    const text =
        transcript.toLowerCase();
    if (
        text.includes("pot") ||
        text.includes("terracotta") ||
        text.includes("clay")
    ) {
        generatedName =
            "Handcrafted Terracotta Pot";
        generatedCategory =
            "Pottery & Ceramics";
        generatedPrice =
            450;
    }
    else if (
        text.includes("saree") ||
        text.includes("sari") ||
        text.includes("cloth")
    ) {
        generatedName =
            "Handwoven Artisan Saree";
        generatedCategory =
            "Handloom & Textiles";
        generatedPrice =
            1200;
    }
    else if (
        text.includes("basket") ||
        text.includes("bamboo")
    ) {
        generatedName =
            "Handcrafted Bamboo Basket";
        generatedCategory =
            "Bamboo & Cane";
        generatedPrice =
            350;
    }
    document.getElementById(
        "previewProductName"
    ).value =
        generatedName;
    document.getElementById(
        "previewCategory"
    ).value =
        generatedCategory;
    document.getElementById(
        "previewDescription"
    ).value =
        generatedDescription;
    document.getElementById(
        "previewPrice"
    ).value =
        generatedPrice;
    /* OPEN PREVIEW */
    showPage(
        "sellerProductPreviewPage"
    );
    /* RESET BUTTON */
    processProductBtn.classList.remove(
        "processing"
    );
    processProductBtn.innerHTML =
        `
        <span>Create My Product</span>
        <span>→</span>
        `;
}
/* =========================================================
   EDIT PRODUCT
   ========================================================= */
document.getElementById(
    "editProductBtn"
)?.addEventListener(
    "click",
    function () {
        showPage(
            "sellerAddItemPage"
        );
    }
);
/* =========================================================
   CONFIRM PRODUCT → BACKEND
   ========================================================= */

document.getElementById(
    "confirmProductBtn"
)?.addEventListener(
    "click",
    async function () {

        try {

            const name =
                document.getElementById(
                    "previewProductName"
                ).value.trim();

            const category =
                document.getElementById(
                    "previewCategory"
                ).value.trim();

            const description =
                document.getElementById(
                    "previewDescription"
                ).value.trim();

            const price =
                Number(
                    document.getElementById(
                        "previewPrice"
                    ).value
                );

            const quantityInput =
                document.getElementById(
                    "previewQuantity"
                );

            const quantity =
                quantityInput
                    ? Number(quantityInput.value || 1)
                    : 1;


            /* =========================
               VALIDATION
               ========================= */

            if (!name) {
                showToast("Product name is required.");
                return;
            }

            if (price < 0) {
                showToast("Price cannot be negative.");
                return;
            }

            if (quantity < 0) {
                showToast("Quantity cannot be negative.");
                return;
            }


            /* =========================
               IMAGE URL
               ========================= */

            let imageUrl = null;
            if (window.karigoProductImage) {
                showToast("Uploading product image...");
                const imageData = new FormData();
                imageData.append("image", window.karigoProductImage);
                const uploadResult = await apiRequest("/api/upload/image", {
                    method: "POST",
                    body: imageData
                });
                imageUrl = uploadResult.image_url;
            }


            /* =========================
               CREATE PRODUCT
               ========================= */

            showToast("Creating product...");


            const productData = {

                name: name,

                description:
                    description || null,

                category:
                    category || null,

                material: null,

                region: null,

                price:
                    price,

                quantity:
                    quantity,

                image_url:
                    imageUrl

            };


            console.log(
                "Sending product:",
                productData
            );


            const createdProduct =
                await apiRequest(
                    "/api/products/",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                productData
                            )
                    }
                );


            console.log(
                "Product created:",
                createdProduct
            );


            /* =========================
               SUCCESS
               ========================= */

            showToast(
                "Product added successfully ✓"
            );


            setTimeout(
                function () {

                    showPage(
                        "sellerGalleryPage"
                    );

                },
                800
            );


        } catch (error) {

            console.error(
                "Product creation error:",
                error
            );


            showToast(
                error.message ||
                "Failed to create product."
            );

        }

    }
);
// ============================================
// BUYER REQUIREMENT CREATION
// ============================================

async function createBuyerRequirementFromCart() {
    if (!karigoCart || karigoCart.length === 0) {
        throw new Error("Your cart is empty.");
    }

    const item = karigoCart[0];
    const product = item.product || {};

    const requirementData = {
        title: `Requirement for ${product.name || "Handmade Product"}`,
        description: `Buyer requirement for ${product.name || "handmade artisan product"}`,
        category: product.category || null,
        material: product.material || null,
        region: product.region || null,
        min_price: item.price || null,
        max_price: item.price || null,
        quantity_required: item.quantity || 1
    };

    console.log("Creating buyer requirement:", requirementData);

    const requirement = await apiRequest(
        "/api/buyer-requirements/",
        {
            method: "POST",
            body: JSON.stringify(requirementData)
        }
    );

    console.log("Buyer requirement created:", requirement);

    localStorage.setItem(
        "karigoRequirementId",
        requirement.id
    );

    localStorage.setItem(
        "karigoRequirement",
        JSON.stringify(requirement)
    );

    return requirement;
}
// ============================================
// CREATE QUOTATION FROM CART
// ============================================

async function createQuotationFromCart(item) {

    console.log("Creating quotation from cart item:", item);

    /* =========================================
       VALIDATE CART ITEM
       ========================================= */

    if (!item) {
        throw new Error("Cart item is missing.");
    }

    const productId = Number(item.productId);

    if (!productId || productId <= 0) {
        console.error("Invalid cart item:", item);
        throw new Error("Product ID is missing from cart.");
    }


    /* =========================================
       BUYER REQUIREMENT
       ========================================= */

    const requirementId =
        Number(
            localStorage.getItem(
                "karigoRequirementId"
            )
        );

    if (!requirementId || requirementId <= 0) {

        throw new Error(
            "Please create a buyer requirement first."
        );

    }


    /* =========================================
       QUOTATION DATA
       ========================================= */

    const quantity =
        Number(item.quantity || 1);

    const unitPrice =
        Number(item.price || 0);


    if (quantity <= 0) {

        throw new Error(
            "Quantity must be greater than 0."
        );

    }

    if (unitPrice <= 0) {

        throw new Error(
            "Product price is invalid."
        );

    }


    const quotationData = {

        product_id:
            productId,

        requirement_id:
            requirementId,

        quantity:
            quantity,

        unit_price:
            unitPrice

    };


    console.log(
        "Sending quotation:",
        quotationData
    );


    /* =========================================
       CREATE QUOTATION
       ========================================= */

    const quotation =
        await apiRequest(
            "/api/quotations/",
            {
                method: "POST",

                body:
                    JSON.stringify(
                        quotationData
                    )
            }
        );


    console.log(
        "Quotation created:",
        quotation
    );

    localStorage.setItem(
        "karigoQuotationId",
        String(quotation.id)
    );


    return quotation;

}

/* =========================================================
   KARIGO BUYER MARKETPLACE
   ========================================================= */
/* =========================================================
   CART DATA
   ========================================================= */
let karigoCart =
    JSON.parse(
        localStorage.getItem("karigoBuyerCart")
    ) || [];
/* =========================================================
   UPDATE CART COUNT
   ========================================================= */
function updateCartCount() {
    const count =
        document.getElementById("cartCount");
    if (!count) return;
    count.textContent =
        karigoCart.length;
}
/* =========================================================
   ADD TO CART
   ========================================================= */
document.addEventListener("click", function (event) {
    const button =
        event.target.closest(".cart-add-btn");
    if (!button) return;
    const product =
        button.dataset.product;
    const price =
        Number(button.dataset.price);
    const productId =
        Number(button.dataset.productId);
    karigoCart.push({
        productId: productId,
        product: {
            name: product,
            category: button.dataset.category || null,
            material: button.dataset.material || null,
            region: button.dataset.region || null
        },
        price: price,
        quantity: 1
    });
    localStorage.setItem(
        "karigoBuyerCart",
        JSON.stringify(karigoCart)
    );
    updateCartCount();
    button.textContent =
        "✓ Added";
    setTimeout(() => {
        button.textContent =
            "+ Cart";
    }, 1200);
    showToast(
        `${product} added to your cart.`
    );
});
/* =========================================================
   CATEGORY FILTER
   ========================================================= */
document.addEventListener("click", function (event) {
    const button =
        event.target.closest(".category-btn");
    if (!button) return;
    const category =
        button.dataset.category;
    document
        .querySelectorAll(".category-btn")
        .forEach(btn => {
            btn.classList.remove("active");
        });
    button.classList.add("active");
    filterProducts(category);
});
function filterProducts(category) {
    const products =
        document.querySelectorAll(
            ".buyer-product-card"
        );
    let visibleCount = 0;
    products.forEach(product => {
        const productCategory =
            product.dataset.category;
        if (
            category === "all" ||
            productCategory === category
        ) {
            product.style.display =
                "block";
            visibleCount++;
        }
        else {
            product.style.display =
                "none";
        }
    });
    const count =
        document.getElementById(
            "productResultCount"
        );
    if (count) {
        count.textContent =
            `${visibleCount} products`;
    }
}
/* =========================================================
   SEARCH
   ========================================================= */
const productSearch =
    document.getElementById(
        "productSearch"
    );
productSearch?.addEventListener(
    "input",
    function () {
        const search =
            this.value
                .trim()
                .toLowerCase();
        const products =
            document.querySelectorAll(
                ".buyer-product-card"
            );
        let visibleCount = 0;
        products.forEach(product => {
            const productName =
                product.dataset.name
                    .toLowerCase();
            const description =
                product
                    .querySelector("p")
                    ?.textContent
                    .toLowerCase() || "";
            if (
                productName.includes(search) ||
                description.includes(search)
            ) {
                product.style.display =
                    "block";
                visibleCount++;
            }
            else {
                product.style.display =
                    "none";
            }
        });
        const count =
            document.getElementById(
                "productResultCount"
            );
        if (count) {
            count.textContent =
                `${visibleCount} products`;
        }
    }
);
/* =========================================================
   RENDER CART
   ========================================================= */
function renderCart() {
    const container =
        document.getElementById(
            "cartContainer"
        );
    const totalElement =
        document.getElementById(
            "cartTotal"
        );
    if (!container) return;
    if (!karigoCart.length) {
        container.innerHTML = `
            <div class="buyer-profile-card">
                <div class="profile-circle">
                    🛒
                </div>
                <h1>
                    Your Cart is <span>Empty</span>
                </h1>
                <p style="
                    margin-top:12px;
                    color:var(--muted);
                    font-size:12px;
                ">
                    Discover beautiful crafts
                    and add something you love.
                </p>
                <button
                    class="back-marketplace-btn"
                    data-go="buyerHomePage"
                >
                    Start Shopping →
                </button>
            </div>
        `;
        if (totalElement) {
            totalElement.textContent =
                "₹0";
        }
        return;
    }
    let total = 0;
    container.innerHTML = "";
    karigoCart.forEach(
        (item, index) => {
            total +=
                Number(item.price);
            const cartItem =
                document.createElement("div");
            cartItem.className =
                "cart-item";
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    🏺
                </div>
                <div class="cart-item-info">
                    <strong>
                        ${escapeHtml(item.product?.name || item.product || "Handmade Product")}
                    </strong>
                    <small>
                        Handmade artisan product
                    </small>
                </div>
                <div class="cart-item-price">
                    ₹${Number(item.price).toLocaleString("en-IN")}
                </div>
                <button
                    class="remove-cart-item"
                    data-index="${index}"
                >
                    ×
                </button>
            `;
            container.appendChild(cartItem);
        }
    );
    if (totalElement) {
        totalElement.textContent =
            `₹${total.toLocaleString("en-IN")}`;
    }
}

/* =========================================================
   REMOVE FROM CART
   ========================================================= */
document.addEventListener("click", function (event) {
    const button =
        event.target.closest(
            ".remove-cart-item"
        );
    if (!button) return;
    const index =
        Number(button.dataset.index);
    karigoCart.splice(
        index,
        1
    );
    localStorage.setItem(
        "karigoBuyerCart",
        JSON.stringify(karigoCart)
    );
    updateCartCount();
    renderCart();
    showToast(
        "Product removed from your cart."
    );
});
/* =========================================================
   BUY NOW
   ========================================================= */
document.addEventListener("click", function (event) {
    const button =
        event.target.closest(".buy-now-btn");
    if (!button) return;
    const product =
        button.dataset.product;
    showToast(
        `${product} selected for purchase.`
    );
    /*
     * Later:
     *
     * product → order page
     * → address
     * → payment
     * → order confirmation
     */
});

/* =========================================================
   CHECKOUT
   ========================================================= */
/* =========================================================
   CHECKOUT → CREATE ORDER
   ========================================================= */

document.getElementById("checkoutBtn")?.addEventListener(
    "click",
    async function () {

        if (!karigoCart.length) {
            showToast("Your cart is empty.");
            return;
        }

        const token =
            localStorage.getItem("karigoToken");

        if (!token) {
            showToast("Please login as a buyer first.");
            showPage("buyerLoginPage");
            return;
        }

        try {

            showToast("Creating your order...");

            /*
             * For the prototype we checkout
             * the first cart item.
             */
            const item = karigoCart[0];

            console.log("Checkout item:", item);

            /*
             * IMPORTANT:
             * requirement_id must come from a real
             * buyer requirement.
             *
             * For now we read it from localStorage.
             */
            let requirementId = localStorage.getItem("karigoRequirementId");

            if (!requirementId) {
                try {
                    showToast("Creating buyer requirement...");

                    const requirement = await createBuyerRequirementFromCart();

                    requirementId = requirement.id;

                    console.log(
                        "Buyer requirement ID:",
                        requirementId
                    );
                } catch (error) {
                    console.error(
                        "Buyer requirement creation failed:",
                        error
                    );

                    showToast(
                        error.message ||
                        "Failed to create buyer requirement."
                    );

                    return;
                }
            }
            // ============================================
            // CREATE QUOTATION IF NEEDED
            // ============================================

            let quotationId = localStorage.getItem("karigoQuotationId");

            if (!quotationId) {
                try {
                    showToast("Creating quotation...");

                    const quotation =
                        await createQuotationFromCart(item);

                    quotationId = quotation.id;

                    console.log(
                        "Quotation created with ID:",
                        quotationId
                    );

                    showToast(
                        "Quotation created. Waiting for seller approval."
                    );

                    return;

                } catch (error) {
                    console.error(
                        "Quotation creation failed:",
                        error
                    );

                    showToast(
                        error.message ||
                        "Failed to create quotation."
                    );

                    return;
                }
            }

            /*
             * STEP 1:
             * Find an accepted quotation.
             */

            const quotations = await apiRequest("/api/quotations/buyer");

            console.log(
                "Quotations:",
                quotations
            );

            const quotation =
                quotations.find(q =>
                    Number(q.id) === Number(quotationId) &&
                    q.status === "ACCEPTED"
                );

            if (!quotation) {

                showToast(
                    "No accepted quotation found for this product."
                );

                console.log(
                    "Required product:",
                    item.productId
                );

                console.log(
                    "Required requirement:",
                    requirementId
                );

                return;
            }

            console.log(
                "Accepted quotation:",
                quotation
            );

            /*
             * STEP 2:
             * Create order from quotation.
             */

            const order =
                await apiRequest(
                    "/api/orders/",
                    {
                        method: "POST",

                        body: JSON.stringify({

                            product_id:
                                Number(item.productId),

                            requirement_id:
                                Number(requirementId),

                            quantity:
                                Number(item.quantity || 1),

                            unit_price:
                                Number(quotation.unit_price)

                        })
                    }
                );

            console.log(
                "Order created:",
                order
            );

            /*
             * STEP 3:
             * Save order locally.
             */

            localStorage.setItem(
                "karigoLastOrder",
                JSON.stringify(order)
            );

            /*
             * STEP 4:
             * Clear cart.
             */

            karigoCart = [];

            localStorage.setItem(
                "karigoBuyerCart",
                JSON.stringify([])
            );

            localStorage.removeItem(
                "karigoRequirementId"
            );

            localStorage.removeItem(
                "karigoQuotationId"
            );

            updateCartCount();

            /*
             * STEP 5:
             * Success.
             */

            showToast(
                "Order placed successfully ✓"
            );

            /*
             * Open order page.
             *
             * Change this ID if your HTML
             * uses another order page ID.
             */

            setTimeout(() => {

                showPage(
                    "buyerOrdersPage"
                );

            }, 700);

        }
        catch (error) {

            console.error(
                "Checkout error:",
                error
            );

            showToast(
                error.message ||
                "Unable to place order."
            );

        }

    }
);
// ============================================
// SELLER QUOTATIONS
// ============================================

async function loadSellerQuotations() {
    try {
        const quotations = await apiRequest(
            "/api/quotations/artisan"
        );

        console.log("Seller quotations:", quotations);

        return quotations;

    } catch (error) {
        console.error(
            "Failed to load seller quotations:",
            error
        );

        showToast(
            error.message ||
            "Failed to load quotations."
        );

        return [];
    }
}

function formatRupees(value) {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function quotationStatusClass(status) {
    return String(status || "").toLowerCase();
}

async function renderSellerQuotations() {
    const list = document.getElementById("sellerQuotationList");

    if (!list) return;

    list.innerHTML = '<p class="seller-quotation-loading">Loading requests...</p>';

    const quotations = await loadSellerQuotations();

    if (!quotations.length) {
        list.innerHTML = `
            <div class="seller-quotation-empty">
                <h2>No buyer requests yet</h2>
                <p>New quotation requests will appear here.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = quotations.map(quotation => {
        const status = String(quotation.status || "PENDING");
        const isPending = status === "PENDING";

        return `
            <article class="seller-quotation-card">
                <div>
                    <span class="quotation-status ${quotationStatusClass(status)}">
                        ${escapeHtml(status)}
                    </span>
                    <h2>Product request #${quotation.product_id}</h2>
                    <div class="seller-quotation-meta">
                        <span>Quantity: ${quotation.quantity}</span>
                        <span>Requirement #${quotation.requirement_id}</span>
                        <span>Unit price: ${formatRupees(quotation.unit_price)}</span>
                    </div>
                </div>
                <div>
                    <div class="seller-quotation-price">${formatRupees(quotation.total_price)}</div>
                    ${isPending ? `
                        <div class="seller-quotation-actions">
                            <button class="accept-quotation-btn" data-quotation-action="accept" data-quotation-id="${quotation.id}">Accept</button>
                            <button class="reject-quotation-btn" data-quotation-action="reject" data-quotation-id="${quotation.id}">Reject</button>
                        </div>
                    ` : ""}
                </div>
            </article>
        `;
    }).join("");
}

document.addEventListener("click", async event => {
    const button = event.target.closest("[data-quotation-action]");

    if (!button) return;

    const quotationId = Number(button.dataset.quotationId);
    const action = button.dataset.quotationAction;

    if (!quotationId || !["accept", "reject"].includes(action)) return;

    button.closest(".seller-quotation-actions")
        ?.querySelectorAll("button")
        .forEach(control => control.disabled = true);

    const result = action === "accept"
        ? await acceptSellerQuotation(quotationId)
        : await rejectSellerQuotation(quotationId);

    if (result) {
        await renderSellerQuotations();
    } else {
        button.closest(".seller-quotation-actions")
            ?.querySelectorAll("button")
            .forEach(control => control.disabled = false);
    }
});
async function acceptSellerQuotation(quotationId) {
    try {
        const result = await apiRequest(
            `/api/quotations/${quotationId}/accept`,
            {
                method: "POST"
            }
        );

        console.log("Quotation accepted:", result);

        showToast("Quotation accepted successfully.");

        return result;

    } catch (error) {
        console.error(
            "Failed to accept quotation:",
            error
        );

        showToast(
            error.message ||
            "Failed to accept quotation."
        );

        return null;
    }
}


async function rejectSellerQuotation(quotationId) {
    try {
        const result = await apiRequest(
            `/api/quotations/${quotationId}/reject`,
            {
                method: "POST"
            }
        );

        console.log("Quotation rejected:", result);

        showToast("Quotation rejected.");

        return result;

    } catch (error) {
        console.error(
            "Failed to reject quotation:",
            error
        );

        showToast(
            error.message ||
            "Failed to reject quotation."
        );

        return null;
    }
}
/* INITIAL */
updateCartCount();
