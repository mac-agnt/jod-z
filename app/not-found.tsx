import SiteLayout from "./(site)/layout";

export const metadata = { title: "Page not found" };
import { NotFoundBody } from "@/components/NotFoundBody";

// Unknown URLs land here, outside the (site) group, so wrap in the site chrome.
export default function NotFound() {
  return (
    <SiteLayout>
      <NotFoundBody />
    </SiteLayout>
  );
}
