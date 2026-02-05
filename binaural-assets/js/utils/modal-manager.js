/**
 * Modal Manager - Centralized modal control
 * Prevents multiple modals from overlapping and manages z-index
 */

const modalStack = [];
let currentModal = null;

/**
 * Open a modal and close any previously open modals
 * @param {string} modalId - ID of the modal element
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.warn(`[ModalManager] Modal not found: ${modalId}`);
        return false;
    }

    // Close previous modal if exists
    if (currentModal && currentModal !== modalId) {
        closeModal(currentModal, false);
    }

    // Open the requested modal
    modal.classList.remove('hidden');
    modal.classList.add('active');
    currentModal = modalId;
    modalStack.push(modalId);

    // Prevent body scroll
    // document.body.style.overflow = 'hidden'; // FIX: Removed to allow scrolling

    console.log(`[ModalManager] Opened modal: ${modalId}`);
    return true;
}

/**
 * Close a modal
 * @param {string} modalId - ID of the modal element
 * @param {boolean} restoreBodyScroll - Whether to restore body scrolling
 */
export function closeModal(modalId, restoreBodyScroll = true) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('active');

    // Remove from stack
    const index = modalStack.indexOf(modalId);
    if (index > -1) {
        modalStack.splice(index, 1);
    }

    // Update current modal
    if (currentModal === modalId) {
        currentModal = modalStack.length > 0 ? modalStack[modalStack.length - 1] : null;
    }

    // Restore body scroll if no modals open
    if (restoreBodyScroll && modalStack.length === 0) {
        // document.body.style.overflow = '';
    }

    console.log(`[ModalManager] Closed modal: ${modalId}`);
}

/**
 * Close all open modals
 */
export function closeAllModals() {
    [...modalStack].forEach(modalId => {
        closeModal(modalId, false);
    });
    // document.body.style.overflow = '';
    modalStack.length = 0;
    currentModal = null;
    console.log('[ModalManager] All modals closed');
}

/**
 * Check if a modal is currently open
 * @param {string} modalId - ID of the modal
 * @returns {boolean}
 */
export function isModalOpen(modalId) {
    return currentModal === modalId;
}

/**
 * Get currently open modal ID
 * @returns {string|null}
 */
export function getCurrentModal() {
    return currentModal;
}

/**
 * Initialize modal manager - set up global ESC key handler
 */
export function initModalManager() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentModal) {
            closeModal(currentModal);
        }
    });

    // Set up click-outside-to-close for all modals
    document.addEventListener('click', (e) => {
        if (currentModal) {
            const modal = document.getElementById(currentModal);
            if (modal && e.target === modal) {
                closeModal(currentModal);
            }
        }
    });

    console.log('[ModalManager] Initialized');
}

// ✅ FIX Issue #4: Centralized modal management
