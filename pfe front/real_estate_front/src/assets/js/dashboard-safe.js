// Safe script loader for dashboard
(function() {
    'use strict';
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Dashboard scripts loaded safely');
        
        // Initialize dashboard-specific functionality
        initDashboardSafely();
    });
    
    function initDashboardSafely() {
        // Only initialize if we're on a dashboard page
        if (window.location.pathname.includes('/admin/dashboard')) {
            console.log('Initializing dashboard components');
            
            // Initialize any dashboard-specific features here
            initDashboardStats();
        }
    }
    
    function initDashboardStats() {
        // Placeholder for dashboard statistics
        console.log('Dashboard statistics initialized');
    }
    
    // Make functions globally available if needed
    window.initDashboardSafely = initDashboardSafely;
})();
