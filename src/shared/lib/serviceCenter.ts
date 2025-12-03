import { safeStorage } from "@/shared/lib/localStorage";
import { defaultServiceCenters } from "@/__mocks__/data/service-centers.mock";

export interface ServiceCenterContext {
  serviceCenterId: string | number | null;
  serviceCenterName: string | null;
  userRole: string | null;
}

const DEFAULT_CENTER_MAP: Record<string, string> = {
  service_advisor: "1",
  sc_manager: "1",
  sc_staff: "1",
  service_engineer: "1",
};

export const getServiceCenterContext = (): ServiceCenterContext => {
  const storedUserInfo = safeStorage.getItem<any>("userInfo", null);
  const storedUserRole = safeStorage.getItem<any>("userRole", null);
  const userRole = typeof storedUserRole === "string" ? storedUserRole : null;
  const explicitCenterId =
    typeof storedUserInfo?.serviceCenterId === "number"
      ? String(storedUserInfo.serviceCenterId)
      : typeof storedUserInfo?.serviceCenter === "number"
      ? String(storedUserInfo.serviceCenter)
      : defaultServiceCenters.find((center) => center.name === storedUserInfo?.serviceCenter)?.id
      ? String(
          defaultServiceCenters.find((center) => center.name === storedUserInfo?.serviceCenter)?.id
        )
      : null;
  const fallbackCenter =
    explicitCenterId || (userRole ? DEFAULT_CENTER_MAP[userRole] ?? null : null);

  return {
    serviceCenterId: fallbackCenter,
    serviceCenterName: storedUserInfo?.serviceCenter ?? null,
    userRole,
  };
};

export const shouldFilterByServiceCenter = (context: ServiceCenterContext): boolean => {
  return Boolean(context.userRole && context.userRole !== "call_center" && context.serviceCenterId);
};

export const filterByServiceCenter = <T extends { serviceCenterId?: number | string }>(
  items: T[],
  context: ServiceCenterContext
): T[] => {
  if (!shouldFilterByServiceCenter(context)) return items;
  return items.filter((item) => String(item.serviceCenterId) === String(context.serviceCenterId));
};

