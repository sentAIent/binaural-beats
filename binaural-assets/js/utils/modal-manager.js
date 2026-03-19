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

/**
 * Modal Flow Manager
 * Sequences high-priority UI flows to prevent overlapping modals.
 */
class ModalFlowManager {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.currentFlow = null;
    }

    /**
     * Add a modal flow to the queue.
     * @param {string} id - Unique ID for the flow
     * @param {Function} fn - Function that returns a Promise (resolves when flow DONE)
     * @param {number} priority - Higher priority runs first
     */
    enqueue(id, fn, priority = 10) {
        if (this.queue.some(item => item.id === id)) return;
        this.queue.push({ id, fn, priority });
        this.queue.sort((a, b) => b.priority - a.priority);
        console.log(`[ModalManager] Enqueued flow: ${id} (priority: ${priority})`);
        this.process();
    }

    async process() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;
        const next = this.queue.shift();
        this.currentFlow = next.id;
        console.log(`[ModalManager] Processing flow: ${next.id}`);
        try {
            await next.fn();
        } catch (e) {
            console.error(`[ModalManager] Error in flow ${next.id}:`, e);
        }
        this.isProcessing = false;
        this.currentFlow = null;
        setTimeout(() => this.process(), 500); // Small gap between flows
    }
}

export const flowManager = new ModalFlowManager();
window.modalFlowManager = flowManager; 
