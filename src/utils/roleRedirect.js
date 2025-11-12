// Utility function to get redirect path based on role
export function getRedirectPath(role) {
  const rolePaths = {
    admin: "/dashboarda",
    super_admin: "/dashboarda",
    sc_manager: "/sc/dashboard",
    sc_staff: "/sc/dashboard",
    service_engineer: "/sc/dashboard",
    service_advisor: "/sc/dashboard",
    call_center: "/sc/dashboard",
  };

  return rolePaths[role] || "/dashboarda";
}

// Check if user has access to a route
export function hasAccess(role, path) {
  // Admin has access to everything
  if (role === "admin" || role === "super_admin") {
    return true;
  }

  // Service center roles can only access SC routes
  const scRoles = ["sc_manager", "sc_staff", "service_engineer", "service_advisor", "call_center"];
  if (scRoles.includes(role)) {
    return path.startsWith("/sc");
  }

  return false;
}

